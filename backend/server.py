from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import jwt
import bcrypt
import random
import json
from openai import OpenAI

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'nexosr_db')]

# OpenAI Client (Emergent LLM Key)
EMERGENT_LLM_KEY = "sk-emergent-09538C92b582341C2B"
openai_client = OpenAI(
    api_key=EMERGENT_LLM_KEY,
    base_url="https://emergentintegrations.ai/api/v1/llm",
    timeout=30.0,
    max_retries=2
)

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'nexosr-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 1 week

app = FastAPI(title="NEXOSR API", version="1.0.0")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    age: int
    interests: List[str] = []
    goals: str = ""
    language: str = "en"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    age: int
    segment: str  # student, graduate, professional
    interests: List[str] = []
    goals: str = ""
    language: str = "en"
    is_premium: bool = False
    xp_points: int = 0
    badges: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    tests_taken: int = 0
    mentor_sessions: int = 0

class Assessment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    test_type: str  # aptitude, personality, career_interest, skill_assessment
    questions: List[Dict[str, Any]]
    answers: List[Dict[str, Any]] = []
    score: Optional[float] = None
    ai_report: Optional[Dict[str, Any]] = None
    completed: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

class AssessmentSubmit(BaseModel):
    assessment_id: str
    answers: List[Dict[str, Any]]

class Mentor(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    email: str
    expertise: List[str]
    experience_years: int
    bio: str
    category: str
    hourly_rate: float
    session_30min_rate: float
    session_1hr_rate: float
    rating: float = 5.0
    total_sessions: int = 0
    approved: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MentorCreate(BaseModel):
    name: str
    email: EmailStr
    expertise: List[str]
    experience_years: int
    bio: str
    category: str
    hourly_rate: float
    session_30min_rate: float
    session_1hr_rate: float

class MentorSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    mentor_id: str
    mentee_id: str
    mentor_name: str
    mentee_name: str
    session_type: str  # 30min, 1hr
    scheduled_at: datetime
    status: str = "pending"  # pending, confirmed, completed, cancelled
    price: float
    notes: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

class BookSession(BaseModel):
    mentor_id: str
    session_type: str
    scheduled_at: datetime
    notes: str = ""

class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    role: str  # user, assistant
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ChatRequest(BaseModel):
    message: str

class Opportunity(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    type: str  # internship, course, project, certification
    company: str
    description: str
    requirements: List[str]
    link: str
    deadline: Optional[datetime] = None
    tags: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Payment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    amount: float
    currency: str = "INR"
    type: str  # subscription, session
    status: str = "pending"  # pending, completed, failed
    description: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ==================== HELPER FUNCTIONS ====================

def get_user_segment(age: int) -> str:
    if age < 19:
        return "student"
    elif age < 26:
        return "graduate"
    else:
        return "professional"

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== PSYCHOMETRIC TEST QUESTIONS ====================

APTITUDE_QUESTIONS = [
    {"id": 1, "question": "If a train travels 120 km in 2 hours, what is its average speed?", "options": ["40 km/h", "60 km/h", "80 km/h", "100 km/h"], "correct": 1, "category": "numerical"},
    {"id": 2, "question": "Complete the series: 2, 6, 12, 20, ?", "options": ["28", "30", "32", "36"], "correct": 1, "category": "logical"},
    {"id": 3, "question": "Which word is the odd one out: Apple, Banana, Carrot, Mango?", "options": ["Apple", "Banana", "Carrot", "Mango"], "correct": 2, "category": "verbal"},
    {"id": 4, "question": "If COMPUTER is coded as DNQRWUFS, how is PRINTER coded?", "options": ["QSJOUFR", "QSJOUES", "QSJOUFS", "QRJOUES"], "correct": 2, "category": "logical"},
    {"id": 5, "question": "A rectangle has length 12cm and width 8cm. What is its area?", "options": ["80 sq cm", "96 sq cm", "104 sq cm", "120 sq cm"], "correct": 1, "category": "numerical"},
    {"id": 6, "question": "Choose the word most similar to 'Abundant':", "options": ["Scarce", "Plentiful", "Limited", "Rare"], "correct": 1, "category": "verbal"},
    {"id": 7, "question": "If 15% of a number is 45, what is the number?", "options": ["200", "250", "300", "350"], "correct": 2, "category": "numerical"},
    {"id": 8, "question": "Find the missing number: 3, 9, 27, 81, ?", "options": ["162", "189", "243", "324"], "correct": 2, "category": "logical"},
    {"id": 9, "question": "Which shape has the most sides?", "options": ["Pentagon", "Hexagon", "Heptagon", "Octagon"], "correct": 3, "category": "spatial"},
    {"id": 10, "question": "Arrange: RELIABLE - Find the 5th letter from left", "options": ["A", "B", "L", "I"], "correct": 0, "category": "verbal"},
    {"id": 11, "question": "What comes next: J, F, M, A, M, J, ?", "options": ["A", "J", "S", "O"], "correct": 1, "category": "logical"},
    {"id": 12, "question": "If you buy 7 items at ₹143 each, total cost is?", "options": ["₹991", "₹1001", "₹1011", "₹1021"], "correct": 1, "category": "numerical"},
    {"id": 13, "question": "Which is the antonym of 'Optimistic'?", "options": ["Hopeful", "Pessimistic", "Positive", "Cheerful"], "correct": 1, "category": "verbal"},
    {"id": 14, "question": "A cube has how many edges?", "options": ["6", "8", "10", "12"], "correct": 3, "category": "spatial"},
    {"id": 15, "question": "If A=1, B=2... Z=26, what is CAT?", "options": ["24", "27", "30", "33"], "correct": 0, "category": "logical"}
]

PERSONALITY_QUESTIONS = [
    {"id": 1, "question": "I enjoy meeting new people and making friends.", "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"], "trait": "extroversion"},
    {"id": 2, "question": "I prefer to plan things in advance rather than being spontaneous.", "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"], "trait": "conscientiousness"},
    {"id": 3, "question": "I often worry about things that might go wrong.", "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"], "trait": "neuroticism"},
    {"id": 4, "question": "I enjoy trying new and creative approaches to problems.", "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"], "trait": "openness"},
    {"id": 5, "question": "I find it easy to empathize with others' feelings.", "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"], "trait": "agreeableness"},
    {"id": 6, "question": "I feel energized after social gatherings.", "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"], "trait": "extroversion"},
    {"id": 7, "question": "I always complete tasks before deadlines.", "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"], "trait": "conscientiousness"},
    {"id": 8, "question": "I stay calm under pressure.", "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"], "trait": "neuroticism"},
    {"id": 9, "question": "I enjoy exploring abstract ideas and theories.", "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"], "trait": "openness"},
    {"id": 10, "question": "I prefer cooperation over competition.", "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"], "trait": "agreeableness"},
    {"id": 11, "question": "I am the life of the party.", "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"], "trait": "extroversion"},
    {"id": 12, "question": "I pay attention to details.", "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"], "trait": "conscientiousness"},
    {"id": 13, "question": "I get stressed easily.", "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"], "trait": "neuroticism"},
    {"id": 14, "question": "I appreciate art, music, and literature.", "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"], "trait": "openness"},
    {"id": 15, "question": "I trust others easily.", "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"], "trait": "agreeableness"}
]

CAREER_INTEREST_QUESTIONS = [
    {"id": 1, "question": "I enjoy solving complex mathematical problems.", "options": ["Not at all", "Slightly", "Moderately", "Very much", "Extremely"], "field": "stem"},
    {"id": 2, "question": "I like helping others with their personal problems.", "options": ["Not at all", "Slightly", "Moderately", "Very much", "Extremely"], "field": "social"},
    {"id": 3, "question": "I enjoy creating art, music, or writing.", "options": ["Not at all", "Slightly", "Moderately", "Very much", "Extremely"], "field": "creative"},
    {"id": 4, "question": "I like leading and managing teams.", "options": ["Not at all", "Slightly", "Moderately", "Very much", "Extremely"], "field": "business"},
    {"id": 5, "question": "I enjoy working with machines and technology.", "options": ["Not at all", "Slightly", "Moderately", "Very much", "Extremely"], "field": "technical"},
    {"id": 6, "question": "I prefer working outdoors in nature.", "options": ["Not at all", "Slightly", "Moderately", "Very much", "Extremely"], "field": "outdoor"},
    {"id": 7, "question": "I enjoy analyzing data and statistics.", "options": ["Not at all", "Slightly", "Moderately", "Very much", "Extremely"], "field": "analytical"},
    {"id": 8, "question": "I like teaching and explaining concepts to others.", "options": ["Not at all", "Slightly", "Moderately", "Very much", "Extremely"], "field": "social"},
    {"id": 9, "question": "I enjoy designing and building things.", "options": ["Not at all", "Slightly", "Moderately", "Very much", "Extremely"], "field": "creative"},
    {"id": 10, "question": "I like negotiating and persuading others.", "options": ["Not at all", "Slightly", "Moderately", "Very much", "Extremely"], "field": "business"},
    {"id": 11, "question": "I enjoy programming and coding.", "options": ["Not at all", "Slightly", "Moderately", "Very much", "Extremely"], "field": "technical"},
    {"id": 12, "question": "I like conducting scientific experiments.", "options": ["Not at all", "Slightly", "Moderately", "Very much", "Extremely"], "field": "stem"},
    {"id": 13, "question": "I enjoy performing in front of an audience.", "options": ["Not at all", "Slightly", "Moderately", "Very much", "Extremely"], "field": "creative"},
    {"id": 14, "question": "I like organizing events and activities.", "options": ["Not at all", "Slightly", "Moderately", "Very much", "Extremely"], "field": "business"},
    {"id": 15, "question": "I enjoy reading and researching topics in depth.", "options": ["Not at all", "Slightly", "Moderately", "Very much", "Extremely"], "field": "analytical"}
]

SKILL_ASSESSMENT_QUESTIONS = [
    {"id": 1, "question": "Rate your proficiency in Microsoft Office (Word, Excel, PowerPoint).", "options": ["Beginner", "Intermediate", "Advanced", "Expert"], "skill": "office_tools"},
    {"id": 2, "question": "Rate your coding/programming skills.", "options": ["None", "Basic", "Intermediate", "Advanced"], "skill": "programming"},
    {"id": 3, "question": "Rate your public speaking abilities.", "options": ["Poor", "Fair", "Good", "Excellent"], "skill": "communication"},
    {"id": 4, "question": "Rate your time management skills.", "options": ["Poor", "Fair", "Good", "Excellent"], "skill": "management"},
    {"id": 5, "question": "Rate your teamwork and collaboration skills.", "options": ["Poor", "Fair", "Good", "Excellent"], "skill": "teamwork"},
    {"id": 6, "question": "Rate your problem-solving abilities.", "options": ["Poor", "Fair", "Good", "Excellent"], "skill": "problem_solving"},
    {"id": 7, "question": "Rate your creativity and innovation skills.", "options": ["Poor", "Fair", "Good", "Excellent"], "skill": "creativity"},
    {"id": 8, "question": "Rate your leadership abilities.", "options": ["Poor", "Fair", "Good", "Excellent"], "skill": "leadership"},
    {"id": 9, "question": "Rate your analytical thinking skills.", "options": ["Poor", "Fair", "Good", "Excellent"], "skill": "analytical"},
    {"id": 10, "question": "Rate your written communication skills.", "options": ["Poor", "Fair", "Good", "Excellent"], "skill": "writing"},
    {"id": 11, "question": "Rate your networking abilities.", "options": ["Poor", "Fair", "Good", "Excellent"], "skill": "networking"},
    {"id": 12, "question": "Rate your adaptability to change.", "options": ["Poor", "Fair", "Good", "Excellent"], "skill": "adaptability"},
    {"id": 13, "question": "Rate your critical thinking skills.", "options": ["Poor", "Fair", "Good", "Excellent"], "skill": "critical_thinking"},
    {"id": 14, "question": "Rate your digital literacy skills.", "options": ["Beginner", "Intermediate", "Advanced", "Expert"], "skill": "digital"},
    {"id": 15, "question": "Rate your emotional intelligence.", "options": ["Poor", "Fair", "Good", "Excellent"], "skill": "emotional_intelligence"}
]

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_data.email,
        name=user_data.name,
        age=user_data.age,
        segment=get_user_segment(user_data.age),
        interests=user_data.interests,
        goals=user_data.goals,
        language=user_data.language
    )
    
    user_dict = user.dict()
    user_dict["password_hash"] = hash_password(user_data.password)
    
    await db.users.insert_one(user_dict)
    token = create_token(user.id, user.email)
    
    return {"token": token, "user": user.dict()}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["email"])
    user_data = {k: v for k, v in user.items() if k != "password_hash" and k != "_id"}
    
    return {"token": token, "user": user_data}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    user_data = {k: v for k, v in user.items() if k != "password_hash" and k != "_id"}
    return user_data

# ==================== ASSESSMENT ROUTES ====================

@api_router.post("/assessments/start")
async def start_assessment(test_type: str = Query(...), user: dict = Depends(get_current_user)):
    # Check limits for free users
    if not user.get("is_premium", False):
        user_tests = await db.assessments.count_documents({"user_id": user["id"], "completed": True})
        if user_tests >= 2:
            raise HTTPException(status_code=403, detail="Free users can only take 2 tests. Upgrade to Premium!")
    
    # Select questions based on test type
    if test_type == "aptitude":
        questions = random.sample(APTITUDE_QUESTIONS, 15)
    elif test_type == "personality":
        questions = random.sample(PERSONALITY_QUESTIONS, 15)
    elif test_type == "career_interest":
        questions = random.sample(CAREER_INTEREST_QUESTIONS, 15)
    elif test_type == "skill_assessment":
        questions = random.sample(SKILL_ASSESSMENT_QUESTIONS, 15)
    else:
        raise HTTPException(status_code=400, detail="Invalid test type")
    
    assessment = Assessment(
        user_id=user["id"],
        test_type=test_type,
        questions=questions
    )
    
    await db.assessments.insert_one(assessment.dict())
    return assessment.dict()

@api_router.post("/assessments/submit")
async def submit_assessment(submission: AssessmentSubmit, user: dict = Depends(get_current_user)):
    assessment = await db.assessments.find_one({"id": submission.assessment_id, "user_id": user["id"]})
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    if assessment.get("completed"):
        raise HTTPException(status_code=400, detail="Assessment already completed")
    
    # Calculate score for aptitude test
    score = 0
    if assessment["test_type"] == "aptitude":
        for answer in submission.answers:
            question = next((q for q in assessment["questions"] if q["id"] == answer["question_id"]), None)
            if question and answer.get("selected") == question.get("correct"):
                score += 1
        score = (score / len(assessment["questions"])) * 100
    else:
        # For personality/interest tests, calculate average score
        total = sum(a.get("selected", 0) for a in submission.answers)
        score = (total / (len(submission.answers) * 4)) * 100  # Assuming 5-point scale (0-4)
    
    # Generate AI Report
    ai_report = await generate_ai_report(user, assessment, submission.answers, score)
    
    # Update assessment
    await db.assessments.update_one(
        {"id": submission.assessment_id},
        {"$set": {
            "answers": submission.answers,
            "score": score,
            "ai_report": ai_report,
            "completed": True,
            "completed_at": datetime.utcnow()
        }}
    )
    
    # Update user XP
    await db.users.update_one(
        {"id": user["id"]},
        {"$inc": {"xp_points": 50, "tests_taken": 1}}
    )
    
    # Check for badge
    updated_user = await db.users.find_one({"id": user["id"]})
    if updated_user["tests_taken"] == 1:
        await db.users.update_one(
            {"id": user["id"]},
            {"$push": {"badges": "Career Explorer"}}
        )
    
    return {
        "score": score,
        "ai_report": ai_report,
        "xp_earned": 50
    }

async def generate_ai_report(user: dict, assessment: dict, answers: list, score: float) -> dict:
    try:
        prompt = f"""
        You are Nexosr AI, a career guidance expert. Analyze this assessment and provide a detailed report.
        
        User Profile:
        - Name: {user['name']}
        - Age: {user['age']}
        - Segment: {user['segment']}
        - Interests: {', '.join(user.get('interests', []))}
        - Goals: {user.get('goals', 'Not specified')}
        
        Assessment Type: {assessment['test_type']}
        Score: {score}%
        
        Questions and Answers:
        {json.dumps(list(zip(assessment['questions'], answers))[:5], indent=2)}
        
        Provide a JSON response with:
        {{
            "strengths": ["list of 3-4 key strengths"],
            "weaknesses": ["list of 2-3 areas for improvement"],
            "interests": ["list of identified interests"],
            "predicted_learning_path": "recommended learning journey",
            "subject_recommendations": ["list of 3-4 subjects/skills to focus on"],
            "skill_gaps": ["list of skills to develop"],
            "career_paths": [
                {{"title": "career1", "match_score": 85, "description": "brief description"}},
                {{"title": "career2", "match_score": 80, "description": "brief description"}},
                {{"title": "career3", "match_score": 75, "description": "brief description"}},
                {{"title": "career4", "match_score": 70, "description": "brief description"}},
                {{"title": "career5", "match_score": 65, "description": "brief description"}}
            ],
            "mentor_categories": ["list of mentor expertise areas that would help"],
            "summary": "2-3 sentence overall summary"
        }}
        """
        
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        logger.error(f"AI Report generation failed: {e}")
        return {
            "strengths": ["Analytical thinking", "Problem-solving", "Attention to detail"],
            "weaknesses": ["Time management", "Public speaking"],
            "interests": ["Technology", "Innovation"],
            "predicted_learning_path": "Focus on building technical and soft skills",
            "subject_recommendations": ["Mathematics", "Computer Science", "Communication"],
            "skill_gaps": ["Leadership", "Networking"],
            "career_paths": [
                {"title": "Software Developer", "match_score": 85, "description": "Build software applications"},
                {"title": "Data Analyst", "match_score": 80, "description": "Analyze data for insights"},
                {"title": "Product Manager", "match_score": 75, "description": "Lead product development"},
                {"title": "UX Designer", "match_score": 70, "description": "Design user experiences"},
                {"title": "Business Analyst", "match_score": 65, "description": "Bridge business and tech"}
            ],
            "mentor_categories": ["Technology", "Career Coaching"],
            "summary": f"Based on your assessment score of {score}%, you show strong potential in analytical fields."
        }

@api_router.get("/assessments/history")
async def get_assessment_history(user: dict = Depends(get_current_user)):
    assessments = await db.assessments.find({"user_id": user["id"], "completed": True}).sort("completed_at", -1).to_list(100)
    return [{k: v for k, v in a.items() if k != "_id"} for a in assessments]

@api_router.get("/assessments/{assessment_id}")
async def get_assessment(assessment_id: str, user: dict = Depends(get_current_user)):
    assessment = await db.assessments.find_one({"id": assessment_id, "user_id": user["id"]})
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return {k: v for k, v in assessment.items() if k != "_id"}

# ==================== CHATBOT ROUTES ====================

@api_router.post("/chat")
async def chat(request: ChatRequest, user: dict = Depends(get_current_user)):
    # Get chat history
    history = await db.chat_messages.find({"user_id": user["id"]}).sort("timestamp", -1).limit(10).to_list(10)
    history.reverse()
    
    # Get user's assessment data for context
    assessments = await db.assessments.find({"user_id": user["id"], "completed": True}).to_list(5)
    assessment_context = ""
    if assessments:
        latest = assessments[-1]
        if latest.get("ai_report"):
            assessment_context = f"\nUser's latest assessment: {latest['test_type']} - Score: {latest.get('score', 0)}%\n"
            assessment_context += f"Career recommendations: {json.dumps(latest['ai_report'].get('career_paths', []))}"
    
    # Build messages
    messages = [
        {"role": "system", "content": f"""You are Nexosr AI, a friendly and knowledgeable career companion for youth aged 14-30. 
        You provide career advice, guidance on skills development, and mentorship recommendations.
        
        User Profile:
        - Name: {user['name']}
        - Age: {user['age']}
        - Segment: {user['segment']} (student/graduate/professional)
        - Interests: {', '.join(user.get('interests', []))}
        - Goals: {user.get('goals', 'Not specified')}
        {assessment_context}
        
        Be encouraging, practical, and personalized in your responses. Keep responses concise but helpful.
        If the user is a free user, occasionally mention premium features they could benefit from."""}
    ]
    
    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    
    messages.append({"role": "user", "content": request.message})
    
    # Check premium status for advanced features
    is_premium = user.get("is_premium", False)
    
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=500 if is_premium else 200
        )
        
        assistant_message = response.choices[0].message.content
    except Exception as e:
        logger.error(f"Chat error: {e}")
        # Provide intelligent fallback responses based on user context
        interests = user.get('interests', [])
        segment = user.get('segment', 'student')
        user_message_lower = request.message.lower()
        
        if 'career' in user_message_lower or 'job' in user_message_lower:
            if 'Technology' in interests:
                assistant_message = f"Based on your interest in Technology, I'd recommend exploring careers in Software Development, Data Science, or Product Management. As a {segment}, you might want to start with online courses on platforms like Coursera or take assessments to identify your specific strengths. Would you like to take our Aptitude Test to get personalized career recommendations?"
            elif 'Business' in interests:
                assistant_message = f"With your interest in Business, careers in Marketing, Consulting, or Entrepreneurship could be great fits! As a {segment}, consider building real-world experience through internships. Take our Career Interest Test to discover which business path aligns with your personality."
            else:
                assistant_message = f"Great question! Based on your profile, I recommend taking our AI-powered assessments to discover careers that match your unique strengths. Our tests analyze aptitude, personality, and interests to provide personalized recommendations. Would you like to start with an assessment?"
        elif 'mentor' in user_message_lower:
            assistant_message = f"Finding the right mentor can accelerate your career growth! Based on your interests in {', '.join(interests) if interests else 'various fields'}, I recommend connecting with mentors in those domains. Check out our Mentors section to find experts who can guide you. Premium users get AI-matched mentor recommendations!"
        elif 'skill' in user_message_lower or 'learn' in user_message_lower:
            assistant_message = f"Continuous learning is key to career success! For {segment}s interested in {', '.join(interests) if interests else 'growing their careers'}, I recommend: 1) Taking our Skill Assessment to identify gaps, 2) Checking our Opportunities section for relevant courses, 3) Booking mentor sessions for personalized guidance."
        elif 'test' in user_message_lower or 'assessment' in user_message_lower:
            assistant_message = "We offer 4 types of AI-powered assessments: 1) Aptitude Test - measures logical, numerical & verbal skills, 2) Personality Assessment - discovers your work style, 3) Career Interest Test - finds careers matching your passions, 4) Skill Assessment - evaluates your current abilities. Each takes about 10-15 minutes and provides detailed AI reports!"
        else:
            assistant_message = f"Hi {user['name']}! I'm Nexosr AI, your career companion. I can help you with: career guidance, skill development advice, finding mentors, and discovering opportunities. As a {segment} interested in {', '.join(interests) if interests else 'exploring career options'}, what specific aspect of your career journey can I help with today?"
    
    # Save messages
    user_msg = ChatMessage(user_id=user["id"], role="user", content=request.message)
    assistant_msg = ChatMessage(user_id=user["id"], role="assistant", content=assistant_message)
    
    await db.chat_messages.insert_many([user_msg.dict(), assistant_msg.dict()])
    
    return {"message": assistant_message}

@api_router.get("/chat/history")
async def get_chat_history(user: dict = Depends(get_current_user)):
    messages = await db.chat_messages.find({"user_id": user["id"]}).sort("timestamp", 1).to_list(100)
    return [{k: v for k, v in m.items() if k != "_id"} for m in messages]

# ==================== MENTOR ROUTES ====================

@api_router.post("/mentors/apply")
async def apply_as_mentor(mentor_data: MentorCreate, user: dict = Depends(get_current_user)):
    existing = await db.mentors.find_one({"user_id": user["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Already applied as mentor")
    
    mentor = Mentor(
        user_id=user["id"],
        name=mentor_data.name,
        email=mentor_data.email,
        expertise=mentor_data.expertise,
        experience_years=mentor_data.experience_years,
        bio=mentor_data.bio,
        category=mentor_data.category,
        hourly_rate=mentor_data.hourly_rate,
        session_30min_rate=mentor_data.session_30min_rate,
        session_1hr_rate=mentor_data.session_1hr_rate
    )
    
    await db.mentors.insert_one(mentor.dict())
    return mentor.dict()

@api_router.get("/mentors")
async def get_mentors(
    category: Optional[str] = None,
    expertise: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    query = {"approved": True}
    if category:
        query["category"] = category
    if expertise:
        query["expertise"] = {"$in": [expertise]}
    
    mentors = await db.mentors.find(query).to_list(100)
    return [{k: v for k, v in m.items() if k != "_id"} for m in mentors]

@api_router.get("/mentors/recommended")
async def get_recommended_mentors(user: dict = Depends(get_current_user)):
    # Get user's latest assessment
    assessment = await db.assessments.find_one(
        {"user_id": user["id"], "completed": True},
        sort=[("completed_at", -1)]
    )
    
    mentor_categories = []
    if assessment and assessment.get("ai_report"):
        mentor_categories = assessment["ai_report"].get("mentor_categories", [])
    
    # Also use user interests
    interests = user.get("interests", [])
    search_terms = list(set(mentor_categories + interests))
    
    if search_terms:
        mentors = await db.mentors.find({
            "approved": True,
            "$or": [
                {"expertise": {"$in": search_terms}},
                {"category": {"$in": search_terms}}
            ]
        }).to_list(10)
    else:
        mentors = await db.mentors.find({"approved": True}).limit(10).to_list(10)
    
    return [{k: v for k, v in m.items() if k != "_id"} for m in mentors]

@api_router.post("/mentors/book")
async def book_mentor_session(booking: BookSession, user: dict = Depends(get_current_user)):
    mentor = await db.mentors.find_one({"id": booking.mentor_id, "approved": True})
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")
    
    price = mentor["session_30min_rate"] if booking.session_type == "30min" else mentor["session_1hr_rate"]
    
    session = MentorSession(
        mentor_id=booking.mentor_id,
        mentee_id=user["id"],
        mentor_name=mentor["name"],
        mentee_name=user["name"],
        session_type=booking.session_type,
        scheduled_at=booking.scheduled_at,
        price=price,
        notes=booking.notes
    )
    
    await db.mentor_sessions.insert_one(session.dict())
    
    # Update user stats
    await db.users.update_one(
        {"id": user["id"]},
        {"$inc": {"xp_points": 25, "mentor_sessions": 1}}
    )
    
    # Check for mentorship badge
    updated_user = await db.users.find_one({"id": user["id"]})
    if updated_user["mentor_sessions"] >= 3 and "Mentorship Pro" not in updated_user.get("badges", []):
        await db.users.update_one(
            {"id": user["id"]},
            {"$push": {"badges": "Mentorship Pro"}}
        )
    
    return session.dict()

@api_router.get("/mentors/sessions")
async def get_my_sessions(user: dict = Depends(get_current_user)):
    sessions = await db.mentor_sessions.find(
        {"$or": [{"mentee_id": user["id"]}, {"mentor_id": user["id"]}]}
    ).sort("scheduled_at", -1).to_list(100)
    return [{k: v for k, v in s.items() if k != "_id"} for s in sessions]

# ==================== OPPORTUNITY ROUTES ====================

@api_router.get("/opportunities")
async def get_opportunities(
    type: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    query = {}
    if type:
        query["type"] = type
    
    opportunities = await db.opportunities.find(query).sort("created_at", -1).to_list(50)
    return [{k: v for k, v in o.items() if k != "_id"} for o in opportunities]

@api_router.get("/opportunities/recommended")
async def get_recommended_opportunities(user: dict = Depends(get_current_user)):
    # Get user interests and assessment data
    interests = user.get("interests", [])
    
    assessment = await db.assessments.find_one(
        {"user_id": user["id"], "completed": True},
        sort=[("completed_at", -1)]
    )
    
    tags = interests[:]
    if assessment and assessment.get("ai_report"):
        tags.extend(assessment["ai_report"].get("subject_recommendations", []))
    
    if tags:
        opportunities = await db.opportunities.find({
            "tags": {"$in": tags}
        }).limit(20).to_list(20)
    else:
        opportunities = await db.opportunities.find().limit(20).to_list(20)
    
    return [{k: v for k, v in o.items() if k != "_id"} for o in opportunities]

# ==================== GAMIFICATION ROUTES ====================

@api_router.get("/leaderboard")
async def get_leaderboard():
    users = await db.users.find().sort("xp_points", -1).limit(20).to_list(20)
    return [
        {
            "rank": i + 1,
            "name": u["name"],
            "xp_points": u.get("xp_points", 0),
            "badges": u.get("badges", []),
            "segment": u["segment"]
        }
        for i, u in enumerate(users)
    ]

@api_router.get("/badges")
async def get_all_badges():
    return [
        {"id": "career_explorer", "name": "Career Explorer", "description": "Complete your first assessment", "icon": "compass"},
        {"id": "top_learner", "name": "Top Learner", "description": "Complete 5 assessments", "icon": "star"},
        {"id": "mentorship_pro", "name": "Mentorship Pro", "description": "Book 3 mentor sessions", "icon": "users"},
        {"id": "skill_master", "name": "Skill Master", "description": "Score 90%+ on skill assessment", "icon": "award"},
        {"id": "goal_getter", "name": "Goal Getter", "description": "Reach 500 XP points", "icon": "target"},
        {"id": "community_star", "name": "Community Star", "description": "Refer 3 friends", "icon": "heart"}
    ]

# ==================== PAYMENT ROUTES (MOCK) ====================

@api_router.post("/payments/subscribe")
async def subscribe_premium(plan: str = Query(...), user: dict = Depends(get_current_user)):
    prices = {
        "monthly": 299,
        "quarterly": 799,
        "annual": 1999
    }
    
    if plan not in prices:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    payment = Payment(
        user_id=user["id"],
        amount=prices[plan],
        type="subscription",
        status="completed",  # Mock - auto complete
        description=f"Premium {plan} subscription"
    )
    
    await db.payments.insert_one(payment.dict())
    
    # Upgrade user to premium
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"is_premium": True}}
    )
    
    return {"success": True, "payment_id": payment.id, "message": "Welcome to Nexosr Premium!"}

@api_router.get("/payments/history")
async def get_payment_history(user: dict = Depends(get_current_user)):
    payments = await db.payments.find({"user_id": user["id"]}).sort("created_at", -1).to_list(50)
    return [{k: v for k, v in p.items() if k != "_id"} for p in payments]

# ==================== DASHBOARD ROUTES ====================

@api_router.get("/dashboard")
async def get_dashboard(user: dict = Depends(get_current_user)):
    # Get assessments
    assessments = await db.assessments.find({"user_id": user["id"], "completed": True}).to_list(100)
    
    # Get sessions
    sessions = await db.mentor_sessions.find({"mentee_id": user["id"]}).to_list(100)
    
    # Calculate stats
    total_tests = len(assessments)
    avg_score = sum(a.get("score", 0) for a in assessments) / total_tests if total_tests > 0 else 0
    
    # Get latest career paths
    career_paths = []
    if assessments:
        latest = assessments[-1]
        if latest.get("ai_report"):
            career_paths = latest["ai_report"].get("career_paths", [])
    
    # Skill gaps
    skill_gaps = []
    for a in assessments:
        if a.get("ai_report"):
            skill_gaps.extend(a["ai_report"].get("skill_gaps", []))
    skill_gaps = list(set(skill_gaps))[:5]
    
    return {
        "user": {k: v for k, v in user.items() if k not in ["password_hash", "_id"]},
        "stats": {
            "tests_completed": total_tests,
            "average_score": round(avg_score, 1),
            "mentor_sessions": len(sessions),
            "xp_points": user.get("xp_points", 0),
            "badges_earned": len(user.get("badges", []))
        },
        "career_paths": career_paths,
        "skill_gaps": skill_gaps,
        "badges": user.get("badges", []),
        "recent_assessments": [{k: v for k, v in a.items() if k != "_id"} for a in assessments[-3:]],
        "upcoming_sessions": [
            {k: v for k, v in s.items() if k != "_id"}
            for s in sessions
            if s.get("status") in ["pending", "confirmed"]
        ][:3]
    }

# ==================== ADMIN ROUTES ====================

@api_router.get("/admin/stats")
async def get_admin_stats(user: dict = Depends(get_current_user)):
    # Simple admin check - in production, use proper role-based auth
    total_users = await db.users.count_documents({})
    total_assessments = await db.assessments.count_documents({"completed": True})
    total_mentors = await db.mentors.count_documents({})
    total_sessions = await db.mentor_sessions.count_documents({})
    total_revenue = 0
    payments = await db.payments.find({"status": "completed"}).to_list(1000)
    total_revenue = sum(p.get("amount", 0) for p in payments)
    
    return {
        "total_users": total_users,
        "total_assessments": total_assessments,
        "total_mentors": total_mentors,
        "total_sessions": total_sessions,
        "total_revenue": total_revenue,
        "premium_users": await db.users.count_documents({"is_premium": True})
    }

@api_router.get("/admin/mentors/pending")
async def get_pending_mentors(user: dict = Depends(get_current_user)):
    mentors = await db.mentors.find({"approved": False}).to_list(100)
    return [{k: v for k, v in m.items() if k != "_id"} for m in mentors]

@api_router.post("/admin/mentors/{mentor_id}/approve")
async def approve_mentor(mentor_id: str, user: dict = Depends(get_current_user)):
    result = await db.mentors.update_one({"id": mentor_id}, {"$set": {"approved": True}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Mentor not found")
    return {"success": True}

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_data():
    # Seed sample mentors
    sample_mentors = [
        Mentor(
            user_id="system",
            name="Dr. Priya Sharma",
            email="priya@nexosr.com",
            expertise=["Technology", "Data Science", "AI/ML"],
            experience_years=12,
            bio="Former Google engineer with expertise in AI and machine learning. Passionate about helping young minds explore tech careers.",
            category="Technology",
            hourly_rate=1500,
            session_30min_rate=800,
            session_1hr_rate=1500,
            rating=4.9,
            total_sessions=45,
            approved=True
        ),
        Mentor(
            user_id="system",
            name="Rahul Verma",
            email="rahul@nexosr.com",
            expertise=["Business", "Entrepreneurship", "Marketing"],
            experience_years=8,
            bio="Serial entrepreneur and startup mentor. Built 3 successful companies and now guides the next generation of founders.",
            category="Business",
            hourly_rate=1200,
            session_30min_rate=650,
            session_1hr_rate=1200,
            rating=4.8,
            total_sessions=38,
            approved=True
        ),
        Mentor(
            user_id="system",
            name="Ananya Krishnan",
            email="ananya@nexosr.com",
            expertise=["Creative", "Design", "UX/UI"],
            experience_years=6,
            bio="Lead designer at a top design agency. Specializes in helping creatives build portfolios and find their niche.",
            category="Creative",
            hourly_rate=1000,
            session_30min_rate=550,
            session_1hr_rate=1000,
            rating=4.7,
            total_sessions=29,
            approved=True
        ),
        Mentor(
            user_id="system",
            name="Dr. Arun Patel",
            email="arun@nexosr.com",
            expertise=["Healthcare", "Medicine", "Research"],
            experience_years=15,
            bio="Senior physician and medical researcher. Guides aspiring doctors through their career journey.",
            category="Healthcare",
            hourly_rate=2000,
            session_30min_rate=1100,
            session_1hr_rate=2000,
            rating=4.9,
            total_sessions=52,
            approved=True
        ),
        Mentor(
            user_id="system",
            name="Sneha Gupta",
            email="sneha@nexosr.com",
            expertise=["Finance", "Investment", "Banking"],
            experience_years=10,
            bio="Investment banker turned career coach. Expert in finance careers and MBA admissions guidance.",
            category="Finance",
            hourly_rate=1800,
            session_30min_rate=950,
            session_1hr_rate=1800,
            rating=4.8,
            total_sessions=41,
            approved=True
        )
    ]
    
    # Seed sample opportunities
    sample_opportunities = [
        Opportunity(
            title="Software Engineering Intern",
            type="internship",
            company="TechCorp India",
            description="6-month internship for aspiring software engineers. Work on real projects with senior developers.",
            requirements=["Python/JavaScript", "Basic DSA", "Currently pursuing B.Tech/BCA"],
            link="https://example.com/apply",
            tags=["Technology", "Programming", "Software"]
        ),
        Opportunity(
            title="Digital Marketing Certification",
            type="certification",
            company="Google",
            description="Free certification in digital marketing fundamentals from Google.",
            requirements=["Basic computer skills", "Interest in marketing"],
            link="https://skillshop.google.com",
            tags=["Marketing", "Digital", "Business"]
        ),
        Opportunity(
            title="Data Science Bootcamp",
            type="course",
            company="DataCamp",
            description="Comprehensive 12-week program covering Python, ML, and data visualization.",
            requirements=["Basic math", "Dedication"],
            link="https://example.com/bootcamp",
            tags=["Data Science", "AI/ML", "Analytics"]
        ),
        Opportunity(
            title="UI/UX Design Project",
            type="project",
            company="DesignHub",
            description="Design a mobile app for a social cause. Great portfolio builder!",
            requirements=["Figma/Sketch skills", "Design thinking"],
            link="https://example.com/project",
            tags=["Design", "UX/UI", "Creative"]
        ),
        Opportunity(
            title="Content Writing Internship",
            type="internship",
            company="MediaWorks",
            description="Write articles, blogs, and social media content for leading brands.",
            requirements=["Excellent English", "Creative writing skills"],
            link="https://example.com/content",
            tags=["Writing", "Content", "Creative"]
        )
    ]
    
    # Clear and insert
    await db.mentors.delete_many({"user_id": "system"})
    await db.opportunities.delete_many({})
    
    for mentor in sample_mentors:
        await db.mentors.insert_one(mentor.dict())
    
    for opp in sample_opportunities:
        await db.opportunities.insert_one(opp.dict())
    
    return {"success": True, "mentors_added": len(sample_mentors), "opportunities_added": len(sample_opportunities)}

# ==================== HEALTH CHECK ====================

@api_router.get("/")
async def root():
    return {"message": "Welcome to NEXOSR API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

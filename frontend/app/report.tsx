import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { COLORS, SPACING, FONT_SIZES } from '../src/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const { width } = Dimensions.get('window');

export default function ReportScreen() {
  const router = useRouter();
  const { assessmentId } = useLocalSearchParams();
  const [assessment, setAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssessment();
  }, []);

  const fetchAssessment = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/assessments/${assessmentId}`);
      setAssessment(response.data);
    } catch (error) {
      console.error('Report fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Generating your AI report...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!assessment || !assessment.ai_report) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>Report not available</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  const report = assessment.ai_report;
  const score = assessment.score;

  const getScoreColor = (score: number) => {
    if (score >= 80) return COLORS.success;
    if (score >= 60) return COLORS.warning;
    return COLORS.error;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Button
            title=""
            onPress={() => router.back()}
            variant="ghost"
            icon={<Ionicons name="arrow-back" size={24} color={COLORS.text} />}
          />
          <Text style={styles.headerTitle}>AI Report</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Score Card */}
        <Card style={styles.scoreCard}>
          <View style={styles.scoreContent}>
            <View style={[styles.scoreCircle, { borderColor: getScoreColor(score) }]}>
              <Text style={[styles.scoreValue, { color: getScoreColor(score) }]}>
                {score?.toFixed(0)}%
              </Text>
            </View>
            <View style={styles.scoreInfo}>
              <Text style={styles.scoreLabel}>Your Score</Text>
              <Text style={styles.testType}>
                {assessment.test_type.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </Text>
              <View style={styles.xpBadge}>
                <Ionicons name="flash" size={14} color={COLORS.gold} />
                <Text style={styles.xpText}>+50 XP Earned</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Summary */}
        <Card style={styles.summaryCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sparkles" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Nexosr AI Analysis</Text>
          </View>
          <Text style={styles.summaryText}>{report.summary}</Text>
        </Card>

        {/* Strengths */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.sectionTitle}>Your Strengths</Text>
          </View>
          {report.strengths?.map((strength: string, index: number) => (
            <View key={index} style={styles.listItem}>
              <View style={[styles.bullet, { backgroundColor: COLORS.success }]} />
              <Text style={styles.listText}>{strength}</Text>
            </View>
          ))}
        </Card>

        {/* Areas for Improvement */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trending-up" size={20} color={COLORS.warning} />
            <Text style={styles.sectionTitle}>Areas for Growth</Text>
          </View>
          {report.weaknesses?.map((weakness: string, index: number) => (
            <View key={index} style={styles.listItem}>
              <View style={[styles.bullet, { backgroundColor: COLORS.warning }]} />
              <Text style={styles.listText}>{weakness}</Text>
            </View>
          ))}
        </Card>

        {/* Career Paths */}
        <Text style={styles.mainSectionTitle}>Recommended Career Paths</Text>
        {report.career_paths?.map((career: any, index: number) => (
          <Card key={index} style={styles.careerCard}>
            <View style={styles.careerHeader}>
              <Text style={styles.careerRank}>#{index + 1}</Text>
              <View style={styles.careerInfo}>
                <Text style={styles.careerTitle}>{career.title}</Text>
                <Text style={styles.careerDesc}>{career.description}</Text>
              </View>
              <View style={styles.matchContainer}>
                <Text style={styles.matchValue}>{career.match_score}%</Text>
                <Text style={styles.matchLabel}>Match</Text>
              </View>
            </View>
          </Card>
        ))}

        {/* Subject Recommendations */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="book" size={20} color={COLORS.info} />
            <Text style={styles.sectionTitle}>Focus Areas</Text>
          </View>
          <View style={styles.tagsContainer}>
            {report.subject_recommendations?.map((subject: string, index: number) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{subject}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Skill Gaps */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="construct" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Skills to Develop</Text>
          </View>
          <View style={styles.tagsContainer}>
            {report.skill_gaps?.map((skill: string, index: number) => (
              <View key={index} style={[styles.tag, styles.skillTag]}>
                <Ionicons name="add" size={14} color={COLORS.primary} />
                <Text style={[styles.tagText, styles.skillTagText]}>{skill}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Mentor Recommendations */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people" size={20} color={COLORS.success} />
            <Text style={styles.sectionTitle}>Suggested Mentor Expertise</Text>
          </View>
          <View style={styles.tagsContainer}>
            {report.mentor_categories?.map((category: string, index: number) => (
              <View key={index} style={[styles.tag, styles.mentorTag]}>
                <Text style={[styles.tagText, styles.mentorTagText]}>{category}</Text>
              </View>
            ))}
          </View>
          <Button
            title="Find Mentors"
            onPress={() => router.push('/(tabs)/mentors')}
            variant="outline"
            size="medium"
            style={styles.mentorButton}
          />
        </Card>

        {/* Learning Path */}
        {report.predicted_learning_path && (
          <Card style={styles.pathCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="map" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Your Learning Path</Text>
            </View>
            <Text style={styles.pathText}>{report.predicted_learning_path}</Text>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <Button
            title="Take Another Test"
            onPress={() => router.replace('/(tabs)/assessments')}
            size="large"
          />
          <Button
            title="Chat with AI"
            onPress={() => router.replace('/(tabs)/chat')}
            variant="outline"
            size="large"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.lg,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text,
  },
  scoreCard: {
    marginBottom: SPACING.md,
  },
  scoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  scoreValue: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
  },
  scoreInfo: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  testType: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 4,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${COLORS.gold}20`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
  },
  xpText: {
    color: COLORS.gold,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  summaryCard: {
    marginBottom: SPACING.md,
    backgroundColor: `${COLORS.primary}10`,
    borderColor: COLORS.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  summaryText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    lineHeight: 24,
  },
  sectionCard: {
    marginBottom: SPACING.md,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: SPACING.sm,
  },
  listText: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    lineHeight: 22,
  },
  mainSectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
    marginTop: SPACING.md,
  },
  careerCard: {
    marginBottom: SPACING.sm,
  },
  careerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  careerRank: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginRight: SPACING.md,
  },
  careerInfo: {
    flex: 1,
  },
  careerTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  careerDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  matchContainer: {
    alignItems: 'center',
    backgroundColor: `${COLORS.success}20`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  matchValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  matchLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tag: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  tagText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
  },
  skillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${COLORS.primary}10`,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  skillTagText: {
    color: COLORS.primary,
  },
  mentorTag: {
    backgroundColor: `${COLORS.success}10`,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  mentorTagText: {
    color: COLORS.success,
  },
  mentorButton: {
    marginTop: SPACING.md,
  },
  pathCard: {
    marginBottom: SPACING.md,
    backgroundColor: `${COLORS.info}10`,
    borderColor: COLORS.info,
  },
  pathText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    lineHeight: 24,
  },
  actionsContainer: {
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
});

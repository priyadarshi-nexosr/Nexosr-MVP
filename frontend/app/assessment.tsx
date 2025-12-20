import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { COLORS, SPACING, FONT_SIZES } from '../src/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const TIME_LIMIT = 45; // seconds per question

export default function AssessmentScreen() {
  const router = useRouter();
  const { assessmentId } = useLocalSearchParams();
  const [assessment, setAssessment] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAssessment();
  }, []);

  useEffect(() => {
    if (!assessment || currentIndex >= assessment.questions.length) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleNext();
          return TIME_LIMIT;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, assessment]);

  const fetchAssessment = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/assessments/${assessmentId}`);
      setAssessment(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load assessment');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleNext = useCallback(() => {
    const currentQuestion = assessment?.questions[currentIndex];
    if (currentQuestion) {
      const newAnswer = {
        question_id: currentQuestion.id,
        selected: selectedOption,
      };
      setAnswers((prev) => [...prev, newAnswer]);
    }

    if (currentIndex < (assessment?.questions?.length || 0) - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setTimeLeft(TIME_LIMIT);
    } else {
      submitAssessment();
    }
  }, [selectedOption, currentIndex, assessment]);

  const submitAssessment = async () => {
    setSubmitting(true);
    try {
      const currentQuestion = assessment?.questions[currentIndex];
      const finalAnswers = [...answers];
      if (currentQuestion && selectedOption !== null) {
        finalAnswers.push({
          question_id: currentQuestion.id,
          selected: selectedOption,
        });
      }

      const response = await axios.post(`${API_URL}/api/assessments/submit`, {
        assessment_id: assessmentId,
        answers: finalAnswers,
      });

      router.replace({
        pathname: '/report',
        params: { assessmentId, immediate: 'true' },
      });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading assessment...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!assessment) return null;

  const currentQuestion = assessment.questions[currentIndex];
  const progress = ((currentIndex + 1) / assessment.questions.length) * 100;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          Alert.alert(
            'Exit Test',
            'Are you sure you want to exit? Your progress will be lost.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Exit', style: 'destructive', onPress: () => router.back() },
            ]
          );
        }}>
          <Ionicons name="close" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.timerContainer}>
          <Ionicons name="time" size={20} color={timeLeft <= 10 ? COLORS.error : COLORS.textSecondary} />
          <Text style={[styles.timerText, timeLeft <= 10 && styles.timerWarning]}>
            {timeLeft}s
          </Text>
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Question {currentIndex + 1} of {assessment.questions.length}
        </Text>
      </View>

      {/* Question */}
      <View style={styles.questionContainer}>
        <Card style={styles.questionCard}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </Card>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option: string, index: number) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selectedOption === index && styles.optionSelected,
              ]}
              onPress={() => setSelectedOption(index)}
            >
              <View style={[
                styles.optionIndicator,
                selectedOption === index && styles.optionIndicatorSelected,
              ]}>
                {selectedOption === index ? (
                  <Ionicons name="checkmark" size={16} color={COLORS.text} />
                ) : (
                  <Text style={styles.optionLetter}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                )}
              </View>
              <Text style={[
                styles.optionText,
                selectedOption === index && styles.optionTextSelected,
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          title={currentIndex === assessment.questions.length - 1 ? 'Submit' : 'Next'}
          onPress={handleNext}
          loading={submitting}
          size="large"
          style={styles.nextButton}
          disabled={selectedOption === null}
        />
      </View>
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
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  timerText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  timerWarning: {
    color: COLORS.error,
  },
  progressContainer: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 3,
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
  },
  questionContainer: {
    flex: 1,
    padding: SPACING.md,
  },
  questionCard: {
    marginBottom: SPACING.lg,
  },
  questionText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
    lineHeight: 28,
    fontWeight: '500',
  },
  optionsContainer: {
    gap: SPACING.sm,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  optionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  optionIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  optionIndicatorSelected: {
    backgroundColor: COLORS.primary,
  },
  optionLetter: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  optionText: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
  },
  optionTextSelected: {
    color: COLORS.text,
    fontWeight: '500',
  },
  footer: {
    padding: SPACING.md,
  },
  nextButton: {
    width: '100%',
  },
});

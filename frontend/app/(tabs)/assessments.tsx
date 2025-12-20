import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '../../src/store/authStore';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { COLORS, SPACING, FONT_SIZES } from '../../src/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const TEST_TYPES = [
  {
    id: 'aptitude',
    title: 'Aptitude Test',
    description: 'Measure your logical, numerical, and verbal reasoning skills',
    icon: 'bulb',
    color: COLORS.primary,
    duration: '15 min',
  },
  {
    id: 'personality',
    title: 'Personality Assessment',
    description: 'Discover your personality traits and work preferences',
    icon: 'person',
    color: COLORS.info,
    duration: '10 min',
  },
  {
    id: 'career_interest',
    title: 'Career Interest Test',
    description: 'Find careers that match your interests and passions',
    icon: 'compass',
    color: COLORS.success,
    duration: '12 min',
  },
  {
    id: 'skill_assessment',
    title: 'Skill Assessment',
    description: 'Evaluate your current skills and identify gaps',
    icon: 'ribbon',
    color: COLORS.warning,
    duration: '10 min',
  },
];

export default function AssessmentsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/assessments/history`);
      setHistory(response.data);
    } catch (error) {
      console.error('History fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const startTest = async (testType: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/assessments/start?test_type=${testType}`);
      router.push({
        pathname: '/assessment',
        params: { assessmentId: response.data.id },
      });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to start test');
    }
  };

  const viewReport = (assessmentId: string) => {
    router.push({
      pathname: '/report',
      params: { assessmentId },
    });
  };

  const freeTestsRemaining = user?.is_premium ? 'Unlimited' : `${Math.max(0, 2 - history.length)} remaining`;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Assessments</Text>
            <Text style={styles.subtitle}>Discover your strengths with AI-powered tests</Text>
          </View>
        </View>

        {/* Free tier info */}
        {!user?.is_premium && (
          <Card style={styles.tierCard}>
            <View style={styles.tierContent}>
              <Ionicons name="information-circle" size={24} color={COLORS.info} />
              <View style={styles.tierText}>
                <Text style={styles.tierTitle}>Free Plan: {freeTestsRemaining}</Text>
                <Text style={styles.tierDesc}>Upgrade to Premium for unlimited tests and detailed reports</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Test Types */}
        <Text style={styles.sectionTitle}>Available Tests</Text>
        {TEST_TYPES.map((test) => (
          <Card key={test.id} style={styles.testCard}>
            <View style={styles.testHeader}>
              <View style={[styles.testIcon, { backgroundColor: `${test.color}20` }]}>
                <Ionicons name={test.icon as any} size={28} color={test.color} />
              </View>
              <View style={styles.testInfo}>
                <Text style={styles.testTitle}>{test.title}</Text>
                <Text style={styles.testDesc}>{test.description}</Text>
                <View style={styles.testMeta}>
                  <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
                  <Text style={styles.testDuration}>{test.duration}</Text>
                  <Text style={styles.testQuestions}>15 questions</Text>
                </View>
              </View>
            </View>
            <Button
              title="Start Test"
              onPress={() => startTest(test.id)}
              size="medium"
              style={styles.startButton}
            />
          </Card>
        ))}

        {/* History */}
        {history.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Your Test History</Text>
            {history.map((assessment) => (
              <Card key={assessment.id} style={styles.historyCard} onPress={() => viewReport(assessment.id)}>
                <View style={styles.historyHeader}>
                  <View>
                    <Text style={styles.historyTitle}>
                      {TEST_TYPES.find(t => t.id === assessment.test_type)?.title || assessment.test_type}
                    </Text>
                    <Text style={styles.historyDate}>
                      {new Date(assessment.completed_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.scoreContainer}>
                    <Text style={styles.scoreValue}>{assessment.score?.toFixed(0)}%</Text>
                    <Text style={styles.scoreLabel}>Score</Text>
                  </View>
                </View>
                <View style={styles.historyFooter}>
                  <TouchableOpacity style={styles.viewReportButton}>
                    <Ionicons name="document-text" size={16} color={COLORS.primary} />
                    <Text style={styles.viewReportText}>View AI Report</Text>
                  </TouchableOpacity>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                </View>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  tierCard: {
    marginBottom: SPACING.lg,
    backgroundColor: `${COLORS.info}10`,
    borderColor: COLORS.info,
  },
  tierContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  tierText: {
    flex: 1,
  },
  tierTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  tierDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  testCard: {
    marginBottom: SPACING.md,
  },
  testHeader: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  testIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  testInfo: {
    flex: 1,
  },
  testTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  testDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  testMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  testDuration: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginRight: SPACING.sm,
  },
  testQuestions: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  startButton: {
    alignSelf: 'flex-start',
  },
  historyCard: {
    marginBottom: SPACING.sm,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  historyTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  historyDate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: 'center',
    backgroundColor: `${COLORS.success}20`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
  },
  scoreValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  scoreLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  viewReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  viewReportText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
});

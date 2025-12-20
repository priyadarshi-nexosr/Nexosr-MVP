import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '../../src/store/authStore';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { COLORS, SPACING, FONT_SIZES } from '../../src/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const { width } = Dimensions.get('window');

interface DashboardData {
  user: any;
  stats: {
    tests_completed: number;
    average_score: number;
    mentor_sessions: number;
    xp_points: number;
    badges_earned: number;
  };
  career_paths: any[];
  skill_gaps: string[];
  badges: string[];
  recent_assessments: any[];
  upcoming_sessions: any[];
  premium_status?: {
    has_premium_access: boolean;
    is_paid_premium: boolean;
    is_trial: boolean;
    trial_days_remaining: number;
  };
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout().then(() => {
              router.replace('/(auth)/welcome');
            });
          },
        },
      ]
    );
  };

  const fetchDashboard = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/dashboard`);
      setDashboard(response.data);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getSegmentBadge = (segment: string) => {
    const badges: Record<string, { color: string; icon: string }> = {
      student: { color: COLORS.info, icon: 'school' },
      graduate: { color: COLORS.success, icon: 'school' },
      professional: { color: COLORS.warning, icon: 'briefcase' },
    };
    return badges[segment] || badges.student;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{user?.name || 'User'}</Text>
              {dashboard?.premium_status?.is_paid_premium ? (
                <View style={styles.premiumBadge}>
                  <Ionicons name="star" size={12} color={COLORS.gold} />
                  <Text style={styles.premiumText}>PRO</Text>
                </View>
              ) : dashboard?.premium_status?.is_trial ? (
                <View style={styles.trialBadge}>
                  <Ionicons name="gift" size={12} color={COLORS.success} />
                  <Text style={styles.trialText}>TRIAL</Text>
                </View>
              ) : null}
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.segmentBadge, { backgroundColor: `${getSegmentBadge(user?.segment || 'student').color}20` }]}>
              <Ionicons name={getSegmentBadge(user?.segment || 'student').icon as any} size={14} color={getSegmentBadge(user?.segment || 'student').color} />
              <Text style={[styles.segmentText, { color: getSegmentBadge(user?.segment || 'student').color }]}>
                {(user?.segment || 'student').charAt(0).toUpperCase() + (user?.segment || 'student').slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Trial Banner */}
        {dashboard?.premium_status?.is_trial && (
          <Card style={styles.trialCard}>
            <View style={styles.trialCardContent}>
              <View style={styles.trialCardIcon}>
                <Ionicons name="gift" size={28} color={COLORS.success} />
              </View>
              <View style={styles.trialCardText}>
                <Text style={styles.trialCardTitle}>15-Day Free Premium Trial</Text>
                <Text style={styles.trialCardDays}>
                  {dashboard.premium_status.trial_days_remaining} days remaining
                </Text>
              </View>
            </View>
            <View style={styles.trialProgressBar}>
              <View 
                style={[
                  styles.trialProgressFill, 
                  { width: `${((15 - dashboard.premium_status.trial_days_remaining) / 15) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.trialCardFeatures}>
              Unlimited tests, AI reports & mentor access
            </Text>
          </Card>
        )}

        {/* XP Card */}
        <Card style={styles.xpCard}>
          <View style={styles.xpContent}>
            <View style={styles.xpLeft}>
              <Ionicons name="flash" size={32} color={COLORS.gold} />
              <View style={styles.xpTextContainer}>
                <Text style={styles.xpValue}>{dashboard?.stats?.xp_points || 0}</Text>
                <Text style={styles.xpLabel}>XP Points</Text>
              </View>
            </View>
            <View style={styles.xpRight}>
              <TouchableOpacity style={styles.leaderboardButton} onPress={() => router.push('/leaderboard')}>
                <Ionicons name="trophy" size={20} color={COLORS.primary} />
                <Text style={styles.leaderboardText}>Leaderboard</Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* Badge strip */}
          <View style={styles.badgeStrip}>
            {dashboard?.badges?.slice(0, 3).map((badge, index) => (
              <View key={index} style={styles.badgeItem}>
                <Ionicons name="ribbon" size={16} color={COLORS.primary} />
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ))}
            {(!dashboard?.badges || dashboard.badges.length === 0) && (
              <Text style={styles.noBadgeText}>Complete assessments to earn badges!</Text>
            )}
          </View>
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Ionicons name="clipboard-outline" size={24} color={COLORS.info} />
            <Text style={styles.statValue}>{dashboard?.stats?.tests_completed || 0}</Text>
            <Text style={styles.statLabel}>Tests Done</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons name="analytics-outline" size={24} color={COLORS.success} />
            <Text style={styles.statValue}>{dashboard?.stats?.average_score?.toFixed(0) || 0}%</Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons name="people-outline" size={24} color={COLORS.warning} />
            <Text style={styles.statValue}>{dashboard?.stats?.mentor_sessions || 0}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </Card>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/assessments')}>
            <View style={[styles.actionIcon, { backgroundColor: `${COLORS.primary}20` }]}>
              <Ionicons name="bulb" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.actionTitle}>Take Test</Text>
            <Text style={styles.actionDesc}>Discover your strengths</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/chat')}>
            <View style={[styles.actionIcon, { backgroundColor: `${COLORS.info}20` }]}>
              <Ionicons name="chatbubble-ellipses" size={28} color={COLORS.info} />
            </View>
            <Text style={styles.actionTitle}>AI Chat</Text>
            <Text style={styles.actionDesc}>Get career advice</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/mentors')}>
            <View style={[styles.actionIcon, { backgroundColor: `${COLORS.success}20` }]}>
              <Ionicons name="people" size={28} color={COLORS.success} />
            </View>
            <Text style={styles.actionTitle}>Find Mentor</Text>
            <Text style={styles.actionDesc}>Expert guidance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/opportunities')}>
            <View style={[styles.actionIcon, { backgroundColor: `${COLORS.warning}20` }]}>
              <Ionicons name="rocket" size={28} color={COLORS.warning} />
            </View>
            <Text style={styles.actionTitle}>Opportunities</Text>
            <Text style={styles.actionDesc}>Jobs & courses</Text>
          </TouchableOpacity>
        </View>

        {/* Career Paths */}
        {dashboard?.career_paths && dashboard.career_paths.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recommended Career Paths</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.careerScroll}>
              {dashboard.career_paths.map((career, index) => (
                <Card key={index} style={styles.careerCard}>
                  <View style={styles.careerHeader}>
                    <Text style={styles.careerTitle}>{career.title}</Text>
                    <View style={styles.matchBadge}>
                      <Text style={styles.matchText}>{career.match_score}%</Text>
                    </View>
                  </View>
                  <Text style={styles.careerDesc}>{career.description}</Text>
                </Card>
              ))}
            </ScrollView>
          </>
        )}

        {/* Skill Gaps */}
        {dashboard?.skill_gaps && dashboard.skill_gaps.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Skills to Develop</Text>
            <View style={styles.skillsContainer}>
              {dashboard.skill_gaps.map((skill, index) => (
                <View key={index} style={styles.skillChip}>
                  <Ionicons name="trending-up" size={14} color={COLORS.primary} />
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Premium CTA for free users (only show after trial ends) */}
        {!dashboard?.premium_status?.has_premium_access && (
          <Card style={styles.premiumCta} variant="outlined">
            <View style={styles.premiumCtaContent}>
              <Ionicons name="diamond" size={40} color={COLORS.primary} />
              <View style={styles.premiumCtaText}>
                <Text style={styles.premiumCtaTitle}>Your Trial Has Ended</Text>
                <Text style={styles.premiumCtaDesc}>Upgrade to keep unlimited access to all features</Text>
              </View>
            </View>
            <Button title="Upgrade Now" onPress={() => router.push('/premium')} size="medium" />
          </Card>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  greeting: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  userName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.gold}20`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  premiumText: {
    color: COLORS.gold,
    fontSize: FONT_SIZES.xs,
    fontWeight: 'bold',
  },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.success}20`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  trialText: {
    color: COLORS.success,
    fontSize: FONT_SIZES.xs,
    fontWeight: 'bold',
  },
  trialCard: {
    marginBottom: SPACING.md,
    backgroundColor: `${COLORS.success}10`,
    borderColor: COLORS.success,
    borderWidth: 1,
  },
  trialCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  trialCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.success}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  trialCardText: {
    flex: 1,
  },
  trialCardTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  trialCardDays: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  trialProgressBar: {
    height: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 3,
    marginBottom: SPACING.sm,
  },
  trialProgressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 3,
  },
  trialCardFeatures: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  segmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  segmentText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  xpCard: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  xpContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  xpLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  xpTextContainer: {},
  xpValue: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  xpLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  xpRight: {},
  leaderboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: `${COLORS.primary}20`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  leaderboardText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  badgeStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${COLORS.primary}10`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  noBadgeText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  actionCard: {
    width: (width - SPACING.md * 2 - SPACING.sm) / 2,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  actionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  careerScroll: {
    marginBottom: SPACING.lg,
    marginHorizontal: -SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  careerCard: {
    width: width * 0.65,
    marginRight: SPACING.sm,
  },
  careerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  careerTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  matchBadge: {
    backgroundColor: `${COLORS.success}20`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  matchText: {
    color: COLORS.success,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  careerDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  skillText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
  },
  premiumCta: {
    marginTop: SPACING.md,
  },
  premiumCtaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  premiumCtaText: {
    flex: 1,
  },
  premiumCtaTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  premiumCtaDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});

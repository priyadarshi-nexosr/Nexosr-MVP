import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { COLORS, SPACING, FONT_SIZES } from '../../src/constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [language, setLanguage] = useState(user?.language || 'en');

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Force navigation to welcome screen
              router.replace('/(auth)/welcome');
            } catch (error) {
              console.error('Logout error:', error);
              // Even if logout fails, navigate to welcome
              router.replace('/(auth)/welcome');
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    { icon: 'trophy', title: 'Leaderboard', subtitle: 'See top performers', route: '/leaderboard' },
    { icon: 'ribbon', title: 'My Badges', subtitle: `${user?.badges?.length || 0} earned`, route: '/badges' },
    { icon: 'calendar', title: 'My Sessions', subtitle: 'View mentor sessions', route: '/sessions' },
    { icon: 'rocket', title: 'Opportunities', subtitle: 'Jobs, courses & more', route: '/opportunities' },
    { icon: 'card', title: 'Payments', subtitle: 'View payment history', route: '/payments' },
  ];

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'student': return COLORS.info;
      case 'graduate': return COLORS.success;
      case 'professional': return COLORS.warning;
      default: return COLORS.info;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
            {user?.is_premium && (
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={12} color={COLORS.gold} />
              </View>
            )}
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          <View style={[styles.segmentBadge, { backgroundColor: `${getSegmentColor(user?.segment || 'student')}20` }]}>
            <Text style={[styles.segmentText, { color: getSegmentColor(user?.segment || 'student') }]}>
              {(user?.segment || 'student').charAt(0).toUpperCase() + (user?.segment || 'student').slice(1)}
            </Text>
          </View>
        </View>

        {/* Stats Card */}
        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="flash" size={24} color={COLORS.gold} />
              <Text style={styles.statValue}>{user?.xp_points || 0}</Text>
              <Text style={styles.statLabel}>XP Points</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="clipboard" size={24} color={COLORS.info} />
              <Text style={styles.statValue}>{user?.tests_taken || 0}</Text>
              <Text style={styles.statLabel}>Tests</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="people" size={24} color={COLORS.success} />
              <Text style={styles.statValue}>{user?.mentor_sessions || 0}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
          </View>
        </Card>

        {/* Premium CTA */}
        {!user?.is_premium && (
          <Card style={styles.premiumCard} variant="outlined">
            <View style={styles.premiumContent}>
              <Ionicons name="diamond" size={32} color={COLORS.primary} />
              <View style={styles.premiumText}>
                <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
                <Text style={styles.premiumDesc}>Unlock unlimited tests & features</Text>
              </View>
            </View>
            <Button title="View Plans" onPress={() => router.push('/premium')} size="medium" />
          </Card>
        )}

        {/* Interests */}
        <Text style={styles.sectionTitle}>Your Interests</Text>
        <View style={styles.interestsContainer}>
          {user?.interests?.map((interest, index) => (
            <View key={index} style={styles.interestChip}>
              <Text style={styles.interestText}>{interest}</Text>
            </View>
          ))}
          {(!user?.interests || user.interests.length === 0) && (
            <Text style={styles.noDataText}>No interests set</Text>
          )}
        </View>

        {/* Goals */}
        {user?.goals && (
          <>
            <Text style={styles.sectionTitle}>Your Goals</Text>
            <Card style={styles.goalsCard}>
              <Text style={styles.goalsText}>{user.goals}</Text>
            </Card>
          </>
        )}

        {/* Menu */}
        <Text style={styles.sectionTitle}>Quick Links</Text>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => router.push(item.route as any)}
          >
            <View style={styles.menuIcon}>
              <Ionicons name={item.icon as any} size={20} color={COLORS.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        ))}

        {/* Language Toggle */}
        <Text style={styles.sectionTitle}>Settings</Text>
        <Card style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="language" size={20} color={COLORS.primary} />
              <Text style={styles.settingLabel}>Language</Text>
            </View>
            <View style={styles.languageToggle}>
              <TouchableOpacity
                style={[styles.langOption, language === 'en' && styles.langOptionActive]}
                onPress={() => setLanguage('en')}
              >
                <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>EN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.langOption, language === 'hi' && styles.langOptionActive]}
                onPress={() => setLanguage('hi')}
              >
                <Text style={[styles.langText, language === 'hi' && styles.langTextActive]}>हि</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
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
          }}
        >
          <Ionicons name="log-out" size={20} color={COLORS.primary} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Nexosr v1.0.0</Text>
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
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
  },
  premiumBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  userName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  userEmail: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  segmentBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: SPACING.sm,
  },
  segmentText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  statsCard: {
    marginBottom: SPACING.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
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
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  premiumCard: {
    marginBottom: SPACING.lg,
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  premiumText: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  premiumDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  interestChip: {
    backgroundColor: `${COLORS.primary}20`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  interestText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  noDataText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
  },
  goalsCard: {
    marginBottom: SPACING.md,
  },
  goalsText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    lineHeight: 22,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  menuSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  settingsCard: {
    marginBottom: SPACING.lg,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  settingLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  languageToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 2,
  },
  langOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
  },
  langOptionActive: {
    backgroundColor: COLORS.primary,
  },
  langText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  langTextActive: {
    color: COLORS.text,
  },
  logoutButton: {
    marginTop: SPACING.lg,
  },
  versionText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.lg,
  },
});

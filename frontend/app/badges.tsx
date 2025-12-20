import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '../src/store/authStore';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { COLORS, SPACING, FONT_SIZES } from '../src/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function BadgesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/badges`);
      setAllBadges(response.data);
    } catch (error) {
      console.error('Badges error:', error);
    } finally {
      setLoading(false);
    }
  };

  const userBadges = user?.badges || [];

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
          <Text style={styles.headerTitle}>My Badges</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Stats */}
        <Card style={styles.statsCard}>
          <View style={styles.statsContent}>
            <View style={styles.badgeIconLarge}>
              <Ionicons name="ribbon" size={40} color={COLORS.primary} />
            </View>
            <View style={styles.statsText}>
              <Text style={styles.statsValue}>{userBadges.length} / {allBadges.length}</Text>
              <Text style={styles.statsLabel}>Badges Earned</Text>
            </View>
          </View>
        </Card>

        {/* Earned Badges */}
        <Text style={styles.sectionTitle}>Earned</Text>
        {userBadges.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="ribbon-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Complete activities to earn badges!</Text>
          </Card>
        ) : (
          userBadges.map((badge: string, index: number) => {
            const badgeInfo = allBadges.find(b => b.name === badge);
            return (
              <Card key={index} style={styles.badgeCard}>
                <View style={styles.badgeEarned}>
                  <Ionicons name={badgeInfo?.icon || 'ribbon'} size={32} color={COLORS.gold} />
                </View>
                <View style={styles.badgeInfo}>
                  <Text style={styles.badgeName}>{badge}</Text>
                  <Text style={styles.badgeDesc}>{badgeInfo?.description || 'Achievement unlocked!'}</Text>
                </View>
                <View style={styles.earnedBadge}>
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                </View>
              </Card>
            );
          })
        )}

        {/* Locked Badges */}
        <Text style={styles.sectionTitle}>Available</Text>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : (
          allBadges
            .filter(b => !userBadges.includes(b.name))
            .map((badge, index) => (
              <Card key={index} style={[styles.badgeCard, styles.lockedCard]}>
                <View style={styles.badgeLocked}>
                  <Ionicons name={badge.icon || 'ribbon'} size={32} color={COLORS.textMuted} />
                </View>
                <View style={styles.badgeInfo}>
                  <Text style={[styles.badgeName, styles.lockedText]}>{badge.name}</Text>
                  <Text style={styles.badgeDesc}>{badge.description}</Text>
                </View>
                <View style={styles.lockedBadge}>
                  <Ionicons name="lock-closed" size={20} color={COLORS.textMuted} />
                </View>
              </Card>
            ))
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
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text,
  },
  statsCard: {
    marginBottom: SPACING.lg,
    backgroundColor: `${COLORS.primary}10`,
    borderColor: COLORS.primary,
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  badgeIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsText: {
    flex: 1,
  },
  statsValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statsLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  emptyCard: {
    alignItems: 'center',
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  emptyText: {
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  lockedCard: {
    opacity: 0.7,
  },
  badgeEarned: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${COLORS.gold}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  badgeLocked: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  lockedText: {
    color: COLORS.textMuted,
  },
  badgeDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  earnedBadge: {
    marginLeft: SPACING.sm,
  },
  lockedBadge: {
    marginLeft: SPACING.sm,
  },
});

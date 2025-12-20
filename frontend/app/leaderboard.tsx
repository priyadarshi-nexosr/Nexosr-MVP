import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { COLORS, SPACING, FONT_SIZES } from '../src/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function LeaderboardScreen() {
  const router = useRouter();
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/leaderboard`);
      setLeaders(response.data);
    } catch (error) {
      console.error('Leaderboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return { color: COLORS.gold, icon: 'trophy' };
      case 2: return { color: COLORS.silver, icon: 'medal' };
      case 3: return { color: COLORS.bronze, icon: 'medal' };
      default: return { color: COLORS.textSecondary, icon: null };
    }
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
          <Text style={styles.headerTitle}>Leaderboard</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Trophy Banner */}
        <Card style={styles.bannerCard}>
          <Ionicons name="trophy" size={48} color={COLORS.gold} />
          <Text style={styles.bannerTitle}>Top Performers</Text>
          <Text style={styles.bannerSubtitle}>Earn XP by completing tests and mentor sessions</Text>
        </Card>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
        ) : leaders.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="people" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No leaders yet. Be the first!</Text>
          </Card>
        ) : (
          leaders.map((leader, index) => {
            const rankStyle = getRankStyle(leader.rank);
            return (
              <Card key={index} style={[
                styles.leaderCard,
                leader.rank <= 3 && styles.topLeaderCard,
                leader.rank === 1 && { borderColor: COLORS.gold },
                leader.rank === 2 && { borderColor: COLORS.silver },
                leader.rank === 3 && { borderColor: COLORS.bronze },
              ]}>
                <View style={styles.rankContainer}>
                  {rankStyle.icon ? (
                    <Ionicons name={rankStyle.icon as any} size={24} color={rankStyle.color} />
                  ) : (
                    <Text style={[styles.rankText, { color: rankStyle.color }]}>#{leader.rank}</Text>
                  )}
                </View>
                <View style={styles.leaderAvatar}>
                  <Text style={styles.avatarText}>{leader.name.charAt(0)}</Text>
                </View>
                <View style={styles.leaderInfo}>
                  <Text style={styles.leaderName}>{leader.name}</Text>
                  <View style={styles.badgeRow}>
                    {leader.badges.slice(0, 2).map((badge: string, idx: number) => (
                      <View key={idx} style={styles.badgeChip}>
                        <Ionicons name="ribbon" size={10} color={COLORS.primary} />
                        <Text style={styles.badgeText}>{badge}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={styles.xpContainer}>
                  <Ionicons name="flash" size={16} color={COLORS.gold} />
                  <Text style={styles.xpText}>{leader.xp_points}</Text>
                </View>
              </Card>
            );
          })
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
  bannerCard: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    backgroundColor: `${COLORS.gold}10`,
    borderColor: COLORS.gold,
  },
  bannerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  bannerSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  loader: {
    marginTop: SPACING.xxl,
  },
  emptyCard: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
  leaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  topLeaderCard: {
    borderWidth: 2,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  leaderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
  },
  leaderInfo: {
    flex: 1,
  },
  leaderName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: `${COLORS.primary}10`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${COLORS.gold}20`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  xpText: {
    color: COLORS.gold,
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
  },
});

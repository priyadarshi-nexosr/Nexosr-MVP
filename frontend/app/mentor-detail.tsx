import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { COLORS, SPACING, FONT_SIZES } from '../src/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function MentorDetailScreen() {
  const router = useRouter();
  const { mentorData } = useLocalSearchParams();
  const mentor = JSON.parse(mentorData as string);
  const [selectedSession, setSelectedSession] = useState<'30min' | '1hr'>('30min');
  const [booking, setBooking] = useState(false);

  const handleBook = async () => {
    setBooking(true);
    try {
      await axios.post(`${API_URL}/api/mentors/book`, {
        mentor_id: mentor.id,
        session_type: selectedSession,
        scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        notes: '',
      });
      Alert.alert(
        'Session Booked!',
        `Your ${selectedSession} session with ${mentor.name} has been booked. You earned +25 XP!`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to book session');
    } finally {
      setBooking(false);
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
          <Text style={styles.headerTitle}>Mentor Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{mentor.name.charAt(0)}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.mentorName}>{mentor.name}</Text>
              <Text style={styles.mentorCategory}>{mentor.category}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={16} color={COLORS.gold} />
                <Text style={styles.ratingText}>{mentor.rating.toFixed(1)}</Text>
                <Text style={styles.sessionsText}>({mentor.total_sessions} sessions)</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{mentor.experience_years}</Text>
              <Text style={styles.statLabel}>Years Exp</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{mentor.total_sessions}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{mentor.rating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        </Card>

        {/* Bio */}
        <Card style={styles.bioCard}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>{mentor.bio}</Text>
        </Card>

        {/* Expertise */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Expertise</Text>
          <View style={styles.tagsContainer}>
            {mentor.expertise.map((skill: string, index: number) => (
              <View key={index} style={styles.expertiseTag}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                <Text style={styles.expertiseText}>{skill}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Session Options */}
        <Text style={styles.mainSectionTitle}>Book a Session</Text>
        <View style={styles.sessionOptions}>
          <Card
            style={[
              styles.sessionCard,
              selectedSession === '30min' && styles.sessionCardSelected,
            ]}
            onPress={() => setSelectedSession('30min')}
          >
            <View style={styles.sessionHeader}>
              <Ionicons name="time" size={24} color={selectedSession === '30min' ? COLORS.primary : COLORS.textSecondary} />
              <View style={selectedSession === '30min' ? styles.checkmarkActive : styles.checkmark}>
                {selectedSession === '30min' && <Ionicons name="checkmark" size={14} color={COLORS.text} />}
              </View>
            </View>
            <Text style={styles.sessionDuration}>30 Minutes</Text>
            <Text style={styles.sessionPrice}>₹{mentor.session_30min_rate}</Text>
            <Text style={styles.sessionDesc}>Quick consultation</Text>
          </Card>

          <Card
            style={[
              styles.sessionCard,
              selectedSession === '1hr' && styles.sessionCardSelected,
            ]}
            onPress={() => setSelectedSession('1hr')}
          >
            <View style={styles.sessionHeader}>
              <Ionicons name="time" size={24} color={selectedSession === '1hr' ? COLORS.primary : COLORS.textSecondary} />
              <View style={selectedSession === '1hr' ? styles.checkmarkActive : styles.checkmark}>
                {selectedSession === '1hr' && <Ionicons name="checkmark" size={14} color={COLORS.text} />}
              </View>
            </View>
            <Text style={styles.sessionDuration}>1 Hour</Text>
            <Text style={styles.sessionPrice}>₹{mentor.session_1hr_rate}</Text>
            <Text style={styles.sessionDesc}>In-depth session</Text>
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>Popular</Text>
            </View>
          </Card>
        </View>

        {/* Book Button */}
        <Button
          title={`Book Session - ₹${selectedSession === '30min' ? mentor.session_30min_rate : mentor.session_1hr_rate}`}
          onPress={handleBook}
          loading={booking}
          size="large"
          style={styles.bookButton}
        />

        <Text style={styles.disclaimer}>
          Payment is simulated for demo. Real payments coming soon!
        </Text>
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
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  profileCard: {
    marginBottom: SPACING.md,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  mentorName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  mentorCategory: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.xs,
  },
  ratingText: {
    color: COLORS.gold,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  sessionsText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
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
  bioCard: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  bioText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    lineHeight: 24,
  },
  sectionCard: {
    marginBottom: SPACING.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  expertiseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${COLORS.success}10`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  expertiseText: {
    color: COLORS.success,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  mainSectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
    marginTop: SPACING.md,
  },
  sessionOptions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  sessionCard: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
  },
  sessionCardSelected: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: `${COLORS.primary}10`,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: SPACING.sm,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  checkmarkActive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionDuration: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  sessionPrice: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.success,
    marginTop: 4,
  },
  sessionDesc: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  popularBadge: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: SPACING.sm,
  },
  popularText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  bookButton: {
    marginBottom: SPACING.sm,
  },
  disclaimer: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
  },
});

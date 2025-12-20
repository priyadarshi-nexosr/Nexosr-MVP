import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { COLORS, SPACING, FONT_SIZES } from '../../src/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const { width } = Dimensions.get('window');

const CATEGORIES = ['All', 'Technology', 'Business', 'Creative', 'Healthcare', 'Finance'];

interface Mentor {
  id: string;
  name: string;
  email: string;
  expertise: string[];
  experience_years: number;
  bio: string;
  category: string;
  hourly_rate: number;
  session_30min_rate: number;
  session_1hr_rate: number;
  rating: number;
  total_sessions: number;
}

export default function MentorsScreen() {
  const router = useRouter();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [recommended, setRecommended] = useState<Mentor[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMentors();
    fetchRecommended();
  }, []);

  const fetchMentors = async (category?: string) => {
    try {
      let url = `${API_URL}/api/mentors`;
      if (category && category !== 'All') {
        url += `?category=${category}`;
      }
      const response = await axios.get(url);
      setMentors(response.data);
    } catch (error) {
      console.error('Mentors fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommended = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/mentors/recommended`);
      setRecommended(response.data);
    } catch (error) {
      console.error('Recommended mentors error:', error);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    fetchMentors(category);
  };

  const viewMentorDetail = (mentor: Mentor) => {
    router.push({
      pathname: '/mentor-detail',
      params: { mentorId: mentor.id, mentorData: JSON.stringify(mentor) },
    });
  };

  const renderMentorCard = (mentor: Mentor, isRecommended = false) => (
    <Card
      key={mentor.id}
      style={[styles.mentorCard, isRecommended && styles.recommendedCard]}
      onPress={() => viewMentorDetail(mentor)}
    >
      {isRecommended && (
        <View style={styles.recommendedBadge}>
          <Ionicons name="sparkles" size={12} color={COLORS.gold} />
          <Text style={styles.recommendedText}>AI Match</Text>
        </View>
      )}
      <View style={styles.mentorHeader}>
        <View style={styles.mentorAvatar}>
          <Text style={styles.avatarText}>{mentor.name.charAt(0)}</Text>
        </View>
        <View style={styles.mentorInfo}>
          <Text style={styles.mentorName}>{mentor.name}</Text>
          <Text style={styles.mentorCategory}>{mentor.category}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color={COLORS.gold} />
            <Text style={styles.ratingText}>{mentor.rating.toFixed(1)}</Text>
            <Text style={styles.sessionsText}>({mentor.total_sessions} sessions)</Text>
          </View>
        </View>
      </View>
      <Text style={styles.mentorBio} numberOfLines={2}>{mentor.bio}</Text>
      <View style={styles.expertiseTags}>
        {mentor.expertise.slice(0, 3).map((skill, index) => (
          <View key={index} style={styles.expertiseTag}>
            <Text style={styles.expertiseText}>{skill}</Text>
          </View>
        ))}
      </View>
      <View style={styles.mentorFooter}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>From</Text>
          <Text style={styles.priceValue}>₹{mentor.session_30min_rate}</Text>
          <Text style={styles.priceUnit}>/30min</Text>
        </View>
        <Button title="View Profile" onPress={() => viewMentorDetail(mentor)} size="small" />
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Mentors</Text>
            <Text style={styles.subtitle}>Connect with industry experts</Text>
          </View>
        </View>

        {/* Recommended Section */}
        {recommended.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recommended for You</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recommendedScroll}>
              {recommended.map((mentor) => (
                <View key={mentor.id} style={styles.recommendedItem}>
                  {renderMentorCard(mentor, true)}
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* Categories */}
        <Text style={styles.sectionTitle}>Browse by Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipActive,
              ]}
              onPress={() => handleCategoryChange(category)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive,
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* All Mentors */}
        <Text style={styles.sectionTitle}>All Mentors</Text>
        {mentors.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="people" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No mentors found in this category</Text>
          </Card>
        ) : (
          mentors.map((mentor) => renderMentorCard(mentor))
        )}

        {/* Become a Mentor CTA */}
        <Card style={styles.becomeMentorCard} variant="outlined">
          <View style={styles.becomeMentorContent}>
            <Ionicons name="school" size={40} color={COLORS.primary} />
            <View style={styles.becomeMentorText}>
              <Text style={styles.becomeMentorTitle}>Become a Mentor</Text>
              <Text style={styles.becomeMentorDesc}>Share your expertise and help others grow</Text>
            </View>
          </View>
          <Button title="Apply Now" onPress={() => Alert.alert('Coming Soon', 'Mentor applications will be available soon!')} variant="outline" />
        </Card>
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
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
    marginTop: SPACING.md,
  },
  recommendedScroll: {
    marginHorizontal: -SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  recommendedItem: {
    width: width * 0.8,
    marginRight: SPACING.md,
  },
  categoryScroll: {
    marginBottom: SPACING.md,
  },
  categoryChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: COLORS.text,
  },
  mentorCard: {
    marginBottom: SPACING.md,
  },
  recommendedCard: {
    borderColor: COLORS.gold,
    borderWidth: 1,
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${COLORS.gold}20`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
  },
  recommendedText: {
    color: COLORS.gold,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  mentorHeader: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  mentorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
  },
  mentorInfo: {
    flex: 1,
  },
  mentorName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  mentorCategory: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    color: COLORS.gold,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  sessionsText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
  },
  mentorBio: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  expertiseTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  expertiseTag: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  expertiseText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
  },
  mentorFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceLabel: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
  },
  priceValue: {
    color: COLORS.success,
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
  },
  priceUnit: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
  },
  emptyCard: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
  becomeMentorCard: {
    marginTop: SPACING.lg,
  },
  becomeMentorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  becomeMentorText: {
    flex: 1,
  },
  becomeMentorTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  becomeMentorDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});

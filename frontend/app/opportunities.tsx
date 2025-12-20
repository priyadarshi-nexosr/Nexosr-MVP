import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { COLORS, SPACING, FONT_SIZES } from '../src/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const OPPORTUNITY_TYPES = ['All', 'internship', 'course', 'project', 'certification'];

interface Opportunity {
  id: string;
  title: string;
  type: string;
  company: string;
  description: string;
  requirements: string[];
  link: string;
  tags: string[];
}

export default function OpportunitiesScreen() {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [recommended, setRecommended] = useState<Opportunity[]>([]);
  const [selectedType, setSelectedType] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOpportunities();
    fetchRecommended();
  }, []);

  const fetchOpportunities = async (type?: string) => {
    try {
      let url = `${API_URL}/api/opportunities`;
      if (type && type !== 'All') {
        url += `?type=${type}`;
      }
      const response = await axios.get(url);
      setOpportunities(response.data);
    } catch (error) {
      console.error('Opportunities error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommended = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/opportunities/recommended`);
      setRecommended(response.data);
    } catch (error) {
      console.error('Recommended opportunities error:', error);
    }
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    fetchOpportunities(type);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'internship': return { icon: 'briefcase', color: COLORS.info };
      case 'course': return { icon: 'book', color: COLORS.success };
      case 'project': return { icon: 'construct', color: COLORS.warning };
      case 'certification': return { icon: 'ribbon', color: COLORS.primary };
      default: return { icon: 'star', color: COLORS.textSecondary };
    }
  };

  const renderOpportunityCard = (opp: Opportunity, isRecommended = false) => (
    <Card key={opp.id} style={[styles.oppCard, isRecommended && styles.recommendedCard]}>
      {isRecommended && (
        <View style={styles.recommendedBadge}>
          <Ionicons name="sparkles" size={12} color={COLORS.gold} />
          <Text style={styles.recommendedText}>For You</Text>
        </View>
      )}
      <View style={styles.oppHeader}>
        <View style={[styles.typeIcon, { backgroundColor: `${getTypeIcon(opp.type).color}20` }]}>
          <Ionicons name={getTypeIcon(opp.type).icon as any} size={20} color={getTypeIcon(opp.type).color} />
        </View>
        <View style={styles.oppInfo}>
          <Text style={styles.oppTitle}>{opp.title}</Text>
          <Text style={styles.oppCompany}>{opp.company}</Text>
        </View>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{opp.type.charAt(0).toUpperCase() + opp.type.slice(1)}</Text>
        </View>
      </View>
      <Text style={styles.oppDesc} numberOfLines={2}>{opp.description}</Text>
      <View style={styles.tagsContainer}>
        {opp.tags.slice(0, 3).map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
      <View style={styles.oppFooter}>
        <View style={styles.requirementsRow}>
          <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
          <Text style={styles.requirementsText}>{opp.requirements.length} requirements</Text>
        </View>
        <Button
          title="Apply"
          onPress={() => Linking.openURL(opp.link)}
          size="small"
        />
      </View>
    </Card>
  );

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
          <Text style={styles.headerTitle}>Opportunities</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Type Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {OPPORTUNITY_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterChip,
                selectedType === type && styles.filterChipActive,
              ]}
              onPress={() => handleTypeChange(type)}
            >
              <Text style={[
                styles.filterText,
                selectedType === type && styles.filterTextActive,
              ]}>
                {type === 'All' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Recommended */}
        {recommended.length > 0 && selectedType === 'All' && (
          <>
            <Text style={styles.sectionTitle}>Recommended for You</Text>
            {recommended.slice(0, 3).map((opp) => renderOpportunityCard(opp, true))}
          </>
        )}

        {/* All Opportunities */}
        <Text style={styles.sectionTitle}>
          {selectedType === 'All' ? 'All Opportunities' : `${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}s`}
        </Text>
        {opportunities.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="rocket" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No opportunities found</Text>
          </Card>
        ) : (
          opportunities.map((opp) => renderOpportunityCard(opp))
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
  filterScroll: {
    marginBottom: SPACING.lg,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  filterTextActive: {
    color: COLORS.text,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  oppCard: {
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
  oppHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  oppInfo: {
    flex: 1,
  },
  oppTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  oppCompany: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  typeBadge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  oppDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  tag: {
    backgroundColor: `${COLORS.primary}10`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.xs,
  },
  oppFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  requirementsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  requirementsText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  emptyCard: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
});

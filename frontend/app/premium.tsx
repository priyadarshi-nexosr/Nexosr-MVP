import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '../src/store/authStore';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { COLORS, SPACING, FONT_SIZES } from '../src/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const PLANS = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: 299,
    period: '/month',
    features: ['Unlimited tests', 'Full AI reports', 'Mentor booking', 'Priority support'],
  },
  {
    id: 'quarterly',
    name: 'Quarterly',
    price: 799,
    period: '/3 months',
    originalPrice: 897,
    savings: '11% off',
    popular: true,
    features: ['Everything in Monthly', 'Extended AI chat', 'Career roadmap', 'Resource library'],
  },
  {
    id: 'annual',
    name: 'Annual',
    price: 1999,
    period: '/year',
    originalPrice: 3588,
    savings: '44% off',
    features: ['Everything in Quarterly', 'Personal mentor match', '1 free session/month', 'Early access'],
  },
];

export default function PremiumScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = React.useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    setLoading(planId);
    try {
      await axios.post(`${API_URL}/api/payments/subscribe?plan=${planId}`);
      Alert.alert(
        'Welcome to Premium!',
        'Your subscription is now active. Enjoy unlimited access!',
        [{
          text: 'OK',
          onPress: () => {
            if (user) {
              updateUser({ ...user, is_premium: true });
            }
            router.back();
          },
        }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Subscription failed');
    } finally {
      setLoading(null);
    }
  };

  if (user?.is_premium) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Button
            title=""
            onPress={() => router.back()}
            variant="ghost"
            icon={<Ionicons name="arrow-back" size={24} color={COLORS.text} />}
          />
        </View>
        <View style={styles.premiumActive}>
          <View style={styles.premiumIcon}>
            <Ionicons name="diamond" size={64} color={COLORS.gold} />
          </View>
          <Text style={styles.premiumActiveTitle}>You're a Premium Member!</Text>
          <Text style={styles.premiumActiveDesc}>Enjoy all the benefits of your subscription</Text>
          <Card style={styles.benefitsCard}>
            {[
              'Unlimited psychometric tests',
              'Detailed AI analysis reports',
              'Advanced career chatbot',
              'Mentor booking access',
              'Priority support',
            ].map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </Card>
          <Button title="Back to App" onPress={() => router.back()} size="large" />
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerTitle}>Go Premium</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Ionicons name="diamond" size={56} color={COLORS.primary} />
          <Text style={styles.heroTitle}>Unlock Your Full Potential</Text>
          <Text style={styles.heroSubtitle}>Get unlimited access to all features and accelerate your career growth</Text>
        </View>

        {/* Plans */}
        {PLANS.map((plan) => (
          <Card
            key={plan.id}
            style={[
              styles.planCard,
              plan.popular && styles.popularPlan,
            ]}
          >
            {plan.popular && (
              <View style={styles.popularBadge}>
                <Ionicons name="star" size={12} color={COLORS.text} />
                <Text style={styles.popularText}>Most Popular</Text>
              </View>
            )}
            <View style={styles.planHeader}>
              <Text style={styles.planName}>{plan.name}</Text>
              {plan.savings && (
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsText}>{plan.savings}</Text>
                </View>
              )}
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.price}>₹{plan.price}</Text>
              <Text style={styles.period}>{plan.period}</Text>
            </View>
            {plan.originalPrice && (
              <Text style={styles.originalPrice}>₹{plan.originalPrice}</Text>
            )}
            <View style={styles.featuresContainer}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark" size={16} color={COLORS.success} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
            <Button
              title="Subscribe"
              onPress={() => handleSubscribe(plan.id)}
              loading={loading === plan.id}
              size="large"
              variant={plan.popular ? 'primary' : 'outline'}
            />
          </Card>
        ))}

        {/* Guarantee */}
        <View style={styles.guarantee}>
          <Ionicons name="shield-checkmark" size={24} color={COLORS.success} />
          <View style={styles.guaranteeText}>
            <Text style={styles.guaranteeTitle}>7-Day Money Back Guarantee</Text>
            <Text style={styles.guaranteeDesc}>Try risk-free. Full refund if not satisfied.</Text>
          </View>
        </View>

        <Text style={styles.disclaimer}>
          Payment simulation for demo purposes only.
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
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text,
  },
  hero: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  heroTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.lg,
  },
  planCard: {
    marginBottom: SPACING.md,
  },
  popularPlan: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
  },
  popularText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  planName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  savingsBadge: {
    backgroundColor: `${COLORS.success}20`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  savingsText: {
    color: COLORS.success,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  price: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  period: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  originalPrice: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
    marginBottom: SPACING.md,
  },
  featuresContainer: {
    marginBottom: SPACING.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  featureText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
  },
  guarantee: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.success}10`,
    borderRadius: 12,
    padding: SPACING.md,
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  guaranteeText: {
    flex: 1,
  },
  guaranteeTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  guaranteeDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  disclaimer: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.lg,
  },
  premiumActive: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.lg,
  },
  premiumIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${COLORS.gold}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  premiumActiveTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  premiumActiveDesc: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  benefitsCard: {
    width: '100%',
    marginBottom: SPACING.lg,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  benefitText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
  },
});

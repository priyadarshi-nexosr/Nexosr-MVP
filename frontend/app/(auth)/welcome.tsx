import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../src/components/Button';
import { COLORS, SPACING, FONT_SIZES } from '../../src/constants/theme';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  const features = [
    { 
      icon: 'bulb', 
      title: 'Smart Assessments', 
      desc: 'AI-powered psychometric tests to discover your true potential',
      color: '#FF6B6B'
    },
    { 
      icon: 'people', 
      title: 'Expert Mentors', 
      desc: 'Connect 1-on-1 with industry professionals who guide your journey',
      color: '#4ECDC4'
    },
    { 
      icon: 'chatbubbles', 
      title: 'AI Career Guide', 
      desc: 'Get personalized career advice 24/7 from our intelligent assistant',
      color: '#45B7D1'
    },
    { 
      icon: 'rocket', 
      title: 'Opportunities Hub', 
      desc: 'Curated internships, courses, and projects matched to your goals',
      color: '#96CEB4'
    },
  ];

  const testimonials = [
    { name: 'Priya S.', role: 'Engineering Student', text: 'Found my dream career path!' },
    { name: 'Rahul M.', role: 'Graduate', text: 'The mentors are incredible!' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          {/* Logo */}
          <View style={styles.logoWrapper}>
            <View style={styles.logoIconContainer}>
              <Ionicons name="sync" size={36} color="#FFFFFF" />
            </View>
            <Text style={styles.logoText}>NEXOSR</Text>
          </View>

          {/* Hero Content */}
          <Text style={styles.heroTitle}>Shape Your{'\n'}Future Today</Text>
          <Text style={styles.heroSubtitle}>Your Smart Future Companion</Text>
          <Text style={styles.heroDescription}>
            AI-powered career guidance platform designed for ambitious youth aged 14-30
          </Text>

          {/* Hero CTA */}
          <TouchableOpacity 
            style={styles.heroCta}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.9}
          >
            <Text style={styles.heroCtaText}>Start Free Trial</Text>
            <View style={styles.heroCtaIcon}>
              <Ionicons name="arrow-forward" size={20} color={COLORS.primary} />
            </View>
          </TouchableOpacity>

          <Text style={styles.trialText}>15 days free • No credit card required</Text>
        </View>

        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>50K+</Text>
            <Text style={styles.statLabel}>Active Users</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>500+</Text>
            <Text style={styles.statLabel}>Expert Mentors</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>95%</Text>
            <Text style={styles.statLabel}>Success Rate</Text>
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>WHAT WE OFFER</Text>
          <Text style={styles.sectionTitle}>Everything You Need to Succeed</Text>
          
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={[styles.featureIconContainer, { backgroundColor: `${feature.color}20` }]}>
                  <Ionicons name={feature.icon as any} size={28} color={feature.color} />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>HOW IT WORKS</Text>
          <Text style={styles.sectionTitle}>Your Journey to Success</Text>
          
          <View style={styles.stepsContainer}>
            {[
              { step: '01', title: 'Take Assessment', desc: 'Complete AI-powered tests to understand your strengths' },
              { step: '02', title: 'Get Insights', desc: 'Receive detailed career recommendations & skill analysis' },
              { step: '03', title: 'Connect & Grow', desc: 'Book mentors, explore opportunities, achieve your goals' },
            ].map((item, index) => (
              <View key={index} style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{item.step}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{item.title}</Text>
                  <Text style={styles.stepDesc}>{item.desc}</Text>
                </View>
                {index < 2 && <View style={styles.stepConnector} />}
              </View>
            ))}
          </View>
        </View>

        {/* Testimonials */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>TESTIMONIALS</Text>
          <Text style={styles.sectionTitle}>Loved by Students</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.testimonialScroll}>
            {testimonials.map((item, index) => (
              <View key={index} style={styles.testimonialCard}>
                <View style={styles.testimonialQuote}>
                  <Ionicons name="chatbubble-ellipses" size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.testimonialText}>"{item.text}"</Text>
                <View style={styles.testimonialAuthor}>
                  <View style={styles.testimonialAvatar}>
                    <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                  </View>
                  <View>
                    <Text style={styles.testimonialName}>{item.name}</Text>
                    <Text style={styles.testimonialRole}>{item.role}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Final CTA */}
        <View style={styles.finalCtaSection}>
          <Text style={styles.finalCtaTitle}>Ready to Transform Your Future?</Text>
          <Text style={styles.finalCtaDesc}>Join thousands of ambitious youth already on their path to success</Text>
          
          <Button
            title="Get Started Free"
            onPress={() => router.push('/(auth)/register')}
            size="large"
            style={styles.finalCtaButton}
          />
          
          <TouchableOpacity 
            style={styles.loginLink}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.loginLinkText}>Already have an account? </Text>
            <Text style={styles.loginLinkHighlight}>Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLogo}>
            <Ionicons name="sync" size={20} color={COLORS.primary} />
            <Text style={styles.footerLogoText}>NEXOSR</Text>
          </View>
          <Text style={styles.footerText}>© 2024 Nexosr. All rights reserved.</Text>
          <Text style={styles.footerTagline}>Empowering the next generation</Text>
        </View>
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
    flexGrow: 1,
  },
  
  // Hero Section
  heroSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxl,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    letterSpacing: 3,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 44,
    marginBottom: SPACING.sm,
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  heroDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xl,
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingLeft: SPACING.xl,
    paddingRight: SPACING.md,
    borderRadius: 30,
    marginBottom: SPACING.md,
  },
  heroCtaText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    marginRight: SPACING.md,
  },
  heroCtaIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trialText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },

  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    borderRadius: 16,
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },

  // Section Styles
  sectionContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
  sectionLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: SPACING.xs,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },

  // Features Grid
  featuresGrid: {
    gap: SPACING.md,
  },
  featureCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  featureTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  featureDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  // Steps
  stepsContainer: {
    position: 'relative',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
    position: 'relative',
  },
  stepNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  stepNumberText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  stepConnector: {
    position: 'absolute',
    left: 23,
    top: 52,
    width: 2,
    height: 30,
    backgroundColor: COLORS.border,
  },

  // Testimonials
  testimonialScroll: {
    marginHorizontal: -SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  testimonialCard: {
    width: width * 0.75,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: SPACING.lg,
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  testimonialQuote: {
    marginBottom: SPACING.md,
  },
  testimonialText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  testimonialAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testimonialAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  avatarText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
  },
  testimonialName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  testimonialRole: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },

  // Final CTA
  finalCtaSection: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    borderRadius: 24,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  finalCtaTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  finalCtaDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  finalCtaButton: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  loginLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  loginLinkHighlight: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  footerLogoText: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: SPACING.xs,
    letterSpacing: 1,
  },
  footerText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  footerTagline: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
});

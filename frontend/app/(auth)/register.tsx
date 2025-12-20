import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { useAuthStore } from '../../src/store/authStore';
import { COLORS, SPACING, FONT_SIZES } from '../../src/constants/theme';

const INTERESTS = [
  'Technology', 'Business', 'Creative', 'Healthcare', 'Finance',
  'Education', 'Science', 'Arts', 'Sports', 'Law'
];

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [goals, setGoals] = useState('');

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else if (interests.length < 5) {
      setInterests([...interests, interest]);
    }
  };

  const validateStep1 = () => {
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!age || parseInt(age) < 14 || parseInt(age) > 30) {
      setError('Age must be between 14 and 30');
      return false;
    }
    if (interests.length === 0) {
      setError('Please select at least one interest');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setError('');

    try {
      await register({
        name,
        email,
        password,
        age: parseInt(age),
        interests,
        goals,
      });
      router.replace('/(tabs)/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Button
              title=""
              onPress={() => step > 1 ? setStep(step - 1) : router.back()}
              variant="ghost"
              icon={<Ionicons name="arrow-back" size={24} color={COLORS.text} />}
            />
            <View style={styles.stepIndicator}>
              {[1, 2, 3].map((s) => (
                <View
                  key={s}
                  style={[
                    styles.stepDot,
                    s === step && styles.stepDotActive,
                    s < step && styles.stepDotComplete,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Logo */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Ionicons name="sync" size={28} color={COLORS.primary} />
              <Text style={styles.logoText}>NEXOSR</Text>
            </View>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Create Your Account</Text>
              <Text style={styles.stepSubtitle}>Let's start with the basics</Text>

              <Input
                label="Full Name"
                placeholder="Enter your name"
                value={name}
                onChangeText={setName}
                icon={<Ionicons name="person" size={20} color={COLORS.textMuted} />}
              />
              <Input
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                icon={<Ionicons name="mail" size={20} color={COLORS.textMuted} />}
              />
              <Input
                label="Password"
                placeholder="Create a password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                icon={<Ionicons name="lock-closed" size={20} color={COLORS.textMuted} />}
              />

              <Button title="Continue" onPress={handleNext} size="large" style={styles.continueButton} />
            </View>
          )}

          {/* Step 2: Profile Info */}
          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Tell Us About You</Text>
              <Text style={styles.stepSubtitle}>Help us personalize your experience</Text>

              <Input
                label="Your Age"
                placeholder="Enter your age (14-30)"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                icon={<Ionicons name="calendar" size={20} color={COLORS.textMuted} />}
              />

              <Text style={styles.interestLabel}>Select Your Interests (up to 5)</Text>
              <View style={styles.interestsContainer}>
                {INTERESTS.map((interest) => (
                  <TouchableOpacity
                    key={interest}
                    style={[
                      styles.interestChip,
                      interests.includes(interest) && styles.interestChipSelected,
                    ]}
                    onPress={() => toggleInterest(interest)}
                  >
                    <Text
                      style={[
                        styles.interestText,
                        interests.includes(interest) && styles.interestTextSelected,
                      ]}
                    >
                      {interest}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Button title="Continue" onPress={handleNext} size="large" style={styles.continueButton} />
            </View>
          )}

          {/* Step 3: Goals */}
          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Your Career Goals</Text>
              <Text style={styles.stepSubtitle}>What do you want to achieve?</Text>

              <Input
                label="Career Goals (Optional)"
                placeholder="E.g., Become a software engineer, start my own business..."
                value={goals}
                onChangeText={setGoals}
                multiline
                numberOfLines={4}
                icon={<Ionicons name="flag" size={20} color={COLORS.textMuted} />}
              />

              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Your Profile Summary</Text>
                <View style={styles.summaryItem}>
                  <Ionicons name="person" size={16} color={COLORS.primary} />
                  <Text style={styles.summaryText}>{name}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Ionicons name="calendar" size={16} color={COLORS.primary} />
                  <Text style={styles.summaryText}>{age} years old</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Ionicons name="heart" size={16} color={COLORS.primary} />
                  <Text style={styles.summaryText}>{interests.join(', ')}</Text>
                </View>
              </View>

              <Button
                title="Start My Journey"
                onPress={handleRegister}
                loading={loading}
                size="large"
                style={styles.continueButton}
              />
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Button
              title="Sign In"
              onPress={() => router.push('/(auth)/login')}
              variant="ghost"
              size="small"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  stepDotComplete: {
    backgroundColor: COLORS.success,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.error}20`,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: COLORS.error,
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.sm,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  stepSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  interestLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.sm,
    fontWeight: '500',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  interestChip: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  interestChipSelected: {
    backgroundColor: `${COLORS.primary}20`,
    borderColor: COLORS.primary,
  },
  interestText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  interestTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  summaryText: {
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.sm,
  },
  continueButton: {
    marginTop: SPACING.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
  },
});

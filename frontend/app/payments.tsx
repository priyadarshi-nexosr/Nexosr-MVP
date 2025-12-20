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

export default function PaymentsScreen() {
  const router = useRouter();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/payments/history`);
      setPayments(response.data);
    } catch (error) {
      console.error('Payments error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return { icon: 'checkmark-circle', color: COLORS.success };
      case 'pending': return { icon: 'time', color: COLORS.warning };
      case 'failed': return { icon: 'close-circle', color: COLORS.error };
      default: return { icon: 'help-circle', color: COLORS.textMuted };
    }
  };

  const totalSpent = payments
    .filter(p => p.status === 'completed')
    .reduce((acc, p) => acc + p.amount, 0);

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
          <Text style={styles.headerTitle}>Payments</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Summary Card */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryContent}>
            <View style={styles.summaryIcon}>
              <Ionicons name="card" size={32} color={COLORS.primary} />
            </View>
            <View style={styles.summaryText}>
              <Text style={styles.summaryLabel}>Total Spent</Text>
              <Text style={styles.summaryValue}>₹{totalSpent}</Text>
            </View>
          </View>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatValue}>{payments.length}</Text>
              <Text style={styles.summaryStatLabel}>Transactions</Text>
            </View>
            <View style={styles.summaryStatDivider} />
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatValue}>
                {payments.filter(p => p.status === 'completed').length}
              </Text>
              <Text style={styles.summaryStatLabel}>Completed</Text>
            </View>
          </View>
        </Card>

        {/* Transaction History */}
        <Text style={styles.sectionTitle}>Transaction History</Text>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
        ) : payments.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="receipt" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No Transactions</Text>
            <Text style={styles.emptyText}>Your payment history will appear here</Text>
          </Card>
        ) : (
          payments.map((payment, index) => {
            const statusInfo = getStatusIcon(payment.status);
            return (
              <Card key={index} style={styles.paymentCard}>
                <View style={styles.paymentHeader}>
                  <View style={[styles.paymentIcon, { backgroundColor: `${statusInfo.color}20` }]}>
                    <Ionicons name={statusInfo.icon as any} size={24} color={statusInfo.color} />
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentDesc}>{payment.description}</Text>
                    <Text style={styles.paymentDate}>
                      {new Date(payment.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.amountContainer}>
                    <Text style={styles.paymentAmount}>₹{payment.amount}</Text>
                    <Text style={[styles.paymentStatus, { color: statusInfo.color }]}>
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </Text>
                  </View>
                </View>
              </Card>
            );
          })
        )}

        {/* Note */}
        <View style={styles.note}>
          <Ionicons name="information-circle" size={16} color={COLORS.textMuted} />
          <Text style={styles.noteText}>
            Payment processing is simulated for demo purposes.
          </Text>
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
  summaryCard: {
    marginBottom: SPACING.lg,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  summaryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryText: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStatItem: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  summaryStatLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  summaryStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  loader: {
    marginTop: SPACING.xl,
  },
  emptyCard: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptyText: {
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  paymentCard: {
    marginBottom: SPACING.sm,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentDesc: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  paymentDate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  paymentStatus: {
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    justifyContent: 'center',
  },
  noteText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
  },
});

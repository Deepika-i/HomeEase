
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
} from 'react-native';

export default function BookingConfirmationScreen() {
  const router = useRouter();

  const {
    service,
    name,
    district,
    city,
    area,
    preferredDate,
    preferredTime,
  } = useLocalSearchParams<{
    service: string;
    name: string;
    district: string;
    city: string;
    area: string;
    preferredDate: string;
    preferredTime: string;
  }>();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>

        {/* Success Icon */}
        <View style={styles.successCircle}>
          <Text style={styles.successIcon}>✓</Text>
        </View>

        {/* Confirmation Message */}
        <Text style={styles.title}>
          Request Submitted!
        </Text>

        <Text style={styles.subtitle}>
          Thank you for choosing HomeEase.
          Your service request has been received successfully.
        </Text>

        {/* Booking Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Booking Details
          </Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service</Text>
            <Text style={styles.detailValue}>
              {service || 'Home Service'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Customer</Text>
            <Text style={styles.detailValue}>
              {name}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>
              {[area, city, district].filter(Boolean).join(', ')}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Preferred Date</Text>
            <Text style={styles.detailValue}>
              {preferredDate}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Preferred Time</Text>
            <Text style={styles.detailValue}>
              {preferredTime}
            </Text>
          </View>
        </View>

        {/* Next Steps */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            What Happens Next?
          </Text>

          <Text style={styles.step}>
            1. Our service provider will contact you.
          </Text>

          <Text style={styles.step}>
            2. The provider will visit your home for a free inspection.
          </Text>

          <Text style={styles.step}>
            3. You will receive a quotation after inspection.
          </Text>

          <Text style={styles.step}>
            4. Once you approve the quotation, you can pay the booking advance.
          </Text>

          <Text style={styles.step}>
            5. Pay the remaining balance after service completion.
          </Text>
        </View>

        {/* Important Information */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            Free Home Inspection
          </Text>

          <Text style={styles.infoText}>
            No payment is required at this stage.
            The final service price will be shared
            after inspection and will require your approval.
          </Text>
        </View>

        {/* Status */}
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>
            ● Request Submitted
          </Text>
          <Text style={styles.statusSubtext}>
            Waiting for provider response
          </Text>
        </View>

        {/* Home Button */}
        <Pressable
          style={styles.homeButton}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.homeButtonText}>
            Back to Home
          </Text>
        </Pressable>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF1E5',
  },

  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },

  successCircle: {
    width: 85,
    height: 85,
    borderRadius: 45,
    backgroundColor: '#B85D32',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  successIcon: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: 'bold',
  },

  title: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#B85D32',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: '#8C756A',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 25,
  },

  card: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 16,
    marginBottom: 18,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B85D32',
    marginBottom: 16,
  },

  detailRow: {
    marginBottom: 14,
  },

  detailLabel: {
    fontSize: 13,
    color: '#8C756A',
    marginBottom: 4,
  },

  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#392D28',
  },

  step: {
    fontSize: 14,
    lineHeight: 24,
    color: '#392D28',
    marginBottom: 10,
  },

  infoCard: {
    backgroundColor: '#FCE5D4',
    padding: 16,
    borderRadius: 14,
    marginBottom: 18,
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B85D32',
    marginBottom: 8,
  },

  infoText: {
    fontSize: 13,
    lineHeight: 22,
    color: '#392D28',
  },

  statusBox: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },

  statusText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#B85D32',
  },

  statusSubtext: {
    fontSize: 12,
    color: '#8C756A',
    marginTop: 6,
  },

  homeButton: {
    backgroundColor: '#B85D32',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },

  homeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

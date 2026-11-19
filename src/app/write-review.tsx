
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';

import { auth, db } from '../lib/firebase';

export default function WriteReviewScreen() {
  const router = useRouter();

  const { bookingId, service } = useLocalSearchParams<{
    bookingId: string;
    service: string;
  }>();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  useEffect(() => {
    const checkReview = async () => {
      try {
        await auth.authStateReady();

        const user = auth.currentUser;

        if (!user) {
          router.replace('/auth');
          return;
        }

        if (!bookingId) {
          Alert.alert('Error', 'Booking information is missing.');
          router.back();
          return;
        }

        const reviewRef = doc(
          db,
          'users',
          user.uid,
          'bookings',
          bookingId,
          'reviews',
          'customerReview'
        );

        const reviewSnapshot = await getDoc(reviewRef);

        if (reviewSnapshot.exists()) {
          setAlreadyReviewed(true);
        }
      } catch (error) {
        console.log('Review check error:', error);
        Alert.alert('Error', 'Unable to check your review.');
      } finally {
        setLoading(false);
      }
    };

    void checkReview();
  }, [bookingId, router]);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Select Rating', 'Please select a star rating.');
      return;
    }

    if (!comment.trim()) {
      Alert.alert('Write a Review', 'Please enter your review.');
      return;
    }

    if (comment.trim().length > 1000) {
      Alert.alert('Review Too Long', 'Your review must be within 1000 characters.');
      return;
    }

    try {
      setSubmitting(true);

      await auth.authStateReady();

      const user = auth.currentUser;

      if (!user) {
        router.replace('/auth');
        return;
      }

      const bookingRef = doc(
        db,
        'users',
        user.uid,
        'bookings',
        bookingId
      );

      const bookingSnapshot = await getDoc(bookingRef);

      if (
        !bookingSnapshot.exists() ||
        bookingSnapshot.data().status !== 'Completed'
      ) {
        Alert.alert(
          'Not Available',
          'You can review only after confirming work completion.'
        );
        return;
      }

      const reviewRef = doc(
        db,
        'users',
        user.uid,
        'bookings',
        bookingId,
        'reviews',
        'customerReview'
      );

      const existingReview = await getDoc(reviewRef);

      if (existingReview.exists()) {
        setAlreadyReviewed(true);
        Alert.alert('Already Reviewed', 'You have already reviewed this booking.');
        return;
      }

      await setDoc(reviewRef, {
        customerId: user.uid,
        bookingId,
        service: bookingSnapshot.data().service || service || 'Home Service',
        rating,
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
      });

      Alert.alert(
        'Thank You!',
        'Your rating and review have been submitted successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.log('Submit review error:', error);
      Alert.alert(
        'Error',
        'Unable to submit your review. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#B85D32" />
        <Text style={styles.loadingText}>Loading review...</Text>
      </View>
    );
  }

  if (alreadyReviewed) {
    return (
      <View style={styles.center}>
        <Text style={styles.successIcon}>⭐</Text>
        <Text style={styles.title}>Review Submitted</Text>
        <Text style={styles.subtitle}>
          You have already submitted a review for this booking.
          Thank you for sharing your experience!
        </Text>

        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.heading}>Rate & Review</Text>

      <Text style={styles.subtitle}>
        Share your experience with HomeEase.
      </Text>

      <View style={styles.card}>
        <Text style={styles.serviceLabel}>Service</Text>
        <Text style={styles.serviceName}>
          {service || 'Home Service'}
        </Text>

        <Text style={styles.question}>
          How was your service experience?
        </Text>

        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Pressable
              key={star}
              onPress={() => setRating(star)}
              style={styles.starButton}
            >
              <Text
                style={[
                  styles.star,
                  star <= rating && styles.selectedStar,
                ]}
              >
                ★
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.ratingText}>
          {rating === 0
            ? 'Tap a star to rate'
            : [
                '',
                'Poor',
                'Fair',
                'Good',
                'Very Good',
                'Excellent',
              ][rating]}
        </Text>

        <Text style={styles.reviewLabel}>Write your review</Text>

        <TextInput
          style={styles.input}
          placeholder="Tell us about your experience..."
          placeholderTextColor="#A99589"
          multiline
          value={comment}
          onChangeText={setComment}
          maxLength={1000}
          textAlignVertical="top"
        />

        <Text style={styles.characterCount}>
          {comment.length}/1000
        </Text>

        <Pressable
          style={[
            styles.submitButton,
            submitting && styles.disabledButton,
          ]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              Submit Review
            </Text>
          )}
        </Pressable>

        <Pressable
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={submitting}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
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
    paddingBottom: 35,
  },

  center: {
    flex: 1,
    backgroundColor: '#FFF1E5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },

  heading: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#392D28',
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#392D28',
    marginTop: 15,
  },

  subtitle: {
    fontSize: 14,
    color: '#8C756A',
    marginTop: 8,
    lineHeight: 21,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 25,
    borderWidth: 1,
    borderColor: '#EAD8C9',
  },

  serviceLabel: {
    fontSize: 13,
    color: '#8C756A',
  },

  serviceName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#B85D32',
    marginTop: 5,
  },

  question: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#392D28',
    marginTop: 28,
    textAlign: 'center',
  },

  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },

  starButton: {
    paddingHorizontal: 5,
  },

  star: {
    fontSize: 43,
    color: '#D8CFC8',
  },

  selectedStar: {
    color: '#F2A900',
  },

  ratingText: {
    fontSize: 14,
    color: '#B85D32',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },

  reviewLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#392D28',
    marginTop: 30,
    marginBottom: 10,
  },

  input: {
    minHeight: 130,
    backgroundColor: '#FFF9F4',
    borderWidth: 1,
    borderColor: '#EAD8C9',
    borderRadius: 10,
    padding: 13,
    fontSize: 14,
    color: '#392D28',
  },

  characterCount: {
    fontSize: 12,
    color: '#8C756A',
    textAlign: 'right',
    marginTop: 6,
  },

  submitButton: {
    backgroundColor: '#B85D32',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 22,
  },

  disabledButton: {
    opacity: 0.6,
  },

  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },

  cancelButton: {
    padding: 13,
    alignItems: 'center',
    marginTop: 5,
  },

  cancelButtonText: {
    color: '#8C756A',
    fontSize: 14,
    fontWeight: 'bold',
  },

  successIcon: {
    fontSize: 55,
  },

  backButton: {
    backgroundColor: '#B85D32',
    paddingHorizontal: 35,
    paddingVertical: 13,
    borderRadius: 10,
    marginTop: 25,
  },

  backButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  loadingText: {
    color: '#8C756A',
    marginTop: 12,
  },
});


import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collectionGroup,
  getDocs,
} from 'firebase/firestore';

import { auth, db } from '../lib/firebase';

type Review = {
  id: string;
  rating: number;
  comment: string;
  service: string;
  createdAt: string;
};

function normalizeService(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+service$/i, '')
    .replace(/\s+/g, ' ');
}

export default function ServiceReviewsScreen() {
  const params = useLocalSearchParams<{ service?: string | string[] }>();
  const service = Array.isArray(params.service)
    ? params.service[0]
    : params.service || '';

  const router = useRouter();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (active) {
          setReviews([]);
          setError('Please log in to view customer reviews.');
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError('');

        const reviewsQuery = collectionGroup(db, 'reviews');
        const snapshot = await getDocs(reviewsQuery);

        const requestedService = normalizeService(service);

        const loadedReviews: Review[] = snapshot.docs
          .map((reviewDoc) => {
            const data = reviewDoc.data();

            return {
              id: reviewDoc.ref.path,
              rating: Number(data.rating) || 0,
              comment: data.comment || '',
              service: data.service || '',
              createdAt: data.createdAt || '',
            };
          })
          .filter(
            (review) =>
              normalizeService(review.service) === requestedService
          );

        loadedReviews.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        );

        if (active) {
          setReviews(loadedReviews);
        }
      } catch (err) {
        console.log('Service reviews error:', err);

        if (active) {
          setError('Unable to load reviews. Please try again later.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    });

    return () => {
      active = false;
      unsubscribeAuth();
    };
  }, [service]);

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((total, review) => total + review.rating, 0) /
        reviews.length
      : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.heading}>{service || 'Service'} Reviews</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.average}>
          {reviews.length > 0 ? averageRating.toFixed(1) : '—'} ★
        </Text>

        <Text style={styles.summaryText}>
          {reviews.length} customer {reviews.length === 1 ? 'review' : 'reviews'}
        </Text>

        {reviews.length > 0 && (
          <Text style={styles.stars}>★★★★★</Text>
        )}
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#B85D32"
          style={styles.loader}
        />
      ) : error ? (
        <Text style={styles.message}>{error}</Text>
      ) : reviews.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyTitle}>No reviews yet</Text>
          <Text style={styles.emptyText}>
            Customer reviews for this service will appear here after completed
            bookings are rated.
          </Text>
        </View>
      ) : (
        reviews.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.customerName}>Verified Customer</Text>
              <Text style={styles.rating}>
                {'★'.repeat(Math.max(0, Math.min(5, review.rating)))}
              </Text>
            </View>

            <Text style={styles.comment}>{review.comment}</Text>

            {review.createdAt ? (
              <Text style={styles.date}>
                {new Date(review.createdAt).toLocaleDateString()}
              </Text>
            ) : null}
          </View>
        ))
      )}

      <Text style={styles.backButton} onPress={() => router.back()}>
        ← Back
      </Text>
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
    paddingTop: 55,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#B85D32',
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 22,
    alignItems: 'center',
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#EAD8C9',
  },
  average: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#B85D32',
  },
  summaryText: {
    fontSize: 14,
    color: '#8C756A',
    marginTop: 5,
  },
  stars: {
    color: '#E6A23C',
    fontSize: 20,
    marginTop: 8,
  },
  loader: {
    marginTop: 35,
  },
  message: {
    color: '#8C756A',
    textAlign: 'center',
    marginTop: 25,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 38,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#392D28',
  },
  emptyText: {
    fontSize: 13,
    color: '#8C756A',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 17,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: '#EAD8C9',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  customerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#392D28',
  },
  rating: {
    color: '#E6A23C',
    fontSize: 16,
  },
  comment: {
    fontSize: 14,
    color: '#5D4940',
    lineHeight: 21,
  },
  date: {
    fontSize: 11,
    color: '#A18B7F',
    marginTop: 12,
  },
  backButton: {
    color: '#B85D32',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    paddingVertical: 10,
  },
});

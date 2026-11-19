
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';

import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';

import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';

import { auth, db } from '../../lib/firebase';

import AnimatedButton from '@/components/animated-button';
import AnimatedCard from '@/components/animated-card';

export default function HomeScreen() {
  const [location, setLocation] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const router = useRouter();

  useEffect(() => {
    let unsubscribeNotifications: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeNotifications) {
        unsubscribeNotifications();
        unsubscribeNotifications = undefined;
      }

      if (!user) {
        setUnreadCount(0);
        return;
      }

      const notificationsRef = collection(
        db,
        'users',
        user.uid,
        'notifications'
      );

      unsubscribeNotifications = onSnapshot(
        notificationsRef,
        (snapshot) => {
          const unread = snapshot.docs.filter(
            (notification) => notification.data().read === false
          ).length;

          setUnreadCount(unread);
        },
        (error) => {
          console.log('Notification badge error:', error);
        }
      );
    });

    return () => {
      unsubscribeAuth();

      if (unsubscribeNotifications) {
        unsubscribeNotifications();
      }
    };
  }, []);

  const cities = ['Chennai', 'Coimbatore', 'Madurai'];

  const selectCity = (city: string) => {
    setLocation(city);
    setModalVisible(false);
  };

  // Open existing booking details screen
  const selectService = (service: string) => {
    router.push({
      pathname: '/service-details',
      params: { service },
    });
  };

  // Open reviews for the selected service
  const openReviews = (service: string) => {
    router.push({
      pathname: '/service-reviews',
      params: { service },
    });
  };

  const openExplore = () => {
    router.push('/(tabs)/explore');
  };

  const openNotifications = () => {
    router.push('/notifications');
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Notification Bell */}
        <View style={styles.notificationHeader}>
          <Pressable
            style={({ pressed }) => [
              styles.notificationButton,
              pressed && styles.notificationButtonPressed,
            ]}
            onPress={openNotifications}
            accessibilityRole="button"
            accessibilityLabel={
              unreadCount > 0
                ? `${unreadCount} unread notifications`
                : 'Open notifications'
            }
          >
            <Text style={styles.notificationIcon}>🔔</Text>

            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Location Section */}
        <View style={styles.locationContainer}>
          <Text style={styles.locationLabel}>YOUR LOCATION</Text>

          <AnimatedButton onPress={() => setModalVisible(true)}>
            <View style={styles.locationButton}>
              <Text style={styles.locationName}>
                📍 {location || 'Select your location'} ▼
              </Text>
            </View>
          </AnimatedButton>
        </View>

        {/* App Name */}
        <Text style={styles.title}>HomeEase</Text>

        <Text style={styles.subtitle}>
          Your Home, Our Care.
        </Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>

          <TextInput
            style={styles.searchInput}
            placeholder="Search for a home service..."
            placeholderTextColor="#8C756A"
          />
        </View>

        {/* Welcome Banner */}
        <AnimatedCard style={styles.banner}>
          <Text style={styles.bannerTitle}>
            A helping hand,
            {'\n'}right at home.
          </Text>

          <Text style={styles.bannerSubtitle}>
            Book home services with ease.
          </Text>

          <Text style={styles.bannerEmoji}>🏡</Text>
        </AnimatedCard>

        {/* Service Categories */}
        <View style={styles.servicesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Our Services</Text>

            <AnimatedButton onPress={openExplore}>
              <Text style={styles.viewAll}>View All</Text>
            </AnimatedButton>
          </View>

          <View style={styles.servicesGrid}>
            {/* Cleaning */}
            <AnimatedCard style={styles.serviceWrapper}>
              <View style={styles.serviceItem}>
                <AnimatedButton
                  onPress={() => selectService('Cleaning')}
                >
                  <View style={styles.serviceCard}>
                    <Text style={styles.serviceEmoji}>🧹</Text>
                    <Text style={styles.serviceName}>Cleaning</Text>
                  </View>
                </AnimatedButton>

                <Pressable onPress={() => openReviews('Cleaning')}>
                  <Text style={styles.reviewLink}>⭐ Reviews</Text>
                </Pressable>
              </View>
            </AnimatedCard>

            {/* Plumbing */}
            <AnimatedCard style={styles.serviceWrapper} delay={80}>
              <View style={styles.serviceItem}>
                <AnimatedButton
                  onPress={() => selectService('Plumbing')}
                >
                  <View style={styles.serviceCard}>
                    <Text style={styles.serviceEmoji}>🔧</Text>
                    <Text style={styles.serviceName}>Plumbing</Text>
                  </View>
                </AnimatedButton>

                <Pressable onPress={() => openReviews('Plumbing')}>
                  <Text style={styles.reviewLink}>⭐ Reviews</Text>
                </Pressable>
              </View>
            </AnimatedCard>

            {/* Electrical */}
            <AnimatedCard style={styles.serviceWrapper} delay={160}>
              <View style={styles.serviceItem}>
                <AnimatedButton
                  onPress={() => selectService('Electrical')}
                >
                  <View style={styles.serviceCard}>
                    <Text style={styles.serviceEmoji}>⚡</Text>
                    <Text style={styles.serviceName}>Electrical</Text>
                  </View>
                </AnimatedButton>

                <Pressable onPress={() => openReviews('Electrical')}>
                  <Text style={styles.reviewLink}>⭐ Reviews</Text>
                </Pressable>
              </View>
            </AnimatedCard>

            {/* Painting */}
            <AnimatedCard style={styles.serviceWrapper} delay={240}>
              <View style={styles.serviceItem}>
                <AnimatedButton
                  onPress={() => selectService('Painting')}
                >
                  <View style={styles.serviceCard}>
                    <Text style={styles.serviceEmoji}>🎨</Text>
                    <Text style={styles.serviceName}>Painting</Text>
                  </View>
                </AnimatedButton>

                <Pressable onPress={() => openReviews('Painting')}>
                  <Text style={styles.reviewLink}>⭐ Reviews</Text>
                </Pressable>
              </View>
            </AnimatedCard>

            {/* AC Service */}
            <AnimatedCard style={styles.serviceWrapper} delay={320}>
              <View style={styles.serviceItem}>
                <AnimatedButton
                  onPress={() => selectService('AC Service')}
                >
                  <View style={styles.serviceCard}>
                    <Text style={styles.serviceEmoji}>❄️</Text>
                    <Text style={styles.serviceName}>AC Service</Text>
                  </View>
                </AnimatedButton>

                <Pressable onPress={() => openReviews('AC Service')}>
                  <Text style={styles.reviewLink}>⭐ Reviews</Text>
                </Pressable>
              </View>
            </AnimatedCard>

            {/* More */}
            <AnimatedCard style={styles.serviceWrapper} delay={400}>
              <AnimatedButton onPress={openExplore}>
                <View style={styles.serviceCard}>
                  <Text style={styles.serviceEmoji}>＋</Text>
                  <Text style={styles.serviceName}>More</Text>
                </View>
              </AnimatedButton>
            </AnimatedCard>
          </View>
        </View>

        {/* Popular Services */}
        <View style={styles.popularSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Services</Text>

            <AnimatedButton onPress={openExplore}>
              <Text style={styles.viewAll}>View All</Text>
            </AnimatedButton>
          </View>

          {/* Deep Cleaning */}
          <AnimatedCard style={styles.popularCard}>
            <AnimatedButton
              onPress={() => selectService('Cleaning')}
            >
              <View style={styles.popularCardContent}>
                <Text style={styles.popularEmoji}>🧹</Text>

                <View style={styles.popularDetails}>
                  <Text style={styles.popularTitle}>
                    Home Deep Cleaning
                  </Text>

                  <Text style={styles.popularDescription}>
                    A fresh, clean space for your family.
                  </Text>

                  <Text style={styles.popularPrice}>
                    From ₹499
                  </Text>
                </View>
              </View>
            </AnimatedButton>

            <Pressable onPress={() => openReviews('Cleaning')}>
              <Text style={styles.popularReviewLink}>
                ⭐ View Cleaning Reviews →
              </Text>
            </Pressable>
          </AnimatedCard>

          {/* Plumbing */}
          <AnimatedCard style={styles.popularCard} delay={150}>
            <AnimatedButton
              onPress={() => selectService('Plumbing')}
            >
              <View style={styles.popularCardContent}>
                <Text style={styles.popularEmoji}>🔧</Text>

                <View style={styles.popularDetails}>
                  <Text style={styles.popularTitle}>
                    Plumbing Repair
                  </Text>

                  <Text style={styles.popularDescription}>
                    Help with leaking taps and pipes.
                  </Text>

                  <Text style={styles.popularPrice}>
                    From ₹199
                  </Text>
                </View>
              </View>
            </AnimatedButton>

            <Pressable onPress={() => openReviews('Plumbing')}>
              <Text style={styles.popularReviewLink}>
                ⭐ View Plumbing Reviews →
              </Text>
            </Pressable>
          </AnimatedCard>
        </View>

        {/* Bottom Home Illustration */}
        <AnimatedCard style={styles.footerCard} delay={200}>
          <Text style={styles.footerEmoji}>🏡</Text>

          <Text style={styles.footerTitle}>
            Your Home, Our Care.
          </Text>

          <Text style={styles.footerSubtitle}>
            Making everyday living easier,
            {'\n'}one service at a time.
          </Text>

          <View style={styles.footerDecoration} />
        </AnimatedCard>
      </ScrollView>

      {/* City Selection Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              Select Your City
            </Text>

            {cities.map((city) => (
              <AnimatedButton
                key={city}
                onPress={() => selectCity(city)}
              >
                <View style={styles.cityButton}>
                  <Text style={styles.cityText}>{city}</Text>
                </View>
              </AnimatedButton>
            ))}

            <AnimatedButton
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </AnimatedButton>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF1E5',
  },

  contentContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 60,
    paddingBottom: 40,
  },

  notificationHeader: {
    width: '90%',
    alignItems: 'flex-end',
    marginBottom: 12,
  },

  notificationButton: {
    width: 45,
    height: 45,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAD8C9',
    position: 'relative',
  },

  notificationButtonPressed: {
    opacity: 0.65,
  },

  notificationIcon: {
    fontSize: 22,
  },

  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 19,
    height: 19,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: '#E53935',
    borderWidth: 2,
    borderColor: '#FFF1E5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },

  locationContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },

  locationLabel: {
    fontSize: 12,
    color: '#8C756A',
    fontWeight: '600',
  },

  locationButton: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },

  locationName: {
    fontSize: 16,
    color: '#392D28',
    fontWeight: 'bold',
  },

  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#B85D32',
  },

  subtitle: {
    fontSize: 16,
    color: '#392D28',
    marginTop: 8,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    width: '90%',
    paddingHorizontal: 15,
    borderRadius: 12,
    marginTop: 30,
    borderWidth: 1,
    borderColor: '#EAD8C9',
  },

  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },

  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 14,
    color: '#392D28',
  },

  banner: {
    width: '90%',
    backgroundColor: '#B85D32',
    padding: 22,
    borderRadius: 18,
    marginTop: 25,
  },

  bannerTitle: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  bannerSubtitle: {
    fontSize: 14,
    color: '#FFF1E5',
    marginTop: 10,
  },

  bannerEmoji: {
    fontSize: 42,
    textAlign: 'right',
    marginTop: 5,
  },

  servicesSection: {
    width: '90%',
    marginTop: 30,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#392D28',
  },

  viewAll: {
    fontSize: 14,
    color: '#B85D32',
    fontWeight: 'bold',
    padding: 4,
  },

  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  serviceWrapper: {
    width: '31%',
    marginBottom: 12,
  },

  serviceItem: {
    width: '100%',
    alignItems: 'stretch',
  },

  serviceCard: {
    width: '100%',
    minHeight: 90,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAD8C9',
  },

  serviceEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },

  serviceName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#392D28',
  },

  // Updated Reviews style only
  reviewLink: {
    color: '#B85D32',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    textAlign: 'center',
    backgroundColor: '#FFF1E5',
    borderRadius: 8,
    overflow: 'hidden',
  },

  popularSection: {
    width: '90%',
    marginTop: 30,
    marginBottom: 20,
  },

  popularCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EAD8C9',
  },

  popularCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  popularEmoji: {
    fontSize: 38,
    marginRight: 15,
  },

  popularDetails: {
    flex: 1,
  },

  popularTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#392D28',
  },

  popularDescription: {
    fontSize: 12,
    color: '#8C756A',
    marginTop: 5,
  },

  popularPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#B85D32',
    marginTop: 8,
  },

  // Updated Popular Reviews style only
  popularReviewLink: {
    color: '#B85D32',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 13,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: '#FFF1E5',
    borderRadius: 8,
    overflow: 'hidden',
  },

  footerCard: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#EAD8C9',
    overflow: 'hidden',
  },

  footerEmoji: {
    fontSize: 58,
    marginBottom: 10,
  },

  footerTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#B85D32',
    textAlign: 'center',
  },

  footerSubtitle: {
    fontSize: 13,
    color: '#8C756A',
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 8,
  },

  footerDecoration: {
    width: 45,
    height: 3,
    backgroundColor: '#EAD8C9',
    borderRadius: 5,
    marginTop: 16,
  },

  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContainer: {
    width: '85%',
    backgroundColor: '#FFF1E5',
    padding: 24,
    borderRadius: 18,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#B85D32',
    marginBottom: 15,
    textAlign: 'center',
  },

  cityButton: {
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 10,
  },

  cityText: {
    fontSize: 16,
    color: '#392D28',
    textAlign: 'center',
  },

  cancelText: {
    textAlign: 'center',
    color: '#8C756A',
    marginTop: 15,
    padding: 5,
    fontSize: 15,
  },
});

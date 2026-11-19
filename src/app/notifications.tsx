
import { useCallback, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { useFocusEffect, useRouter } from 'expo-router';

import { auth } from '../lib/firebase';

import {
  getUserNotifications,
  markNotificationAsRead,
  NotificationData,
} from '../utils/firestoreBookingStorage';

export default function NotificationsScreen() {
  const router = useRouter();

  const [notifications, setNotifications] =
    useState<NotificationData[]>([]);

  const [loading, setLoading] = useState(true);

  const [updatingId, setUpdatingId] = useState<string | null>(
    null
  );

  // Load customer notifications
  const loadNotifications = useCallback(async () => {
    const user = auth.currentUser;

    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const result = await getUserNotifications(user.uid);

      setNotifications(result);
    } catch (error) {
      console.log('Notification loading error:', error);

      Alert.alert(
        'Error',
        'Unable to load notifications. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh whenever screen opens
  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  // Mark notification as read
  const handleNotificationPress = async (
    notification: NotificationData
  ) => {
    const user = auth.currentUser;

    if (!user || notification.read) {
      return;
    }

    try {
      setUpdatingId(notification.id);

      await markNotificationAsRead(
        user.uid,
        notification.id
      );

      setNotifications((previous) =>
        previous.map((item) =>
          item.id === notification.id
            ? { ...item, read: true }
            : item
        )
      );
    } catch (error) {
      console.log('Mark notification error:', error);

      Alert.alert(
        'Error',
        'Unable to update notification.'
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Format notification date
  const formatDate = (date: string) => {
    if (!date) {
      return '';
    }

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) {
      return '';
    }

    return parsedDate.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get notification icon
  const getNotificationIcon = (
    type: NotificationData['type']
  ) => {
    switch (type) {
      case 'approved':
        return '✓';

      case 'rejected':
        return '✕';

      case 'cancelled':
        return '!';
      
      default:
        return '🔔';
    }
  };

  // Get notification color
  const getNotificationColor = (
    type: NotificationData['type']
  ) => {
    switch (type) {
      case 'approved':
        return '#447A54';

      case 'rejected':
        return '#B94A48';

      case 'cancelled':
        return '#C18435';

      default:
        return '#B85D32';
    }
  };

  const unreadCount = notifications.filter(
    (item) => !item.read
  ).length;

  // Loading screen
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#B85D32"
        />

        <Text style={styles.loadingText}>
          Loading notifications...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            Notifications
          </Text>

          <Text style={styles.headerSubtitle}>
            Stay updated with your bookings
          </Text>
        </View>

        <Pressable
          style={styles.refreshButton}
          onPress={loadNotifications}
        >
          <Text style={styles.refreshText}>↻</Text>
        </Pressable>
      </View>

      {/* Notification Summary */}
      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryTitle}>
            Your Notifications
          </Text>

          <Text style={styles.summarySubtitle}>
            {notifications.length}{' '}
            {notifications.length === 1
              ? 'notification'
              : 'notifications'}
          </Text>
        </View>

        <View style={styles.unreadBadge}>
          <Text style={styles.unreadNumber}>
            {unreadCount}
          </Text>

          <Text style={styles.unreadLabel}>
            Unread
          </Text>
        </View>
      </View>

      {/* Notification List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {!auth.currentUser ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔒</Text>

            <Text style={styles.emptyTitle}>
              Please Login
            </Text>

            <Text style={styles.emptySubtitle}>
              Login to view your notifications.
            </Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>

            <Text style={styles.emptyTitle}>
              No Notifications Yet
            </Text>

            <Text style={styles.emptySubtitle}>
              Your booking updates will appear here.
            </Text>
          </View>
        ) : (
          notifications.map((item) => {
            const iconColor = getNotificationColor(
              item.type
            );

            return (
              <Pressable
                key={item.id}
                style={[
                  styles.notificationCard,
                  !item.read && styles.unreadCard,
                ]}
                onPress={() =>
                  handleNotificationPress(item)
                }
                disabled={updatingId === item.id}
              >
                <View
                  style={[
                    styles.notificationIcon,
                    { backgroundColor: iconColor },
                  ]}
                >
                  <Text style={styles.iconText}>
                    {getNotificationIcon(item.type)}
                  </Text>
                </View>

                <View style={styles.notificationContent}>
                  <View style={styles.titleRow}>
                    <Text style={styles.notificationTitle}>
                      {item.title}
                    </Text>

                    {!item.read && (
                      <View style={styles.unreadDot} />
                    )}
                  </View>

                  <Text style={styles.notificationMessage}>
                    {item.message}
                  </Text>

                  <Text style={styles.notificationDate}>
                    {formatDate(item.createdAt)}
                  </Text>

                  {updatingId === item.id && (
                    <ActivityIndicator
                      size="small"
                      color="#B85D32"
                      style={styles.itemLoader}
                    />
                  )}

                  {!item.read && (
                    <Text style={styles.tapText}>
                      Tap to mark as read
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF1E5',
    paddingTop: 55,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF1E5',
  },

  loadingText: {
    color: '#8C756A',
    fontSize: 14,
    marginTop: 12,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 22,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FCE5DC',
    justifyContent: 'center',
    alignItems: 'center',
  },

  backText: {
    color: '#B85D32',
    fontSize: 32,
    lineHeight: 36,
  },

  headerInfo: {
    flex: 1,
    marginLeft: 13,
  },

  headerTitle: {
    color: '#392D28',
    fontSize: 21,
    fontWeight: 'bold',
  },

  headerSubtitle: {
    color: '#8C756A',
    fontSize: 11,
    marginTop: 4,
  },

  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FCE5DC',
    justifyContent: 'center',
    alignItems: 'center',
  },

  refreshText: {
    color: '#B85D32',
    fontSize: 27,
  },

  summaryCard: {
    backgroundColor: '#B85D32',
    marginHorizontal: 20,
    padding: 19,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },

  summaryTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  summarySubtitle: {
    color: '#FFE8D9',
    fontSize: 12,
    marginTop: 6,
  },

  unreadBadge: {
    backgroundColor: '#FFFFFF',
    width: 58,
    height: 58,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  unreadNumber: {
    color: '#B85D32',
    fontSize: 21,
    fontWeight: 'bold',
  },

  unreadLabel: {
    color: '#8C756A',
    fontSize: 9,
  },

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 45,
    flexGrow: 1,
  },

  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 17,
    marginBottom: 13,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#EAD8C9',
  },

  unreadCard: {
    backgroundColor: '#FFF9F4',
    borderColor: '#DCA17F',
  },

  notificationIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },

  iconText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },

  notificationContent: {
    flex: 1,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  notificationTitle: {
    flex: 1,
    color: '#392D28',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },

  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#B85D32',
  },

  notificationMessage: {
    color: '#6F5C52',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },

  notificationDate: {
    color: '#A18E83',
    fontSize: 10,
    marginTop: 11,
  },

  tapText: {
    color: '#B85D32',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 8,
  },

  itemLoader: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },

  emptyContainer: {
    flex: 1,
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 25,
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: 17,
  },

  emptyTitle: {
    color: '#392D28',
    fontSize: 18,
    fontWeight: 'bold',
  },

  emptySubtitle: {
    color: '#8C756A',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 9,
    lineHeight: 20,
  },
});

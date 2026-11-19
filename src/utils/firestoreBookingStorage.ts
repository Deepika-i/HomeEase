
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { db } from '../lib/firebase';

type BookingData = {
  id: string;
  createdAt?: string | number;
  [key: string]: any;
};

export type NotificationData = {
  id: string;
  title: string;
  message: string;
  type:
    | 'approved'
    | 'rejected'
    | 'cancelled'
    | 'general'
    | 'quotation';
  bookingId?: string;
  read: boolean;
  createdAt: string;
};

// Remove undefined values before saving to Firestore
function removeUndefined(data: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  );
}

// Save a booking under the logged-in user's account
export async function saveUserBooking(
  userId: string,
  booking: BookingData
) {
  if (!userId) {
    throw new Error('User is not logged in.');
  }

  const bookingRef = doc(
    db,
    'users',
    userId,
    'bookings',
    booking.id
  );

  await setDoc(
    bookingRef,
    removeUndefined({
      ...booking,
      userId,
    })
  );
}

// Get only the logged-in user's bookings
export async function getUserBookings(userId: string) {
  if (!userId) {
    throw new Error('User is not logged in.');
  }

  const bookingsRef = collection(
    db,
    'users',
    userId,
    'bookings'
  );

  const snapshot = await getDocs(bookingsRef);

  const bookings: BookingData[] = snapshot.docs.map((item) => ({
    ...item.data(),
    id: item.id,
  }));

  return bookings.sort((a, b) => {
    const dateA = a.createdAt
      ? new Date(a.createdAt).getTime()
      : 0;

    const dateB = b.createdAt
      ? new Date(b.createdAt).getTime()
      : 0;

    return dateB - dateA;
  });
}

// Update an existing booking belonging to this user
export async function updateUserBooking(
  userId: string,
  bookingId: string,
  updates: Record<string, any>
) {
  if (!userId) {
    throw new Error('User is not logged in.');
  }

  const bookingRef = doc(
    db,
    'users',
    userId,
    'bookings',
    bookingId
  );

  await updateDoc(bookingRef, removeUndefined(updates));
}

// Create a notification for a customer
export async function createUserNotification(
  userId: string,
  notification: Omit<NotificationData, 'id' | 'read' | 'createdAt'>
) {
  if (!userId) {
    throw new Error('User ID is required.');
  }

  const notificationsRef = collection(
    db,
    'users',
    userId,
    'notifications'
  );

  const notificationRef = doc(notificationsRef);

  await setDoc(notificationRef, {
    ...notification,
    read: false,
    createdAt: new Date().toISOString(),
  });

  return notificationRef.id;
}

// Get all notifications for a customer
export async function getUserNotifications(
  userId: string
): Promise<NotificationData[]> {
  if (!userId) {
    throw new Error('User is not logged in.');
  }

  const notificationsRef = collection(
    db,
    'users',
    userId,
    'notifications'
  );

  const snapshot = await getDocs(notificationsRef);

  const notifications: NotificationData[] = snapshot.docs.map((item) => ({
    ...item.data(),
    id: item.id,
  } as NotificationData));

  return notifications.sort((a, b) => {
    return (
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
    );
  });
}

// Mark a notification as read
export async function markNotificationAsRead(
  userId: string,
  notificationId: string
) {
  if (!userId) {
    throw new Error('User is not logged in.');
  }

  const notificationRef = doc(
    db,
    'users',
    userId,
    'notifications',
    notificationId
  );

  await updateDoc(notificationRef, {
    read: true,
  });
}

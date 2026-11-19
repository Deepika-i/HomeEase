
import AsyncStorage from '@react-native-async-storage/async-storage';

export type BookingRequest = {
  id: string;
  service: string;
  name: string;
  district: string;
  city: string;
  area: string;
  address?: string;
  landmark?: string;
  preferredDate: string;
  preferredTime: string;
  additionalRequirements?: string;
  status: string;
  createdAt: string;
};

export type EditableBookingFields = {
  preferredDate: string;
  preferredTime: string;
  address: string;
  landmark: string;
  additionalRequirements: string;
};

const BOOKINGS_KEY = 'homeease_bookings';

export const getBookings = async (): Promise<BookingRequest[]> => {
  try {
    const data = await AsyncStorage.getItem(BOOKINGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.log('Error loading bookings:', error);
    return [];
  }
};

export const saveBooking = async (
  booking: BookingRequest
): Promise<void> => {
  try {
    const bookings = await getBookings();

    const updatedBookings = [...bookings, booking];

    await AsyncStorage.setItem(
      BOOKINGS_KEY,
      JSON.stringify(updatedBookings)
    );
  } catch (error) {
    console.log('Error saving booking:', error);
    throw error;
  }
};

export const updateBooking = async (
  id: string,
  updates: EditableBookingFields
): Promise<boolean> => {
  try {
    const bookings = await getBookings();

    const bookingExists = bookings.some(
      (booking) =>
        booking.id === id &&
        booking.status === 'Waiting for Provider Response'
    );

    if (!bookingExists) {
      return false;
    }

    const updatedBookings = bookings.map((booking) =>
      booking.id === id
        ? { ...booking, ...updates }
        : booking
    );

    await AsyncStorage.setItem(
      BOOKINGS_KEY,
      JSON.stringify(updatedBookings)
    );

    return true;
  } catch (error) {
    console.log('Error updating booking:', error);
    throw error;
  }
};

export const cancelBooking = async (
  id: string
): Promise<boolean> => {
  try {
    const bookings = await getBookings();

    const bookingExists = bookings.some(
      (booking) =>
        booking.id === id &&
        booking.status === 'Waiting for Provider Response'
    );

    if (!bookingExists) {
      return false;
    }

    const updatedBookings = bookings.map((booking) =>
      booking.id === id
        ? { ...booking, status: 'Cancelled' }
        : booking
    );

    await AsyncStorage.setItem(
      BOOKINGS_KEY,
      JSON.stringify(updatedBookings)
    );

    return true;
  } catch (error) {
    console.log('Error cancelling booking:', error);
    throw error;
  }
};
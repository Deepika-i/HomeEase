
import AsyncStorage from '@react-native-async-storage/async-storage';

const BOOKING_DRAFT_KEY = '@homeease/pending_booking';

export async function saveBookingDraft(
  booking: object
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      BOOKING_DRAFT_KEY,
      JSON.stringify(booking)
    );
  } catch (error) {
    console.error('Error saving booking draft:', error);
    throw error;
  }
}

export async function getBookingDraft<T = Record<string, unknown>>():
  Promise<T | null> {
  try {
    const data = await AsyncStorage.getItem(BOOKING_DRAFT_KEY);

    return data ? (JSON.parse(data) as T) : null;
  } catch (error) {
    console.error('Error reading booking draft:', error);
    throw error;
  }
}

export async function clearBookingDraft(): Promise<void> {
  try {
    await AsyncStorage.removeItem(BOOKING_DRAFT_KEY);
  } catch (error) {
    console.error('Error clearing booking draft:', error);
    throw error;
  }
}

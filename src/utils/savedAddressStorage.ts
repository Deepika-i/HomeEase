
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';

import { db } from '../lib/firebase';

export type SavedAddress = {
  id: string;
  label: string;
  district: string;
  city: string;
  area: string;
  address: string;
  landmark: string;
};

const getAddressCollection = (userId: string) =>
  collection(db, 'users', userId, 'savedAddresses');

export async function getSavedAddresses(
  userId: string
): Promise<SavedAddress[]> {
  const snapshot = await getDocs(getAddressCollection(userId));

  return snapshot.docs.map((addressDoc) => ({
    id: addressDoc.id,
    ...(addressDoc.data() as Omit<SavedAddress, 'id'>),
  }));
}

export async function addSavedAddress(
  userId: string,
  address: Omit<SavedAddress, 'id'>
): Promise<string> {
  const result = await addDoc(
    getAddressCollection(userId),
    address
  );

  return result.id;
}

export async function updateSavedAddress(
  userId: string,
  addressId: string,
  address: Omit<SavedAddress, 'id'>
): Promise<void> {
  await updateDoc(
    doc(db, 'users', userId, 'savedAddresses', addressId),
    address
  );
}

export async function deleteSavedAddress(
  userId: string,
  addressId: string
): Promise<void> {
  await deleteDoc(
    doc(db, 'users', userId, 'savedAddresses', addressId)
  );
}

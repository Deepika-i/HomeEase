
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
} from 'react-native';

import { auth } from '../lib/firebase';

import {
  addSavedAddress,
  deleteSavedAddress,
  getSavedAddresses,
  SavedAddress,
  updateSavedAddress,
} from '@/utils/savedAddressStorage';

const emptyForm = {
  label: 'Home',
  district: '',
  city: '',
  area: '',
  address: '',
  landmark: '',
};

export default function SavedAddressesScreen() {
  const router = useRouter();

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadAddresses = useCallback(async () => {
    try {
      await auth.authStateReady();

      const user = auth.currentUser;

      if (!user) {
        router.replace('/auth');
        return;
      }

      const data = await getSavedAddresses(user.uid);
      setAddresses(data);
    } catch (error) {
      console.log('Load saved addresses error:', error);
      Alert.alert('Error', 'Unable to load saved addresses.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadAddresses();
  }, [loadAddresses]);

  const handleChange = (
    key: keyof typeof emptyForm,
    value: string
  ) => {
    setFormData((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const openAddForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (address: SavedAddress) => {
    setEditingId(address.id);

    setFormData({
      label: address.label,
      district: address.district,
      city: address.city,
      area: address.area,
      address: address.address,
      landmark: address.landmark || '',
    });

    setShowForm(true);
  };

  const handleSave = async () => {
    if (
      !formData.label.trim() ||
      !formData.district.trim() ||
      !formData.city.trim() ||
      !formData.area.trim() ||
      !formData.address.trim()
    ) {
      Alert.alert(
        'Missing Information',
        'Please fill in the address type, district, city, area, and full address.'
      );
      return;
    }

    try {
      setSaving(true);

      await auth.authStateReady();

      const user = auth.currentUser;

      if (!user) {
        router.replace('/auth');
        return;
      }

      const addressData = {
        label: formData.label.trim(),
        district: formData.district.trim(),
        city: formData.city.trim(),
        area: formData.area.trim(),
        address: formData.address.trim(),
        landmark: formData.landmark.trim(),
      };

      if (editingId) {
        await updateSavedAddress(
          user.uid,
          editingId,
          addressData
        );

        Alert.alert('Success', 'Address updated successfully.');
      } else {
        await addSavedAddress(user.uid, addressData);

        Alert.alert('Success', 'Address saved successfully.');
      }

      setFormData(emptyForm);
      setEditingId(null);
      setShowForm(false);

      await loadAddresses();
    } catch (error) {
      console.log('Save address error:', error);

      Alert.alert(
        'Error',
        'Unable to save your address. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (addressId: string) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this saved address?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes, Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await auth.authStateReady();

              const user = auth.currentUser;

              if (!user) {
                router.replace('/auth');
                return;
              }

              await deleteSavedAddress(user.uid, addressId);

              setAddresses((previous) =>
                previous.filter((item) => item.id !== addressId)
              );

              Alert.alert(
                'Deleted',
                'Address deleted successfully.'
              );
            } catch (error) {
              console.log('Delete address error:', error);

              Alert.alert(
                'Error',
                'Unable to delete this address.'
              );
            }
          },
        },
      ]
    );
  };

  const renderInput = (
    label: string,
    key: keyof typeof emptyForm,
    placeholder: string,
    multiline = false
  ) => (
    <View style={styles.inputGroup} key={key}>
      <Text style={styles.inputLabel}>{label}</Text>

      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
        ]}
        placeholder={placeholder}
        placeholderTextColor="#A58E82"
        value={formData[key]}
        onChangeText={(value) => handleChange(key, value)}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B85D32" />
        <Text style={styles.loadingText}>
          Loading saved addresses...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>Saved Addresses</Text>

      <Text style={styles.subtitle}>
        Manage your home, work, and other addresses.
      </Text>

      {!showForm && (
        <Pressable
          style={styles.addButton}
          onPress={openAddForm}
        >
          <Text style={styles.addButtonText}>
            + Add New Address
          </Text>
        </Pressable>
      )}

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {editingId ? 'Edit Address' : 'Add New Address'}
          </Text>

          <Text style={styles.inputLabel}>Address Type</Text>

          <View style={styles.typeRow}>
            {['Home', 'Work', 'Other'].map((type) => (
              <Pressable
                key={type}
                style={[
                  styles.typeButton,
                  formData.label === type &&
                    styles.selectedTypeButton,
                ]}
                onPress={() => handleChange('label', type)}
              >
                <Text
                  style={[
                    styles.typeText,
                    formData.label === type &&
                      styles.selectedTypeText,
                  ]}
                >
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>

          {renderInput('District', 'district', 'Enter district')}
          {renderInput('City', 'city', 'Enter city')}
          {renderInput('Area', 'area', 'Enter area or locality')}
          {renderInput(
            'Full Address',
            'address',
            'House number, street name, apartment...',
            true
          )}
          {renderInput(
            'Landmark (Optional)',
            'landmark',
            'Enter nearby landmark'
          )}

          <Pressable
            style={[
              styles.saveButton,
              saving && styles.disabledButton,
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>
                {editingId ? 'Update Address' : 'Save Address'}
              </Text>
            )}
          </Pressable>

          <Pressable
            style={styles.cancelFormButton}
            onPress={() => {
              setShowForm(false);
              setEditingId(null);
              setFormData(emptyForm);
            }}
          >
            <Text style={styles.cancelFormText}>Cancel</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.sectionTitle}>
        Your Addresses ({addresses.length})
      </Text>

      {addresses.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📍</Text>

          <Text style={styles.emptyTitle}>
            No saved addresses
          </Text>

          <Text style={styles.emptyText}>
            Add your address to make future bookings easier.
          </Text>
        </View>
      ) : (
        addresses.map((item) => (
          <View key={item.id} style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <Text style={styles.addressType}>
                {item.label === 'Home'
                  ? '🏠'
                  : item.label === 'Work'
                    ? '🏢'
                    : '📍'}{' '}
                {item.label}
              </Text>
            </View>

            <Text style={styles.addressText}>
              {item.address}
            </Text>

            <Text style={styles.locationText}>
              {[item.area, item.city, item.district]
                .filter(Boolean)
                .join(', ')}
            </Text>

            {!!item.landmark && (
              <Text style={styles.landmarkText}>
                Landmark: {item.landmark}
              </Text>
            )}

            <View style={styles.actionRow}>
              <Pressable
                style={styles.editButton}
                onPress={() => openEditForm(item)}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </Pressable>

              <Pressable
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
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

  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFF1E5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    color: '#8C756A',
    marginTop: 12,
  },

  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
  },

  backText: {
    color: '#B85D32',
    fontSize: 16,
    fontWeight: 'bold',
  },

  title: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#B85D32',
    marginTop: 25,
  },

  subtitle: {
    fontSize: 14,
    color: '#8C756A',
    marginTop: 7,
    marginBottom: 20,
  },

  addButton: {
    backgroundColor: '#B85D32',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 25,
  },

  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 25,
  },

  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#B85D32',
    marginBottom: 18,
  },

  inputGroup: {
    marginTop: 15,
  },

  inputLabel: {
    color: '#392D28',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 8,
  },

  input: {
    backgroundColor: '#FFF8F3',
    borderWidth: 1,
    borderColor: '#EAD8C9',
    borderRadius: 10,
    padding: 13,
    color: '#392D28',
    fontSize: 15,
  },

  multilineInput: {
    minHeight: 90,
    paddingTop: 13,
  },

  typeRow: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 10,
    marginBottom: 5,
  },

  typeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#EAD8C9',
    borderRadius: 9,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#FFF8F3',
  },

  selectedTypeButton: {
    backgroundColor: '#B85D32',
    borderColor: '#B85D32',
  },

  typeText: {
    color: '#8C756A',
    fontWeight: '600',
  },

  selectedTypeText: {
    color: '#FFFFFF',
  },

  saveButton: {
    backgroundColor: '#B85D32',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 25,
  },

  disabledButton: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },

  cancelFormButton: {
    padding: 13,
    alignItems: 'center',
    marginTop: 5,
  },

  cancelFormText: {
    color: '#8C756A',
    fontWeight: 'bold',
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#392D28',
    marginBottom: 15,
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 25,
    alignItems: 'center',
  },

  emptyIcon: {
    fontSize: 38,
    marginBottom: 10,
  },

  emptyTitle: {
    color: '#392D28',
    fontSize: 17,
    fontWeight: 'bold',
  },

  emptyText: {
    color: '#8C756A',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 21,
  },

  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 17,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EAD8C9',
  },

  addressHeader: {
    marginBottom: 10,
  },

  addressType: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#B85D32',
  },

  addressText: {
    fontSize: 15,
    color: '#392D28',
    lineHeight: 22,
  },

  locationText: {
    fontSize: 13,
    color: '#8C756A',
    marginTop: 7,
  },

  landmarkText: {
    fontSize: 13,
    color: '#8C756A',
    marginTop: 5,
  },

  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },

  editButton: {
    flex: 1,
    backgroundColor: '#FCE5D4',
    padding: 12,
    borderRadius: 9,
    alignItems: 'center',
  },

  editButtonText: {
    color: '#B85D32',
    fontWeight: 'bold',
  },

  deleteButton: {
    flex: 1,
    backgroundColor: '#FCE5DC',
    padding: 12,
    borderRadius: 9,
    alignItems: 'center',
  },

  deleteButtonText: {
    color: '#A33E27',
    fontWeight: 'bold',
  },
});

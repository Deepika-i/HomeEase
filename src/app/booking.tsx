
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Alert,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';

import DateTimePicker from '@react-native-community/datetimepicker';

import {
  saveBookingDraft,
  clearBookingDraft,
} from '@/utils/bookingDraftStorage';

import { auth } from '../lib/firebase';
import { saveUserBooking } from '@/utils/firestoreBookingStorage';

import {
  getSavedAddresses,
  type SavedAddress,
} from '@/utils/savedAddressStorage';

import SelectionField from '@/components/booking/SelectionField';
import CustomInput from '@/components/booking/CustomInput';
import LocationFields from '@/components/booking/LocationFields';
import AreaField from '@/components/booking/AreaField';
import AddressFields from '@/components/booking/AddressFields';

type ServiceField = {
  key: string;
  label: string;
  placeholder: string;
  numeric?: boolean;
  options?: string[];
};

const serviceFields: Record<string, ServiceField[]> = {
  Plumbing: [
    {
      key: 'problemType',
      label: 'Problem Type',
      placeholder: 'Pipe leakage / Tap repair / Drainage',
    },
    {
      key: 'numberOfIssues',
      label: 'Number of Issues',
      placeholder: 'Example: 2',
      numeric: true,
    },
    {
      key: 'urgency',
      label: 'Urgency',
      placeholder: 'Normal / Urgent',
    },
  ],

  Electrical: [
    {
      key: 'workType',
      label: 'Work Type',
      placeholder: 'Fan / Light / Wiring / Switch',
    },
    {
      key: 'electricalPoints',
      label: 'Number of Electrical Points',
      placeholder: 'Example: 3',
      numeric: true,
    },
    {
      key: 'electricalUrgency',
      label: 'Urgency',
      placeholder: 'Normal / Urgent',
    },
  ],

  Painting: [
    {
      key: 'paintingProperty',
      label: 'Property Type',
      placeholder: 'House / Apartment',
    },
    {
      key: 'paintingType',
      label: 'Painting Type',
      placeholder: 'Interior / Exterior / Both',
    },
    {
      key: 'houseArea',
      label: 'House Area (sq.ft.)',
      placeholder: 'Example: 1200',
      numeric: true,
    },
    {
      key: 'numberOfRooms',
      label: 'Number of Rooms',
      placeholder: 'Example: 3',
      numeric: true,
    },
    {
      key: 'paintPreference',
      label: 'Paint Preference',
      placeholder: 'Emulsion / Distemper',
    },
  ],

  'AC Service': [
    {
      key: 'acType',
      label: 'AC Type',
      placeholder: 'Select AC Type',
      options: ['Split AC', 'Window AC'],
    },
    {
      key: 'acUnits',
      label: 'Number of AC Units',
      placeholder: 'Example: 2',
      numeric: true,
    },
    {
      key: 'acServiceType',
      label: 'Service Type',
      placeholder: 'General Service / Repair / Installation',
    },
  ],

  'Maid / Housekeeping': [
    {
      key: 'maidRooms',
      label: 'Number of Rooms',
      placeholder: 'Example: 3',
      numeric: true,
    },
    {
      key: 'maidBathrooms',
      label: 'Number of Bathrooms',
      placeholder: 'Example: 2',
      numeric: true,
    },
    {
      key: 'cleaningFrequency',
      label: 'Cleaning Frequency',
      placeholder: 'Daily / Weekly / One-time',
    },
    {
      key: 'maidDuration',
      label: 'Preferred Duration',
      placeholder: '2 hours / 4 hours / Full day',
    },
    {
      key: 'maidTasks',
      label: 'Housekeeping Tasks',
      placeholder: 'Sweeping / Mopping / Dusting / Washing',
    },
  ],

  Cooking: [
    {
      key: 'peopleCount',
      label: 'Number of People',
      placeholder: 'Example: 4',
      numeric: true,
    },
    {
      key: 'mealsRequired',
      label: 'Meals Required',
      placeholder: 'Breakfast / Lunch / Dinner',
    },
    {
      key: 'cookingFrequency',
      label: 'Cooking Frequency',
      placeholder: 'Daily / Weekly / One-time',
    },
    {
      key: 'foodPreference',
      label: 'Food Preference',
      placeholder: 'Vegetarian / Non-vegetarian / Both',
    },
    {
      key: 'cookingRequirements',
      label: 'Special Cooking Requirements',
      placeholder: 'Describe your cooking requirements',
    },
  ],

  Carpentry: [
    {
      key: 'carpentryWork',
      label: 'Type of Carpentry Work',
      placeholder: 'Furniture repair / Installation / Custom work',
    },
    {
      key: 'furnitureType',
      label: 'Furniture Type',
      placeholder: 'Door / Bed / Cupboard / Table / Chair',
    },
    {
      key: 'furnitureDetails',
      label: 'Furniture Details',
      placeholder: 'Describe the furniture or item',
    },
    {
      key: 'carpentryQuantity',
      label: 'Number of Items',
      placeholder: 'Example: 2',
      numeric: true,
    },
  ],

  Gardening: [
    {
      key: 'gardenSize',
      label: 'Garden Size',
      placeholder: 'Small / Medium / Large',
    },
    {
      key: 'gardeningWork',
      label: 'Type of Gardening Work',
      placeholder: 'Planting / Trimming / Maintenance',
    },
    {
      key: 'plantCount',
      label: 'Approximate Number of Plants',
      placeholder: 'Example: 15',
      numeric: true,
    },
    {
      key: 'gardeningFrequency',
      label: 'Maintenance Frequency',
      placeholder: 'One-time / Weekly / Monthly',
    },
  ],

  'Pest Control': [
    {
      key: 'pestType',
      label: 'Type of Pest',
      placeholder: 'Termites / Cockroaches / Rats / Ants',
    },
    {
      key: 'affectedArea',
      label: 'Affected Area',
      placeholder: 'Kitchen / Bedroom / Entire House',
    },
    {
      key: 'pestPropertyType',
      label: 'Property Type',
      placeholder: 'House / Apartment / Office',
    },
    {
      key: 'pestSeverity',
      label: 'Pest Problem Level',
      placeholder: 'Low / Medium / High',
    },
  ],

  'Appliance Repair': [
    {
      key: 'applianceType',
      label: 'Appliance Type',
      placeholder: 'Washing Machine / Refrigerator / TV',
    },
    {
      key: 'applianceBrand',
      label: 'Appliance Brand',
      placeholder: 'Example: Samsung / LG / Whirlpool',
    },
    {
      key: 'applianceProblem',
      label: 'Problem Description',
      placeholder: 'Describe the appliance problem',
    },
    {
      key: 'applianceQuantity',
      label: 'Number of Appliances',
      placeholder: 'Example: 1',
      numeric: true,
    },
  ],
};

export default function BookingScreen() {
  const router = useRouter();

  const { service } = useLocalSearchParams<{
    service: string;
  }>();

  const serviceName = service || 'Home Service';

  const [formData, setFormData] = useState<Record<string, string>>({
    name: '',
    district: '',
    city: '',
    area: '',
    address: '',
    landmark: '',
    preferredDate: '',
    preferredTime: '',
    additionalRequirements: '',
  });

  // Cleaning information
  const [propertyType, setPropertyType] = useState('');
  const [cleaningType, setCleaningType] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');

  // Location information
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [showSavedAddresses, setShowSavedAddresses] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState('');

  // Calendar and time picker
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleChange = (key: string, value: string) => {
    setFormData((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  // Load saved addresses when the customer opens the selector
  const handleOpenSavedAddresses = async () => {
    await auth.authStateReady();

    const currentUser = auth.currentUser;

    if (!currentUser) {
      Alert.alert(
        'Login Required',
        'Please login to use your saved addresses.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Login',
            onPress: () => router.push('/auth'),
          },
        ]
      );
      return;
    }

    try {
      setLoadingAddresses(true);
      setShowSavedAddresses(true);

      const addresses = await getSavedAddresses(currentUser.uid);

      setSavedAddresses(addresses);
    } catch (error) {
      console.log('Saved address loading error:', error);

      setShowSavedAddresses(false);

      Alert.alert(
        'Error',
        'Unable to load your saved addresses. Please try again.'
      );
    } finally {
      setLoadingAddresses(false);
    }
  };

  // Apply selected saved address to booking form
  const handleSelectSavedAddress = (address: SavedAddress) => {
    setDistrict(address.district);
    setCity(address.city);

    setFormData((previous) => ({
      ...previous,
      district: address.district,
      city: address.city,
      area: address.area,
      address: address.address,
      landmark: address.landmark || '',
    }));

    setSelectedAddressId(address.id);
    setShowSavedAddresses(false);
  };

  // Clear selected address indicator when the customer edits location manually
  const clearSelectedAddress = () => {
    setSelectedAddressId('');
  };

  // Date picker
  const handleDateChange = (_event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');

    if (date) {
      setSelectedDate(date);

      const formattedDate = date.toLocaleDateString('en-GB');

      handleChange('preferredDate', formattedDate);
    }
  };

  // Time picker
  const handleTimeChange = (_event: any, time?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');

    if (time) {
      setSelectedTime(time);

      const formattedTime = time.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });

      handleChange('preferredTime', formattedTime);
    }
  };

  // Form submission, validation and storage
  const handleSubmit = async () => {
    const commonFields = [
      formData.name,
      district,
      city,
      formData.area,
      formData.address,
      formData.preferredDate,
      formData.preferredTime,
    ];

    const currentServiceFields = serviceFields[serviceName] || [];

    const serviceValues = currentServiceFields.map(
      (field) => formData[field.key] || ''
    );

    const requiredFields = [...commonFields, ...serviceValues];

    if (serviceName === 'Cleaning') {
      requiredFields.push(
        propertyType,
        cleaningType,
        bedrooms,
        bathrooms
      );
    }

    const isEmpty = requiredFields.some(
      (value) => !value.trim()
    );

    if (isEmpty) {
      Alert.alert(
        'Missing Information',
        'Please fill in all required fields before continuing.'
      );
      return;
    }

    const newBooking = {
      id: Date.now().toString(),
      service: serviceName,
      name: formData.name,
      district,
      city,
      area: formData.area,
      address: formData.address,
      landmark: formData.landmark,
      preferredDate: formData.preferredDate,
      preferredTime: formData.preferredTime,
      additionalRequirements: formData.additionalRequirements,

      // Cleaning details
      propertyType,
      cleaningType,
      bedrooms,
      bathrooms,

      // Service-specific details
      ...Object.fromEntries(
        currentServiceFields.map((field) => [
          field.key,
          formData[field.key] || '',
        ])
      ),

      status: 'Waiting for Provider Response',
      createdAt: new Date().toISOString(),
    };

    try {
      await auth.authStateReady();

      const currentUser = auth.currentUser;

      if (currentUser) {
        await saveUserBooking(currentUser.uid, newBooking);

        await clearBookingDraft();

        router.replace({
          pathname: '/booking-confirmation',
          params: {
            service: serviceName,
            name: formData.name,
            district,
            city,
            area: formData.area,
            preferredDate: formData.preferredDate,
            preferredTime: formData.preferredTime,
          },
        });
      } else {
        await saveBookingDraft(newBooking);

        router.push('/auth');
      }
    } catch (error) {
      console.log('Booking submission error:', error);

      Alert.alert(
        'Error',
        'Your request could not be saved. Please try again.'
      );
    }
  };

  return (
    <ScrollView
      style={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.content}>

        {/* Back button */}
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Text style={styles.title}>Book Your Service</Text>

        <Text style={styles.subtitle}>{serviceName}</Text>

        <View style={styles.formCard}>

          {/* Customer Name */}
          <CustomInput
            label="Your Name"
            placeholder="Enter your name"
            value={formData.name}
            onChangeText={(value) =>
              handleChange('name', value)
            }
          />

          {/* Cleaning Fields */}
          {serviceName === 'Cleaning' && (
            <>
              <SelectionField
                label="Property Type"
                options={['House', 'Apartment']}
                value={propertyType}
                onSelect={setPropertyType}
              />

              <SelectionField
                label="Cleaning Type"
                options={['Full Home', 'Kitchen', 'Bathroom']}
                value={cleaningType}
                onSelect={setCleaningType}
              />

              <SelectionField
                label="Number of Bedrooms"
                options={['1', '2', '3', '4+']}
                value={bedrooms}
                onSelect={setBedrooms}
              />

              <SelectionField
                label="Number of Bathrooms"
                options={['1', '2', '3', '4+']}
                value={bathrooms}
                onSelect={setBathrooms}
              />
            </>
          )}

          {/* Individual Service Fields */}
          {(serviceFields[serviceName] || []).map((field) =>
            field.options ? (
              <SelectionField
                key={field.key}
                label={field.label}
                options={field.options}
                value={formData[field.key] || ''}
                onSelect={(value) =>
                  handleChange(field.key, value)
                }
              />
            ) : (
              <CustomInput
                key={field.key}
                label={field.label}
                placeholder={field.placeholder}
                numeric={field.numeric}
                value={formData[field.key] || ''}
                onChangeText={(value) =>
                  handleChange(field.key, value)
                }
              />
            )
          )}

          {/* Saved Address Selector */}
          <View style={styles.savedAddressSection}>
            <Text style={styles.savedAddressTitle}>
              📍 Saved Addresses
            </Text>

            <Pressable
              style={styles.savedAddressButton}
              onPress={handleOpenSavedAddresses}
            >
              <Text style={styles.savedAddressButtonText}>
                {selectedAddressId
                  ? '✓ Saved Address Selected'
                  : 'Choose a Saved Address'}
              </Text>
              <Text style={styles.savedAddressArrow}>›</Text>
            </Pressable>

            <Text style={styles.savedAddressHint}>
              Select an address to automatically fill your location details.
            </Text>
          </View>

          {/* Location Selection */}
          <LocationFields
            district={district}
            city={city}
            onDistrictChange={(value) => {
              setDistrict(value);
              handleChange('district', value);
              setCity('');
              handleChange('city', '');
              clearSelectedAddress();
            }}
            onCityChange={(value) => {
              setCity(value);
              handleChange('city', value);
              clearSelectedAddress();
            }}
          />

          {/* Area */}
          <AreaField
            city={city}
            value={formData.area}
            onChangeText={(value) => {
              handleChange('area', value);
              clearSelectedAddress();
            }}
          />

          {/* Full Address and Landmark */}
          <AddressFields
            address={formData.address}
            landmark={formData.landmark}
            onAddressChange={(value) => {
              handleChange('address', value);
              clearSelectedAddress();
            }}
            onLandmarkChange={(value) => {
              handleChange('landmark', value);
              clearSelectedAddress();
            }}
          />

          {/* Preferred Date */}
          <Text style={styles.label}>Preferred Date</Text>

          <Pressable
            style={styles.pickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.pickerText}>
              {formData.preferredDate || '📅 Select a date'}
            </Text>
          </Pressable>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={handleDateChange}
            />
          )}

          {/* Preferred Time */}
          <Text style={styles.label}>Preferred Time</Text>

          <Pressable
            style={styles.pickerButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.pickerText}>
              {formData.preferredTime || '🕒 Select a time'}
            </Text>
          </Pressable>

          {showTimePicker && (
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          )}

          {/* Optional Requirements */}
          <CustomInput
            label="Additional Requirements (Optional)"
            placeholder="Describe any additional requirements..."
            value={formData.additionalRequirements}
            onChangeText={(value) =>
              handleChange('additionalRequirements', value)
            }
            multiline
          />

        </View>

        {/* Free Inspection and Quotation Information */}
        <View style={styles.inspectionCard}>
          <View style={styles.inspectionHeader}>
            <Text style={styles.inspectionIcon}>🏠</Text>

            <Text style={styles.inspectionTitle}>
              Free Home Inspection
            </Text>
          </View>

          <Text style={styles.inspectionText}>
            After receiving your booking request, our service
            provider will contact you and visit your home to
            inspect the work.
          </Text>

          <View style={styles.inspectionDivider} />

          <Text style={styles.inspectionNote}>
            ✓ Inspection is completely free.
          </Text>

          <Text style={styles.inspectionNote}>
            ✓ Final quotation will be provided after inspection.
          </Text>

          <Text style={styles.inspectionNote}>
            ✓ Work starts only after your approval.
          </Text>

          <Text style={styles.inspectionNote}>
            ✓ Booking advance is payable after quotation approval.
          </Text>

          <Text style={styles.inspectionNote}>
            ✓ Remaining balance can be paid after service completion.
          </Text>
        </View>

        {/* Continue Button */}
        <Pressable
          style={styles.bookButton}
          onPress={handleSubmit}
        >
          <Text style={styles.bookButtonText}>Continue</Text>
        </Pressable>

      </View>

      {/* Saved Addresses Modal */}
      <Modal
        visible={showSavedAddresses}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSavedAddresses(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Choose Saved Address
              </Text>

              <Pressable
                onPress={() => setShowSavedAddresses(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            {loadingAddresses ? (
              <ActivityIndicator
                size="large"
                color="#B85D32"
                style={styles.modalLoader}
              />
            ) : savedAddresses.length === 0 ? (
              <View style={styles.emptyAddressContainer}>
                <Text style={styles.emptyAddressIcon}>📍</Text>

                <Text style={styles.emptyAddressTitle}>
                  No Saved Addresses
                </Text>

                <Text style={styles.emptyAddressText}>
                  Add an address from Profile → Saved Addresses first.
                </Text>

                <Pressable
                  style={styles.manageAddressButton}
                  onPress={() => {
                    setShowSavedAddresses(false);
                    router.push('/saved-addresses');
                  }}
                >
                  <Text style={styles.manageAddressButtonText}>
                    Manage Saved Addresses
                  </Text>
                </Pressable>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.addressList}
              >
                {savedAddresses.map((address) => (
                  <Pressable
                    key={address.id}
                    style={[
                      styles.addressOption,
                      selectedAddressId === address.id &&
                        styles.selectedAddressOption,
                    ]}
                    onPress={() => handleSelectSavedAddress(address)}
                  >
                    <View style={styles.addressOptionHeader}>
                      <Text style={styles.addressOptionLabel}>
                        {address.label === 'Home'
                          ? '🏠'
                          : address.label === 'Work'
                            ? '🏢'
                            : '📍'}{' '}
                        {address.label}
                      </Text>

                      {selectedAddressId === address.id && (
                        <Text style={styles.selectedAddressCheck}>
                          ✓ Selected
                        </Text>
                      )}
                    </View>

                    <Text style={styles.addressOptionText}>
                      {address.address}
                    </Text>

                    <Text style={styles.addressOptionDetails}>
                      {address.area}, {address.city}, {address.district}
                    </Text>

                    {!!address.landmark && (
                      <Text style={styles.addressOptionLandmark}>
                        Landmark: {address.landmark}
                      </Text>
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
    fontSize: 17,
    color: '#8C756A',
    marginTop: 8,
  },

  formCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginTop: 25,
  },

  label: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#392D28',
    marginTop: 18,
    marginBottom: 8,
  },

  pickerButton: {
    backgroundColor: '#FFF1E5',
    borderWidth: 1,
    borderColor: '#EAD8C9',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },

  pickerText: {
    color: '#392D28',
    fontSize: 15,
  },

  savedAddressSection: {
    marginBottom: 20,
    padding: 14,
    backgroundColor: '#FFF8F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAD8C9',
  },

  savedAddressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#392D28',
    marginBottom: 10,
  },

  savedAddressButton: {
    backgroundColor: '#B85D32',
    padding: 13,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  savedAddressButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  savedAddressArrow: {
    color: '#FFFFFF',
    fontSize: 24,
  },

  savedAddressHint: {
    fontSize: 12,
    color: '#8C756A',
    marginTop: 9,
    lineHeight: 18,
  },

  inspectionCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAD8C9',
    marginTop: 20,
  },

  inspectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  inspectionIcon: {
    fontSize: 24,
    marginRight: 10,
  },

  inspectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B85D32',
  },

  inspectionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#392D28',
  },

  inspectionDivider: {
    height: 1,
    backgroundColor: '#EAD8C9',
    marginVertical: 14,
  },

  inspectionNote: {
    fontSize: 13,
    lineHeight: 23,
    color: '#392D28',
  },

  bookButton: {
    backgroundColor: '#B85D32',
    padding: 16,
    borderRadius: 12,
    marginTop: 25,
    alignItems: 'center',
  },

  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },

  modalCard: {
    backgroundColor: '#FFF1E5',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 35,
    maxHeight: '75%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#392D28',
  },

  modalCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 18,
    backgroundColor: '#F2DFD1',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalCloseText: {
    color: '#8C756A',
    fontSize: 17,
    fontWeight: 'bold',
  },

  modalLoader: {
    marginVertical: 35,
  },

  emptyAddressContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },

  emptyAddressIcon: {
    fontSize: 40,
    marginBottom: 12,
  },

  emptyAddressTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#392D28',
  },

  emptyAddressText: {
    fontSize: 13,
    color: '#8C756A',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },

  manageAddressButton: {
    backgroundColor: '#B85D32',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 9,
    marginTop: 18,
  },

  manageAddressButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },

  addressList: {
    maxHeight: 450,
  },

  addressOption: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAD8C9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },

  selectedAddressOption: {
    borderColor: '#B85D32',
    borderWidth: 2,
    backgroundColor: '#FFF8F2',
  },

  addressOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  addressOptionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#392D28',
  },

  selectedAddressCheck: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#B85D32',
  },

  addressOptionText: {
    fontSize: 14,
    color: '#392D28',
    lineHeight: 21,
  },

  addressOptionDetails: {
    fontSize: 13,
    color: '#8C756A',
    marginTop: 5,
  },

  addressOptionLandmark: {
    fontSize: 12,
    color: '#8C756A',
    marginTop: 5,
  },
});

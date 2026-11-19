
import { View, Text, TextInput, StyleSheet } from 'react-native';

type AddressFieldsProps = {
  address: string;
  landmark: string;
  onAddressChange: (value: string) => void;
  onLandmarkChange: (value: string) => void;
};

export default function AddressFields({
  address,
  landmark,
  onAddressChange,
  onLandmarkChange,
}: AddressFieldsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Service Address</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Full Address *</Text>

        <TextInput
          style={[styles.input, styles.addressInput]}
          placeholder="House / Flat number, street name, apartment..."
          placeholderTextColor="#8C756A"
          value={address}
          onChangeText={onAddressChange}
          multiline
          textAlignVertical="top"
        />

        <Text style={styles.helper}>
          Enter your complete address where the service is required.
        </Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Landmark (Optional)</Text>

        <TextInput
          style={styles.input}
          placeholder="Nearby school, bus stop, temple..."
          placeholderTextColor="#8C756A"
          value={landmark}
          onChangeText={onLandmarkChange}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B85D32',
    marginBottom: 15,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#392D28',
    marginBottom: 9,
  },
  input: {
    backgroundColor: '#FFF1E5',
    borderWidth: 1,
    borderColor: '#EAD8C9',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#392D28',
  },
  addressInput: {
    height: 110,
    textAlignVertical: 'top',
  },
  helper: {
    fontSize: 12,
    color: '#8C756A',
    marginTop: 7,
  },
});

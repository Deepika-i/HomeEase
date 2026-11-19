
import { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native';

type AreaFieldProps = {
  city: string;
  value: string;
  onChangeText: (text: string) => void;
};

const areaSuggestions: Record<string, string[]> = {
  Chennai: [
    'Anna Nagar',
    'Adyar',
    'Velachery',
    'Tambaram',
    'T. Nagar',
    'Porur',
    'Chromepet',
    'OMR',
    'Perungudi',
    'Mylapore',
  ],
  Tambaram: [
    'East Tambaram',
    'West Tambaram',
    'Selaiyur',
    'Madambakkam',
    'Perungalathur',
    'Mudichur',
  ],
  Coimbatore: [
    'Gandhipuram',
    'RS Puram',
    'Peelamedu',
    'Saibaba Colony',
    'Singanallur',
    'Saravanampatti',
  ],
  Madurai: [
    'Anna Nagar',
    'KK Nagar',
    'Tallakulam',
    'Thirunagar',
    'Goripalayam',
    'Othakadai',
  ],
  Salem: [
    'Fairlands',
    'Hasthampatti',
    'Ammapet',
    'Suramangalam',
    'Five Roads',
  ],
};

export default function AreaField({
  city,
  value,
  onChangeText,
}: AreaFieldProps) {
  const [focused, setFocused] = useState(false);

  const suggestions = areaSuggestions[city] || [];

  const filteredSuggestions = suggestions.filter((area) =>
    area.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Area / Locality</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter your area or locality"
        placeholderTextColor="#8C756A"
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />

      {focused && value.length > 0 && filteredSuggestions.length > 0 && (
        <View style={styles.suggestionsBox}>
          {filteredSuggestions.map((area) => (
            <Pressable
              key={area}
              style={styles.suggestion}
              onPressIn={() => {
                onChangeText(area);
                setFocused(false);
              }}
            >
              <Text style={styles.suggestionText}>{area}</Text>
              <Text style={styles.arrow}>›</Text>
            </Pressable>
          ))}
        </View>
      )}

      <Text style={styles.helper}>
        Enter your area name or select a suggestion.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
    zIndex: 10,
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
    padding: 15,
    fontSize: 15,
    color: '#392D28',
  },
  suggestionsBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAD8C9',
    borderRadius: 12,
    marginTop: 5,
    overflow: 'hidden',
  },
  suggestion: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8DF',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  suggestionText: {
    fontSize: 14,
    color: '#392D28',
  },
  arrow: {
    fontSize: 18,
    color: '#B85D32',
  },
  helper: {
    color: '#8C756A',
    fontSize: 12,
    marginTop: 7,
  },
});

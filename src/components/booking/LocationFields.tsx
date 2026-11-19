
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';

import SearchablePicker from './SearchablePicker';

type LocationFieldsProps = {
  district: string;
  city: string;
  onDistrictChange: (value: string) => void;
  onCityChange: (value: string) => void;
};

const districtCities: Record<string, string[]> = {
  Ariyalur: ['Ariyalur', 'Jayankondam', 'Sendurai'],
  Chengalpattu: ['Chengalpattu', 'Tambaram', 'Pallavaram', 'Madurantakam'],
  Chennai: ['Chennai'],
  Coimbatore: ['Coimbatore', 'Pollachi', 'Mettupalayam', 'Valparai'],
  Cuddalore: ['Cuddalore', 'Chidambaram', 'Panruti', 'Virudhachalam'],
  Dharmapuri: ['Dharmapuri', 'Harur', 'Palacode', 'Pennagaram'],
  Dindigul: ['Dindigul', 'Palani', 'Kodaikanal', 'Oddanchatram'],
  Erode: ['Erode', 'Gobichettipalayam', 'Bhavani', 'Perundurai'],
  Kallakurichi: ['Kallakurichi', 'Chinnasalem', 'Sankarapuram', 'Ulundurpet'],
  Kancheepuram: ['Kancheepuram', 'Kundrathur', 'Sriperumbudur', 'Uthiramerur'],
  Kanniyakumari: ['Nagercoil', 'Marthandam', 'Kanyakumari', 'Colachel'],
  Karur: ['Karur', 'Kulithalai', 'Aravakurichi', 'Krishnarayapuram'],
  Krishnagiri: ['Krishnagiri', 'Hosur', 'Denkanikottai', 'Pochampalli'],
  Madurai: ['Madurai', 'Melur', 'Thirumangalam', 'Usilampatti'],
  Mayiladuthurai: ['Mayiladuthurai', 'Sirkazhi', 'Tharangambadi'],
  Nagapattinam: ['Nagapattinam', 'Vedaranyam', 'Thirukkuvalai'],
  Namakkal: ['Namakkal', 'Rasipuram', 'Tiruchengode', 'Paramathi Velur'],
  Nilgiris: ['Ooty', 'Coonoor', 'Kotagiri', 'Gudalur'],
  Perambalur: ['Perambalur', 'Veppanthattai', 'Kunnam'],
  Pudukkottai: ['Pudukkottai', 'Aranthangi', 'Alangudi', 'Illuppur'],
  Ramanathapuram: ['Ramanathapuram', 'Rameswaram', 'Paramakudi', 'Kamuthi'],
  Ranipet: ['Ranipet', 'Arcot', 'Walajapet', 'Arakkonam'],
  Salem: ['Salem', 'Attur', 'Mettur', 'Edappadi'],
  Sivaganga: ['Sivaganga', 'Karaikudi', 'Devakottai', 'Manamadurai'],
  Tenkasi: ['Tenkasi', 'Sankarankovil', 'Kadayanallur', 'Courtallam'],
  Thanjavur: ['Thanjavur', 'Kumbakonam', 'Pattukkottai', 'Orathanadu'],
  Theni: ['Theni', 'Periyakulam', 'Bodinayakanur', 'Cumbum'],
  Thoothukudi: ['Thoothukudi', 'Kovilpatti', 'Tiruchendur', 'Ettayapuram'],
  Tiruchirappalli: ['Tiruchirappalli', 'Manapparai', 'Thuraiyur', 'Lalgudi'],
  Tirunelveli: ['Tirunelveli', 'Ambasamudram', 'Nanguneri', 'Palayamkottai'],
  Tirupathur: ['Tirupathur', 'Vaniyambadi', 'Ambur', 'Natrampalli'],
  Tiruppur: ['Tiruppur', 'Dharapuram', 'Palladam', 'Avinashi'],
  Tiruvallur: ['Tiruvallur', 'Avadi', 'Ponneri', 'Tiruttani'],
  Tiruvannamalai: ['Tiruvannamalai', 'Arani', 'Cheyyar', 'Polur'],
  Tiruvarur: ['Tiruvarur', 'Mannargudi', 'Thiruthuraipoondi', 'Needamangalam'],
  Vellore: ['Vellore', 'Katpadi', 'Gudiyatham', 'Anaicut'],
  Viluppuram: ['Viluppuram', 'Tindivanam', 'Gingee', 'Kandachipuram'],
  Virudhunagar: ['Virudhunagar', 'Sivakasi', 'Rajapalayam', 'Aruppukkottai'],
};

export default function LocationFields({
  district,
  city,
  onDistrictChange,
  onCityChange,
}: LocationFieldsProps) {
  const districts = Object.keys(districtCities);
  const suggestions = district ? districtCities[district] || [] : [];

  const [showSuggestions, setShowSuggestions] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Your Location</Text>

      {/* District */}
      <SearchablePicker
        label="District"
        placeholder="Select your district"
        options={districts}
        value={district}
        onSelect={(value) => {
          onDistrictChange(value);
          onCityChange('');
          setShowSuggestions(false);
        }}
      />

      {/* City / Town / Taluk */}
      <Text style={styles.label}>City / Town / Taluk</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter or select your city, town or taluk"
        placeholderTextColor="#A28D82"
        value={city}
        onChangeText={(value) => {
          onCityChange(value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
      />

      {/* Optional suggestions */}
      {district !== '' && showSuggestions && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionTitle}>
            Suggested locations
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {suggestions.map((item) => (
              <Pressable
                key={item}
                style={[
                  styles.suggestionChip,
                  city === item && styles.selectedChip,
                ]}
                onPress={() => {
                  onCityChange(item);
                  setShowSuggestions(false);
                }}
              >
                <Text
                  style={[
                    styles.suggestionText,
                    city === item && styles.selectedText,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B85D32',
    marginBottom: 15,
  },
  label: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#392D28',
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF1E5',
    borderWidth: 1,
    borderColor: '#EAD8C9',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#392D28',
  },
  suggestionsContainer: {
    marginTop: 12,
  },
  suggestionTitle: {
    fontSize: 13,
    color: '#8C756A',
    marginBottom: 8,
  },
  suggestionChip: {
    backgroundColor: '#FFF1E5',
    borderWidth: 1,
    borderColor: '#EAD8C9',
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 20,
    marginRight: 8,
  },
  selectedChip: {
    backgroundColor: '#B85D32',
    borderColor: '#B85D32',
  },
  suggestionText: {
    color: '#392D28',
    fontSize: 13,
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

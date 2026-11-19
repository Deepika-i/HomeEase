
import { View, Text, Pressable, StyleSheet } from 'react-native';

type SelectionFieldProps = {
  label: string;
  options: string[];
  value: string;
  onSelect: (option: string) => void;
};

export default function SelectionField({
  label,
  options,
  value,
  onSelect,
}: SelectionFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <Pressable
            key={option}
            style={[
              styles.optionButton,
              value === option && styles.selectedOption,
            ]}
            onPress={() => onSelect(option)}
          >
            <Text
              style={[
                styles.optionText,
                value === option && styles.selectedOptionText,
              ]}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#392D28',
    marginBottom: 10,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#EAD8C9',
    borderRadius: 10,
    backgroundColor: '#FFF1E5',
  },
  selectedOption: {
    backgroundColor: '#B85D32',
    borderColor: '#B85D32',
  },
  optionText: {
    color: '#392D28',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

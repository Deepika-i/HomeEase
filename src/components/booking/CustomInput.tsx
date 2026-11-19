
import { View, Text, TextInput, StyleSheet } from 'react-native';

type CustomInputProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  numeric?: boolean;
  multiline?: boolean;
};

export default function CustomInput({
  label,
  placeholder,
  value,
  onChangeText,
  numeric = false,
  multiline = false,
}: CustomInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        style={[
          styles.input,
          multiline && styles.textArea,
        ]}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={numeric ? 'numeric' : 'default'}
        multiline={multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#392D28',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF1E5',
    borderWidth: 1,
    borderColor: '#EAD8C9',
    borderRadius: 10,
    padding: 13,
    fontSize: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
});


import { useState } from 'react';

import {
  View,
  Text,
  Pressable,
  TextInput,
  Modal,
  FlatList,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';

type SearchablePickerProps = {
  label: string;
  placeholder: string;
  options: string[];
  value: string;
  onSelect: (value: string) => void;
};

export default function SearchablePicker({
  label,
  placeholder,
  options,
  value,
  onSelect,
}: SearchablePickerProps) {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = options.filter((item) =>
    item.toLowerCase().includes(search.toLowerCase())
  );

  const selectOption = (item: string) => {
    onSelect(item);
    setVisible(false);
    setSearch('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        style={styles.input}
        onPress={() => setVisible(true)}
      >
        <Text style={value ? styles.selectedText : styles.placeholder}>
          {value || placeholder}
        </Text>

        <Text style={styles.arrow}>⌄</Text>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setVisible(false)}
        >
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.bottomSheet}>
                <View style={styles.handle} />

                <View style={styles.header}>
                  <Text style={styles.title}>
                    Select {label}
                  </Text>

                  <Pressable
                    onPress={() => setVisible(false)}
                  >
                    <Text style={styles.close}>✕</Text>
                  </Pressable>
                </View>

                <View style={styles.searchBox}>
                  <Text style={styles.searchIcon}>⌕</Text>

                  <TextInput
                    style={styles.searchInput}
                    placeholder={`Search ${label.toLowerCase()}...`}
                    placeholderTextColor="#8C756A"
                    value={search}
                    onChangeText={setSearch}
                  />
                </View>

                <FlatList
                  data={filteredOptions}
                  keyExtractor={(item) => item}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <Pressable
                      style={styles.option}
                      onPress={() => selectOption(item)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          value === item && styles.activeOption,
                        ]}
                      >
                        {item}
                      </Text>

                      {value === item && (
                        <Text style={styles.check}>✓</Text>
                      )}
                    </Pressable>
                  )}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>
                      No results found
                    </Text>
                  }
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
    marginBottom: 9,
  },

  input: {
    backgroundColor: '#FFF1E5',
    borderWidth: 1,
    borderColor: '#EAD8C9',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  placeholder: {
    color: '#8C756A',
    fontSize: 15,
  },

  selectedText: {
    color: '#392D28',
    fontSize: 15,
    fontWeight: '500',
  },

  arrow: {
    color: '#B85D32',
    fontSize: 22,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },

  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    height: '70%',
  },

  handle: {
    width: 45,
    height: 5,
    borderRadius: 5,
    backgroundColor: '#EAD8C9',
    alignSelf: 'center',
    marginBottom: 20,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#392D28',
  },

  close: {
    fontSize: 20,
    color: '#8C756A',
    padding: 5,
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1E5',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 15,
  },

  searchIcon: {
    fontSize: 22,
    color: '#B85D32',
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: '#392D28',
  },

  option: {
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8DF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  optionText: {
    fontSize: 15,
    color: '#392D28',
  },

  activeOption: {
    color: '#B85D32',
    fontWeight: 'bold',
  },

  check: {
    color: '#B85D32',
    fontSize: 18,
    fontWeight: 'bold',
  },

  emptyText: {
    textAlign: 'center',
    color: '#8C756A',
    padding: 25,
  },
});

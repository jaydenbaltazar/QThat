import React, { useEffect, useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  editable?: boolean;
  value?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Search...",
  onSearch,
  editable = true,
  value = '',
}) => {
  const [query, setQuery] = useState(value);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const handleSearch = (text: string) => {
    if (editable) {
      setQuery(text);
      onSearch(text);
    }
  };

  return (
    <View style={styles.container}>
      <Ionicons name="search" size={20} color="#888" style={styles.icon} />
      <TextInput
        style={[
          styles.input,
          !editable && styles.disabledInput,
        ]}
        placeholder={placeholder}
        value={query}
        onChangeText={handleSearch}
        placeholderTextColor="#888"
        editable={editable}
        autoCorrect={false}
        autoComplete="off"
        spellCheck={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB', // Equivalent to Tailwind gray-200
    borderRadius: 10,
    padding: 12,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  disabledInput: {
    opacity: 0.5,
  },
});

export default SearchBar;

import React, { useState } from "react";
import { StyleSheet, TextInput, View, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/constants/colors";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
  initialQuery?: string;
}

export default function SearchBar({ onSearch, isSearching, initialQuery = "" }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);

  const handleSearch = () => {
    if (query.trim() && !isSearching) {
      onSearch(query.trim());
    }
  };

  const clearSearch = () => {
    setQuery("");
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color={colors.mediumGray} style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder="Search legal information (e.g., Alabama emergency custody)"
          placeholderTextColor={colors.mediumGray}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isSearching}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Feather name="x" size={18} color={colors.mediumGray} />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity
        style={[styles.searchButton, isSearching && styles.searchingButton]}
        onPress={handleSearch}
        disabled={isSearching || query.trim().length === 0}
      >
        {isSearching ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Feather name="search" size={20} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: "100%",
    alignItems: "center",
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: colors.text,
    ...Platform.select({
      web: {
        outlineStyle: "none",
      },
    }),
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  searchingButton: {
    backgroundColor: colors.mediumGray,
  },
});/ TODO: Implement this file

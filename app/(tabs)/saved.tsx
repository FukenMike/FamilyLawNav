/import React, { useState, useEffect } from "react";
import { StyleSheet, View, FlatList, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Bookmark, Trash2 } from "lucide-react-native";
import { LegalResult } from "@/types";
import ResultCard from "@/components/ResultCard";
import EmptyResults from "@/components/EmptyResults";
import { colors } from "@/constants/colors";

export default function SavedResultsScreen() {
  const router = useRouter();
  const [savedResults, setSavedResults] = useState<LegalResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSavedResults();
  }, []);

  const loadSavedResults = async () => {
    try {
      setIsLoading(true);
      const savedResultsJson = await AsyncStorage.getItem("saved-results");
      if (savedResultsJson) {
        const results = JSON.parse(savedResultsJson);
        setSavedResults(results);
      }
    } catch (error) {
      console.error("Error loading saved results:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultPress = (result: LegalResult) => {
    router.push({
      pathname: "/result-details",
      params: { 
        id: result.id || Date.now().toString(),
        title: result.title,
        state: result.state_id,
        category: result.category_id,
        county: result.county_id || "",
      }
    });
  };

  const handleClearAll = async () => {
    try {
      await AsyncStorage.removeItem("saved-results");
      setSavedResults([]);
    } catch (error) {
      console.error("Error clearing saved results:", error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading saved results...</Text>
      </View>
    );
  }

  if (savedResults.length === 0) {
    return (
      <EmptyResults message="You haven't saved any legal information yet. Search for legal content and save it for offline access." />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Legal Information</Text>
        <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
          <Trash2 size={16} color={colors.error} />
          <Text style={styles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={savedResults}
        keyExtractor={(item, index) => item.id || `saved-${index}`}
        renderItem={({ item }) => (
          <ResultCard result={item} onPress={handleResultPress} />
        )}
        contentContainerStyle={styles.resultsList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  clearButtonText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: "500",
  },
  resultsList: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: colors.darkGray,
    textAlign: "center",
    lineHeight: 24,
  },
});/ TODO: Implement this file

import React, { useState } from "react";
import { StyleSheet, View, FlatList, Text, TouchableOpacity, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useSearchStore } from "@/store/searchStore";
import { classifyQuery } from "@/services/aiService";
import { searchLegalContent } from "@/services/crawlerService";
import { LegalResult } from "@/types";
import SearchBar from "@/components/SearchBar";
import ResultCard from "@/components/ResultCard";
import EmptyResults from "@/components/EmptyResults";
import LoadingResults from "@/components/LoadingResults";
import ErrorMessage from "@/components/ErrorMessage";
import { colors } from "@/constants/colors";

export default function SearchScreen() {
  const router = useRouter();
  const { query, results, isSearching, error, setQuery, setResults, setIsSearching, setError } = useSearchStore();
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    setIsSearching(true);
    setError(null);
    setHasSearched(true);

    try {
      // Step 1: Classify the query using AI
      const classifiedQuery = await classifyQuery(searchQuery);
      console.log("Classified query:", classifiedQuery);

      // Step 2: Search for legal content based on the classified query
      const searchResults = await searchLegalContent(classifiedQuery);
      
      // Step 3: Update the store with the results
      setResults(searchResults);
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to search for legal information. Please try again.");
    } finally {
      setIsSearching(false);
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

  const renderContent = () => {
    if (isSearching) {
      return <LoadingResults />;
    }

    if (error) {
      return <ErrorMessage message={error} onRetry={() => handleSearch(query)} />;
    }

    if (results.length === 0) {
      if (hasSearched) {
        return <EmptyResults message="No legal information found for your query. Try being more specific or check your spelling." />;
      }
      return <WelcomeScreen onExamplePress={handleSearch} />;
    }

    return (
      <FlatList
        data={results}
        keyExtractor={(item, index) => item.id || `result-${index}`}
        renderItem={({ item }) => (
          <ResultCard result={item} onPress={handleResultPress} />
        )}
        contentContainerStyle={styles.resultsList}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <View style={styles.container}>
      <SearchBar 
        onSearch={handleSearch} 
        isSearching={isSearching} 
        initialQuery={query} 
      />
      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
}

function WelcomeScreen({ onExamplePress }: { onExamplePress: (query: string) => void }) {
  const examples = [
    "Alabama emergency custody 2024",
    "Texas child support calculator",
    "Florida DCF investigation rights",
    "California foster care visitation",
  ];

  return (
    <View style={styles.welcomeContainer}>
      <Text style={styles.welcomeTitle}>The Father's Alliance Legal Search</Text>
      <Text style={styles.welcomeSubtitle}>
        Find family law information from government and legal sources
      </Text>
      
      <View style={styles.examplesContainer}>
        <Text style={styles.examplesTitle}>Try searching for:</Text>
        {examples.map((example, index) => (
          <TouchableOpacity
            key={index}
            style={styles.exampleButton}
            onPress={() => onExamplePress(example)}
          >
            <Text style={styles.exampleText}>{example}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={styles.disclaimer}>
        This tool provides legal information, not legal advice. Always consult with a qualified attorney for your specific situation.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  resultsList: {
    padding: 16,
    paddingBottom: 24,
  },
  welcomeContainer: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: colors.darkGray,
    textAlign: "center",
    marginBottom: 32,
  },
  examplesContainer: {
    width: "100%",
    marginBottom: 32,
  },
  examplesTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
  },
  exampleButton: {
    backgroundColor: colors.lightGray,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  exampleText: {
    color: colors.primary,
    fontWeight: "500",
  },
  disclaimer: {
    fontSize: 12,
    color: colors.mediumGray,
    textAlign: "center",
    ...Platform.select({
      web: {
        maxWidth: 500,
      },
    }),
  },
});// TODO: Implement this file

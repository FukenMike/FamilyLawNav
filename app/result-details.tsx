import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Linking, Platform } from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/constants/colors";
import { LegalResult } from "@/types";
import { getCategoryById } from "@/constants/categories";
import { getStateByAbbreviation } from "@/constants/states";

export default function ResultDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id, title, state, category, county } = params;
  
  const [result, setResult] = useState<LegalResult | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadResult();
    checkIfSaved();
  }, [id]);

  const loadResult = async () => {
    try {
      setIsLoading(true);
      // In a real app, we would fetch the full result from the API or local storage
      // For now, we'll use the search store results
      const searchResultsJson = await AsyncStorage.getItem("search-store");
      if (searchResultsJson) {
        const searchStore = JSON.parse(searchResultsJson);
        const foundResult = searchStore.state.results.find((r: LegalResult) => r.id === id || r.title === title);
        
        if (foundResult) {
          setResult(foundResult);
        } else {
          // Fallback to a mock result if not found
          setResult({
            id: id as string,
            title: title as string,
            summary: "Summary not available. Please go back and try again.",
            source_url: "https://example.com",
            state_id: state as string,
            category_id: category as string,
            county_id: county as string,
            full_text: "Full text not available. Please go back and try again."
          });
        }
      }
    } catch (error) {
      console.error("Error loading result:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfSaved = async () => {
    try {
      const savedResultsJson = await AsyncStorage.getItem("saved-results");
      if (savedResultsJson) {
        const savedResults = JSON.parse(savedResultsJson);
        const isSavedResult = savedResults.some((r: LegalResult) => r.id === id || r.title === title);
        setIsSaved(isSavedResult);
      }
    } catch (error) {
      console.error("Error checking if result is saved:", error);
    }
  };

  const handleSaveResult = async () => {
    if (!result) return;
    
    try {
      const savedResultsJson = await AsyncStorage.getItem("saved-results");
      let savedResults: LegalResult[] = savedResultsJson ? JSON.parse(savedResultsJson) : [];
      
      if (isSaved) {
        // Remove from saved results
        savedResults = savedResults.filter(r => r.id !== result.id && r.title !== result.title);
      } else {
        // Add to saved results
        savedResults.push(result);
      }
      
      await AsyncStorage.setItem("saved-results", JSON.stringify(savedResults));
      setIsSaved(!isSaved);
    } catch (error) {
      console.error("Error saving result:", error);
    }
  };

  const handleOpenLink = async () => {
    if (!result) return;
    
    try {
      const supported = await Linking.canOpenURL(result.source_url);
      if (supported) {
        await Linking.openURL(result.source_url);
      } else {
        console.error("Cannot open URL:", result.source_url);
      }
    } catch (error) {
      console.error("Error opening URL:", error);
    }
  };

  const handleShare = async () => {
    if (!result) return;
    
    try {
      if (Platform.OS === "web") {
        // Web sharing
        if (navigator.share) {
          await navigator.share({
            title: result.title,
            text: result.summary,
            url: result.source_url,
          });
        } else {
          // Fallback for browsers that don't support the Web Share API
          await Linking.openURL(`mailto:?subject=${encodeURIComponent(result.title)}&body=${encodeURIComponent(result.summary + "\n\nSource: " + result.source_url)}`);
        }
      } else {
        // Native sharing
        // This would use the Share API in a real app
        console.log("Sharing on native platforms would use the Share API");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const stateObj = state ? getStateByAbbreviation(state as string) : null;
  const categoryObj = category ? getCategoryById(category as string) : null;

  return (
    <>
      <Stack.Screen 
        options={{
          title: "Legal Information",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <Feather name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerRightContainer}>
              <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
                <Feather name="share-2" size={24} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveResult} style={styles.headerButton}>
                {isSaved ? (
                  <Feather name="check" size={24} color={colors.primary} />
                ) : (
                  <Feather name="bookmark" size={24} color={colors.text} />
                )}
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading...</Text>
          </View>
        ) : result ? (
          <>
            <Text style={styles.title}>{result.title}</Text>
            
            <View style={styles.metadataContainer}>
              {stateObj && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{stateObj.name}</Text>
                </View>
              )}
              {categoryObj && (
                <View style={[styles.tag, styles.categoryTag]}>
                  <Text style={styles.tagText}>{categoryObj.name}</Text>
                </View>
              )}
              {county && (
                <View style={[styles.tag, styles.countyTag]}>
                  <Text style={styles.tagText}>{county} County</Text>
                </View>
              )}
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Summary</Text>
              <Text style={styles.summaryText}>{result.summary}</Text>
            </View>
            
            <TouchableOpacity style={styles.sourceButton} onPress={handleOpenLink}>
              <Feather name="external-link" size={20} color="#fff" />
              <Text style={styles.sourceButtonText}>View Original Source</Text>
            </TouchableOpacity>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Full Legal Text</Text>
              <Text style={styles.fullText}>{result.full_text}</Text>
            </View>
            
            <View style={styles.disclaimerContainer}>
              <Text style={styles.disclaimerText}>
                This information is provided for educational purposes only and should not be construed as legal advice. Always consult with a qualified attorney for advice specific to your situation.
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load legal information. Please try again.</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadResult}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  headerButton: {
    padding: 8,
  },
  headerRightContainer: {
    flexDirection: "row",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
  },
  metadataContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 24,
    gap: 8,
  },
  tag: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  categoryTag: {
    backgroundColor: colors.secondary,
  },
  countyTag: {
    backgroundColor: colors.warning,
  },
  tagText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  fullText: {
    fontSize: 15,
    color: colors.darkGray,
    lineHeight: 22,
  },
  sourceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  sourceButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  disclaimerContainer: {
    padding: 16,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    marginTop: 8,
  },
  disclaimerText: {
    fontSize: 14,
    color: colors.darkGray,
    fontStyle: "italic",
  },
  errorContainer: {
    padding: 24,
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});// TODO: Implement this file

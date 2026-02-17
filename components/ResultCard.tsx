import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Linking, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/constants/colors";
import { LegalResult } from "@/types";
import { getCategoryById } from "@/constants/categories";
import { getStateByAbbreviation } from "@/constants/states";

interface ResultCardProps {
  result: LegalResult;
  onPress: (result: LegalResult) => void;
}

export default function ResultCard({ result, onPress }: ResultCardProps) {
  const category = getCategoryById(result.category_id);
  const state = getStateByAbbreviation(result.state_id);

  const handleOpenLink = async () => {
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

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(result)}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {result.title}
        </Text>
        <Feather name="chevron-right" size={20} color={colors.mediumGray} />
      </View>
      
      <View style={styles.tagsContainer}>
        {state && (
          <View style={styles.tag}>
            <Text style={styles.tagText}>{state.name}</Text>
          </View>
        )}
        {category && (
          <View style={[styles.tag, styles.categoryTag]}>
            <Text style={styles.tagText}>{category.name}</Text>
          </View>
        )}
        {result.county_id && (
          <View style={[styles.tag, styles.countyTag]}>
            <Text style={styles.tagText}>{result.county_id} County</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.summary} numberOfLines={3}>
        {result.summary}
      </Text>
      
      <TouchableOpacity style={styles.sourceLink} onPress={handleOpenLink}>
        <ExternalLink size={16} color={colors.primary} />
        <Text style={styles.sourceLinkText}>View Source</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
    gap: 8,
  },
  tag: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
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
    fontSize: 12,
    fontWeight: "500",
  },
  summary: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 20,
    marginBottom: 12,
  },
  sourceLink: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  sourceLinkText: {
    color: colors.primary,
    marginLeft: 6,
    fontWeight: "500",
  },
});// TODO: Implement this file

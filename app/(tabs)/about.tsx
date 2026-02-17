import React from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Linking, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/constants/colors";

export default function AboutScreen() {
  const handleOpenLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.error("Cannot open URL:", url);
      }
    } catch (error) {
      console.error("Error opening URL:", error);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.section}>
        <Text style={styles.title}>The Father's Alliance</Text>
        <Text style={styles.description}>
          The Father's Alliance is a nonprofit organization dedicated to helping families understand and navigate the complex legal systems that affect their lives. Our mission is to provide accessible, accurate legal information to parents and families in crisis.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About This App</Text>
        <Text style={styles.description}>
          This legal search tool helps you find and understand family law information from government and legal sources. It uses AI to analyze your query, search for relevant legal content, and summarize it in plain language.
        </Text>
        
        <Text style={styles.sectionSubtitle}>How It Works:</Text>
        <View style={styles.stepContainer}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <Text style={styles.stepText}>Enter your legal question or search terms</Text>
        </View>
        <View style={styles.stepContainer}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <Text style={styles.stepText}>Our AI identifies the relevant state and legal category</Text>
        </View>
        <View style={styles.stepContainer}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <Text style={styles.stepText}>We search verified legal sources for information</Text>
        </View>
        <View style={styles.stepContainer}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>4</Text>
          </View>
          <Text style={styles.stepText}>Results are summarized in plain language you can understand</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Important Disclaimer</Text>
        <Text style={styles.disclaimer}>
          This app provides legal information, not legal advice. The information provided is for educational purposes only and should not be construed as legal advice. Every legal situation is unique, and the laws vary by state and locality.
        </Text>
        <Text style={styles.disclaimer}>
          Always consult with a qualified attorney for advice specific to your situation. The Father's Alliance and this app's creators are not responsible for any actions taken based on the information provided.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <TouchableOpacity 
          style={styles.contactButton}
          onPress={() => handleOpenLink("mailto:contact@fathersalliance.org")}
        >
          <Feather name="mail" size={20} color="#fff" />
          <Text style={styles.contactButtonText}>Email Us</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.websiteButton}
          onPress={() => handleOpenLink("https://fathersalliance.org")}
        >
          <Feather name="external-link" size={20} color={colors.primary} />
          <Text style={styles.websiteButtonText}>Visit Our Website</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Feather name="heart" size={16} color={colors.error} />
        <Text style={styles.footerText}>
          Made with love for families navigating difficult times
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginTop: 16,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: colors.darkGray,
    lineHeight: 24,
    marginBottom: 16,
  },
  stepContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepNumberText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: colors.darkGray,
  },
  disclaimer: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 22,
    marginBottom: 12,
    fontStyle: "italic",
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    justifyContent: "center",
    ...Platform.select({
      web: {
        cursor: "pointer",
      },
    }),
  },
  contactButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  websiteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    ...Platform.select({
      web: {
        cursor: "pointer",
      },
    }),
  },
  websiteButtonText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: colors.mediumGray,
    textAlign: "center",
  },
});/ TODO: Implement this file

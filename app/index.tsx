import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from "react-native";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<string[]>([]);

  function handleSearch() {
    if (!query.trim()) return;

    setResults([
      `Result for "${query}" #1`,
      `Result for "${query}" #2`,
      `Result for "${query}" #3`,
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Family Law Navigator</Text>

      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Enter legal topic..."
          style={styles.input}
        />
        <TouchableOpacity onPress={handleSearch} style={styles.button}>
          <Text style={styles.buttonText}>Search</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.resultCard}>
            <Text>{item}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No results yet.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  searchRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 4,
  },
  button: {
    marginLeft: 10,
    backgroundColor: "#007AFF",
    paddingHorizontal: 15,
    justifyContent: "center",
    borderRadius: 4,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  resultCard: {
    padding: 15,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 6,
    marginBottom: 10,
  },
  empty: {
    textAlign: "center",
    marginTop: 20,
    color: "#888",
  },
});

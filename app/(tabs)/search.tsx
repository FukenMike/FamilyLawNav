import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { searchResources } from '@/services/searchProvider';
import { SeedSearchProvider } from '@/services/SeedSearchProvider';

export default function TabSearchRoute() {
  const [q, setQ] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      // Prefer backend search if configured, otherwise fall back to seeded provider
      if (process.env.EXPO_PUBLIC_FAMILYLAW_API_BASE_URL) {
        const res = await searchResources({ q, state: state || undefined, zip: zip || undefined });
        setResults(res.results || []);
      } else {
        const provider = new SeedSearchProvider();
        const res = await provider.search(q || '');
        setResults(res || []);
      }
    } catch (e: any) {
      setError(e.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search</Text>

      <View style={styles.formRow}>
        <TextInput
          placeholder="Query (articles, topics)"
          value={q}
          onChangeText={setQ}
          style={styles.input}
          returnKeyType="search"
          onSubmitEditing={doSearch}
        />
      </View>

      <View style={styles.formRow}>
        <TextInput
          placeholder="State (e.g. GA)"
          value={state}
          onChangeText={setState}
          style={[styles.input, { width: 120 }]}
        />
        <TextInput
          placeholder="ZIP"
          value={zip}
          onChangeText={setZip}
          style={[styles.input, { width: 120, marginLeft: 8 }]}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.btn} onPress={doSearch}>
          <Text style={styles.btnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="small" />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={results}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }) => (
          <View style={styles.resultItem}>
            <Text style={styles.resultTitle}>{item.title}</Text>
            {item.summary && <Text style={styles.resultSummary}>{item.summary}</Text>}
          </View>
        )}
        ListEmptyComponent={() => (
          <Text style={styles.empty}>{q ? 'No results' : 'Enter a search to begin'}</Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', flex: 1 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  formRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingHorizontal: 12, height: 40 },
  btn: { marginLeft: 8, backgroundColor: '#1976d2', paddingHorizontal: 14, borderRadius: 6, justifyContent: 'center', height: 40 },
  btnText: { color: '#fff', fontWeight: '600' },
  resultItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
  resultTitle: { fontWeight: '700' },
  resultSummary: { color: '#444', marginTop: 4 },
  empty: { color: '#666', marginTop: 16 },
  error: { color: '#b00020', marginTop: 8 },
});
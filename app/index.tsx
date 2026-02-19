import { searchResources } from '@/services/searchProvider'
import { Resource } from '@/types/resource'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

export default function SearchScreen() {
  const [q, setQ] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [results, setResults] = useState<Resource[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSearch() {
    setError(null)
    setResults([])
    setLoading(true)
    try {
      const res = await searchResources({ q, state, zip })
      setResults(res.results || [])
    } catch (err: any) {
      setError(err.message || 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Family Law Navigator</Text>

      <View style={styles.form}>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search query"
          style={styles.input}
          autoCapitalize="none"
        />
        <TextInput
          value={state}
          onChangeText={setState}
          placeholder="State (2-letter)"
          style={styles.input}
          autoCapitalize="characters"
          maxLength={2}
        />
        <TextInput
          value={zip}
          onChangeText={setZip}
          placeholder="Zip code"
          style={styles.input}
          keyboardType="numeric"
          maxLength={10}
        />
        <TouchableOpacity
          onPress={handleSearch}
          style={styles.button}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator style={styles.loading} size="large" />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id || item.url || item.title}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.resultCard}
            onPress={() => router.push(`/resource/${item.id}`)}
            activeOpacity={0.8}
          >
            <Text style={styles.resultTitle}>{item.title}</Text>
            <Text style={styles.resultSummary}>{item.summary}</Text>
            {!!item.url && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation()
                  Linking.openURL(item.url!)
                }}
              >
                <Text style={styles.resultLink}>Open Link</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading && !error ? (
            <Text style={styles.empty}>No results found.</Text>
          ) : null
        }
        contentContainerStyle={styles.resultsList}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  form: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 10,
    marginBottom: 8,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 10,
    justifyContent: 'center',
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  loading: {
    marginVertical: 16,
  },
  error: {
    color: '#b00020',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  resultsList: {
    paddingBottom: 32,
  },
  resultCard: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 6,
    marginBottom: 10,
    backgroundColor: '#fafafa',
  },
  resultTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    fontSize: 16,
  },
  resultSummary: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
  },
  resultLink: {
    color: '#1976d2',
    fontWeight: 'bold',
    fontSize: 15,
  },
  empty: {
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
  },
})
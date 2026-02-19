import { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { useLocalSearchParams } from 'expo-router'

const API_BASE =
  process.env.EXPO_PUBLIC_FAMILYLAW_API_BASE_URL?.trim() ||
  'http://127.0.0.1:8787'

export default function ResourceDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()

  interface Resource {
    id: string;
    title: string;
    summary: string;
    url?: string | null;
    category?: string | null;
    last_verified_at?: string | null;
  }
  interface Coverage {
    coverage_type: string;
    state_code?: string | null;
    zip_prefix?: string | null;
  }
  interface ResourceDetailsResponse {
    resource: Resource;
    coverage: Coverage[];
  }

  const [data, setData] = useState<ResourceDetailsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    fetch(`${API_BASE}/resource/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed (${res.status})`)
        return res.json()
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    )
  if (error)
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    )
  if (!data) return null

  const { resource, coverage } = data

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{resource.title}</Text>
      <Text style={styles.summary}>{resource.summary}</Text>
      {resource.category && (
        <Text style={styles.label}>
          Category: <Text style={styles.value}>{resource.category}</Text>
        </Text>
      )}
      {resource.last_verified_at && (
        <Text style={styles.label}>
          Last Verified:{' '}
          <Text style={styles.value}>{resource.last_verified_at}</Text>
        </Text>
      )}
      <Text style={styles.section}>Coverage</Text>
      {coverage.length === 0 ? (
        <Text style={styles.value}>No coverage data.</Text>
      ) : (
        coverage.map((c, i) => (
          <View key={i} style={styles.coverageRow}>
            <Text style={styles.value}>{c.coverage_type}</Text>
            {c.state_code && (
              <Text style={styles.value}> | State: {c.state_code}</Text>
            )}
            {c.zip_prefix && (
              <Text style={styles.value}> | Zip: {c.zip_prefix}</Text>
            )}
          </View>
        ))
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  summary: {
    fontSize: 16,
    marginBottom: 12,
    color: '#333',
  },
  label: {
    fontWeight: 'bold',
    marginTop: 6,
    marginBottom: 2,
  },
  value: {
    fontWeight: 'normal',
    color: '#222',
  },
  section: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 18,
    marginBottom: 6,
  },
  error: {
    color: '#b00020',
    fontWeight: 'bold',
    fontSize: 16,
  },
  coverageRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
})

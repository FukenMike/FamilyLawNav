import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native'

import { useLocalSearchParams } from 'expo-router'
import { decodeAuthorityId } from '@/services/authorityIdHelpers'
import { getAuthorityPackProvider } from '@/config/runtime'

export default function ResourceRoute() {
  const { id, state } = useLocalSearchParams<{ id: string, state?: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authority, setAuthority] = useState<any | null>(null);
  const [referencedBy, setReferencedBy] = useState<string[]>([]);
  const [decodedCitation, setDecodedCitation] = useState<string>("");

  useEffect(() => {
    if (!id || !state) {
      setError("Missing state or citation");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const citation = decodeAuthorityId(id);
    setDecodedCitation(citation);
    const provider = getAuthorityPackProvider();
    provider.getStatePack(state).then(pack => {
      if (!pack || !pack.authorities) {
        setAuthority(null);
        setReferencedBy([]);
        setLoading(false);
        return;
      }
      const meta = pack.authorities[citation] || null;
      // Find which issues reference this citation
      const referenced: string[] = [];
      for (const [issueId, citations] of Object.entries(pack.authoritiesByIssue || {})) {
        if (citations.includes(citation)) referenced.push(issueId);
      }
      setAuthority(meta);
      setReferencedBy(referenced);
      setLoading(false);
    }).catch(e => {
      setError(e.message);
      setLoading(false);
    });
  }, [id, state]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }
  if (!authority) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>State pack not available or authority not found</Text>
        <Text style={styles.value}>{decodedCitation}</Text>
      </View>
    );
  }
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View>
        <Text style={styles.title}>{authority.title || decodedCitation}</Text>
        <Text style={styles.value}>{authority.kind}</Text>
        {authority.rank && <Text style={styles.value}>Rank: {authority.rank}</Text>}
        {authority.courtScope && <Text style={styles.value}>Court: {authority.courtScope}</Text>}
        {authority.sources && authority.sources.length > 0 && (
          <View style={{ marginTop: 10 }}>
            <Text style={styles.label}>Sources:</Text>
            {authority.sources.map((url: string, i: number) => (
              <Text key={i} style={[styles.value, { color: '#1976d2' }]} onPress={() => window.open ? window.open(url, '_blank') : null}>{url}</Text>
            ))}
          </View>
        )}
        {referencedBy.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.label}>Referenced by issues:</Text>
            {referencedBy.map((iss, i) => (
              <Text key={i} style={styles.value}>{iss}</Text>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  label: {
    fontWeight: 'bold',
    marginTop: 12,
  },
  value: {
    fontSize: 16,
    marginBottom: 4,
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
    marginTop: 16,
  },
  coverageRow: {
    flexDirection: 'row',
    marginBottom: 4,
	},
});

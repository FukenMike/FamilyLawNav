import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native'

import { useLocalSearchParams } from 'expo-router'
import { decodeAuthorityId } from '@/services/authorityIdHelpers'
import { usePack } from '@/services/packStore'
import { isSaved, toggle as toggleSaved } from '@/services/savedStore'
import { summarizeAuthority } from '@/services/aiService'

export default function ResourceRoute() {
  const { id, state } = useLocalSearchParams<{ id: string, state?: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authority, setAuthority] = useState<any | null>(null);
  const [referencedBy, setReferencedBy] = useState<string[]>([]);
  const [decodedCitation, setDecodedCitation] = useState<string>("");
  const [saved, setSaved] = useState<boolean>(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const stateCode = typeof state === 'string' ? state : '';
  const { pack, status: packStatus } = usePack(stateCode);

  useEffect(() => {
    if (!id || !stateCode) {
      setError("Missing state or citation");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const citation = decodeAuthorityId(id);
    setDecodedCitation(citation);

    if (!pack || !pack.authorities) {
      setAuthority(null);
      setReferencedBy([]);
      setLoading(false);
      return;
    }
    const meta = pack.authorities[citation] || null;
    const referenced: string[] = [];
    for (const [issueId, citations] of Object.entries(pack.authoritiesByIssue || {})) {
      const list = citations as string[];
      if (list.includes(citation)) referenced.push(issueId);
    }
    setAuthority(meta);
    setReferencedBy(referenced);
    setLoading(false);

    // check saved state
    isSaved(id).then(s => setSaved(s)).catch(() => {});
  }, [id, stateCode, pack]);

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
        <TouchableOpacity
          style={[styles.saveBtn, saved ? styles.saveBtnActive : null]}
          onPress={async () => {
            const newState = await toggleSaved(id);
            setSaved(newState);
          }}
        >
          <Text style={saved ? styles.saveBtnTextActive : styles.saveBtnText}>
            {saved ? 'Unsave' : 'Save'}
          </Text>
        </TouchableOpacity>
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
        {/* AI summary */}
        <TouchableOpacity
          style={[styles.runBtn, { marginTop: 16 }]}
          onPress={async () => {
            setSummarizing(true);
            setSummaryError(null);
            try {
              const text = authority.description || authority.text || authority.title || decodedCitation;
              const res = await summarizeAuthority(text || '');
              setSummary(res);
            } catch (e: any) {
              setSummaryError(e.message || 'Failed');
            } finally {
              setSummarizing(false);
            }
          }}
          disabled={summarizing}
        >
          <Text style={styles.runBtnText}>{summarizing ? 'Summarizing...' : 'Generate Summary'}</Text>
        </TouchableOpacity>
        {summary && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.section}>Summary</Text>
            <Text style={styles.value}>{summary}</Text>
          </View>
        )}
        {summaryError && (
          <Text style={[styles.error, { marginTop: 8 }]}>{summaryError}</Text>
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
  saveBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#eee',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  saveBtnActive: {
    backgroundColor: '#1976d2',
  },
  saveBtnText: {
    color: '#333',
    fontWeight: '600',
  },
  saveBtnTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  runBtn: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runBtnText: {
    color: '#fff',
    fontWeight: '600',
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

import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Switch } from "react-native";

import { runNavigator } from "@/services/navigatorService";
import { getManifest, getPack, PACK_CACHE_TTL_MS } from "@/services/packStore";
import type { PackStatus } from "@/services/packStore";
import type { Domain, IntakeQuestion, IntakeAnswer, NavigatorOutput } from "@/core/navigator/types";
import { encodeAuthorityId } from "@/services/authorityIdHelpers";
import { useRouter } from "expo-router";

const ALL_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
];


export default function NavigatorScreen() {
  const [state, setState] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('lastState') || 'GA';
    }
    return 'GA';
  });
  const [manifest, setManifest] = useState<any>(null);
  const [pack, setPack] = useState<any>(null);
  const [packStatus, setPackStatus] = useState<PackStatus | null>(null);
  const [refreshBusy, setRefreshBusy] = useState(false);
  const [domainId, setDomainId] = useState<string>("");
  const [questions, setQuestions] = useState<IntakeQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [output, setOutput] = useState<NavigatorOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [gap, setGap] = useState<string | null>(null);
  const router = useRouter();

  function timeSince(iso?: string) {
    if (!iso) return '';
    const diff = Date.now() - Date.parse(iso);
    if (isNaN(diff)) return '';
    const s = Math.floor(diff / 1000);
    if (s < 30) return 'just now';
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d old`;
    return new Date(iso).toLocaleDateString();
  }

  // Load manifest and pack on state change
  useEffect(() => {
    (async () => {
      setPack(null);
      setPackStatus(null);
      setDomainId("");
      setQuestions([]);
      setAnswers({});
      setOutput(null);
      setGap(null);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('lastState', state);
      }
      const mRes = await getManifest();
      setManifest(mRes.manifest);
      const packRes = await getPack(state);
      setPack(packRes.pack);
      setPackStatus(packRes.status);
      if (packRes.pack && packRes.pack.domains && packRes.pack.domains.length > 0) {
        setDomainId(packRes.pack.domains[0].id);
      }
    })();
  }, [state]);

  // Update questions when domain or pack changes
  useEffect(() => {
    if (pack && domainId) {
      // TODO: Use pack-provided questions if available
      setQuestions([
        { id: "q1", domainId, prompt: "Are you seeking initial custody?", type: "boolean" },
        { id: "q2", domainId, prompt: "Is there a material change in circumstances?", type: "boolean" },
        { id: "q3", domainId, prompt: "Is there an emergency?", type: "boolean" },
      ]);
    } else {
      setQuestions([]);
    }
    setAnswers({});
    setOutput(null);
    setGap(null);
  }, [domainId, pack]);

  const handleRun = async () => {
    setLoading(true);
    setOutput(null);
    setGap(null);
    const intakeAnswers: IntakeAnswer[] = questions.map(q => ({
      questionId: q.id,
      value: answers[q.id] ?? false,
    }));
    try {
      const result = await runNavigator({ state, domainId, answers: intakeAnswers });
      setOutput(result);
      if (result.gaps && result.gaps.length > 0) setGap(result.gaps.join("\n"));
    } catch (e: any) {
      setGap(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Navigator</Text>
      {/* State Selector */}
      <View style={styles.row}>
        <Text style={styles.label}>State:</Text>
        {ALL_STATES.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.stateBtn, state === s && styles.stateBtnActive]}
            onPress={() => setState(s)}
          >
            <Text style={state === s ? styles.stateBtnTextActive : styles.stateBtnText}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Pack status */}
      <View style={{ marginBottom: 8 }}>
        <Text style={styles.label}>Pack:</Text>
        <Text style={styles.value}>
          {packStatus === null
            ? '(loading)'
            : packStatus.source === 'none'
            ? 'none'
            : `${packStatus.source} (v${packStatus.packVersion ?? 'unknown'})${pack?.quality === 'baseline' ? ' (baseline)' : ''}${packStatus.isStale ? ' (stale)' : ''}${packStatus.lastFetchedAt ? ` — ${timeSince(packStatus.lastFetchedAt)}` : ''}`}
        </Text>
        {packStatus?.error ? <Text style={styles.error}>Pack error: {packStatus.error}</Text> : null}
      </View>

      {/* Domain Selector */}
      <View style={styles.row}>
        <Text style={styles.label}>Domain:</Text>
        {pack && pack.domains && pack.domains.length > 0 ? (
          pack.domains.map((d: any) => (
            <TouchableOpacity
              key={d.id}
              style={[styles.domainBtn, domainId === d.id && styles.domainBtnActive]}
              onPress={() => setDomainId(d.id)}
            >
              <Text style={domainId === d.id ? styles.domainBtnTextActive : styles.domainBtnText}>{d.label}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.value}>State pack not available yet</Text>
        )}
      </View>
      {/* Intake Questions */}
      <View style={styles.section}>
        <Text style={styles.label}>Questions:</Text>
        {questions.map(q => (
          <View key={q.id} style={styles.questionRow}>
            <Text style={styles.questionText}>{q.prompt}</Text>
            {q.type === "boolean" && (
              <Switch
                value={!!answers[q.id]}
                onValueChange={v => setAnswers(a => ({ ...a, [q.id]: v }))}
              />
            )}
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <TouchableOpacity
          style={styles.runBtn}
          onPress={handleRun}
          disabled={
            loading ||
            !pack ||
            !domainId ||
            packStatus?.source === 'none' ||
            pack?.quality === 'baseline' ||
            !(pack?.domains && pack.domains.length > 0)
          }
        >
          <Text style={styles.runBtnText}>{loading ? "Running..." : "Run Navigator"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.runBtn, { backgroundColor: '#eee', paddingHorizontal: 12 }]}
          onPress={async () => {
            if (refreshBusy) return;
            setRefreshBusy(true);
            try {
              setGap(null);
              const res = await getPack(state, { forceRemote: true });
              // only replace pack if remote returned one; always update status
              if (res.pack) setPack(res.pack);
              setPackStatus(res.status);
            } catch (e: any) {
              setPackStatus(prev => ({ ...(prev || {}), error: e?.message || String(e) } as PackStatus));
            } finally {
              setRefreshBusy(false);
            }
          }}
          disabled={refreshBusy}
        >
          <Text style={[styles.runBtnText, { color: '#333' }]}>{refreshBusy ? 'Refreshing...' : 'Refresh Pack'}</Text>
        </TouchableOpacity>
      </View>
      {/* Output */}
      {gap && <Text style={styles.gap}>{gap}</Text>}
      {output && (
        <View style={styles.section}>
          <Text style={styles.label}>Detected Issues:</Text>
          {output.detectedIssues.length === 0 && <Text style={styles.value}>None detected.</Text>}
          {output.detectedIssues.map(issue => (
            <View key={issue.issueId} style={styles.issueBlock}>
              <Text style={styles.issueTitle}>{issue.issueId}</Text>
              <Text style={styles.value}>Confidence: {issue.confidence}</Text>
              <Text style={styles.value}>Reasons: {issue.reasons.join(", ")}</Text>
              {/* Authorities */}
              <Text style={styles.subLabel}>Authorities:</Text>
              {(output.authoritiesByIssue[issue.issueId] || []).map((c, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.authorityRow}
                  onPress={() => router.push(`/resource/${encodeAuthorityId(c)}?state=${state}`)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.authorityText}>{c}</Text>
                </TouchableOpacity>
              ))}
              {/* Legal Tests */}
              <Text style={styles.subLabel}>Legal Tests:</Text>
              {(output.testsByIssue[issue.issueId] || []).map((t, i) => (
                <Text key={i} style={styles.value}>{t.label}</Text>
              ))}
              {/* Traps */}
              <Text style={styles.subLabel}>Procedural Traps:</Text>
              {(output.trapsByIssue[issue.issueId] || []).map((t, i) => (
                <Text key={i} style={styles.value}>{t.label} ({t.severity})</Text>
              ))}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    flexWrap: "wrap",
  },
  label: {
    fontWeight: "bold",
    marginRight: 8,
    fontSize: 16,
  },
  stateBtn: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: "#f5f5f5",
  },
  stateBtnActive: {
    backgroundColor: "#1976d2",
    borderColor: "#1976d2",
  },
  stateBtnText: {
    color: "#333",
  },
  stateBtnTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  domainBtn: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: "#f5f5f5",
  },
  domainBtnActive: {
    backgroundColor: "#1976d2",
    borderColor: "#1976d2",
  },
  domainBtnText: {
    color: "#333",
  },
  domainBtnTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  section: {
    marginTop: 18,
    marginBottom: 8,
  },
  questionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  questionText: {
    flex: 1,
    fontSize: 15,
    color: "#222",
  },
  runBtn: {
    backgroundColor: "#1976d2",
    borderRadius: 4,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  runBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  gap: {
    color: "#b00020",
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 8,
  },
  error: {
    color: '#b00020',
    fontWeight: 'bold',
    marginTop: 6,
  },
  value: {
    color: "#222",
    marginLeft: 8,
    marginBottom: 2,
  },
  issueBlock: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    backgroundColor: "#fafafa",
  },
  issueTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  subLabel: {
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 2,
  },
    authorityRow: {
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 4,
      backgroundColor: '#e3e9f6',
      marginBottom: 4,
      alignSelf: 'flex-start',
    },
    authorityText: {
      color: '#1976d2',
      fontWeight: 'bold',
      fontSize: 15,
    },
});

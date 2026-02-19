import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Switch } from "react-native";
import { runNavigator } from "@/services/navigatorService";
import { gaPack } from "@/data/statePacks/ga";
import type { Domain, IntakeQuestion, IntakeAnswer, NavigatorOutput } from "@/core/navigator/types";
import { encodeAuthorityId } from "@/services/authorityIdHelpers";
import { useRouter } from "expo-router";

const STATES = ["GA"];

export default function NavigatorScreen() {
  const [state, setState] = useState("GA");
  const [domainId, setDomainId] = useState(gaPack.domains[0]?.id || "");
  const [questions, setQuestions] = useState<IntakeQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [output, setOutput] = useState<NavigatorOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [gap, setGap] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // For this seed, intake questions are not in the pack, so synthesize a few for demo
    // In a real pack, these would be loaded from the pack
    setQuestions([
      { id: "q1", domainId, prompt: "Are you seeking initial custody?", type: "boolean" },
      { id: "q2", domainId, prompt: "Is there a material change in circumstances?", type: "boolean" },
      { id: "q3", domainId, prompt: "Is there an emergency?", type: "boolean" },
    ]);
    setAnswers({});
    setOutput(null);
    setGap(null);
  }, [domainId, state]);

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
        {STATES.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.stateBtn, state === s && styles.stateBtnActive]}
            onPress={() => setState(s)}
          >
            <Text style={state === s ? styles.stateBtnTextActive : styles.stateBtnText}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Domain Selector */}
      <View style={styles.row}>
        <Text style={styles.label}>Domain:</Text>
        {gaPack.domains.map(d => (
          <TouchableOpacity
            key={d.id}
            style={[styles.domainBtn, domainId === d.id && styles.domainBtnActive]}
            onPress={() => setDomainId(d.id)}
          >
            <Text style={domainId === d.id ? styles.domainBtnTextActive : styles.domainBtnText}>{d.label}</Text>
          </TouchableOpacity>
        ))}
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
      <TouchableOpacity style={styles.runBtn} onPress={handleRun} disabled={loading}>
        <Text style={styles.runBtnText}>{loading ? "Running..." : "Run Navigator"}</Text>
      </TouchableOpacity>
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
                  onPress={() => router.push(`/resource/${encodeAuthorityId(c)}`)}
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

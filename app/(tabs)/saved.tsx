import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { getSavedIds } from '@/services/savedStore';
import { usePack } from '@/services/packStore';

export default function SavedRoute() {
  const router = useRouter();
  const [ids, setIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [packState, setPackState] = useState<string>('');
  const { pack } = usePack(packState);

  useEffect(() => {
    // load saved ids and optionally a pack to resolve titles
    setLoading(true);
    getSavedIds().then(arr => {
      setIds(arr);
      setLoading(false);
      if (arr.length > 0 && !packState) {
        // try to load pack from first id's state if encoded
        const maybeState = arr[0]?.split('%')[0];
        if (maybeState) setPackState(maybeState);
      }
    });
  }, []);

  const renderItem = ({ item }: { item: string }) => {
    let label = item;
    if (pack && pack.authorities && pack.authorities[item]?.title) {
      label = pack.authorities[item].title;
    }
    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => router.push(`/resource/${item}?state=${packState}`)}
      >
        <Text style={styles.itemText}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Saved Authorities</Text>
      {loading && <ActivityIndicator size="small" />}
      {!loading && ids.length === 0 && <Text style={styles.empty}>No saved items</Text>}
      <FlatList
        data={ids}
        keyExtractor={i => i}
        renderItem={renderItem}
        style={{ width: '100%' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  empty: { color: '#666', marginTop: 20 },
  item: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemText: { fontSize: 16 },
});

import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { list, SavedItem } from '@/services/savedStore';
import { usePack } from '@/services/packStore';

export default function SavedRoute() {
  const router = useRouter();
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [packState, setPackState] = useState<string>('');
  const { pack } = usePack(packState);

  useEffect(() => {
    // load saved items; legacy string[] values will be migrated
    setLoading(true);
    list().then(arr => {
      setItems(arr);
      setLoading(false);
      // if we don't have a packState yet, pick the first non-empty state
      if (arr.length > 0 && !packState) {
        const first = arr.find(i => i.state && i.state.length > 0);
        if (first) setPackState(first.state);
      }
    });
  }, []);

  const renderItem = ({ item }: { item: SavedItem }) => {
    let label = item.id;
    if (pack && pack.authorities && pack.authorities[item.id]?.title) {
      label = pack.authorities[item.id].title;
    }
    const disable = !item.state;
    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => {
          if (disable) return;
          router.push(`/resource/${item.id}?state=${item.state}`);
        }}
        disabled={disable}
      >
        <Text style={[styles.itemText, disable ? { color: '#999' } : null]}>
          {label}{disable ? ' (Missing state)' : ''}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Saved Authorities</Text>
      {loading && <ActivityIndicator size="small" />}
      {!loading && items.length === 0 && <Text style={styles.empty}>No saved items</Text>}
      <FlatList
        data={items}
        keyExtractor={i => i.id + '|' + i.state}
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

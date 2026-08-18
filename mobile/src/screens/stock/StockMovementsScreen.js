import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';
import { mobileCrudApi } from '../../services/mobileCrudApi';

const movementColors = {
  entry: '#10b981',
  exit: '#ef4444',
  transfer: '#3b82f6',
};

const emptyForm = {
  movement_type: 'entry',
  product_id: null,
  quantity: '0',
  warehouse_from_id: null,
  warehouse_to_id: null,
  reference: '',
  notes: '',
};

export default function StockMovementsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [movementList, productList, warehouseList] = await Promise.all([
        mobileCrudApi.getList('stock/movements/'),
        mobileCrudApi.getList('stock/products/'),
        mobileCrudApi.getList('entrepots/'),
      ]);
      setMovements(movementList);
      setProducts(productList);
      setWarehouses(warehouseList);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les mouvements');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return movements.filter((item) => {
      const typeOk = typeFilter === 'all' || item.movement_type === typeFilter;
      const fields = [item.product_name, item.product_sku, item.reference, item.responsible_name].map((v) => String(v || '').toLowerCase());
      const searchOk = !q || fields.some((v) => v.includes(q));
      return typeOk && searchOk;
    });
  }, [movements, search, typeFilter]);

  const stats = useMemo(() => ({
    total: movements.length,
    entries: movements.filter((m) => m.movement_type === 'entry').length,
    exits: movements.filter((m) => m.movement_type === 'exit').length,
    transfers: movements.filter((m) => m.movement_type === 'transfer').length,
  }), [movements]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const saveMovement = async () => {
    if (!formData.product_id || Number(formData.quantity || 0) <= 0) {
      Alert.alert('Validation', 'Produit et quantite valide sont requis');
      return;
    }

    const payload = {
      movement_type: formData.movement_type,
      product_id: formData.product_id,
      quantity: Number(formData.quantity),
      warehouse_from_id: formData.warehouse_from_id,
      warehouse_to_id: formData.warehouse_to_id,
      reference: formData.reference,
      notes: formData.notes,
    };

    try {
      await mobileCrudApi.create('stock/movements/', payload);
      setModalVisible(false);
      setFormData(emptyForm);
      fetchData();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de creer le mouvement');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Mouvements</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <MaterialIcons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Nouveau</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}><Text style={styles.statValue}>{stats.total}</Text><Text style={styles.statLabel}>Total</Text></View>
          <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10b981' }]}>{stats.entries}</Text><Text style={styles.statLabel}>Entrees</Text></View>
          <View style={styles.statCard}><Text style={[styles.statValue, { color: '#ef4444' }]}>{stats.exits}</Text><Text style={styles.statLabel}>Sorties</Text></View>
          <View style={styles.statCard}><Text style={[styles.statValue, { color: '#3b82f6' }]}>{stats.transfers}</Text><Text style={styles.statLabel}>Transferts</Text></View>
        </View>

        <View style={styles.searchWrap}>
          <MaterialIcons name="search" size={20} color="#64748b" />
          <TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder="Produit, SKU, reference" placeholderTextColor="#64748b" />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { value: 'all', label: 'Tous' },
              { value: 'entry', label: 'Entree' },
              { value: 'exit', label: 'Sortie' },
              { value: 'transfer', label: 'Transfert' },
            ].map((item) => (
              <TouchableOpacity key={item.value} onPress={() => setTypeFilter(item.value)} style={[styles.filterChip, typeFilter === item.value && styles.filterChipActive]}>
                <Text style={[styles.filterChipText, typeFilter === item.value && styles.filterChipTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filtered}
            scrollEnabled={false}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <View style={styles.itemCard}>
                <View style={[styles.typeDot, { backgroundColor: movementColors[item.movement_type] || '#64748b' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{item.product_name}</Text>
                  <Text style={styles.itemSub}>SKU: {item.product_sku} - Qte: {item.quantity}</Text>
                  <Text style={styles.itemSub}>Ref: {item.reference || '-'} - {item.responsible_name || '-'}</Text>
                </View>
                <Text style={[styles.badge, { color: movementColors[item.movement_type] || '#94a3b8' }]}>{item.movement_type_display || item.movement_type}</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>Aucun mouvement</Text>}
          />
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nouveau mouvement</Text>

            <View style={styles.pickerWrap}>
              <Picker selectedValue={formData.movement_type} onValueChange={(value) => setFormData((prev) => ({ ...prev, movement_type: value }))} style={{ color: '#fff' }}>
                <Picker.Item label="Entree" value="entry" />
                <Picker.Item label="Sortie" value="exit" />
                <Picker.Item label="Transfert" value="transfer" />
              </Picker>
            </View>

            <View style={styles.pickerWrap}>
              <Picker selectedValue={formData.product_id} onValueChange={(value) => setFormData((prev) => ({ ...prev, product_id: value }))} style={{ color: '#fff' }}>
                <Picker.Item label="Produit" value={null} />
                {products.map((product) => <Picker.Item key={product.id} label={`${product.name} (${product.sku})`} value={product.id} />)}
              </Picker>
            </View>

            <TextInput style={styles.input} value={formData.quantity} onChangeText={(value) => setFormData((prev) => ({ ...prev, quantity: value }))} placeholder="Quantite" placeholderTextColor="#64748b" keyboardType="numeric" />

            <View style={styles.pickerWrap}>
              <Picker selectedValue={formData.warehouse_from_id} onValueChange={(value) => setFormData((prev) => ({ ...prev, warehouse_from_id: value }))} style={{ color: '#fff' }}>
                <Picker.Item label="Entrepot source" value={null} />
                {warehouses.map((warehouse) => <Picker.Item key={warehouse.id} label={warehouse.name} value={warehouse.id} />)}
              </Picker>
            </View>

            <View style={styles.pickerWrap}>
              <Picker selectedValue={formData.warehouse_to_id} onValueChange={(value) => setFormData((prev) => ({ ...prev, warehouse_to_id: value }))} style={{ color: '#fff' }}>
                <Picker.Item label="Entrepot destination" value={null} />
                {warehouses.map((warehouse) => <Picker.Item key={warehouse.id} label={warehouse.name} value={warehouse.id} />)}
              </Picker>
            </View>

            <TextInput style={styles.input} value={formData.reference} onChangeText={(value) => setFormData((prev) => ({ ...prev, reference: value }))} placeholder="Reference" placeholderTextColor="#64748b" />
            <TextInput style={[styles.input, { height: 70 }]} value={formData.notes} onChangeText={(value) => setFormData((prev) => ({ ...prev, notes: value }))} placeholder="Notes" placeholderTextColor="#64748b" multiline />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveMovement}>
                <Text style={styles.saveBtnText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: { flex: 1, paddingHorizontal: 14 },
  headerRow: { paddingHorizontal: 14, paddingTop: 46, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#fff', fontSize: 28, fontWeight: '800' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#3b82f6', borderRadius: 9, paddingHorizontal: 12, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  statCard: { width: '48%', backgroundColor: 'rgba(30,41,59,0.5)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.18)', borderRadius: 12, padding: 12, alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 20, fontWeight: '800' },
  statLabel: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.75)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.25)', borderRadius: 10, paddingHorizontal: 10, marginBottom: 10 },
  searchInput: { flex: 1, color: '#fff', paddingVertical: 11, paddingHorizontal: 8 },
  filterChip: { borderWidth: 1, borderColor: 'rgba(148,163,184,0.35)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  filterChipActive: { backgroundColor: 'rgba(59,130,246,0.22)', borderColor: '#3b82f6' },
  filterChipText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  filterChipTextActive: { color: '#dbeafe' },
  itemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30,41,59,0.5)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.15)', borderRadius: 12, padding: 12, marginBottom: 10, gap: 10 },
  typeDot: { width: 10, height: 10, borderRadius: 5 },
  itemTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  itemSub: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  badge: { fontSize: 12, fontWeight: '700' },
  emptyText: { color: '#64748b', textAlign: 'center', marginTop: 34 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.8)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#0f172a', borderTopLeftRadius: 16, borderTopRightRadius: 16, borderWidth: 1, borderColor: 'rgba(59,130,246,0.25)', padding: 14, gap: 10 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  input: { borderWidth: 1, borderColor: 'rgba(59,130,246,0.25)', backgroundColor: 'rgba(15,23,42,0.75)', borderRadius: 10, color: '#fff', paddingHorizontal: 12, paddingVertical: 10 },
  pickerWrap: { borderWidth: 1, borderColor: 'rgba(59,130,246,0.25)', borderRadius: 10, backgroundColor: 'rgba(15,23,42,0.75)', overflow: 'hidden' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6, marginBottom: Platform.OS === 'ios' ? 20 : 8 },
  cancelBtn: { borderWidth: 1, borderColor: 'rgba(148,163,184,0.35)', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
  cancelBtnText: { color: '#94a3b8', fontWeight: '700' },
  saveBtn: { backgroundColor: '#3b82f6', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
  saveBtnText: { color: '#fff', fontWeight: '700' },
});

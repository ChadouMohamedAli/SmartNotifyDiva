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

const emptyForm = {
  id: null,
  name: '',
  sku: '',
  category: null,
  status: 'optimal',
  quantity: '0',
  min_quantity: '0',
  max_quantity: '0',
  price: '0',
  supplier: null,
  warehouse: null,
};

const moduleCards = [
  { title: 'Mouvements', icon: 'swap-horiz', route: 'StockMovements' },
  { title: 'Categories', icon: 'category', route: 'Categories' },
  { title: 'Fournisseurs', icon: 'business', route: 'Fournisseurs' },
  { title: 'Entrepots', icon: 'warehouse', route: 'Entrepots' },
  { title: 'Facturation', icon: 'receipt-long', route: 'Facturation' },
];

export default function StockScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productList, categoryList, supplierList, warehouseList] = await Promise.all([
        mobileCrudApi.getList('stock/products/'),
        mobileCrudApi.getList('categories/'),
        mobileCrudApi.getList('fournisseurs/'),
        mobileCrudApi.getList('entrepots/'),
      ]);
      setProducts(productList);
      setCategories(categoryList);
      setSuppliers(supplierList);
      setWarehouses(warehouseList);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les donnees stock');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const fields = [item.name, item.sku, item.category_name, item.supplier_name].map((v) => String(v || '').toLowerCase());
      const matchesSearch = !q || fields.some((v) => v.includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [products, search, statusFilter]);

  const stats = useMemo(() => ({
    total: products.length,
    optimal: products.filter((p) => p.status === 'optimal').length,
    low: products.filter((p) => p.status === 'low').length,
    rupture: products.filter((p) => p.status === 'out_of_stock' || p.status === 'rupture').length,
  }), [products]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const openCreate = () => {
    setFormData(emptyForm);
    setModalVisible(true);
  };

  const openEdit = (item) => {
    setFormData({
      id: item.id,
      name: item.name || '',
      sku: item.sku || '',
      category: item.category || null,
      status: item.status || 'optimal',
      quantity: String(item.quantity || 0),
      min_quantity: String(item.min_quantity || 0),
      max_quantity: String(item.max_quantity || 0),
      price: String(item.price || 0),
      supplier: item.supplier || null,
      warehouse: item.warehouse || null,
    });
    setModalVisible(true);
  };

  const saveProduct = async () => {
    if (!formData.name.trim() || !formData.sku.trim()) {
      Alert.alert('Validation', 'Nom et SKU sont requis');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      sku: formData.sku.trim(),
      category: formData.category,
      status: formData.status,
      quantity: Number(formData.quantity || 0),
      min_quantity: Number(formData.min_quantity || 0),
      max_quantity: Number(formData.max_quantity || 0),
      price: Number(formData.price || 0),
      supplier: formData.supplier,
      warehouse: formData.warehouse,
    };

    try {
      if (formData.id) {
        await mobileCrudApi.update('stock/products', formData.id, payload);
      } else {
        await mobileCrudApi.create('stock/products/', payload);
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d enregistrer le produit');
    }
  };

  const removeProduct = (item) => {
    Alert.alert('Confirmation', `Supprimer ${item.name} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await mobileCrudApi.remove('stock/products', item.id);
            fetchData();
          } catch (error) {
            Alert.alert('Erreur', 'Suppression impossible');
          }
        },
      },
    ]);
  };

  const statusColor = (status) => {
    if (status === 'optimal') return '#10b981';
    if (status === 'low') return '#f59e0b';
    return '#ef4444';
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Stock</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <MaterialIcons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Produit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}><Text style={styles.statValue}>{stats.total}</Text><Text style={styles.statLabel}>Total</Text></View>
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10b981' }]}>{stats.optimal}</Text><Text style={styles.statLabel}>Optimal</Text></View>
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#f59e0b' }]}>{stats.low}</Text><Text style={styles.statLabel}>Stock bas</Text></View>
            <View style={styles.statCard}><Text style={[styles.statValue, { color: '#ef4444' }]}>{stats.rupture}</Text><Text style={styles.statLabel}>Rupture</Text></View>
          </View>
        </ScrollView>

        <Text style={styles.sectionTitle}>Modules stock et facturation</Text>
        <View style={styles.modulesGrid}>
          {moduleCards.map((item) => (
            <TouchableOpacity key={item.route} style={styles.moduleCard} onPress={() => navigation.navigate(item.route)}>
              <MaterialIcons name={item.icon} size={22} color="#60a5fa" />
              <Text style={styles.moduleLabel}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.searchWrap}>
          <MaterialIcons name="search" size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher produit, SKU"
            placeholderTextColor="#64748b"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { value: 'all', label: 'Tous' },
              { value: 'optimal', label: 'Optimal' },
              { value: 'low', label: 'Stock bas' },
              { value: 'out_of_stock', label: 'Out' },
              { value: 'rupture', label: 'Rupture' },
            ].map((item) => (
              <TouchableOpacity
                key={item.value}
                onPress={() => setStatusFilter(item.value)}
                style={[styles.filterChip, statusFilter === item.value && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, statusFilter === item.value && styles.filterChipTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filteredProducts}
            scrollEnabled={false}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <View style={styles.itemCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{item.name}</Text>
                  <Text style={styles.itemSub}>SKU: {item.sku} - {item.category_name || '-'}</Text>
                  <Text style={styles.itemSub}>Qte: {item.quantity} - Prix: {Number(item.price || 0).toFixed(2)}</Text>
                  <Text style={[styles.badge, { color: statusColor(item.status) }]}>{item.status}</Text>
                </View>
                <View style={styles.actionsCol}>
                  <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconBtn}>
                    <MaterialIcons name="edit" size={18} color="#3b82f6" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeProduct(item)} style={styles.iconBtn}>
                    <MaterialIcons name="delete" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>Aucun produit</Text>}
          />
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalCard}>
            <Text style={styles.modalTitle}>{formData.id ? 'Modifier produit' : 'Nouveau produit'}</Text>
            <TextInput style={styles.input} value={formData.name} onChangeText={(value) => setFormData((prev) => ({ ...prev, name: value }))} placeholder="Nom" placeholderTextColor="#64748b" />
            <TextInput style={styles.input} value={formData.sku} onChangeText={(value) => setFormData((prev) => ({ ...prev, sku: value }))} placeholder="SKU" placeholderTextColor="#64748b" />

            <View style={styles.pickerWrap}>
              <Picker selectedValue={formData.category} onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))} style={{ color: '#fff' }}>
                <Picker.Item label="Categorie" value={null} />
                {categories.map((category) => <Picker.Item key={category.id} label={category.name} value={category.id} />)}
              </Picker>
            </View>

            <View style={styles.pickerWrap}>
              <Picker selectedValue={formData.supplier} onValueChange={(value) => setFormData((prev) => ({ ...prev, supplier: value }))} style={{ color: '#fff' }}>
                <Picker.Item label="Fournisseur" value={null} />
                {suppliers.map((supplier) => <Picker.Item key={supplier.id} label={supplier.name} value={supplier.id} />)}
              </Picker>
            </View>

            <View style={styles.pickerWrap}>
              <Picker selectedValue={formData.warehouse} onValueChange={(value) => setFormData((prev) => ({ ...prev, warehouse: value }))} style={{ color: '#fff' }}>
                <Picker.Item label="Entrepot" value={null} />
                {warehouses.map((warehouse) => <Picker.Item key={warehouse.id} label={warehouse.name} value={warehouse.id} />)}
              </Picker>
            </View>

            <View style={styles.pickerWrap}>
              <Picker selectedValue={formData.status} onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))} style={{ color: '#fff' }}>
                <Picker.Item label="Optimal" value="optimal" />
                <Picker.Item label="Stock bas" value="low" />
                <Picker.Item label="Out of stock" value="out_of_stock" />
                <Picker.Item label="Rupture" value="rupture" />
              </Picker>
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput style={[styles.input, { flex: 1 }]} value={formData.quantity} onChangeText={(value) => setFormData((prev) => ({ ...prev, quantity: value }))} placeholder="Quantite" placeholderTextColor="#64748b" keyboardType="numeric" />
              <TextInput style={[styles.input, { flex: 1 }]} value={formData.min_quantity} onChangeText={(value) => setFormData((prev) => ({ ...prev, min_quantity: value }))} placeholder="Min" placeholderTextColor="#64748b" keyboardType="numeric" />
              <TextInput style={[styles.input, { flex: 1 }]} value={formData.max_quantity} onChangeText={(value) => setFormData((prev) => ({ ...prev, max_quantity: value }))} placeholder="Max" placeholderTextColor="#64748b" keyboardType="numeric" />
            </View>
            <TextInput style={styles.input} value={formData.price} onChangeText={(value) => setFormData((prev) => ({ ...prev, price: value }))} placeholder="Prix" placeholderTextColor="#64748b" keyboardType="numeric" />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveProduct}>
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
  sectionTitle: { color: '#e2e8f0', fontSize: 14, fontWeight: '700', marginBottom: 8 },
  modulesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  moduleCard: { width: '31%', minWidth: 95, backgroundColor: 'rgba(30,41,59,0.5)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.16)', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center', gap: 6 },
  moduleLabel: { color: '#cbd5e1', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: 8, paddingRight: 10 },
  statCard: { width: 98, backgroundColor: 'rgba(30,41,59,0.5)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.18)', borderRadius: 12, padding: 12, alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 20, fontWeight: '800' },
  statLabel: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.75)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.25)', borderRadius: 10, paddingHorizontal: 10, marginBottom: 10 },
  searchInput: { flex: 1, color: '#fff', paddingVertical: 11, paddingHorizontal: 8 },
  filterChip: { borderWidth: 1, borderColor: 'rgba(148,163,184,0.35)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  filterChipActive: { backgroundColor: 'rgba(59,130,246,0.22)', borderColor: '#3b82f6' },
  filterChipText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  filterChipTextActive: { color: '#dbeafe' },
  itemCard: { flexDirection: 'row', backgroundColor: 'rgba(30,41,59,0.5)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.15)', borderRadius: 12, padding: 12, marginBottom: 10 },
  itemTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  itemSub: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  badge: { marginTop: 8, fontSize: 12, fontWeight: '700' },
  actionsCol: { justifyContent: 'center', gap: 8, marginLeft: 12 },
  iconBtn: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15,23,42,0.7)' },
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

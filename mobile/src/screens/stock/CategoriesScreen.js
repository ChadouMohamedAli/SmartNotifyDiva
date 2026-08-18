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
  Switch,
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
  description: '',
  supplier_id: null,
  is_active: true,
};

export default function CategoriesScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [categoryList, supplierList] = await Promise.all([
        mobileCrudApi.getList('categories/'),
        mobileCrudApi.getList('fournisseurs/'),
      ]);
      setCategories(categoryList);
      setSuppliers(supplierList);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les categories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((item) => {
      const name = String(item?.name || '').toLowerCase();
      const desc = String(item?.description || '').toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [categories, search]);

  const stats = useMemo(() => ({
    total: categories.length,
    active: categories.filter((c) => c?.is_active).length,
    inactive: categories.filter((c) => !c?.is_active).length,
  }), [categories]);

  const openCreate = () => {
    setFormData(emptyForm);
    setModalVisible(true);
  };

  const openEdit = (item) => {
    setFormData({
      id: item.id,
      name: item.name || '',
      description: item.description || '',
      supplier_id: item.supplier?.id || item.supplier_id || null,
      is_active: Boolean(item.is_active),
    });
    setModalVisible(true);
  };

  const saveCategory = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation', 'Le nom est requis');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      supplier_id: formData.supplier_id || null,
      is_active: Boolean(formData.is_active),
    };

    try {
      if (formData.id) {
        await mobileCrudApi.update('categories', formData.id, payload);
      } else {
        await mobileCrudApi.create('categories/', payload);
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d enregistrer la categorie');
    }
  };

  const deleteCategory = (item) => {
    Alert.alert('Confirmation', `Supprimer ${item.name} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await mobileCrudApi.remove('categories', item.id);
            fetchData();
          } catch (error) {
            Alert.alert('Erreur', 'Suppression impossible');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Categories</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <MaterialIcons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />}
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard}><Text style={styles.statValue}>{stats.total}</Text><Text style={styles.statLabel}>Total</Text></View>
          <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10b981' }]}>{stats.active}</Text><Text style={styles.statLabel}>Actives</Text></View>
          <View style={styles.statCard}><Text style={[styles.statValue, { color: '#ef4444' }]}>{stats.inactive}</Text><Text style={styles.statLabel}>Inactives</Text></View>
        </View>

        <View style={styles.searchWrap}>
          <MaterialIcons name="search" size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher une categorie"
            placeholderTextColor="#64748b"
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filtered}
            scrollEnabled={false}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <View style={styles.itemCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{item.name}</Text>
                  <Text style={styles.itemSub}>{item.description || 'Aucune description'}</Text>
                  <Text style={[styles.badge, { color: item.is_active ? '#10b981' : '#ef4444' }]}>
                    {item.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
                <View style={styles.actionsCol}>
                  <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconBtn}>
                    <MaterialIcons name="edit" size={18} color="#3b82f6" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteCategory(item)} style={styles.iconBtn}>
                    <MaterialIcons name="delete" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>Aucune categorie</Text>}
          />
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalCard}>
            <Text style={styles.modalTitle}>{formData.id ? 'Modifier categorie' : 'Nouvelle categorie'}</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(value) => setFormData((prev) => ({ ...prev, name: value }))}
              placeholder="Nom"
              placeholderTextColor="#64748b"
            />
            <TextInput
              style={[styles.input, { height: 80 }]}
              value={formData.description}
              onChangeText={(value) => setFormData((prev) => ({ ...prev, description: value }))}
              placeholder="Description"
              placeholderTextColor="#64748b"
              multiline
            />
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={formData.supplier_id}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, supplier_id: value }))}
                dropdownIconColor="#94a3b8"
                style={{ color: '#fff' }}
              >
                <Picker.Item label="Aucun fournisseur" value={null} />
                {suppliers.map((supplier) => (
                  <Picker.Item key={supplier.id} label={supplier.name} value={supplier.id} />
                ))}
              </Picker>
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Categorie active</Text>
              <Switch
                value={formData.is_active}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, is_active: value }))}
                thumbColor={formData.is_active ? '#10b981' : '#64748b'}
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveCategory}>
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
  headerRow: {
    paddingHorizontal: 14,
    paddingTop: 46,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { color: '#fff', fontSize: 28, fontWeight: '800' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#3b82f6', borderRadius: 9, paddingHorizontal: 12, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(30,41,59,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.18)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: { color: '#fff', fontSize: 20, fontWeight: '800' },
  statLabel: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  searchInput: { flex: 1, color: '#fff', paddingVertical: 11, paddingHorizontal: 8 },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30,41,59,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  itemTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  itemSub: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  badge: { marginTop: 8, fontSize: 12, fontWeight: '700' },
  actionsCol: { justifyContent: 'center', gap: 8, marginLeft: 12 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.7)',
  },
  emptyText: { color: '#64748b', textAlign: 'center', marginTop: 34 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.8)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
    padding: 14,
    gap: 10,
  },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
    backgroundColor: 'rgba(15,23,42,0.75)',
    borderRadius: 10,
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
    borderRadius: 10,
    backgroundColor: 'rgba(15,23,42,0.75)',
    overflow: 'hidden',
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel: { color: '#cbd5e1', fontSize: 14, fontWeight: '600' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6, marginBottom: Platform.OS === 'ios' ? 20 : 8 },
  cancelBtn: { borderWidth: 1, borderColor: 'rgba(148,163,184,0.35)', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
  cancelBtnText: { color: '#94a3b8', fontWeight: '700' },
  saveBtn: { backgroundColor: '#3b82f6', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
  saveBtnText: { color: '#fff', fontWeight: '700' },
});

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

const defaultInvoice = () => ({
  id: null,
  invoice_number: `INV-${Date.now()}`,
  purchase_order_number: '',
  invoice_type: 'sales',
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  customer_address: '',
  supplier: null,
  category: null,
  currency: 'EUR',
  supplier_departure_date: '',
  invoice_date: new Date().toISOString().slice(0, 10),
  due_date: '',
  subtotal: '0',
  tax_rate: '20',
  discount: '0',
  status: 'draft',
  notes: '',
  terms: '',
});

const statusColors = {
  draft: '#64748b',
  sent: '#3b82f6',
  paid: '#10b981',
  overdue: '#ef4444',
  cancelled: '#f59e0b',
};

export default function FacturationScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState(defaultInvoice());
  const [modalVisible, setModalVisible] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invoiceList, supplierList, categoryList] = await Promise.all([
        mobileCrudApi.getList('facturation/invoices/'),
        mobileCrudApi.getList('fournisseurs/'),
        mobileCrudApi.getList('categories/'),
      ]);
      setInvoices(invoiceList);
      setSuppliers(supplierList);
      setCategories(categoryList);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger la facturation');
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
    if (!q) return invoices;
    return invoices.filter((item) => {
      const fields = [
        item.invoice_number,
        item.customer_name,
        item.supplier_name,
        item.status,
      ].map((v) => String(v || '').toLowerCase());
      return fields.some((v) => v.includes(q));
    });
  }, [invoices, search]);

  const stats = useMemo(() => {
    const total = invoices.length;
    const paid = invoices.filter((i) => i.status === 'paid').length;
    const overdue = invoices.filter((i) => i.status === 'overdue').length;
    const totalAmount = invoices.reduce((sum, item) => sum + Number(item.total_amount || 0), 0);
    return { total, paid, overdue, totalAmount };
  }, [invoices]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const openCreate = () => {
    setFormData(defaultInvoice());
    setModalVisible(true);
  };

  const openEdit = (item) => {
    setFormData({
      id: item.id,
      invoice_number: item.invoice_number || '',
      purchase_order_number: item.purchase_order_number || '',
      invoice_type: item.invoice_type || 'sales',
      customer_name: item.customer_name || '',
      customer_email: item.customer_email || '',
      customer_phone: item.customer_phone || '',
      customer_address: item.customer_address || '',
      supplier: item.supplier || null,
      category: item.category || null,
      currency: item.currency || 'EUR',
      supplier_departure_date: item.supplier_departure_date || '',
      invoice_date: item.invoice_date || new Date().toISOString().slice(0, 10),
      due_date: item.due_date || '',
      subtotal: String(item.subtotal || '0'),
      tax_rate: String(item.tax_rate || '20'),
      discount: String(item.discount || '0'),
      status: item.status || 'draft',
      notes: item.notes || '',
      terms: item.terms || '',
    });
    setModalVisible(true);
  };

  const saveInvoice = async () => {
    if (!formData.invoice_number || !formData.customer_name) {
      Alert.alert('Validation', 'Numero et client sont requis');
      return;
    }

    const payload = {
      invoice_number: formData.invoice_number,
      purchase_order_number: formData.purchase_order_number,
      invoice_type: formData.invoice_type,
      customer_name: formData.customer_name,
      customer_email: formData.customer_email,
      customer_phone: formData.customer_phone,
      customer_address: formData.customer_address,
      supplier: formData.supplier,
      category: formData.category,
      currency: formData.currency,
      supplier_departure_date: formData.supplier_departure_date || null,
      invoice_date: formData.invoice_date,
      due_date: formData.due_date,
      subtotal: Number(formData.subtotal || 0),
      tax_rate: Number(formData.tax_rate || 0),
      discount: Number(formData.discount || 0),
      status: formData.status,
      notes: formData.notes,
      terms: formData.terms,
      items: [],
    };

    try {
      if (formData.id) {
        await mobileCrudApi.update('facturation/invoices', formData.id, payload);
      } else {
        await mobileCrudApi.create('facturation/invoices/', payload);
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d enregistrer la facture');
    }
  };

  const removeInvoice = (item) => {
    Alert.alert('Confirmation', `Supprimer ${item.invoice_number} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await mobileCrudApi.remove('facturation/invoices', item.id);
            fetchData();
          } catch (error) {
            Alert.alert('Erreur', 'Suppression impossible');
          }
        },
      },
    ]);
  };

  const taxAmount = Number(formData.subtotal || 0) * (Number(formData.tax_rate || 0) / 100);
  const finalTotal = Number(formData.subtotal || 0) + taxAmount - Number(formData.discount || 0);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Facturation</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <MaterialIcons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Nouvelle</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}><Text style={styles.statValue}>{stats.total}</Text><Text style={styles.statLabel}>Factures</Text></View>
          <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10b981' }]}>{stats.paid}</Text><Text style={styles.statLabel}>Payees</Text></View>
          <View style={styles.statCard}><Text style={[styles.statValue, { color: '#ef4444' }]}>{stats.overdue}</Text><Text style={styles.statLabel}>Retard</Text></View>
          <View style={styles.statCard}><Text style={[styles.statValue, { color: '#8b5cf6' }]}>{stats.totalAmount.toFixed(0)}</Text><Text style={styles.statLabel}>Total</Text></View>
        </View>

        <View style={styles.searchWrap}>
          <MaterialIcons name="search" size={20} color="#64748b" />
          <TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder="Rechercher facture" placeholderTextColor="#64748b" />
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
                  <Text style={styles.itemTitle}>{item.invoice_number}</Text>
                  <Text style={styles.itemSub}>{item.customer_name} - {item.supplier_name || '-'}</Text>
                  <Text style={styles.itemSub}>Total: {Number(item.total_amount || 0).toFixed(2)} {item.currency || 'EUR'}</Text>
                  <Text style={[styles.badge, { color: statusColors[item.status] || '#94a3b8' }]}>{item.status}</Text>
                </View>
                <View style={styles.actionsCol}>
                  <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconBtn}>
                    <MaterialIcons name="edit" size={18} color="#3b82f6" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeInvoice(item)} style={styles.iconBtn}>
                    <MaterialIcons name="delete" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>Aucune facture</Text>}
          />
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalCard}>
            <Text style={styles.modalTitle}>{formData.id ? 'Modifier facture' : 'Nouvelle facture'}</Text>

            <TextInput style={styles.input} value={formData.invoice_number} onChangeText={(value) => setFormData((prev) => ({ ...prev, invoice_number: value }))} placeholder="Numero facture" placeholderTextColor="#64748b" />
            <TextInput style={styles.input} value={formData.customer_name} onChangeText={(value) => setFormData((prev) => ({ ...prev, customer_name: value }))} placeholder="Client" placeholderTextColor="#64748b" />

            <View style={styles.pickerWrap}>
              <Picker selectedValue={formData.invoice_type} onValueChange={(value) => setFormData((prev) => ({ ...prev, invoice_type: value }))} style={{ color: '#fff' }}>
                <Picker.Item label="Vente" value="sales" />
                <Picker.Item label="Achat" value="purchase" />
              </Picker>
            </View>

            <View style={styles.pickerWrap}>
              <Picker selectedValue={formData.supplier} onValueChange={(value) => setFormData((prev) => ({ ...prev, supplier: value }))} style={{ color: '#fff' }}>
                <Picker.Item label="Fournisseur" value={null} />
                {suppliers.map((supplier) => <Picker.Item key={supplier.id} label={supplier.name} value={supplier.id} />)}
              </Picker>
            </View>

            <View style={styles.pickerWrap}>
              <Picker selectedValue={formData.category} onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))} style={{ color: '#fff' }}>
                <Picker.Item label="Categorie" value={null} />
                {categories.map((category) => <Picker.Item key={category.id} label={category.name} value={category.id} />)}
              </Picker>
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput style={[styles.input, { flex: 1 }]} value={formData.invoice_date} onChangeText={(value) => setFormData((prev) => ({ ...prev, invoice_date: value }))} placeholder="Date facture YYYY-MM-DD" placeholderTextColor="#64748b" />
              <TextInput style={[styles.input, { flex: 1 }]} value={formData.due_date} onChangeText={(value) => setFormData((prev) => ({ ...prev, due_date: value }))} placeholder="Date echeance YYYY-MM-DD" placeholderTextColor="#64748b" />
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput style={[styles.input, { flex: 1 }]} value={formData.subtotal} onChangeText={(value) => setFormData((prev) => ({ ...prev, subtotal: value }))} placeholder="Sous total" placeholderTextColor="#64748b" keyboardType="numeric" />
              <TextInput style={[styles.input, { flex: 1 }]} value={formData.tax_rate} onChangeText={(value) => setFormData((prev) => ({ ...prev, tax_rate: value }))} placeholder="Taxe %" placeholderTextColor="#64748b" keyboardType="numeric" />
              <TextInput style={[styles.input, { flex: 1 }]} value={formData.discount} onChangeText={(value) => setFormData((prev) => ({ ...prev, discount: value }))} placeholder="Remise" placeholderTextColor="#64748b" keyboardType="numeric" />
            </View>

            <View style={styles.pickerWrap}>
              <Picker selectedValue={formData.status} onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))} style={{ color: '#fff' }}>
                <Picker.Item label="Brouillon" value="draft" />
                <Picker.Item label="Envoyee" value="sent" />
                <Picker.Item label="Payee" value="paid" />
                <Picker.Item label="En retard" value="overdue" />
                <Picker.Item label="Annulee" value="cancelled" />
              </Picker>
            </View>

            <Text style={styles.totalText}>Total calcule: {finalTotal.toFixed(2)} {formData.currency}</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveInvoice}>
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
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.75)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.25)', borderRadius: 10, paddingHorizontal: 10, marginBottom: 12 },
  searchInput: { flex: 1, color: '#fff', paddingVertical: 11, paddingHorizontal: 8 },
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
  totalText: { color: '#cbd5e1', fontSize: 14, fontWeight: '700', textAlign: 'right', marginTop: 4 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6, marginBottom: Platform.OS === 'ios' ? 20 : 8 },
  cancelBtn: { borderWidth: 1, borderColor: 'rgba(148,163,184,0.35)', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
  cancelBtnText: { color: '#94a3b8', fontWeight: '700' },
  saveBtn: { backgroundColor: '#3b82f6', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
  saveBtnText: { color: '#fff', fontWeight: '700' },
});

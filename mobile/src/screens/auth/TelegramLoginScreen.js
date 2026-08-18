import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

export default function TelegramLoginScreen({ navigation }) {
  const { setToken, setUser } = useAuth();
  const [step, setStep] = useState(1);
  const [sessionCode, setSessionCode] = useState('');
  const [botUrl, setBotUrl] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try {
      const base = API_BASE_URL.replace(/\/+$/, '');
      const response = await axios.post(`${base}/auth/telegram-send-code/`, {}, { timeout: 8000 });
      const { session_code, bot_url } = response.data;
      setSessionCode(session_code);
      setBotUrl(bot_url);
      setStep(2);
      await Linking.openURL(bot_url);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      Alert.alert('Code invalide', 'Le code doit contenir 6 chiffres.');
      return;
    }
    setLoading(true);
    try {
      const base = API_BASE_URL.replace(/\/+$/, '');
      const response = await axios.post(
        `${base}/auth/telegram-verify-otp/`,
        { session_code: sessionCode, otp },
        { timeout: 8000 },
      );
      const { token: accessToken, refresh_token: refreshToken, user: userData } = response.data;
      await AsyncStorage.setItem('access_token', accessToken);
      await AsyncStorage.setItem('refresh_token', refreshToken || '');
      setToken(accessToken);
      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      Alert.alert('Succes', 'Connexion Telegram reussie !');
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (e) {
      const msg = e.response?.data?.error || 'Code incorrect ou expire.';
      Alert.alert('Erreur', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={22} color="#e2e8f0" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Telegram</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <MaterialIcons name="send" size={56} color="#2AABEE" style={styles.icon} />
        <Text style={styles.title}>Connexion via Telegram</Text>

        {step === 1 ? (
          <>
            <Text style={styles.desc}>
              Appuyez sur le bouton ci-dessous.{'\n'}
              Le bot vous enverra un code a 6 chiffres.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleStart} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="send" size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>Ouvrir le bot et obtenir un code</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.desc}>
              Le bot @ERP_notif_Bot vous a envoye un code.{'\n'}
              Entrez-le ci-dessous.
            </Text>
            <TouchableOpacity style={styles.reopenBtn} onPress={() => Linking.openURL(botUrl)}>
              <MaterialIcons name="open-in-new" size={16} color="#2AABEE" />
              <Text style={styles.reopenBtnText}>Rouvrir le bot</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.otpInput}
              value={otp}
              onChangeText={setOtp}
              placeholder="000000"
              placeholderTextColor="#475569"
              keyboardType="number-pad"
              maxLength={6}
              textAlign="center"
            />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleVerify} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Valider le code</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setStep(1); setOtp(''); }}>
              <Text style={styles.backLink}>Recommencer</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  headerRow: {
    paddingTop: 8, paddingHorizontal: 16, paddingBottom: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(148,163,184,0.12)',
  },
  headerTitle: { color: '#e2e8f0', fontSize: 18, fontWeight: '700' },
  content: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 28, gap: 16,
  },
  icon: { marginBottom: 8 },
  title: { color: '#e2e8f0', fontSize: 22, fontWeight: '700', textAlign: 'center' },
  desc: { color: '#94a3b8', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#2563eb', borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 24, width: '100%', marginTop: 8,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  reopenBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reopenBtnText: { color: '#2AABEE', fontSize: 13, fontWeight: '600' },
  otpInput: {
    width: '60%', backgroundColor: '#1e293b',
    borderWidth: 1, borderColor: '#334155', borderRadius: 12,
    color: '#e2e8f0', fontSize: 28, fontWeight: '700',
    letterSpacing: 12, paddingVertical: 14, paddingHorizontal: 16,
  },
  backLink: { color: '#64748b', fontSize: 13, marginTop: 8 },
});

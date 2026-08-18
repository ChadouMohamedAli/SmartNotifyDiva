import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert, Image
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { withApi } from '../../config/api';
const notifLogo = require('../../../assets/notif.png');

export default function ResetPasswordScreen({ route, navigation }) {
    // We expect uid and token to be passed via navigation params from a deep link
    const { uid, token } = route.params || { uid: null, token: null };
    const [newPassword, setNewPassword] = useState('');
    const [newPassword2, setNewPassword2] = useState('');
    const [loading, setLoading] = useState(false);

    const handleReset = async () => {
        if (!newPassword || !newPassword2) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs');
            return;
        }

        if (newPassword !== newPassword2) {
            Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
            return;
        }

        if (!uid || !token) {
            Alert.alert('Erreur', 'Lien invalide manquant les paramètres (uid/token).');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(withApi('auth/password-reset-confirm/'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    uid,
                    token,
                    new_password: newPassword,
                    new_password2: newPassword2,
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data?.error || 'Lien invalide ou expiré');
            }

            Alert.alert('Succès', 'Mot de passe réinitialisé avec succès. Vous pouvez vous connecter.', [
                { text: 'OK', onPress: () => navigation.navigate('Login') }
            ]);

        } catch (error) {
            Alert.alert('Erreur', error.message || 'Une erreur est survenue.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.formContainer}>
                    <View style={styles.logoContainer}>
                        <Image source={notifLogo} style={{ width: 40, height: 40, marginRight: 10 }} resizeMode="contain" />
                        <Text style={styles.brandTitle}>SmartNotify</Text>
                    </View>

                    <Text style={styles.welcomeText}>Réinitialiser le mot de passe</Text>

                    <View style={styles.inputContainer}>
                        <MaterialIcons name="lock" size={20} color="#64748b" style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Nouveau mot de passe"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry
                            placeholderTextColor="#94a3b8"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <MaterialIcons name="lock" size={20} color="#64748b" style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Confirmer le mot de passe"
                            value={newPassword2}
                            onChangeText={setNewPassword2}
                            secureTextEntry
                            placeholderTextColor="#94a3b8"
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.resetButton}
                        onPress={handleReset}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.resetButtonText}>Réinitialiser</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backButton}>
                        <Text style={styles.backButtonText}>Retour à la connexion</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    formContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
    },
    brandTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#3b82f6',
    },
    welcomeText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0a0e27',
        marginBottom: 24,
        textAlign: 'center'
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 20,
        height: 50,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: '#1e293b',
        fontSize: 16,
    },
    resetButton: {
        backgroundColor: '#3b82f6',
        borderRadius: 8,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    resetButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    backButton: {
        alignItems: 'center',
    },
    backButtonText: {
        color: '#3b82f6',
        fontSize: 14,
        fontWeight: 'bold'
    },
});

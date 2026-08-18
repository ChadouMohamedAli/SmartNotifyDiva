import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert, Image
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { withApi } from '../../config/api';
const notifLogo = require('../../../assets/notif.png');

export default function ForgotPasswordScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleReset = async () => {
        if (!email) {
            Alert.alert('Erreur', 'Veuillez saisir votre adresse email');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(withApi('auth/password-reset/'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data?.error || 'Erreur lors de l\'envoi du lien');
            }

            Alert.alert('Succès', 'Un lien de réinitialisation a été envoyé à votre adresse email.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert('Erreur', error.message || 'Une erreur est survenue. Veuillez réessayer.');
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
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <MaterialIcons name="arrow-back" size={24} color="#64748b" />
                        <Text style={styles.backButtonText}>Retour à la connexion</Text>
                    </TouchableOpacity>

                    <View style={styles.logoContainer}>
                        <Image source={notifLogo} style={{ width: 40, height: 40, marginRight: 10 }} resizeMode="contain" />
                        <Text style={styles.brandTitle}>SmartNotify</Text>
                    </View>

                    <Text style={styles.welcomeText}>Réinitialiser votre mot de passe</Text>
                    <Text style={styles.instructionText}>Entrez votre email pour recevoir les instructions de réinitialisation</Text>

                    <View style={styles.inputContainer}>
                        <MaterialIcons name="email" size={20} color="#64748b" style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            placeholder="votre@email.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholderTextColor="#94a3b8"
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.resetButton}
                        onPress={handleReset}
                        disabled={loading || !email}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.resetButtonText}>Envoyer le lien</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0e27',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    formContainer: {
        backgroundColor: '#0d1117',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#30363d',
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },
    backButtonText: {
        color: '#64748b',
        marginLeft: 8,
        fontSize: 16,
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
        color: '#60a5fa',
    },
    welcomeText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#e2e8f0',
        marginBottom: 8,
        textAlign: 'center'
    },
    instructionText: {
        color: '#94a3b8',
        marginBottom: 24,
        textAlign: 'center',
        fontSize: 14,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#161b22',
        borderWidth: 1,
        borderColor: '#30363d',
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
        color: '#e2e8f0',
        fontSize: 16,
    },
    resetButton: {
        backgroundColor: '#3b82f6',
        borderRadius: 8,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    resetButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

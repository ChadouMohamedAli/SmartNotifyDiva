import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function ChangePasswordScreen({ navigation }) {
    const { changePassword } = useAuth();
    const [loading, setLoading] = useState(false);

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPassword2, setNewPassword2] = useState('');

    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showNewPassword2, setShowNewPassword2] = useState(false);

    const handleSubmit = async () => {
        if (!oldPassword || !newPassword || !newPassword2) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs');
            return;
        }

        if (newPassword !== newPassword2) {
            Alert.alert('Erreur', 'Les nouveaux mots de passe ne correspondent pas');
            return;
        }

        setLoading(true);
        try {
            const result = await changePassword(oldPassword, newPassword, newPassword2);
            if (!result.success) {
                Alert.alert('Erreur', result.error || 'Erreur lors du changement de mot de passe');
                return;
            }

            Alert.alert('Succès', 'Mot de passe changé avec succès', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (err) {
            Alert.alert('Erreur', err.message || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    const PasswordInput = ({ label, value, onChangeText, showPassword, setShowPassword }) => (
        <View style={{ marginBottom: 16 }}>
            <Text style={styles.inputLabel}>
                <MaterialIcons name="lock" size={16} color="#3b82f6" style={{ marginRight: 5 }} /> {label}
            </Text>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={!showPassword}
                    placeholderTextColor="#94a3b8"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <MaterialIcons name={showPassword ? "visibility-off" : "visibility"} size={20} color="#64748b" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <MaterialIcons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.pageTitle}>Sécurité</Text>
                    <View style={{ width: 24 }} />
                </View>

                <View style={styles.formContainer}>
                    <Text style={styles.sectionTitle}>
                        Changer le mot de passe
                    </Text>
                    <Text style={styles.sectionSubtitle}>
                        Assurez-vous de choisir un mot de passe fort et unique.
                    </Text>

                    <PasswordInput
                        label="Mot de passe actuel"
                        value={oldPassword}
                        onChangeText={setOldPassword}
                        showPassword={showOldPassword}
                        setShowPassword={setShowOldPassword}
                    />

                    <PasswordInput
                        label="Nouveau mot de passe"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        showPassword={showNewPassword}
                        setShowPassword={setShowNewPassword}
                    />

                    <PasswordInput
                        label="Confirmer le nouveau mot de passe"
                        value={newPassword2}
                        onChangeText={setNewPassword2}
                        showPassword={showNewPassword2}
                        setShowPassword={setShowNewPassword2}
                    />

                    <View style={styles.divider} />

                    <View style={styles.actionsContainer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} disabled={loading}>
                            <Text style={styles.cancelButtonText}>Annuler</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.saveButton} onPress={handleSubmit} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : (
                                <Text style={styles.saveButtonText}>Mettre à jour</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        paddingTop: 40,
        borderBottomWidth: 1,
        borderBottomColor: '#3b82f620',
    },
    backButton: {
        padding: 5,
    },
    pageTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    formContainer: {
        backgroundColor: '#1e293b80',
        margin: 20,
        borderRadius: 12,
        padding: 24,
        borderWidth: 1,
        borderColor: '#3b82f620',
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    sectionSubtitle: {
        color: '#94a3b8',
        fontSize: 14,
        marginBottom: 24,
    },
    divider: {
        height: 1,
        backgroundColor: '#3b82f620',
        marginVertical: 20,
    },
    inputLabel: {
        color: '#fff',
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '600'
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#00000050',
        borderWidth: 1,
        borderColor: '#3b82f640',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 50,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
    },
    cancelButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3b82f640',
        marginRight: 10,
    },
    cancelButtonText: {
        color: '#94a3b8',
        fontWeight: 'bold',
    },
    saveButton: {
        backgroundColor: '#3b82f6',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 140,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    }
});

import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function EditProfileScreen({ navigation }) {
    const { user, updateProfile } = useAuth();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        username: '',
        phone_number: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                username: user.username || '',
                phone_number: user.phone_number || '',
            });
        }
    }, [user]);

    const handleInputChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const payload = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                username: formData.username,
                phone_number: formData.phone_number,
            };

            await updateProfile(payload);
            Alert.alert('Succès', 'Profil mis à jour avec succès', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (err) {
            Alert.alert('Erreur', err.message || 'Erreur lors de la mise à jour du profil');
        } finally {
            setLoading(false);
        }
    };

    const isAdmin = user?.is_superuser || user?.is_staff;

    const InputField = ({ label, icon, value, onChangeText, ...props }) => (
        <View style={{ marginBottom: 16 }}>
            <Text style={styles.inputLabel}>
                <MaterialIcons name={icon} size={16} color="#3b82f6" style={{ marginRight: 5 }} /> {label}
            </Text>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                    placeholderTextColor="#94a3b8"
                    {...props}
                />
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
                    <Text style={styles.pageTitle}>Modifier le profil</Text>
                    <View style={{ width: 24 }} />
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.avatarSection}>
                        <View style={[styles.avatar, { backgroundColor: isAdmin ? '#ef4444' : '#3b82f6' }]}>
                            <Text style={styles.avatarText}>
                                {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                            </Text>
                        </View>
                        <Text style={styles.avatarSubtext}>Photo de profil (Lecture seule par l'app)</Text>
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>
                        <MaterialIcons name="person" size={20} color="#3b82f6" /> Informations personnelles
                    </Text>

                    <InputField
                        label="Prénom" icon="person" value={formData.first_name}
                        onChangeText={(val) => handleInputChange('first_name', val)}
                    />
                    <InputField
                        label="Nom" icon="person" value={formData.last_name}
                        onChangeText={(val) => handleInputChange('last_name', val)}
                    />

                    {/* ReadOnly Email to prevent issues */}
                    <InputField
                        label="Email" icon="email" value={formData.email}
                        editable={false}
                        style={[styles.input, { color: '#64748b' }]}
                    />

                    <InputField
                        label="Nom d'utilisateur" icon="badge" value={formData.username}
                        onChangeText={(val) => handleInputChange('username', val)}
                    />
                    <InputField
                        label="Téléphone" icon="phone" value={formData.phone_number}
                        onChangeText={(val) => handleInputChange('phone_number', val)}
                        keyboardType="phone-pad"
                    />

                    <View style={styles.divider} />

                    <View style={styles.actionsContainer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} disabled={loading}>
                            <Text style={styles.cancelButtonText}>Annuler</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.saveButton} onPress={handleSubmit} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : (
                                <Text style={styles.saveButtonText}>Enregistrer</Text>
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
        padding: 20,
        borderWidth: 1,
        borderColor: '#3b82f620',
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#3b82f640',
        marginBottom: 10,
    },
    avatarText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#fff',
    },
    avatarSubtext: {
        color: '#94a3b8',
        fontSize: 12,
    },
    divider: {
        height: 1,
        backgroundColor: '#3b82f620',
        marginVertical: 20,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    inputLabel: {
        color: '#fff',
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '600'
    },
    inputContainer: {
        backgroundColor: '#00000050',
        borderWidth: 1,
        borderColor: '#3b82f640',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 50,
        justifyContent: 'center'
    },
    input: {
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
        minWidth: 120,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    }
});

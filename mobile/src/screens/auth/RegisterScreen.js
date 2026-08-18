import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert, Dimensions, Image
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
const notifLogo = require('../../../assets/notif.png');
import { Picker } from '@react-native-picker/picker'; // We need to install this

const { width } = Dimensions.get('window');

export default function RegisterScreen({ navigation }) {
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        role: '',
        phone_number: '',
        password: '',
        password2: '',
        first_name: '',
        last_name: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showPassword2, setShowPassword2] = useState(false);
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();

    const [passwordStrength, setPasswordStrength] = useState({ feedback: '', isValid: true });

    const roleOptions = [
        { value: '', label: 'Sélectionnez votre rôle' },
        { value: 'super_admin', label: 'Super Administrateur' },
        { value: 'responsable_stock', label: 'Responsable Stock' },
        { value: 'responsable_production', label: 'Responsable Production' },
        { value: 'responsable_facturation', label: 'Responsable Facturation' },
        { value: 'responsable_commandes', label: 'Responsable Commandes' },
        { value: 'agent_stock', label: 'Agent Stock' },
        { value: 'agent_production', label: 'Agent Production' },
        { value: 'employe', label: 'Employé' },
    ];

    const handleChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));

        // Simple local password check to give some visual feedback
        if (name === 'password') {
            const isValid = value.length >= 8;
            setPasswordStrength({
                isValid: isValid,
                feedback: isValid ? '✓ Mot de passe acceptable' : 'Manque : 8 caractères minimum'
            })
        }
    };

    const handleRegister = async () => {
        if (!formData.email || !formData.username || !formData.role || !formData.first_name || !formData.last_name || !formData.password || !formData.password2) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
            return;
        }

        if (formData.password !== formData.password2) {
            Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
            return;
        }

        setLoading(true);
        try {
            const result = await register(formData);
            if (!result.success) {
                Alert.alert('Erreur d\'inscription', result.error || 'Échec de l\'inscription');
            } else {
                // Should redirect to a verification pending screen ideally, sending back to login for now
                Alert.alert('Succès', 'Inscription réussie! Veuillez vérifier votre email.', [
                    { text: 'OK', onPress: () => navigation.navigate('Login') }
                ]);
            }
        } catch (error) {
            Alert.alert('Erreur', 'Une erreur est survenue');
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

                {/* Header matching Login styling */}
                <View style={styles.headerContainer}>
                    <Image source={notifLogo} style={{ width: 40, height: 40, marginRight: 8 }} resizeMode="contain" />
                    <Text style={styles.brandTitleBlack}>SmartNotify</Text>
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.blueBar} />
                    <Text style={styles.welcomeText}>Créer un compte</Text>
                    <Text style={styles.instructionText}>Rejoignez SmartNotify et commencez à gérer vos alertes</Text>

                    {/* Email */}
                    <Text style={styles.inputLabel}>Adresse email</Text>
                    <View style={styles.inputContainer}>
                        <MaterialIcons name="email" size={20} color="#9ca3af" style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            placeholder="vous@entreprise.com"
                            value={formData.email}
                            onChangeText={(val) => handleChange('email', val)}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholderTextColor="#9ca3af"
                        />
                    </View>

                    {/* Username */}
                    <Text style={styles.inputLabel}>Nom d'utilisateur</Text>
                    <View style={styles.inputContainer}>
                        <MaterialIcons name="account-circle" size={20} color="#9ca3af" style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            placeholder="nom_entreprise"
                            value={formData.username}
                            onChangeText={(val) => handleChange('username', val)}
                            autoCapitalize="none"
                            placeholderTextColor="#9ca3af"
                        />
                    </View>

                    {/* Noms */}
                    <View style={styles.row}>
                        <View style={[styles.flex1, { marginRight: 8 }]}>
                            <Text style={styles.inputLabel}>Prénom</Text>
                            <View style={styles.inputContainer}>
                                <MaterialIcons name="person" size={20} color="#9ca3af" style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Prénom"
                                    value={formData.first_name}
                                    onChangeText={(val) => handleChange('first_name', val)}
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>
                        </View>
                        <View style={styles.flex1}>
                            <Text style={styles.inputLabel}>Nom</Text>
                            <View style={styles.inputContainer}>
                                <MaterialIcons name="person" size={20} color="#9ca3af" style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nom"
                                    value={formData.last_name}
                                    onChangeText={(val) => handleChange('last_name', val)}
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Role Picker */}
                    <Text style={styles.inputLabel}>Rôle</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={formData.role}
                            onValueChange={(val) => handleChange('role', val)}
                            style={styles.picker}
                        >
                            {roleOptions.map((role) => (
                                <Picker.Item key={role.value} label={role.label} value={role.value} color="#1e293b" />
                            ))}
                        </Picker>
                    </View>

                    {/* Phone */}
                    <Text style={styles.inputLabel}>Numéro de téléphone</Text>
                    <View style={styles.inputContainer}>
                        <MaterialIcons name="phone" size={20} color="#9ca3af" style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Numéro de téléphone"
                            value={formData.phone_number}
                            onChangeText={(val) => handleChange('phone_number', val)}
                            keyboardType="phone-pad"
                            maxLength={8}
                            placeholderTextColor="#9ca3af"
                        />
                    </View>

                    {/* Passwords */}
                    <View style={styles.row}>
                        <View style={[styles.flex1, { marginRight: 8 }]}>
                            <Text style={styles.inputLabel}>Mot de passe</Text>
                            <View style={styles.inputContainer}>
                                <MaterialIcons name="lock" size={20} color="#9ca3af" style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Mot de passe"
                                    value={formData.password}
                                    onChangeText={(val) => handleChange('password', val)}
                                    secureTextEntry={!showPassword}
                                    placeholderTextColor="#9ca3af"
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <MaterialIcons name={showPassword ? "visibility-off" : "visibility"} size={20} color="#9ca3af" />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.flex1}>
                            <Text style={styles.inputLabel}>Confirmer mot de passe</Text>
                            <View style={styles.inputContainer}>
                                <MaterialIcons name="lock" size={20} color="#9ca3af" style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Confirmer"
                                    value={formData.password2}
                                    onChangeText={(val) => handleChange('password2', val)}
                                    secureTextEntry={!showPassword2}
                                    placeholderTextColor="#9ca3af"
                                />
                                <TouchableOpacity onPress={() => setShowPassword2(!showPassword2)}>
                                    <MaterialIcons name={showPassword2 ? "visibility-off" : "visibility"} size={20} color="#9ca3af" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                    {formData.password.length > 0 && (
                        <Text style={{ color: passwordStrength.isValid ? 'green' : 'red', fontSize: 12, marginBottom: 12 }}>
                            {passwordStrength.feedback}
                        </Text>
                    )}

                    <TouchableOpacity
                        style={styles.registerButton}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.registerButtonText}>Créer mon compte</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.loginContainer}>
                        <Text style={styles.loginText}>Déjà un compte ? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.loginLink}>Se connecter</Text>
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
        backgroundColor: '#0a0e27', // Matching dark left side theme for background
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center', // Center the card
        padding: 20,
        paddingVertical: 50,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        width: '100%',
        maxWidth: 450,
        justifyContent: 'center',
    },
    logoPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    brandTitleBlack: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    formContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 480,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    blueBar: {
        width: 60,
        height: 4,
        backgroundColor: '#3b82f6', // Needs gradient ideally, solid for now
        borderRadius: 2,
        marginBottom: 20,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0a0e27',
        marginBottom: 4,
    },
    instructionText: {
        color: '#64748b',
        marginBottom: 20,
        fontSize: 14,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 6,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 6,
        paddingHorizontal: 12,
        marginBottom: 16,
        height: 45,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 6,
        marginBottom: 16,
        height: 45,
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    picker: {
        height: 45,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: '#1e293b',
        fontSize: 15,
    },
    row: {
        flexDirection: 'row',
        width: '100%',
    },
    flex1: {
        flex: 1,
    },
    registerButton: {
        backgroundColor: '#3b82f6',
        borderRadius: 6,
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 16,
    },
    registerButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 8,
    },
    loginText: {
        color: '#64748b',
    },
    loginLink: {
        color: '#3b82f6',
        fontWeight: 'bold',
    },
});

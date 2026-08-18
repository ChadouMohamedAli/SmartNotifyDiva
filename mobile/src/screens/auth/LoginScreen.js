import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    Image,
    useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import notif from '../../../assets/notif.png';

export default function LoginScreen({ navigation }) {
    const { width } = useWindowDimensions();
    const isLargeScreen = width >= 980;

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [emailChecking, setEmailChecking] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const { login, checkEmailExists } = useAuth();
    const emailInputRef = useRef(null);

    useEffect(() => {
        if (emailInputRef.current) {
            emailInputRef.current.focus();
        }
    }, []);

    const validateEmail = (value) => /\S+@\S+\.\S+/.test(value);

    const handleEmailCheck = async () => {
        if (!email || !validateEmail(email)) {
            setEmailError('');
            return;
        }

        setEmailChecking(true);
        try {
            const result = await checkEmailExists(email);
            if (result && result.exists === false) {
                setEmailError('Cet email n\'existe pas.');
            }
        } catch (error) {
            setEmailError('Impossible de verifier l\'email.');
        } finally {
            setEmailChecking(false);
        }
    };

    const handleLogin = async () => {
        setError('');
        setEmailError('');

        if (!email || !password) {
            setError('Veuillez remplir tous les champs');
            return;
        }

        if (!validateEmail(email)) {
            setEmailError('Adresse email invalide');
            return;
        }

        setLoading(true);
        try {
            const result = await login(email, password);
            if (!result.success) {
                const errorMessage = result.error || 'Echec de la connexion';
                if (
                    errorMessage.includes('credentials') ||
                    errorMessage.includes('mot de passe') ||
                    errorMessage.includes('Invalid')
                ) {
                    setError('Email ou mot de passe incorrect');
                } else {
                    setError(errorMessage);
                }
            }
        } catch (error) {
            setError('Une erreur est survenue. Veuillez reessayer.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = () => {
        Alert.alert(
            'Google Sign-In',
            'Ajoute Expo Auth Session pour activer Google Sign-In sur mobile.'
        );
    };

    const handleTelegramSignIn = () => {
        navigation.navigate('TelegramLogin');
    };

    return (
        <View style={styles.page}>
            {isLargeScreen && (
                <View style={styles.heroColumn}>
                    <View style={styles.brandRow}>
                        <Image source={notif} style={styles.logo} resizeMode="contain" />
                        <Text style={styles.brandText}>SmartNotify</Text>
                    </View>

                    <Text style={styles.heroTitle}>ERP Alert System</Text>
                    <Text style={styles.heroSubtitle}>Gerez vos alertes ERP intelligemment</Text>
                    <Text style={styles.heroDescription}>
                        Une plateforme pour configurer, gerer et recevoir des notifications
                        personnalisees sur tous vos modules ERP.
                    </Text>

                    <View style={styles.featuresWrap}>
                        {[
                            {
                                icon: 'notifications-active',
                                title: 'Alertes personnalisees',
                                description: 'Configurez vos propres regles par module ERP.',
                            },
                            {
                                icon: 'flash-on',
                                title: 'Notifications instantanees',
                                description: 'Recevez des alertes en temps reel par email ou in-app.',
                            },
                            {
                                icon: 'bar-chart',
                                title: 'Tableau analytique',
                                description: 'Suivez les indicateurs et optimisez vos processus.',
                            },
                            {
                                icon: 'security',
                                title: 'Securite renforcee',
                                description: 'Vos donnees ERP restent confidentielles et protegees.',
                            },
                        ].map((item) => (
                            <View key={item.title} style={styles.featureCard}>
                                <MaterialIcons name={item.icon} size={20} color="#60a5fa" />
                                <Text style={styles.featureTitle}>{item.title}</Text>
                                <Text style={styles.featureDescription}>{item.description}</Text>
                            </View>
                        ))}
                    </View>

                    <Text style={styles.heroFooter}>© 2026 DIVA Software. Tous droits reserves.</Text>
                </View>
            )}

            <KeyboardAvoidingView
                style={styles.formColumn}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    {!isLargeScreen && (
                        <View style={styles.mobileBrandRow}>
                            <Image source={notif} style={styles.mobileLogo} resizeMode="contain" />
                            <Text style={styles.mobileBrandText}>SmartNotify</Text>
                        </View>
                    )}

                    <View style={styles.formCard}>
                        <View style={styles.titleBar} />
                        <Text style={styles.welcomeText}>Bienvenue</Text>
                        <Text style={styles.instructionText}>Connectez-vous a votre espace</Text>

                        {error ? (
                            <View style={styles.alertBox}>
                                <MaterialIcons name="error-outline" size={18} color="#ef4444" />
                                <Text style={styles.alertText}>{error}</Text>
                            </View>
                        ) : null}

                        <Text style={styles.inputLabel}>Adresse email</Text>
                        <View style={[styles.inputContainer, emailError ? styles.inputError : null]}>
                            <MaterialIcons name="email" size={20} color="#64748b" style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                ref={emailInputRef}
                                placeholder="exemple@entreprise.com"
                                value={email}
                                onChangeText={(value) => {
                                    setEmail(value);
                                    if (value && !validateEmail(value)) {
                                        setEmailError('Format email invalide');
                                    } else {
                                        setEmailError('');
                                    }
                                }}
                                onBlur={handleEmailCheck}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholderTextColor="#94a3b8"
                            />
                            {emailChecking ? <ActivityIndicator size="small" color="#3b82f6" /> : null}
                        </View>
                        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

                        <View style={styles.passwordHeader}>
                            <Text style={styles.inputLabel}>Mot de passe</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                                <Text style={styles.forgotPasswordText}>Mot de passe oublie ?</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                            <MaterialIcons name="lock" size={20} color="#64748b" style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Entrez votre mot de passe"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                placeholderTextColor="#94a3b8"
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <MaterialIcons
                                    name={showPassword ? 'visibility' : 'visibility-off'}
                                    size={20}
                                    color="#64748b"
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.securityHint}>
                            <Text style={styles.securityHintText}>
                                Conseil: utilisez des mots de passe uniques pour chaque service.
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.rememberRow}
                            onPress={() => setRememberMe((v) => !v)}
                            activeOpacity={0.8}
                        >
                            <MaterialIcons
                                name={rememberMe ? 'check-box' : 'check-box-outline-blank'}
                                size={20}
                                color={rememberMe ? '#3b82f6' : '#94a3b8'}
                            />
                            <Text style={styles.rememberText}>Se souvenir de moi pendant 30 jours</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading || emailChecking || !!emailError}>
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <View style={styles.loginTextWrap}>
                                    <Text style={styles.loginButtonText}>Se connecter</Text>
                                    <MaterialIcons name="arrow-forward" size={18} color="#fff" />
                                </View>
                            )}
                        </TouchableOpacity>

                        <View style={styles.dividerRow}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>OU CONTINUER AVEC</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn} disabled={loading}>
                            <MaterialIcons name="g-translate" size={18} color="#0f172a" />
                            <Text style={styles.googleButtonText}>Continuer avec Google</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.telegramButton} onPress={handleTelegramSignIn} disabled={loading}>
                            <MaterialIcons name="send" size={18} color="#fff" />
                            <Text style={styles.telegramButtonText}>Continuer avec Telegram</Text>
                        </TouchableOpacity>

                        <View style={styles.registerContainer}>
                            <Text style={styles.registerText}>Pas encore de compte ? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                <Text style={styles.registerLink}>Creer un compte</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    page: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
    },
    heroColumn: {
        width: '50%',
        backgroundColor: '#0a0e27',
        padding: 24,
        justifyContent: 'center',
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18,
    },
    logo: {
        width: 44,
        height: 44,
        marginRight: 10,
    },
    brandText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    heroTitle: {
        color: '#fff',
        fontSize: 36,
        fontWeight: '800',
        marginBottom: 12,
    },
    heroSubtitle: {
        color: '#94a3b8',
        fontSize: 18,
        marginBottom: 12,
        fontWeight: '600',
    },
    heroDescription: {
        color: '#cbd5e1',
        fontSize: 14,
        lineHeight: 22,
        marginBottom: 20,
    },
    featuresWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    featureCard: {
        width: '48%',
        backgroundColor: 'rgba(30,41,99,0.45)',
        borderWidth: 1,
        borderColor: 'rgba(59,130,246,0.2)',
        borderRadius: 12,
        padding: 12,
    },
    featureTitle: {
        color: '#e2e8f0',
        fontSize: 13,
        marginTop: 8,
        fontWeight: '600',
    },
    featureDescription: {
        color: '#94a3b8',
        fontSize: 11,
        marginTop: 6,
        lineHeight: 16,
    },
    heroFooter: {
        color: '#64748b',
        fontSize: 11,
        marginTop: 18,
        textAlign: 'center',
    },
    formColumn: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    mobileBrandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 22,
    },
    mobileLogo: {
        width: 34,
        height: 34,
        marginRight: 8,
    },
    mobileBrandText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0a0e27',
    },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 4,
        maxWidth: 520,
        width: '100%',
        alignSelf: 'center',
    },
    titleBar: {
        width: 62,
        height: 4,
        borderRadius: 999,
        backgroundColor: '#3b82f6',
        marginBottom: 16,
    },
    welcomeText: {
        fontSize: 30,
        fontWeight: '700',
        color: '#0a0e27',
        marginBottom: 6,
    },
    instructionText: {
        color: '#64748b',
        marginBottom: 20,
        fontSize: 14,
    },
    alertBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fecaca',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 14,
        gap: 8,
    },
    alertText: {
        color: '#b91c1c',
        fontSize: 13,
        flex: 1,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 12,
        marginBottom: 14,
        height: 54,
    },
    inputError: {
        borderColor: '#ef4444',
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: '#1e293b',
        fontSize: 16,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 12,
        marginTop: -6,
        marginBottom: 10,
    },
    passwordHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 2,
        marginBottom: 2,
    },
    forgotPasswordText: {
        color: '#3b82f6',
        fontSize: 12,
        fontWeight: '500',
    },
    securityHint: {
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginBottom: 10,
    },
    securityHintText: {
        color: '#64748b',
        fontSize: 11,
    },
    rememberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
        gap: 8,
    },
    rememberText: {
        color: '#475569',
        fontSize: 13,
        fontWeight: '500',
    },
    loginButton: {
        backgroundColor: '#0a0e27',
        borderRadius: 12,
        height: 54,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 18,
    },
    loginTextWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e2e8f0',
    },
    dividerText: {
        marginHorizontal: 10,
        color: '#64748b',
        fontSize: 11,
        fontWeight: '700',
    },
    googleButton: {
        height: 52,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    googleButtonText: {
        color: '#0f172a',
        fontSize: 15,
        fontWeight: '600',
    },
    telegramButton: {
        marginTop: 10,
        height: 52,
        borderWidth: 1,
        borderColor: '#1d4ed8',
        borderRadius: 12,
        backgroundColor: '#2563eb',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    telegramButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 18,
    },
    registerText: {
        color: '#64748b',
    },
    registerLink: {
        color: '#3b82f6',
        fontWeight: '700',
    },
});

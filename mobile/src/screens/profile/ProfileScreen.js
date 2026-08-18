import React from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen({ navigation }) {
    const { user } = useAuth();
    const isAdmin = user?.is_superuser || user?.is_staff;

    const roleOptions = [
        { value: 'responsable_stock', label: 'Responsable Stock' },
        { value: 'commercial', label: 'Commercial' },
        { value: 'achats', label: 'Achats' },
        { value: 'employe', label: 'Employé' },
        { value: 'client', label: 'Client' },
        { value: 'fournisseur', label: 'Fournisseur' },
    ];

    const getRoleLabel = (roleValue) => {
        const role = roleOptions.find(opt => opt.value === roleValue);
        return role ? role.label : (roleValue || 'Non renseigné');
    };

    const handleEditProfile = () => {
        navigation.navigate('EditProfile');
    };

    const handleChangePassword = () => {
        navigation.navigate('ChangePassword');
    };

    if (!user) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    const InfoCard = ({ title, icon, data }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <MaterialIcons name={icon} size={24} color="#3b82f6" />
                </View>
                <Text style={styles.cardTitle}>{title}</Text>
            </View>
            <View style={styles.cardBody}>
                {data.map((item, index) => (
                    <View key={index} style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{item.label}</Text>
                        <Text style={styles.infoValue}>{item.value}</Text>
                    </View>
                ))}
            </View>
        </View>
    );

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.pageTitle}>Mon Profil</Text>
                    <Text style={styles.pageSubtitle}>Gérez vos informations personnelles</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.actionButtonOutline} onPress={handleChangePassword}>
                        <MaterialIcons name="lock" size={16} color="#3b82f6" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButtonFill} onPress={handleEditProfile}>
                        <MaterialIcons name="edit" size={16} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.profileHeaderCard}>
                <View style={styles.avatarContainer}>
                    <View style={[styles.avatar, { backgroundColor: isAdmin ? '#ef4444' : '#3b82f6' }]}>
                        <Text style={styles.avatarText}>
                            {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                        </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: isAdmin ? '#ef444420' : '#3b82f620' }]}>
                        <Text style={[styles.badgeText, { color: isAdmin ? '#ef4444' : '#3b82f6' }]}>
                            {isAdmin ? 'ADMINISTRATEUR' : 'UTILISATEUR'}
                        </Text>
                    </View>
                </View>
                <View style={styles.profileInfo}>
                    <Text style={styles.userName}>{user?.first_name} {user?.last_name}</Text>
                    <Text style={styles.userHandle}>@{user?.username}</Text>

                    <View style={styles.statusRow}>
                        <View style={styles.statusItem}>
                            <MaterialIcons name="verified" size={20} color="#10b981" />
                            <View style={styles.statusTextContainer}>
                                <Text style={styles.statusLabel}>Statut</Text>
                                <Text style={styles.statusValue}>{user?.is_active ? 'Actif' : 'Inactif'}</Text>
                            </View>
                        </View>
                        <View style={styles.statusItem}>
                            <MaterialIcons name="calendar-today" size={20} color="#3b82f6" />
                            <View style={styles.statusTextContainer}>
                                <Text style={styles.statusLabel}>Membre depuis</Text>
                                <Text style={styles.statusValue}>
                                    {new Date(user?.date_joined || Date.now()).toLocaleDateString('fr-FR')}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            <InfoCard
                title="Informations Personnelles"
                icon="person"
                data={[
                    { label: 'Prénom', value: user?.first_name || 'Non renseigné' },
                    { label: 'Nom', value: user?.last_name || 'Non renseigné' },
                    { label: 'Nom d\'utilisateur', value: user?.username || 'Non renseigné' },
                    { label: 'Rôle', value: isAdmin ? 'Administrateur' : getRoleLabel(user?.role) }
                ]}
            />

            <InfoCard
                title="Contact"
                icon="email"
                data={[
                    { label: 'Email', value: user?.email || 'Non renseigné' },
                    { label: 'Téléphone', value: user?.phone_number || 'Non renseigné' },
                    { label: 'Adresse', value: user?.address || user?.adresse || 'Non renseigné' }
                ]}
            />

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 40,
        borderBottomWidth: 1,
        borderBottomColor: '#3b82f620',
    },
    pageTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    pageSubtitle: {
        color: '#64748b',
        fontSize: 14,
    },
    headerActions: {
        flexDirection: 'row',
    },
    actionButtonOutline: {
        borderWidth: 1,
        borderColor: '#3b82f650',
        padding: 10,
        borderRadius: 8,
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionButtonFill: {
        backgroundColor: '#3b82f6',
        padding: 10,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileHeaderCard: {
        backgroundColor: '#1e293b80',
        margin: 20,
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: '#3b82f620',
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        alignItems: 'center',
        marginRight: 20,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 3,
        borderColor: '#3b82f640',
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    profileInfo: {
        flex: 1,
    },
    userName: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    userHandle: {
        color: '#94a3b8',
        fontSize: 16,
        marginBottom: 15,
    },
    statusRow: {
        flexDirection: 'column',
    },
    statusItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    statusTextContainer: {
        marginLeft: 10,
    },
    statusLabel: {
        color: '#94a3b8',
        fontSize: 12,
    },
    statusValue: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    card: {
        backgroundColor: '#1e293b80',
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: '#3b82f620',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#3b82f620',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    cardTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    cardBody: {
        flexDirection: 'column',
    },
    infoRow: {
        backgroundColor: '#3b82f610',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#3b82f620',
    },
    infoLabel: {
        color: '#94a3b8',
        fontSize: 12,
        marginBottom: 5,
    },
    infoValue: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    }
});

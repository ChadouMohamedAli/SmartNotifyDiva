import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, RefreshControl
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import AdminDashboardScreen from './adminDashboardScreen';
// We would ordinarily use react-native-chart-kit here for the canvas logic, 
// but for the sake of the initial layout we will use placeholder blocks.

export default function DashboardScreen({ navigation }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dashboardData, setDashboardData] = useState({
        stats: {
            activeAlerts: 0,
            sentNotifications: 0,
            resolvedAlerts: 0,
            configuredRules: 0,
            totalUsers: 0,
            activeUsers: 0,
        },
        recentActivity: [],
    });

    const isAdmin = user?.is_superuser || user?.is_staff;

    if (isAdmin) {
        return <AdminDashboardScreen navigation={navigation} />;
    }

    const fetchData = async () => {
        try {
            // Mock data fetching to represent the structure
            // In reality, this would use fetch with the stored token
            const data = {
                stats: {
                    activeAlerts: 12,
                    sentNotifications: 145,
                    resolvedAlerts: 89,
                    totalUsers: 24,
                    activeUsers: 18,
                },
                recentActivity: [
                    { id: 1, title: 'Nouvelle alerte', type: 'alert', time: 'Il y a 5m' },
                    { id: 2, title: 'Produit ajouté', type: 'inventory', time: 'Il y a 1h' },
                ]
            };

            setDashboardData(data);
        } catch (error) {
            console.error(error);
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

    const StatCard = ({ title, value, icon, color }) => (
        <View style={styles.statCard}>
            <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
                <MaterialIcons name={icon} size={24} color={color} />
            </View>
            <View>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statTitle}>{title}</Text>
            </View>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
            }
        >
            <View style={styles.header}>
                <Text style={styles.greeting}>Bonjour, {user?.first_name || user?.username}</Text>
                <Text style={styles.subtitle}>Voici un aperçu de votre activité aujourd'hui</Text>
            </View>

            <View style={styles.statsGrid}>
                <StatCard
                    title="Alertes Actives"
                    value={dashboardData.stats.activeAlerts}
                    icon="warning"
                    color="#ef4444"
                />
                <StatCard
                    title="Notifications"
                    value={dashboardData.stats.sentNotifications}
                    icon="notifications"
                    color="#3b82f6"
                />
                <StatCard
                    title="Alertes Résolues"
                    value={dashboardData.stats.resolvedAlerts}
                    icon="check-circle"
                    color="#10b981"
                />
                {isAdmin && (
                    <StatCard
                        title="Utilisateurs Actifs"
                        value={dashboardData.stats.activeUsers}
                        icon="people"
                        color="#8b5cf6"
                    />
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Activité des notifications</Text>
                <View style={styles.chartPlaceholder}>
                    {[
                        { label: 'Actives', value: dashboardData.stats.activeAlerts, color: '#ef4444' },
                        { label: 'Notifs', value: dashboardData.stats.sentNotifications, color: '#3b82f6' },
                        { label: 'Resolues', value: dashboardData.stats.resolvedAlerts, color: '#10b981' },
                    ].map((item, index, list) => {
                        const max = Math.max(1, ...list.map((x) => x.value));
                        const heightPercent = Math.max(12, (item.value / max) * 100);
                        return (
                            <View key={item.label} style={styles.miniChartItem}>
                                <View style={styles.miniChartTrack}>
                                    <View style={[styles.miniChartBar, { height: `${heightPercent}%`, backgroundColor: item.color }]} />
                                </View>
                                <Text style={styles.miniChartValue}>{item.value}</Text>
                                <Text style={styles.miniChartLabel}>{item.label}</Text>
                            </View>
                        );
                    })}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Activité Récente</Text>
                {dashboardData.recentActivity.map(item => (
                    <View key={item.id} style={styles.activityItem}>
                        <View style={styles.activityIcon}>
                            <MaterialIcons name={item.type === 'alert' ? 'warning' : 'inventory'} size={20} color="#64748b" />
                        </View>
                        <View style={styles.activityContent}>
                            <Text style={styles.activityTitle}>{item.title}</Text>
                            <Text style={styles.activityTime}>{item.time}</Text>
                        </View>
                    </View>
                ))}
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0e27',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0a0e27',
    },
    header: {
        padding: 20,
        paddingTop: 40,
        paddingBottom: 20,
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#94a3b8',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 10,
        justifyContent: 'space-between',
    },
    statCard: {
        backgroundColor: '#0d1117',
        width: '46%',
        marginHorizontal: '2%',
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1e293b',
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    statTitle: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 2,
    },
    section: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
    },
    chartPlaceholder: {
        minHeight: 200,
        backgroundColor: '#0d1117',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1e293b',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        flexDirection: 'row',
        paddingHorizontal: 18,
        paddingVertical: 16,
    },
    placeholderText: {
        color: '#64748b',
        marginTop: 10,
        fontSize: 12,
    },
    miniChartItem: {
        flex: 1,
        alignItems: 'center',
        maxWidth: 80,
    },
    miniChartTrack: {
        width: 30,
        height: 120,
        borderRadius: 12,
        backgroundColor: 'rgba(59,130,246,0.15)',
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    miniChartBar: {
        width: '100%',
        borderRadius: 12,
    },
    miniChartValue: {
        color: '#e2e8f0',
        fontSize: 12,
        fontWeight: '700',
        marginTop: 8,
    },
    miniChartLabel: {
        color: '#94a3b8',
        fontSize: 11,
        marginTop: 2,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0d1117',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#1e293b',
    },
    activityIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#161b22',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    activityContent: {
        flex: 1,
    },
    activityTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    activityTime: {
        color: '#64748b',
        fontSize: 12,
        marginTop: 4,
    }
});

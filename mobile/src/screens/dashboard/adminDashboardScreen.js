import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	ActivityIndicator,
	Modal,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

const parseList = (payload) => {
	if (Array.isArray(payload)) return payload;
	if (Array.isArray(payload?.results)) return payload.results;
	if (Array.isArray(payload?.data)) return payload.data;
	return [];
};

const getStatusLabel = (product) => {
	const status = String(product?.status || '').toLowerCase();
	if (status === 'optimal') return { label: 'Optimal', color: '#10b981' };
	if (status === 'low') return { label: 'Faible', color: '#f59e0b' };
	if (status === 'out_of_stock') return { label: 'Rupture', color: '#ef4444' };
	return { label: status || 'N/A', color: '#64748b' };
};

const mapActivityToTimeline = (activity) => {
	const actionType = activity?.action_type;
	let icon = 'notifications';
	let color = '#8b5cf6';
	let title = activity?.title || 'Activite systeme';

	if (actionType === 'product_created') {
		icon = 'inventory';
		color = '#3b82f6';
	} else if (actionType === 'user_created') {
		icon = 'person-add';
		color = '#10b981';
	} else if (actionType === 'category_created') {
		icon = 'category';
		color = '#f59e0b';
	} else if (actionType === 'alert_created') {
		icon = 'warning';
		color = '#ef4444';
	}

	return {
		id: activity?.id || `${actionType}-${activity?.created_at || Math.random()}`,
		icon,
		color,
		title,
		description: activity?.description || '',
		time: activity?.created_at ? new Date(activity.created_at).toLocaleString('fr-FR') : 'Recemment',
	};
};

const StatCard = ({ icon, value, label, subText, color }) => (
	<View style={[styles.statCard, { borderColor: `${color}44` }]}>
		<View style={[styles.statIconWrap, { backgroundColor: `${color}22` }]}>
			<MaterialIcons name={icon} size={19} color={color} />
		</View>
		<Text style={styles.statValue}>{value}</Text>
		<Text style={styles.statLabel}>{label}</Text>
		<Text style={[styles.statSub, { color }]}>{subText}</Text>
	</View>
);

const yTicks = [0, 20, 40, 60, 80];
const chartConfig = {
	width: 356,
	height: 220,
	paddingTop: 16,
	paddingBottom: 34,
	paddingLeft: 36,
	paddingRight: 14,
};

const buildSmoothPath = (points) => {
	if (!points.length) return '';
	if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

	let d = `M ${points[0].x} ${points[0].y}`;
	for (let i = 0; i < points.length - 1; i += 1) {
		const p0 = points[Math.max(0, i - 1)];
		const p1 = points[i];
		const p2 = points[i + 1];
		const p3 = points[Math.min(points.length - 1, i + 2)];

		const cp1x = p1.x + (p2.x - p0.x) / 6;
		const cp1y = p1.y + (p2.y - p0.y) / 6;
		const cp2x = p2.x - (p3.x - p1.x) / 6;
		const cp2y = p2.y - (p3.y - p1.y) / 6;

		d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
	}

	return d;
};

const NotificationActivityChart = ({ labels, series }) => {
	const chartW = chartConfig.width - chartConfig.paddingLeft - chartConfig.paddingRight;
	const chartH = chartConfig.height - chartConfig.paddingTop - chartConfig.paddingBottom;

	const maxValue = Math.max(1, ...series.flatMap((s) => s.data));
	const scaledMax = Math.max(80, Math.ceil(maxValue / 10) * 10);

	const getX = (index) => chartConfig.paddingLeft + (index / (labels.length - 1 || 1)) * chartW;
	const getY = (value) => chartConfig.paddingTop + chartH - (value / scaledMax) * chartH;

	return (
		<View style={styles.svgChartWrap}>
			<Svg width="100%" height={chartConfig.height} viewBox={`0 0 ${chartConfig.width} ${chartConfig.height}`}>
				<Defs>
					<LinearGradient id="sentFill" x1="0" y1="0" x2="0" y2="1">
						<Stop offset="0" stopColor="rgba(59,130,246,0.26)" />
						<Stop offset="1" stopColor="rgba(59,130,246,0.04)" />
					</LinearGradient>
					<LinearGradient id="resolvedFill" x1="0" y1="0" x2="0" y2="1">
						<Stop offset="0" stopColor="rgba(16,185,129,0.2)" />
						<Stop offset="1" stopColor="rgba(16,185,129,0.04)" />
					</LinearGradient>
					<LinearGradient id="criticalFill" x1="0" y1="0" x2="0" y2="1">
						<Stop offset="0" stopColor="rgba(239,68,68,0.2)" />
						<Stop offset="1" stopColor="rgba(239,68,68,0.04)" />
					</LinearGradient>
				</Defs>

				{yTicks.map((tick) => {
					const y = getY(tick);
					return (
						<G key={`tick-${tick}`}>
							<Line
								x1={chartConfig.paddingLeft}
								y1={y}
								x2={chartConfig.width - chartConfig.paddingRight}
								y2={y}
								stroke="rgba(148,163,184,0.16)"
								strokeWidth="1"
							/>
							<SvgText x={chartConfig.paddingLeft - 8} y={y + 4} fill="#94a3b8" fontSize="10" textAnchor="end">
								{tick}
							</SvgText>
						</G>
					);
				})}

				{series.map((dataset) => {
					const points = dataset.data.map((value, idx) => ({ x: getX(idx), y: getY(value) }));
					const linePath = buildSmoothPath(points);
					const areaPath = `${linePath} L ${points[points.length - 1]?.x || 0} ${getY(0)} L ${points[0]?.x || 0} ${getY(0)} Z`;

					return (
						<G key={dataset.key}>
							<Path d={areaPath} fill={`url(#${dataset.fillId})`} />
							<Path d={linePath} fill="none" stroke={dataset.color} strokeWidth="2.2" />
							{points.map((point, idx) => (
								<G key={`${dataset.key}-${labels[idx]}`}>
									<Circle cx={point.x} cy={point.y} r="3.8" fill={dataset.color} />
									<Circle cx={point.x} cy={point.y} r="1.9" fill="#0b1220" />
								</G>
							))}
						</G>
					);
				})}

				{labels.map((label, idx) => (
					<SvgText
						key={`x-${label}`}
						x={getX(idx)}
						y={chartConfig.height - 10}
						fill="#94a3b8"
						fontSize="10"
						textAnchor="middle"
					>
						{label}
					</SvgText>
				))}
			</Svg>

			<View style={styles.lineLegendRow}>
				{series.map((dataset) => (
					<View key={`legend-${dataset.key}`} style={styles.lineLegendItem}>
						<View style={[styles.lineLegendDot, { backgroundColor: dataset.color }]} />
						<Text style={[styles.lineLegendText, { color: dataset.color }]}>{dataset.label}</Text>
					</View>
				))}
			</View>
		</View>
	);
};

const AlertDistributionDonut = ({ items }) => {
	const total = items.reduce((acc, item) => acc + item.value, 0);
	const radius = 70;
	const strokeWidth = 30;
	const circumference = 2 * Math.PI * radius;
	let cumulative = 0;

	return (
		<View style={styles.donutWrap}>
			<Svg width={220} height={220} viewBox="0 0 220 220">
				<G rotation="-90" origin="110,110">
					<Circle cx="110" cy="110" r={radius} fill="none" stroke="rgba(148,163,184,0.14)" strokeWidth={strokeWidth} />
					{items.map((item) => {
						const pct = total > 0 ? item.value / total : 0;
						const dash = pct * circumference;
						const dashArray = `${dash} ${circumference - dash}`;
						const dashOffset = -cumulative * circumference;
						cumulative += pct;

						return (
							<Circle
								key={`slice-${item.key}`}
								cx="110"
								cy="110"
								r={radius}
								fill="none"
								stroke={item.color}
								strokeWidth={strokeWidth}
								strokeDasharray={dashArray}
								strokeDashoffset={dashOffset}
								strokeLinecap="butt"
							/>
						);
					})}
				</G>
			</Svg>

			<View style={styles.donutCenter}>
				<Text style={styles.donutCenterValue}>{items.length}</Text>
				<Text style={styles.donutCenterLabel}>modules</Text>
			</View>

			<View style={styles.donutLegendRow}>
				{items.map((item) => {
					const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
					return (
						<View key={`legend-${item.key}`} style={styles.donutLegendItem}>
							<View style={[styles.donutLegendDot, { backgroundColor: item.color }]} />
							<Text style={styles.donutLegendText}>{item.label} ({pct}%)</Text>
						</View>
					);
				})}
			</View>
		</View>
	);
};

const getLast7DayLabels = () => {
	const labels = [];
	for (let i = 6; i >= 0; i -= 1) {
		const day = new Date();
		day.setDate(day.getDate() - i);
		labels.push(day.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 3));
	}
	return labels;
};

export default function AdminDashboardScreen() {
	const { user } = useAuth();
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [productsPage, setProductsPage] = useState(1);
	const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
	const [selectedAlert, setSelectedAlert] = useState(null);

	const [dashboardData, setDashboardData] = useState({
		stats: {
			activeAlerts: 0,
			sentNotifications: 0,
			resolvedAlerts: 0,
			pendingOrders: 0,
			configuredRules: 0,
			totalUsers: 0,
			activeUsers: 0,
		},
		alerts: [],
		recentActivity: [],
		products: [],
		notifications: [],
		unreadNotifications: [],
	});

	const apiGet = useCallback(async (path, token) => {
		const response = await fetch(`${API_BASE_URL}${path}`, {
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
		});
		if (!response.ok) return null;
		return response.json();
	}, []);

	const fetchDashboard = useCallback(async () => {
		try {
			const token = await AsyncStorage.getItem('access_token');
			if (!token) return;

			const [
				usersPayload,
				alertsPayload,
				productsPayload,
				ordersStatsPayload,
				notificationsPayload,
				activitiesPayload,
			] = await Promise.all([
				apiGet('/admin/users/', token),
				apiGet('/alerts/', token),
				apiGet('/stock/products/', token),
				apiGet('/orders/orders/statistics/', token),
				apiGet('/notifications/', token),
				apiGet('/activity/recent/?limit=8', token),
			]);

			const users = parseList(usersPayload);
			const alerts = parseList(alertsPayload);
			const products = parseList(productsPayload);
			const notifications = parseList(notificationsPayload);
			const recentActivity = parseList(activitiesPayload).map(mapActivityToTimeline);

			const activeAlerts = alerts.filter(
				(a) => a?.is_active === true || a?.status === 'active' || a?.status === 'ACTIVE'
			).length;
			const resolvedAlerts = alerts.filter(
				(a) => a?.is_active === false || a?.status === 'resolved' || a?.status === 'RESOLVED'
			).length;
			const unreadNotifications = notifications.filter((i) => i?.is_read === false);

			setDashboardData({
				stats: {
					activeAlerts,
					sentNotifications: notifications.length,
					resolvedAlerts,
					pendingOrders: Number(ordersStatsPayload?.pending) || 0,
					configuredRules: alerts.length,
					totalUsers: users.length,
					activeUsers: users.filter((u) => u?.is_active === true).length,
				},
				alerts,
				recentActivity,
				products,
				notifications,
				unreadNotifications,
			});
		} catch (error) {
			console.log('Erreur dashboard admin mobile:', error);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [apiGet]);

	useEffect(() => {
		fetchDashboard();
	}, [fetchDashboard]);

	const onRefresh = () => {
		setRefreshing(true);
		fetchDashboard();
	};

	const pagedProducts = useMemo(() => {
		const start = (productsPage - 1) * 5;
		return dashboardData.products.slice(start, start + 5);
	}, [dashboardData.products, productsPage]);

	const notificationActivityTrend = useMemo(() => {
		const labels = getLast7DayLabels();
		const keys = [];
		for (let i = 6; i >= 0; i -= 1) {
			const day = new Date();
			day.setDate(day.getDate() - i);
			keys.push(day.toISOString().slice(0, 10));
		}

		const buckets = keys.reduce((acc, key) => {
			acc[key] = { sent: 0, resolved: 0, critical: 0 };
			return acc;
		}, {});

		dashboardData.notifications.forEach((item) => {
			if (!item?.created_at) return;
			const dayKey = new Date(item.created_at).toISOString().slice(0, 10);
			if (!buckets[dayKey]) return;

			const type = String(item?.notification_type || '').toLowerCase();
			const title = String(item?.title || '').toLowerCase();
			const message = String(item?.message || '').toLowerCase();

			buckets[dayKey].sent += 1;
			if (type.includes('critical') || type.includes('warning') || message.includes('critique')) {
				buckets[dayKey].critical += 1;
			}
			if (type.includes('resolved') || title.includes('resol') || message.includes('resol')) {
				buckets[dayKey].resolved += 1;
			}
		});

		return {
			labels,
			series: [
				{ key: 'sent', label: 'envoyees', color: '#3b82f6', fillId: 'sentFill', data: keys.map((k) => buckets[k].sent) },
				{ key: 'resolved', label: 'resolues', color: '#22c55e', fillId: 'resolvedFill', data: keys.map((k) => buckets[k].resolved) },
				{ key: 'critical', label: 'critiques', color: '#ef4444', fillId: 'criticalFill', data: keys.map((k) => buckets[k].critical) },
			],
		};
	}, [dashboardData.notifications]);

	const alertDistribution = useMemo(() => {
		const counts = {};
		dashboardData.alerts.forEach((alert) => {
			const moduleName = String(alert?.module || 'Systeme').trim();
			counts[moduleName] = (counts[moduleName] || 0) + 1;
		});

		const palette = ['#2b8ae3', '#8b5cf6', '#22c55e', '#fb923c', '#06b6d4', '#ef4444'];

		return Object.entries(counts)
			.map(([module, count], index) => ({
				key: module.toLowerCase().replace(/\s+/g, '-'),
				label: module,
				value: count,
				color: palette[index % palette.length],
			}))
			.sort((a, b) => b.value - a.value)
			.slice(0, 5);
	}, [dashboardData.alerts]);

	const totalProductPages = Math.max(1, Math.ceil(dashboardData.products.length / 5));

	if (loading && !refreshing) {
		return (
			<View style={styles.loadingWrap}>
				<ActivityIndicator size="large" color="#3b82f6" />
			</View>
		);
	}

	return (
		<View style={styles.screen}>
			<ScrollView
				contentContainerStyle={styles.content}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
				}
			>
				<View style={styles.navbar}>
					<View style={styles.navbarTopRow}>
						<Text style={styles.navbarTitle}>Tableau de bord</Text>

						<View style={styles.searchWrap}>
							<MaterialIcons name="search" size={18} color="#64748b" />
							<TextInput
								style={styles.searchInput}
								placeholder="Search"
								placeholderTextColor="#64748b"
								editable={false}
							/>
						</View>

						<View style={styles.navbarRightRow}>
							<TouchableOpacity style={styles.notifIconBtn} onPress={() => setNotificationsModalOpen(true)}>
								<MaterialIcons name="notifications" size={21} color="#94a3b8" />
								{dashboardData.unreadNotifications.length > 0 ? (
									<View style={styles.notifCountBadge}>
										<Text style={styles.notifCountText}>
											{dashboardData.unreadNotifications.length > 99 ? '99+' : dashboardData.unreadNotifications.length}
										</Text>
									</View>
								) : null}
							</TouchableOpacity>

							<Text style={styles.navbarUserText}>
								{(user?.first_name || user?.username || 'admin').toLowerCase()}{' '}
								{(user?.last_name || user?.username || 'admin').toLowerCase()}
							</Text>

							<View style={styles.navbarAvatar}>
								<Text style={styles.navbarAvatarText}>
									{(user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'a').toLowerCase()}
								</Text>
							</View>
						</View>
					</View>

					<View style={styles.welcomeStrip}>
						<Text style={styles.welcomeText}>Welcome, {user?.first_name || user?.username}!</Text>
					</View>
				</View>

				<View style={styles.statsGrid}>
					<StatCard
						icon="warning"
						value={dashboardData.stats.activeAlerts}
						label="Alertes Actives"
						subText="Necessite attention"
						color="#ef4444"
					/>
					<StatCard
						icon="notifications"
						value={dashboardData.stats.sentNotifications}
						label="Notifications Totales"
						subText={`${dashboardData.unreadNotifications.length} non lues`}
						color="#3b82f6"
					/>
					<StatCard
						icon="check-circle"
						value={dashboardData.stats.resolvedAlerts}
						label="Alertes Resolues"
						subText="Alertes traitees"
						color="#10b981"
					/>
					<StatCard
						icon="people"
						value={dashboardData.stats.totalUsers}
						label="Utilisateurs"
						subText={`${dashboardData.stats.activeUsers} actifs`}
						color="#8b5cf6"
					/>
					<StatCard
						icon="shopping-cart"
						value={dashboardData.stats.pendingOrders}
						label="Commandes en attente"
						subText="Statut: pending"
						color="#f59e0b"
					/>
				</View>

				<View style={styles.panel}>
					<Text style={styles.panelTitle}>Activite des notifications</Text>
					<Text style={styles.panelSubtitle}>Tendance sur les 7 derniers jours</Text>
					{notificationActivityTrend.series.some((dataset) => dataset.data.some((value) => value > 0)) ? (
						<NotificationActivityChart labels={notificationActivityTrend.labels} series={notificationActivityTrend.series} />
					) : (
						<Text style={styles.emptyText}>Aucune donnee de notifications recente</Text>
					)}
				</View>

				<View style={styles.panel}>
					<Text style={styles.panelTitle}>Repartition des alertes</Text>
					{alertDistribution.length > 0 ? (
						<AlertDistributionDonut items={alertDistribution} />
					) : (
						<Text style={styles.emptyText}>Aucune alerte disponible pour la repartition</Text>
					)}
				</View>

				<View style={styles.panel}>
					<Text style={styles.panelTitle}>Liste des Produits</Text>
					{pagedProducts.length > 0 ? (
						pagedProducts.map((product, idx) => {
							const statusInfo = getStatusLabel(product);
							return (
								<View key={`${product?.id || idx}`} style={styles.productRow}>
									<View style={{ flex: 1 }}>
										<Text style={styles.productName}>{product?.name || 'N/A'}</Text>
										<Text style={styles.productMeta}>SKU: {product?.sku || 'N/A'} | Qte: {product?.quantity || 0}</Text>
									</View>
									<View style={[styles.badge, { backgroundColor: `${statusInfo.color}22` }]}>
										<Text style={[styles.badgeText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
									</View>
								</View>
							);
						})
					) : (
						<Text style={styles.emptyText}>Aucun produit disponible</Text>
					)}
					<View style={styles.paginationRow}>
						<TouchableOpacity
							disabled={productsPage === 1}
							onPress={() => setProductsPage((p) => Math.max(1, p - 1))}
							style={[styles.pageButton, productsPage === 1 && styles.pageButtonDisabled]}
						>
							<Text style={styles.pageButtonText}>Prev</Text>
						</TouchableOpacity>
						<Text style={styles.pageIndex}>{productsPage} / {totalProductPages}</Text>
						<TouchableOpacity
							disabled={productsPage >= totalProductPages}
							onPress={() => setProductsPage((p) => Math.min(totalProductPages, p + 1))}
							style={[styles.pageButton, productsPage >= totalProductPages && styles.pageButtonDisabled]}
						>
							<Text style={styles.pageButtonText}>Next</Text>
						</TouchableOpacity>
					</View>
				</View>

				<View style={styles.panel}>
					<Text style={styles.panelTitle}>Alertes Recentes</Text>
					{dashboardData.alerts.slice(0, 3).map((alert) => (
						<TouchableOpacity key={alert.id} style={styles.alertRow} onPress={() => setSelectedAlert(alert)}>
							<MaterialIcons
								name={alert?.type === 'critical' ? 'error' : alert?.type === 'warning' ? 'warning' : 'info'}
								size={18}
								color={alert?.type === 'critical' ? '#ef4444' : alert?.type === 'warning' ? '#f59e0b' : '#3b82f6'}
							/>
							<View style={{ flex: 1 }}>
								<Text style={styles.alertTitle}>{alert?.module || 'Systeme'}</Text>
								<Text style={styles.alertMessage}>{alert?.message || 'Alerte systeme'}</Text>
							</View>
						</TouchableOpacity>
					))}
					{dashboardData.alerts.length === 0 ? <Text style={styles.emptyText}>Aucune alerte recente</Text> : null}
				</View>

				<View style={styles.panel}>
					<Text style={styles.panelTitle}>Mes activites recentes</Text>
					{dashboardData.recentActivity.length > 0 ? (
						dashboardData.recentActivity.map((activity) => (
							<View key={activity.id} style={styles.activityRow}>
								<View style={[styles.activityIconWrap, { backgroundColor: `${activity.color}22` }]}>
									<MaterialIcons name={activity.icon} size={16} color={activity.color} />
								</View>
								<View style={{ flex: 1 }}>
									<Text style={styles.activityTitle}>{activity.title}</Text>
									{activity.description ? <Text style={styles.activityDesc}>{activity.description}</Text> : null}
								</View>
								<Text style={styles.activityTime}>{activity.time}</Text>
							</View>
						))
					) : (
						<Text style={styles.emptyText}>Aucune activite recente</Text>
					)}
				</View>
			</ScrollView>

			<Modal
				visible={notificationsModalOpen}
				transparent
				animationType="slide"
				onRequestClose={() => setNotificationsModalOpen(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalCard}>
						<Text style={styles.modalTitle}>Notifications non lues</Text>
						<ScrollView style={{ maxHeight: 280 }}>
							{dashboardData.unreadNotifications.length > 0 ? (
								dashboardData.unreadNotifications.map((n) => (
									<View key={n.id} style={styles.modalRow}>
										<MaterialIcons name="circle" size={9} color="#ef4444" />
										<View style={{ flex: 1 }}>
											<Text style={styles.modalRowTitle}>{n.title || 'Sans titre'}</Text>
											<Text style={styles.modalRowText}>{n.message || '-'}</Text>
										</View>
									</View>
								))
							) : (
								<Text style={styles.emptyText}>Aucune notification non lue</Text>
							)}
						</ScrollView>
						<TouchableOpacity style={styles.closeBtn} onPress={() => setNotificationsModalOpen(false)}>
							<Text style={styles.closeBtnText}>Fermer</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>

			<Modal visible={!!selectedAlert} transparent animationType="fade" onRequestClose={() => setSelectedAlert(null)}>
				<View style={styles.modalOverlay}>
					<View style={styles.modalCard}>
						<Text style={styles.modalTitle}>Details alerte</Text>
						<Text style={styles.modalRowTitle}>{selectedAlert?.module || 'Systeme'}</Text>
						<Text style={styles.modalRowText}>{selectedAlert?.message || '-'}</Text>
						<Text style={styles.modalRowText}>Type: {selectedAlert?.type || 'info'}</Text>
						<Text style={styles.modalRowText}>Status: {selectedAlert?.status || '-'}</Text>
						<TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedAlert(null)}>
							<Text style={styles.closeBtnText}>Fermer</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		backgroundColor: '#000',
	},
	loadingWrap: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#000',
	},
	content: {
		padding: 14,
		paddingBottom: 90,
	},
	navbar: {
		marginBottom: 10,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(59,130,246,0.14)',
		paddingBottom: 12,
	},
	navbarTopRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 12,
		paddingTop: 4,
		flexWrap: 'wrap',
	},
	navbarTitle: {
		color: '#fff',
		fontSize: 28,
		fontWeight: '800',
		lineHeight: 34,
	},
	searchWrap: {
		flex: 1,
		minWidth: 180,
		maxWidth: 420,
		height: 42,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: 'rgba(59,130,246,0.34)',
		backgroundColor: 'rgba(2,18,45,0.56)',
		paddingHorizontal: 12,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	searchInput: {
		flex: 1,
		color: '#94a3b8',
		fontSize: 21,
		paddingVertical: 0,
	},
	navbarRightRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 9,
	},
	notifIconBtn: {
		position: 'relative',
		padding: 4,
	},
	notifCountBadge: {
		position: 'absolute',
		top: -6,
		right: -8,
		minWidth: 20,
		height: 20,
		borderRadius: 10,
		backgroundColor: '#ef4444',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 4,
	},
	notifCountText: {
		color: '#fff',
		fontSize: 10,
		fontWeight: '800',
	},
	navbarUserText: {
		color: '#fff',
		fontSize: 18,
		fontWeight: '700',
	},
	navbarAvatar: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: '#ef4444',
		alignItems: 'center',
		justifyContent: 'center',
	},
	navbarAvatarText: {
		color: '#fff',
		fontSize: 20,
		fontWeight: '800',
	},
	welcomeStrip: {
		marginTop: 12,
		paddingTop: 10,
		borderTopWidth: 1,
		borderTopColor: 'rgba(59,130,246,0.08)',
	},
	welcomeText: {
		color: '#fff',
		fontSize: 42,
		fontWeight: '700',
	},
	statsGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		marginBottom: 10,
	},
	statCard: {
		width: '48.5%',
		backgroundColor: 'rgba(30,41,59,0.5)',
		borderWidth: 1,
		borderRadius: 14,
		padding: 12,
		marginBottom: 10,
	},
	statIconWrap: {
		width: 34,
		height: 34,
		borderRadius: 8,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 10,
	},
	statValue: {
		color: '#fff',
		fontSize: 22,
		fontWeight: '700',
	},
	statLabel: {
		color: '#94a3b8',
		fontSize: 12,
		marginTop: 2,
	},
	statSub: {
		marginTop: 5,
		fontSize: 11,
		fontWeight: '600',
	},
	panel: {
		backgroundColor: 'rgba(30,41,59,0.5)',
		borderWidth: 1,
		borderColor: 'rgba(59,130,246,0.15)',
		borderRadius: 14,
		padding: 12,
		marginBottom: 10,
	},
	panelTitle: {
		color: '#fff',
		fontSize: 17,
		fontWeight: '700',
		marginBottom: 6,
	},
	panelSubtitle: {
		color: '#64748b',
		fontSize: 12,
		marginBottom: 8,
	},
	svgChartWrap: {
		marginTop: 2,
	},
	lineLegendRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 20,
		marginTop: 8,
		marginBottom: 2,
	},
	lineLegendItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	lineLegendDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
	},
	lineLegendText: {
		fontSize: 12,
		fontWeight: '600',
	},
	donutWrap: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 8,
	},
	donutCenter: {
		position: 'absolute',
		top: 82,
		alignItems: 'center',
	},
	donutCenterValue: {
		color: '#ffffff',
		fontSize: 40,
		fontWeight: '800',
		lineHeight: 44,
	},
	donutCenterLabel: {
		color: '#94a3b8',
		fontSize: 16,
		marginTop: 2,
	},
	donutLegendRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		gap: 12,
		marginTop: -8,
		paddingHorizontal: 8,
	},
	donutLegendItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	donutLegendDot: {
		width: 10,
		height: 10,
		borderRadius: 5,
	},
	donutLegendText: {
		color: '#94a3b8',
		fontSize: 13,
		fontWeight: '600',
	},
	productRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 9,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(59,130,246,0.08)',
	},
	productName: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '600',
	},
	productMeta: {
		color: '#94a3b8',
		fontSize: 12,
		marginTop: 3,
	},
	badge: {
		borderRadius: 999,
		paddingHorizontal: 10,
		paddingVertical: 5,
	},
	badgeText: {
		fontSize: 11,
		fontWeight: '700',
	},
	paginationRow: {
		marginTop: 10,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	pageButton: {
		borderWidth: 1,
		borderColor: 'rgba(59,130,246,0.5)',
		backgroundColor: 'rgba(59,130,246,0.15)',
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 6,
	},
	pageButtonDisabled: {
		opacity: 0.4,
	},
	pageButtonText: {
		color: '#cbd5e1',
		fontWeight: '600',
		fontSize: 12,
	},
	pageIndex: {
		color: '#94a3b8',
		fontSize: 12,
	},
	alertRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 8,
		paddingVertical: 9,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(59,130,246,0.08)',
	},
	alertTitle: {
		color: '#fff',
		fontWeight: '700',
		fontSize: 13,
	},
	alertMessage: {
		color: '#94a3b8',
		marginTop: 2,
		fontSize: 12,
	},
	activityRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingVertical: 9,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(59,130,246,0.08)',
	},
	activityIconWrap: {
		width: 28,
		height: 28,
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center',
	},
	activityTitle: {
		color: '#e2e8f0',
		fontSize: 13,
		fontWeight: '600',
	},
	activityDesc: {
		color: '#64748b',
		fontSize: 11,
		marginTop: 2,
	},
	activityTime: {
		color: '#64748b',
		fontSize: 11,
	},
	emptyText: {
		color: '#64748b',
		fontSize: 13,
		paddingVertical: 10,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(2,6,23,0.7)',
		justifyContent: 'center',
		padding: 16,
	},
	modalCard: {
		backgroundColor: '#0f172a',
		borderWidth: 1,
		borderColor: 'rgba(59,130,246,0.25)',
		borderRadius: 14,
		padding: 14,
	},
	modalTitle: {
		color: '#fff',
		fontSize: 18,
		fontWeight: '700',
		marginBottom: 10,
	},
	modalRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 8,
		paddingVertical: 8,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(59,130,246,0.08)',
	},
	modalRowTitle: {
		color: '#fff',
		fontSize: 13,
		fontWeight: '700',
	},
	modalRowText: {
		color: '#94a3b8',
		marginTop: 2,
		fontSize: 12,
	},
	closeBtn: {
		marginTop: 12,
		backgroundColor: '#3b82f6',
		borderRadius: 10,
		paddingVertical: 10,
		alignItems: 'center',
	},
	closeBtnText: {
		color: '#fff',
		fontWeight: '700',
	},
});

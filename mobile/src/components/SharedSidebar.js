import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import { getAuthorizedMenus } from '../utils/moduleMenuConfig';

const menuGroups = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', target: 'Dashboard' },
  { id: 'stock', label: 'Stock', icon: 'inventory', target: 'Stock' },
  { id: 'profile', label: 'Profil', icon: 'person', target: 'Profile' },
  {
    id: 'facturation',
    label: 'Facturation',
    icon: 'receipt-long',
    children: [
      { id: 'facturation-new', label: 'Nouvelle facture', target: 'Facturation' },
      { id: 'facturation-list', label: 'Liste des factures', target: 'Facturation' },
    ],
  },
  {
    id: 'orders',
    label: 'Commandes',
    icon: 'shopping-cart',
    children: [
      { id: 'orders-new', label: 'Nouvelle commande' },
      { id: 'orders-list', label: 'Liste des commandes' },
    ],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: 'notifications',
  },
  {
    id: 'settings',
    label: 'Parametres',
    icon: 'settings',
  },
  {
    id: 'deconnexion',
    label: 'Deconnexion',
    icon: 'logout',
    action: 'logout',
  },
];

export default function SharedSidebar({ state, navigation }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [openMenus, setOpenMenus] = useState({
    stock: true,
    facturation: false,
    orders: false,
  });

  const authorizedMenuIds = useMemo(() => getAuthorizedMenus(user), [user]);
  const filteredMenus = useMemo(
    () => menuGroups.filter((m) => authorizedMenuIds.includes(m.id)),
    [authorizedMenuIds]
  );

  const activeRouteName = state.routeNames[state.index];

  const fetchUnreadNotifications = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        setUnreadNotifications(0);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/notifications/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) return;

      const payload = await response.json();
      const notifications = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.results)
          ? payload.results
          : [];

      const unreadCount = notifications.filter((item) => item?.is_read === false).length;
      setUnreadNotifications(unreadCount);
    } catch (error) {
      setUnreadNotifications(0);
    }
  }, []);

  useEffect(() => {
    fetchUnreadNotifications();
    const interval = setInterval(fetchUnreadNotifications, 20000);
    return () => clearInterval(interval);
  }, [fetchUnreadNotifications]);

  const tabItems = [
    { label: 'Dashboard', icon: 'dashboard', target: 'Dashboard' },
    { label: 'Stock', icon: 'inventory', target: 'Stock' },
    { label: 'Notifications', icon: 'notifications', target: 'Dashboard', showBadge: true },
    { label: 'Profil', icon: 'person', target: 'Profile' },
    { label: 'Plus', icon: 'menu', openMenu: true },
  ];

  const toggleMenu = (id) => {
    setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const onPressMenuItem = async (item) => {
    if (item.action === 'logout') {
      await logout();
      setMenuOpen(false);
      return;
    }

    if (item.target) {
      navigation.navigate(item.target);
      setMenuOpen(false);
      return;
    }

    Alert.alert('Information', 'Cet ecran sera disponible bientot.');
  };

  return (
    <>
      <Modal
        visible={menuOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setMenuOpen(false)}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setMenuOpen(false)}>
          <View style={styles.drawer}>
            <View style={styles.drawerHeader}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{user?.first_name || user?.username || 'Utilisateur'}</Text>
                <Text style={styles.userRole}>{user?.role || 'Compte standard'}</Text>
              </View>
            </View>

            <ScrollView contentContainerStyle={styles.menuList}>
              {filteredMenus.map((group) => {
                const hasChildren = Boolean(group.children?.length);
                const isOpen = openMenus[group.id];
                const isActive = group.target && activeRouteName === group.target;

                return (
                  <View key={group.id}>
                    <TouchableOpacity
                      style={[styles.menuRow, isActive && styles.menuRowActive]}
                      onPress={() => {
                        if (hasChildren) {
                          toggleMenu(group.id);
                          return;
                        }
                        onPressMenuItem(group);
                      }}
                    >
                      <View style={styles.menuLeft}>
                        <MaterialIcons
                          name={group.icon}
                          size={20}
                          color={isActive ? '#60a5fa' : '#94a3b8'}
                        />
                        <Text style={[styles.menuText, isActive && styles.menuTextActive]}>{group.label}</Text>
                      </View>

                      {hasChildren ? (
                        <MaterialIcons
                          name={isOpen ? 'expand-more' : 'chevron-right'}
                          size={20}
                          color="#64748b"
                        />
                      ) : null}
                    </TouchableOpacity>

                    {hasChildren && isOpen ? (
                      <View style={styles.childWrap}>
                        {group.children.map((child) => (
                          <TouchableOpacity
                            key={child.id}
                            style={styles.childRow}
                            onPress={() => onPressMenuItem(child)}
                          >
                            <MaterialIcons name="circle" size={8} color="#64748b" />
                            <Text style={styles.childText}>{child.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.tabBar}>
        {tabItems.map((item) => {
          const active = item.target && activeRouteName === item.target;
          return (
            <TouchableOpacity
              key={item.label}
              style={styles.tabItem}
              onPress={() => {
                if (item.openMenu) {
                  fetchUnreadNotifications();
                  setMenuOpen(true);
                } else if (item.target) {
                  navigation.navigate(item.target);
                }
              }}
            >
              <View style={styles.tabIconWrap}>
                <MaterialIcons name={item.icon} size={24} color={active ? '#3b82f6' : '#64748b'} />
                {item.showBadge && unreadNotifications > 0 ? (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>{unreadNotifications > 99 ? '99+' : unreadNotifications}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: '#0d1117',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabIconWrap: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -12,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#0d1117',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  tabLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#3b82f6',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.55)',
    justifyContent: 'flex-end',
  },
  drawer: {
    backgroundColor: '#020617',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '82%',
    paddingBottom: 16,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  userName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  userRole: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  menuList: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  menuRowActive: {
    backgroundColor: 'rgba(59,130,246,0.16)',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  menuTextActive: {
    color: '#60a5fa',
  },
  childWrap: {
    borderLeftWidth: 1,
    borderLeftColor: '#1e293b',
    marginLeft: 22,
    marginBottom: 6,
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  childText: {
    color: '#64748b',
    fontSize: 13,
  },
});

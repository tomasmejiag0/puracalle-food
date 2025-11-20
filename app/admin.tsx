import { useAuth } from '@/hooks/useAuth';
import { listProfiles, updateProfileRole, type Profile } from '@/services/users';
import * as Haptics from 'expo-haptics';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminScreen() {
  const { role } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listProfiles(search, ['admin', 'worker']);
      setProfiles(data);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleRole = async (p: Profile) => {
    try {
      const next = p.role === 'admin' ? 'user' : 'admin';
      await updateProfileRole(p.id, next);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      load();
    } catch (e: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', e.message ?? 'No se pudo actualizar el rol');
    }
  };

  if (role !== 'admin') {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Administración' }} />
        <View style={styles.blockedBox}>
          <Text style={styles.blockedText}>Acceso restringido</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Administración' }} />
      <View style={styles.header}>
        <Text style={styles.title}>Usuarios y roles</Text>
        <Text style={styles.subtitle}>Promueve o quita permisos de admin</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            placeholder="Buscar por email"
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity style={styles.searchBtn} onPress={load}>
            <Text style={styles.searchBtnText}>{loading ? '...' : 'Buscar'}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {profiles.map((p) => (
          <View key={p.id} style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.email}>{p.email ?? p.id}</Text>
              <Text style={styles.meta}>Rol: {p.role}</Text>
              {!!p.full_name && <Text style={styles.meta}>Nombre: {p.full_name}</Text>}
            </View>
            <TouchableOpacity style={styles.roleBtn} onPress={() => toggleRole(p)}>
              <Text style={styles.roleBtnText}>{p.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fef2e7' },
  header: { padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  subtitle: { color: '#6b7280', marginTop: 4 },
  searchRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  input: { flex: 1, backgroundColor: 'white', borderWidth: 1, borderColor: '#fde6d3', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#1f2937' },
  searchBtn: { backgroundColor: '#f97316', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  searchBtnText: { color: '#fff', fontWeight: '700' },
  content: { padding: 24, gap: 12 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderLeftWidth: 4, borderLeftColor: '#f97316' },
  email: { color: '#1f2937', fontWeight: '700' },
  meta: { color: '#6b7280', marginTop: 2 },
  roleBtn: { backgroundColor: 'white', borderWidth: 1, borderColor: '#fde6d3', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999 },
  roleBtnText: { color: '#f97316', fontWeight: '700' },
  blockedBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  blockedText: { color: '#6b7280' },
});



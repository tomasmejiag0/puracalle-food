/**
 * PANTALLA: PERFIL DE USUARIO COMPLETO
 * 
 * Funcionalidades:
 * - Editar información personal (nombre, teléfono)
 * - Cambiar contraseña con confirmación por email de Supabase
 * - Ver información de la cuenta
 * - Badge de rol (User/Admin/Worker)
 * - Cerrar sesión
 * - Configuraciones adicionales
 */

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { getOwnProfile, updateOwnProfile, type Profile } from '@/services/users';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import { Key, Lock, LogOut, Mail, Phone, Shield, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { user, signOut, role } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await getOwnProfile();
      setProfile(data);
      if (data) {
        setFullName(data.full_name ?? '');
        setPhone(data.phone ?? '');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateOwnProfile({ full_name: fullName, phone });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅ ¡Listo!', 'Perfil actualizado correctamente');
      loadProfile();
    } catch (e: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('❌ Error', e.message ?? 'No se pudo actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    // Validaciones
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('⚠️ Error', 'La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('⚠️ Error', 'Las contraseñas no coinciden');
      return;
    }

    setChangingPassword(true);
    try {
      // Supabase enviará email de confirmación automáticamente
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '✅ ¡Contraseña Actualizada!',
        'Tu contraseña ha sido cambiada correctamente.',
        [
          {
            text: 'OK',
            onPress: () => {
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
              setShowPasswordSection(false);
            },
          },
        ]
      );
    } catch (e: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('❌ Error', e.message ?? 'No se pudo cambiar la contraseña');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          const ok = await signOut();
          if (ok) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace('/');
          }
        },
      },
    ]);
  };

  const getRoleBadge = () => {
    if (role === 'admin') return { text: '👑 Administrador', color: '#7c3aed' };
    if (role === 'worker') return { text: '🚗 Repartidor', color: '#f97316' };
    return { text: '👤 Usuario', color: '#3b82f6' };
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Mi Perfil', headerShown: false }} />
        <View style={styles.emptyBox}>
          <User size={60} color="#d1d5db" />
          <Text style={styles.emptyText}>Inicia sesión para ver tu perfil</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/auth')}>
            <Text style={styles.primaryBtnText}>Iniciar Sesión</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const roleBadge = getRoleBadge();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Mi Perfil', headerShown: false }} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header con Avatar y Rol */}
        <View style={styles.header}>
          <View style={styles.avatarBox}>
            <User size={48} color="#f97316" />
          </View>
          <Text style={styles.name}>{fullName || 'Usuario'}</Text>
          <Text style={styles.email}>{profile?.email ?? user.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: `${roleBadge.color}15` }]}>
            <Shield size={14} color={roleBadge.color} />
            <Text style={[styles.roleText, { color: roleBadge.color }]}>{roleBadge.text}</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#f97316" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Sección: Información Personal */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📝 Información Personal</Text>

              <Text style={styles.label}>Nombre Completo</Text>
              <View style={styles.inputRow}>
                <User size={20} color="#6b7280" />
                <TextInput
                  style={styles.input}
                  placeholder="Tu nombre completo"
                  placeholderTextColor="#9ca3af"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>

              <Text style={styles.label}>Teléfono</Text>
              <View style={styles.inputRow}>
                <Phone size={20} color="#6b7280" />
                <TextInput
                  style={styles.input}
                  placeholder="+57 300 123 4567"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>

              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputRow, styles.inputDisabled]}>
                <Mail size={20} color="#9ca3af" />
                <TextInput
                  style={[styles.input, { color: '#9ca3af' }]}
                  value={profile?.email ?? ''}
                  editable={false}
                />
                <Lock size={16} color="#9ca3af" />
              </View>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                <Text style={styles.primaryBtnText}>
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sección: Seguridad */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔒 Seguridad</Text>

              {!showPasswordSection ? (
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => setShowPasswordSection(true)}
                >
                  <Key size={20} color="#f97316" />
                  <Text style={styles.secondaryBtnText}>Cambiar Contraseña</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <Text style={styles.label}>Nueva Contraseña</Text>
                  <View style={styles.inputRow}>
                    <Lock size={20} color="#6b7280" />
                    <TextInput
                      style={styles.input}
                      placeholder="Mínimo 6 caracteres"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry
                      value={newPassword}
                      onChangeText={setNewPassword}
                      autoCapitalize="none"
                    />
                  </View>

                  <Text style={styles.label}>Confirmar Nueva Contraseña</Text>
                  <View style={styles.inputRow}>
                    <Lock size={20} color="#6b7280" />
                    <TextInput
                      style={styles.input}
                      placeholder="Repite la contraseña"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={[styles.secondaryBtn, { flex: 1 }]}
                      onPress={() => {
                        setShowPasswordSection(false);
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                    >
                      <Text style={styles.secondaryBtnText}>Cancelar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.primaryBtn, { flex: 1 }]}
                      onPress={handleChangePassword}
                      disabled={changingPassword}
                    >
                      <Text style={styles.primaryBtnText}>
                        {changingPassword ? 'Cambiando...' : 'Cambiar'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>

            {/* Botón de Cerrar Sesión */}
            <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
              <LogOut size={20} color="#dc2626" />
              <Text style={styles.signOutText}>Cerrar Sesión</Text>
            </TouchableOpacity>

            <View style={{ height: 100 }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef2e7',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  avatarBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 4,
    borderColor: '#f97316',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  name: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1f2937',
    marginBottom: 4,
  },
  email: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 12,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '800',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1f2937',
    marginBottom: 20,
  },
  label: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: '#fde6d3',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputDisabled: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  input: {
    flex: 1,
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '500',
  },
  primaryBtn: {
    backgroundColor: '#f97316',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#fed7aa',
    paddingVertical: 14,
    borderRadius: 12,
  },
  secondaryBtnText: {
    color: '#f97316',
    fontWeight: '800',
    fontSize: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fecaca',
    backgroundColor: 'white',
    marginTop: 8,
  },
  signOutText: {
    color: '#dc2626',
    fontWeight: '800',
    fontSize: 16,
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
});

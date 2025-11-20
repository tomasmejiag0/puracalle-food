import { useAuth } from '@/hooks/useAuth';
import { Stack, useRouter } from 'expo-router';
import { LogIn, UserPlus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AuthScreen() {
  const { signInWithEmail, signUpWithEmail, error, user } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email || !password) return;
    setLoading(true);
    const ok = mode === 'login'
      ? await signInWithEmail(email.trim(), password)
      : await signUpWithEmail(email.trim(), password);
    setLoading(false);
    if (ok) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Tu cuenta' }} />
      <View style={styles.header}>
        <Text style={styles.title}>Tu cuenta</Text>
        <Text style={styles.subtitle}>Inicia sesión o crea una cuenta para ordenar más rápido</Text>
      </View>
      <View style={styles.switcher}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setMode('login')}
          style={[styles.switchBtn, mode === 'login' ? styles.switchActive : undefined]}
        >
          <LogIn size={16} color={mode === 'login' ? '#fff' : '#f97316'} />
          <Text style={[styles.switchText, mode === 'login' ? styles.switchTextActive : undefined]}>Iniciar sesión</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setMode('signup')}
          style={[styles.switchBtn, mode === 'signup' ? styles.switchActive : undefined]}
        >
          <UserPlus size={16} color={mode === 'signup' ? '#fff' : '#f97316'} />
          <Text style={[styles.switchText, mode === 'signup' ? styles.switchTextActive : undefined]}>Crear cuenta</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="tucorreo@ejemplo.com"
          placeholderTextColor="#9ca3af"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />
        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          autoCapitalize="none"
          secureTextEntry
          placeholder="********"
          placeholderTextColor="#9ca3af"
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />
        {!!error && <Text style={styles.error}>{error}</Text>}
        {!!user && <Text style={styles.success}>¡Sesión activa!</Text>}
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.cta, styles.loginCta, { marginTop: 8 }]}
          disabled={loading}
          onPress={onSubmit}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              {mode === 'login' ? <LogIn size={20} color="#fff" /> : <UserPlus size={20} color="#fff" />}
              <Text style={styles.ctaTextPrimary}>{mode === 'login' ? 'Entrar' : 'Crear cuenta'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef2e7',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
  },
  subtitle: {
    color: '#6b7280',
    fontSize: 14,
  },
  switcher: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#fde6d3',
    borderRadius: 999,
  },
  switchActive: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  switchText: {
    color: '#f97316',
    fontWeight: '600',
  },
  switchTextActive: {
    color: '#fff',
  },
  form: {
    padding: 24,
    gap: 8,
  },
  label: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#fde6d3',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    color: '#1f2937',
  },
  actions: {
    padding: 24,
    gap: 16,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  loginCta: {
    backgroundColor: '#f97316',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  signupCta: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#fde6d3',
  },
  ctaTextPrimary: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  ctaTextSecondary: {
    color: '#f97316',
    fontWeight: '700',
    fontSize: 16,
  },
  error: {
    color: '#b91c1c',
    marginTop: 6,
  },
  success: {
    color: '#166534',
    marginTop: 6,
  },
  helper: {
    color: '#6b7280',
    fontSize: 12,
    paddingHorizontal: 24,
  },
});



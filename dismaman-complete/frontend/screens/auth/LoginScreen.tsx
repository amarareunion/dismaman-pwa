import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { FormInput } from '../../components/FormInput';
import { LoginLoadingSpinner } from '../../components/LoginLoadingSpinner';

export default function LoginScreen() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoginInProgress, setIsLoginInProgress] = useState(false);
  
  // États simples pour les champs - vides pour la production
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Debug de la fonction login
  console.log('🔍 Login function from context:', typeof login, !!login);

  const onSubmit = async () => {
    console.log('🔐 BOUTON LOGIN CLIQUÉ !');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password ? '***' : 'VIDE');
    console.log('🔍 Login function available:', typeof login, !!login);
    
    if (!login) {
      console.error('❌ La fonction login n\'est pas disponible dans le contexte !');
      Alert.alert('Erreur', 'Service de connexion indisponible');
      return;
    }
    
    if (!email || !password) {
      console.log('❌ Champs manquants');
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    
    console.log('✅ Champs valides, début du login...');
    setIsLoginInProgress(true);

    try {
      console.log('🚀 Appel de la fonction login du contexte...');
      
      const result = await login({
        email: email,
        password: password,
      });
      
      console.log('✅ Login réussi, résultat:', result);
      router.replace('/');
      
    } catch (error: any) {
      console.error('🚨 Erreur de login complète:', error);
      console.error('🚨 Message d\'erreur:', error.message);
      console.error('🚨 Stack:', error.stack);
      
      const errorMessage = error.message || 'Erreur de connexion inconnue';
      Alert.alert('Erreur de connexion', errorMessage);
    } finally {
      console.log('🔄 Fin du processus de login');
      setIsLoginInProgress(false);
    }
  };

  const navigateToRegister = () => {
    router.push('/auth/register');
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#f093fb']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* App Logo */}
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>🤱 Dis Maman !</Text>
              <Text style={styles.tagline}>
                L'appli magique pour répondre aux questions de tes enfants
              </Text>
            </View>

            {/* Trial Banner */}
            <TouchableOpacity
              style={styles.trialBanner}
              onPress={navigateToRegister}
              activeOpacity={0.8}
            >
              <View style={styles.trialContent}>
                <Ionicons name="gift" size={24} color="#ff6b9d" />
                <Text style={styles.trialText}>Essai Gratuit 30 Jours</Text>
                <Ionicons name="arrow-forward" size={20} color="#ff6b9d" />
              </View>
              <Text style={styles.trialSubtext}>Clique ici pour t'inscrire</Text>
            </TouchableOpacity>

            {/* Login Form */}
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Connexion</Text>

              {/* Email Input */}
              <FormInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="contact@dismaman.fr"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                leftIcon="mail"
              />

              {/* Password Input */}
              <FormInput
                label="Mot de passe"
                value={password}
                onChangeText={setPassword}
                placeholder="Test123!"
                secureTextEntry={!showPassword}
                autoComplete="password"
                leftIcon="lock-closed"
                rightIcon={showPassword ? "eye-off" : "eye"}
                onRightIconPress={() => setShowPassword(!showPassword)}
              />

              {/* Login Button */}
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  isLoginInProgress && styles.loginButtonDisabled
                ]}
                onPress={() => {
                  console.log('🔘 TouchableOpacity cliqué !');
                  onSubmit();
                }}
                disabled={isLoginInProgress}
                activeOpacity={0.8}
              >
                {isLoginInProgress ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons name="log-in" size={20} color="white" />
                    <Text style={styles.loginButtonText}>Se connecter</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Register Link */}
              <TouchableOpacity
                style={styles.registerLink}
                onPress={navigateToRegister}
              >
                <Text style={styles.registerLinkText}>
                  Pas encore de compte ?{' '}
                  <Text style={styles.registerLinkHighlight}>Inscris-toi gratuitement !</Text>
                </Text>
              </TouchableOpacity>

              {/* Forgot Password */}
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>
                  Mot de passe oublié ?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                En te connectant, tu acceptes nos conditions d'utilisation
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      
      {/* Loading Spinner */}
      <LoginLoadingSpinner
        visible={isLoginInProgress}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  trialBanner: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 2,
    borderColor: 'rgba(255,107,157,0.3)',
  },
  trialContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  trialText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 12,
  },
  trialSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  formContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#ff6b9d',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    elevation: 3,
    shadowColor: '#ff6b9d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
    elevation: 0,
    shadowOpacity: 0,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  registerLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  registerLinkText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    textAlign: 'center',
  },
  registerLinkHighlight: {
    color: '#ff6b9d',
    fontWeight: 'bold',
  },
  forgotPassword: {
    marginTop: 12,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 20,
  },
  footerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  // Temporary test button styles
  testButton: {
    backgroundColor: 'rgba(255, 193, 7, 0.8)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 1)',
  },
  testButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
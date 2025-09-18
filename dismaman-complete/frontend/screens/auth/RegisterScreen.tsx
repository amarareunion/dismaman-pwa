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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { FormInput } from '../../components/FormInput';

interface RegisterFormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const registerSchema = yup.object().shape({
  first_name: yup
    .string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .required('Le prénom est requis'),
  last_name: yup
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .required('Le nom est requis'),
  email: yup
    .string()
    .email('Format d\'email invalide')
    .required('L\'email est requis'),
  password: yup
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'
    )
    .required('Le mot de passe est requis'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Les mots de passe ne correspondent pas')
    .required('La confirmation du mot de passe est requise'),
});

export default function RegisterScreen() {
  const { register, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPassword, ...registerData } = data;
      await register(registerData);
      // Navigation will be handled automatically by AuthContext
    } catch (error: any) {
      Alert.alert('Erreur d\'inscription', error.message);
    }
  };

  const navigateToLogin = () => {
    router.push('/auth/login');
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
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Inscription Gratuite</Text>
            </View>

            {/* Welcome Section */}
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeTitle}>🎉 Bienvenue !</Text>
              <Text style={styles.welcomeText}>
                Crée ton compte gratuit et profite de 30 jours d'essai complet !
              </Text>
            </View>

            {/* Benefits */}
            <View style={styles.benefitsContainer}>
              <View style={styles.benefit}>
                <Ionicons name="gift" size={20} color="#4ade80" />
                <Text style={styles.benefitText}>30 jours gratuits</Text>
              </View>
              <View style={styles.benefit}>
                <Ionicons name="people" size={20} color="#4ade80" />
                <Text style={styles.benefitText}>Jusqu'à 4 enfants</Text>
              </View>
              <View style={styles.benefit}>
                <Ionicons name="chatbubble-ellipses" size={20} color="#4ade80" />
                <Text style={styles.benefitText}>Questions illimitées</Text>
              </View>
            </View>

            {/* Registration Form */}
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Tes informations</Text>

              {/* First Name */}
              <Controller
                control={control}
                name="first_name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FormInput
                    label="Prénom"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Ton prénom"
                    autoCapitalize="words"
                    autoComplete="given-name"
                    leftIcon="person"
                    error={errors.first_name?.message}
                  />
                )}
              />

              {/* Last Name */}
              <Controller
                control={control}
                name="last_name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FormInput
                    label="Nom"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Ton nom de famille"
                    autoCapitalize="words"
                    autoComplete="family-name"
                    leftIcon="person-outline"
                    error={errors.last_name?.message}
                  />
                )}
              />

              {/* Email */}
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FormInput
                    label="Email"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="ton.email@exemple.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    leftIcon="mail"
                    error={errors.email?.message}
                  />
                )}
              />

              {/* Password */}
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FormInput
                    label="Mot de passe"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Crée un mot de passe sécurisé"
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
                    leftIcon="lock-closed"
                    rightIcon={showPassword ? "eye-off" : "eye"}
                    onRightIconPress={() => setShowPassword(!showPassword)}
                    error={errors.password?.message}
                  />
                )}
              />

              {/* Confirm Password */}
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FormInput
                    label="Confirmer le mot de passe"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Tape ton mot de passe à nouveau"
                    secureTextEntry={!showConfirmPassword}
                    autoComplete="new-password"
                    leftIcon="lock-closed"
                    rightIcon={showConfirmPassword ? "eye-off" : "eye"}
                    onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    error={errors.confirmPassword?.message}
                  />
                )}
              />

              {/* Register Button */}
              <TouchableOpacity
                style={[
                  styles.registerButton,
                  (!isValid || isLoading) && styles.registerButtonDisabled
                ]}
                onPress={handleSubmit(onSubmit)}
                disabled={!isValid || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons name="rocket" size={20} color="white" />
                    <Text style={styles.registerButtonText}>Commencer l'essai gratuit</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Login Link */}
              <TouchableOpacity
                style={styles.loginLink}
                onPress={navigateToLogin}
              >
                <Text style={styles.loginLinkText}>
                  Déjà un compte ?{' '}
                  <Text style={styles.loginLinkHighlight}>Connecte-toi ici</Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                En créant un compte, tu acceptes nos{' '}
                <Text style={styles.footerLink}>conditions d'utilisation</Text>
                {' '}et notre{' '}
                <Text style={styles.footerLink}>politique de confidentialité</Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  benefitsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  benefit: {
    alignItems: 'center',
    flex: 1,
  },
  benefitText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  registerButton: {
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
  registerButtonDisabled: {
    opacity: 0.6,
    elevation: 0,
    shadowOpacity: 0,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginLinkText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    textAlign: 'center',
  },
  loginLinkHighlight: {
    color: '#ff6b9d',
    fontWeight: 'bold',
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
  footerLink: {
    textDecorationLine: 'underline',
    color: 'rgba(255,255,255,0.8)',
  },
});
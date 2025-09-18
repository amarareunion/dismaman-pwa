import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

// API Configuration
const api = axios.create({
  baseURL: BACKEND_URL + '/api',
  timeout: 10000,
});

// Add token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface MonetizationStatus {
  is_premium: boolean;
  trial_days_left: number;
  questions_asked: number;
  popup_frequency: string;
}

export default function SubscriptionScreen() {
  const [status, setStatus] = useState<MonetizationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const response = await api.get('/monetization/status');
      setStatus(response.data);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger le statut d\'abonnement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    
    Alert.alert(
      '🚀 Abonnement Premium',
      'Cette fonctionnalité nécessite l\'intégration avec l\'App Store/Google Play. En production, l\'achat se ferait ici.',
      [
        {
          text: 'Annuler',
          style: 'cancel',
          onPress: () => setIsSubscribing(false)
        },
        {
          text: 'Simuler l\'achat',
          onPress: async () => {
            try {
              // Simulate subscription
              await api.post('/monetization/subscribe');
              Alert.alert(
                '🎉 Félicitations !',
                'Ton abonnement Premium est maintenant actif ! Questions illimitées débloquées !',
                [
                  {
                    text: 'Super !',
                    onPress: () => {
                      router.back();
                    }
                  }
                ]
              );
            } catch (error) {
              Alert.alert('Erreur', 'Impossible d\'activer l\'abonnement');
            } finally {
              setIsSubscribing(false);
            }
          }
        }
      ]
    );
  };

  const features = [
    { icon: '🔓', title: 'Questions illimitées', description: 'Pose autant de questions que tu veux !' },
    { icon: '🧠', title: 'IA avancée', description: 'Réponses adaptées à l\'âge de chaque enfant' },
    { icon: '🗣️', title: 'Synthèse vocale', description: 'Écoute les réponses avec une voix naturelle' },
    { icon: '📚', title: 'Historique complet', description: 'Retrouve toutes vos conversations' },
    { icon: '👨‍👩‍👧‍👦', title: 'Jusqu\'à 4 enfants', description: 'Gère les questions de toute la famille' },
    { icon: '🎨', title: 'Interface ludique', description: 'Design coloré et amusant pour les enfants' },
  ];

  if (isLoading) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="white" />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (status?.is_premium) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Premium</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.premiumContainer}>
            <Text style={styles.premiumEmoji}>🎉</Text>
            <Text style={styles.premiumTitle}>Tu es Premium !</Text>
            <Text style={styles.premiumSubtitle}>
              Profite de toutes les fonctionnalités sans limite !
            </Text>
            
            <View style={styles.premiumFeatures}>
              <View style={styles.premiumFeature}>
                <Ionicons name="checkmark-circle" size={24} color="#4ade80" />
                <Text style={styles.premiumFeatureText}>Questions illimitées</Text>
              </View>
              <View style={styles.premiumFeature}>
                <Ionicons name="checkmark-circle" size={24} color="#4ade80" />
                <Text style={styles.premiumFeatureText}>Accès complet à l'IA</Text>
              </View>
              <View style={styles.premiumFeature}>
                <Ionicons name="checkmark-circle" size={24} color="#4ade80" />
                <Text style={styles.premiumFeatureText}>Historique illimité</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.backToAppButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backToAppButtonText}>Retourner à l'app</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#f093fb']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Devenir Premium</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Trial Status */}
          {status && status.trial_days_left > 0 && (
            <View style={styles.trialContainer}>
              <Text style={styles.trialTitle}>🆓 Essai gratuit</Text>
              <Text style={styles.trialText}>
                {status.trial_days_left} jour{status.trial_days_left > 1 ? 's' : ''} restant{status.trial_days_left > 1 ? 's' : ''}
              </Text>
              <Text style={styles.trialSubtext}>
                {status.questions_asked} question{status.questions_asked > 1 ? 's' : ''} posée{status.questions_asked > 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {/* Premium Banner */}
          <View style={styles.premiumBanner}>
            <Text style={styles.bannerEmoji}>🌟</Text>
            <Text style={styles.bannerTitle}>Dis Maman ! Premium</Text>
            <Text style={styles.bannerSubtitle}>Questions illimitées pour toute la famille</Text>
          </View>

          {/* Features List */}
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>Ce que tu obtiens :</Text>
            {features.map((feature, index) => (
              <View key={index} style={styles.feature}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Benefits */}
          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>Pourquoi Premium ?</Text>
            <View style={styles.benefit}>
              <Ionicons name="heart" size={20} color="#ff6b9d" />
              <Text style={styles.benefitText}>Soutenir le développement de l'app</Text>
            </View>
            <View style={styles.benefit}>
              <Ionicons name="shield-checkmark" size={20} color="#4ade80" />
              <Text style={styles.benefitText}>Réponses sûres et adaptées aux enfants</Text>
            </View>
            <View style={styles.benefit}>
              <Ionicons name="time" size={20} color="#fbbf24" />
              <Text style={styles.benefitText}>Mises à jour régulières et nouvelles fonctionnalités</Text>
            </View>
          </View>

          {/* Subscribe Buttons - Moved from middle to bottom */}
          <View style={styles.subscribeContainer}>
            <Text style={styles.subscribeTitle}>Choisis ton abonnement :</Text>
            
            {/* Option Mensuelle - Moins visible */}
            <TouchableOpacity 
              style={[styles.subscriptionButton, styles.monthlyButtonBottom]}
              onPress={handleSubscribe}
              disabled={isSubscribing}
            >
              <View style={styles.subscriptionHeader}>
                <Text style={styles.subscriptionTitleBottom}>Mensuel</Text>
                <Text style={styles.subscriptionPriceBottom}>5,99€</Text>
              </View>
              <Text style={styles.subscriptionPeriodBottom}>par mois</Text>
              <Text style={styles.subscriptionNoteBottom}>Annulation à tout moment</Text>
            </TouchableOpacity>

            {/* Option Annuelle - Mise en avant avec fond blanc */}
            <TouchableOpacity 
              style={[styles.subscriptionButton, styles.yearlyButtonBottom]}
              onPress={handleSubscribe}
              disabled={isSubscribing}
            >
              <View style={styles.popularBadgeBottom}>
                <Text style={styles.popularTextBottom}>🔥 RECOMMANDÉ</Text>
              </View>
              <View style={styles.subscriptionHeader}>
                <Text style={styles.subscriptionTitleBottomHighlight}>Annuel</Text>
                <Text style={styles.subscriptionPriceBottomHighlight}>59,90€</Text>
              </View>
              <Text style={styles.subscriptionPeriodBottomHighlight}>par an</Text>
              <Text style={styles.subscriptionSavingsBottom}>💰 Économise 2 mois !</Text>
              <Text style={styles.subscriptionNoteBottomHighlight}>Soit 4,99€/mois</Text>
            </TouchableOpacity>
            
            <Text style={styles.subscribeNote}>
              • Annulation possible à tout moment{'\n'}
              • Renouvellement automatique{'\n'}
              • Pas d'engagement
            </Text>
            
            <View style={styles.legalLinks}>
              <TouchableOpacity 
                style={styles.legalLink}
                onPress={() => Linking.openURL('https://www.dismaman.com/privacy-policy.html')}
              >
                <Text style={styles.legalLinkText}>Politique de Confidentialité</Text>
              </TouchableOpacity>
              
              <Text style={styles.legalSeparator}> • </Text>
              
              <TouchableOpacity 
                style={styles.legalLink}
                onPress={() => Linking.openURL('https://www.dismaman.com/terms-of-use.html')}
              >
                <Text style={styles.legalLinkText}>Conditions d'Utilisation</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  trialContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  trialTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  trialText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 4,
  },
  trialSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  premiumBanner: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  bannerEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  bannerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bannerPrice: {
    color: '#ff6b9d',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bannerOffer: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
    fontWeight: '600',
  },
  bannerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  
  // Subscription Options Styles
  subscriptionOptions: {
    paddingHorizontal: 20,
    marginVertical: 24,
    gap: 16,
  },
  subscriptionButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    padding: 20,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  monthlyButton: {
    borderWidth: 2,
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  yearlyButton: {
    borderWidth: 2,
    borderColor: '#667eea',
    backgroundColor: 'rgba(102, 126, 234, 0.05)',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  popularText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subscriptionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subscriptionPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
  },
  subscriptionPeriod: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  subscriptionSavings: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 4,
  },
  subscriptionNote: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  featuresContainer: {
    marginBottom: 32,
  },
  featuresTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  featureDescription: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  benefitsContainer: {
    marginBottom: 32,
  },
  benefitsTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  subscribeContainer: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  subscribeButton: {
    backgroundColor: '#ff6b9d',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    width: '100%',
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  subscribeNote: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  premiumContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  premiumEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  premiumTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  premiumSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  premiumFeatures: {
    marginBottom: 32,
  },
  premiumFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  premiumFeatureText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 12,
  },
  backToAppButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  backToAppButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // New styles for bottom subscription buttons
  subscribeTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  
  // Monthly button - less visible (transparent)
  monthlyButtonBottom: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    marginBottom: 12,
  },
  
  // Yearly button - highly visible (white background)
  yearlyButtonBottom: {
    backgroundColor: 'white',
    borderWidth: 3,
    borderColor: '#FFD700',
    marginBottom: 12,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  popularBadgeBottom: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  
  popularTextBottom: {
    color: '#333',
    fontSize: 10,
    fontWeight: 'bold',
  },
  
  // Text styles for bottom buttons
  subscriptionTitleBottom: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.9)',
  },
  
  subscriptionTitleBottomHighlight: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  
  subscriptionPriceBottom: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.9)',
  },
  
  subscriptionPriceBottomHighlight: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
  },
  
  subscriptionPeriodBottom: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  
  subscriptionPeriodBottomHighlight: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  
  subscriptionNoteBottom: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontStyle: 'italic',
  },
  
  subscriptionNoteBottomHighlight: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  
  subscriptionSavingsBottom: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 4,
  },
  
  // Legal links styles
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  
  legalLink: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  
  legalLinkText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  
  legalSeparator: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginHorizontal: 8,
  },
});
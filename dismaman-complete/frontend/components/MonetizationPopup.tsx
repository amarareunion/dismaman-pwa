import React from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface MonetizationPopupProps {
  visible: boolean;
  onClose: () => void;
  type: 'child_selection' | 'monthly_limit' | 'inactive_child' | 'feedback_premium' | 'history_premium';
  onSubscribe: (type: 'monthly' | 'annual') => void;
  extraMessage?: string;
}

const { width } = Dimensions.get('window');

export const MonetizationPopup: React.FC<MonetizationPopupProps> = ({
  visible,
  onClose,
  type,
  onSubscribe,
  extraMessage = '',
}) => {
  const getContent = () => {
    switch (type) {
      case 'child_selection':
        return {
          title: '🎁 Fin de l\'essai gratuit',
          message: 'Votre mois d\'essai est terminé ! Choisissez votre formule pour continuer à profiter de "Dis Maman !" avec tous vos enfants.',
          showLimitations: true,
        };
      case 'monthly_limit':
        return {
          title: '📊 Limite mensuelle atteinte',
          message: extraMessage || 'Une seule question par mois en version gratuite ! Passez au Premium pour des questions illimitées.',
          showLimitations: false,
        };
      case 'inactive_child':
        return {
          title: '👶 Enfant non actif',
          message: 'Cet enfant n\'est pas disponible en version gratuite. Passez au Premium pour utiliser tous vos enfants.',
          showLimitations: false,
        };
      case 'feedback_premium':
        return {
          title: '🧠 Fonctionnalité Premium',
          message: 'Les boutons "Plus d\'infos" et "Trop difficile" sont disponibles uniquement en version Premium.',
          showLimitations: false,
        };
      case 'history_premium':
        return {
          title: '📚 Historique Premium',
          message: extraMessage || 'L\'accès à l\'historique des conversations nécessite un abonnement Premium pour retrouver toutes vos discussions passées.',
          showLimitations: false,
        };
      default:
        return {
          title: '🌟 Découvrez Premium',
          message: 'Débloquez toutes les fonctionnalités de "Dis Maman !"',
          showLimitations: true,
        };
    }
  };

  const content = getContent();

  const handleMonthlySubscribe = () => {
    Alert.alert(
      'Abonnement Mensuel',
      'Redirection vers l\'abonnement mensuel à 5,99€/mois',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'S\'abonner', onPress: () => onSubscribe('monthly') },
      ]
    );
  };

  const handleAnnualSubscribe = () => {
    Alert.alert(
      'Abonnement Annuel',
      'Redirection vers l\'abonnement annuel à 59,90€/an (2 mois offerts)',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'S\'abonner', onPress: () => onSubscribe('annual') },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.popup}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.header}
          >
            <Text style={styles.title}>{content.title}</Text>
          </LinearGradient>

          <View style={styles.content}>
            <Text style={styles.message}>{content.message}</Text>

            {content.showLimitations && (
              <View style={styles.limitsContainer}>
                <Text style={styles.limitsTitle}>Version gratuite :</Text>
                <Text style={styles.limitItem}>• 1 seul enfant actif</Text>
                <Text style={styles.limitItem}>• 1 question par mois maximum</Text>
                <Text style={styles.limitItem}>• Pas de boutons de feedback</Text>
              </View>
            )}

            <View style={styles.plansContainer}>
              <Text style={styles.plansTitle}>🌟 Choisissez votre formule Premium</Text>

              {/* Plan Mensuel */}
              <TouchableOpacity style={styles.planButton} onPress={handleMonthlySubscribe}>
                <LinearGradient
                  colors={['#ff6b9d', '#c44569']}
                  style={styles.planGradient}
                >
                  <View style={styles.planContent}>
                    <Text style={styles.planPrice}>5,99€</Text>
                    <Text style={styles.planPeriod}>par mois</Text>
                    <Text style={styles.planDescription}>Sans engagement</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Plan Annuel */}
              <TouchableOpacity style={styles.planButton} onPress={handleAnnualSubscribe}>
                <LinearGradient
                  colors={['#2ecc71', '#27ae60']}
                  style={styles.planGradient}
                >
                  <View style={styles.planBadge}>
                    <Text style={styles.planBadgeText}>2 MOIS OFFERTS</Text>
                  </View>
                  <View style={styles.planContent}>
                    <Text style={styles.planPrice}>59,90€</Text>
                    <Text style={styles.planPeriod}>par an</Text>
                    <Text style={styles.planDescription}>Soit 4,99€/mois</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.featuresContainer}>
              <Text style={styles.featuresTitle}>✨ Avec Premium :</Text>
              <Text style={styles.feature}>🧒 Tous vos enfants actifs</Text>
              <Text style={styles.feature}>❓ Questions illimitées</Text>
              <Text style={styles.feature}>🧠 Boutons "Plus d'infos" & "Trop difficile"</Text>
              <Text style={styles.feature}>🎯 Explications approfondies et ludiques</Text>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Plus tard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  popup: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
    marginBottom: 20,
    lineHeight: 22,
  },
  limitsContainer: {
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  limitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 8,
  },
  limitItem: {
    fontSize: 14,
    color: '#991b1b',
    marginBottom: 4,
  },
  plansContainer: {
    marginBottom: 20,
  },
  plansTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 16,
  },
  planButton: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  planGradient: {
    padding: 16,
    position: 'relative',
  },
  planBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
  },
  planBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  planContent: {
    alignItems: 'center',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  planPeriod: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  featuresContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  feature: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  closeButton: {
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
});
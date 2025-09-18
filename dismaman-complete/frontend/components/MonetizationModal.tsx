import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useMonetization } from '../contexts/MonetizationContext';

const { width, height } = Dimensions.get('window');

interface MonetizationModalProps {
  visible: boolean;
  onClose?: () => void;
}

export const MonetizationModal: React.FC<MonetizationModalProps> = ({
  visible,
  onClose,
}) => {
  const {
    status,
    popupType,
    isLoading,
    purchaseSubscription,
    restorePurchases,
    trackPopupShown,
    hidePopup,
  } = useMonetization();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Track popup shown
      trackPopupShown();
      
      // Animate modal entrance
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();

      // Pulsing animation for urgent popups
      if (popupType === 'warning' || popupType === 'blocking') {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.05,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    } else {
      scaleAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [visible, popupType]);

  const handlePurchase = async () => {
    const success = await purchaseSubscription();
    if (success && onClose) {
      onClose();
    }
  };

  const handleClose = () => {
    if (popupType !== 'blocking') {
      hidePopup();
      if (onClose) onClose();
    }
  };

  const getModalContent = () => {
    switch (popupType) {
      case 'trial':
        return {
          colors: ['#10b981', '#059669'],
          icon: 'gift',
          title: '🎁 Essai gratuit actif',
          subtitle: `Plus que ${status?.trial_days_left} jour${(status?.trial_days_left || 0) > 1 ? 's' : ''} !`,
          description: 'Découvre toutes les fonctionnalités Premium avant de t\'abonner.',
          urgency: false,
        };
        
      case 'warning':
        return {
          colors: ['#f59e0b', '#f97316'],
          icon: 'warning',
          title: '⚠️ Dernière semaine !',
          subtitle: `${status?.trial_days_left} jour${(status?.trial_days_left || 0) > 1 ? 's' : ''} restant${(status?.trial_days_left || 0) > 1 ? 's' : ''}`,
          description: 'Ton essai gratuit se termine bientôt. Abonne-toi pour continuer !',
          urgency: true,
        };
        
      case 'blocking':
        return {
          colors: ['#ef4444', '#dc2626'],
          icon: 'lock-closed',
          title: '🔒 Essai terminé',
          subtitle: 'Abonnement requis',
          description: 'Ton essai gratuit est terminé. Abonne-toi pour continuer à utiliser Dis Maman !',
          urgency: true,
        };
        
      default:
        return {
          colors: ['#8b5cf6', '#7c3aed'],
          icon: 'star',
          title: '⭐ Passe Premium',
          subtitle: 'Débloque toutes les fonctionnalités',
          description: 'Questions illimitées et réponses personnalisées pour tes enfants.',
          urgency: false,
        };
    }
  };

  const content = getModalContent();
  const canDismiss = popupType !== 'blocking';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [
                { scale: scaleAnim },
                { scale: content.urgency ? pulseAnim : 1 }
              ],
            },
          ]}
        >
          <LinearGradient
            colors={content.colors}
            style={styles.modal}
          >
            {/* Close button (only if dismissible) */}
            {canDismiss && (
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            )}

            {/* Header */}
            <View style={styles.header}>
              <Ionicons name={content.icon as any} size={48} color="white" />
              <Text style={styles.title}>{content.title}</Text>
              <Text style={styles.subtitle}>{content.subtitle}</Text>
            </View>

            {/* Description */}
            <Text style={styles.description}>{content.description}</Text>

            {/* Premium Benefits */}
            <View style={styles.benefits}>
              <View style={styles.benefit}>
                <Ionicons name="infinite" size={20} color="white" />
                <Text style={styles.benefitText}>Questions illimitées</Text>
              </View>
              <View style={styles.benefit}>
                <Ionicons name="brain" size={20} color="white" />
                <Text style={styles.benefitText}>Réponses détaillées</Text>
              </View>
              <View style={styles.benefit}>
                <Ionicons name="headset" size={20} color="white" />
                <Text style={styles.benefitText}>Support prioritaire</Text>
              </View>
              <View style={styles.benefit}>
                <Ionicons name="people" size={20} color="white" />
                <Text style={styles.benefitText}>Jusqu'à 4 enfants</Text>
              </View>
            </View>

            {/* Pricing */}
            <View style={styles.pricingContainer}>
              <View style={styles.priceBadge}>
                <Text style={styles.badgeText}>Meilleure offre</Text>
              </View>
              <Text style={styles.price}>3,99€</Text>
              <Text style={styles.pricePeriod}>par mois</Text>
            </View>

            {/* Trust indicators */}
            <View style={styles.trustIndicators}>
              <View style={styles.trustItem}>
                <Ionicons name="checkmark-circle" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.trustText}>Résiliable à tout moment</Text>
              </View>
              <View style={styles.trustItem}>
                <Ionicons name="shield-checkmark" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.trustText}>Pas d'engagement</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.subscribeButton}
                onPress={handlePurchase}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="star" size={20} color="white" />
                    <Text style={styles.subscribeButtonText}>
                      S'abonner maintenant
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {canDismiss && popupType === 'trial' && (
                <TouchableOpacity
                  style={styles.continueTrialButton}
                  onPress={handleClose}
                >
                  <Text style={styles.continueTrialButtonText}>
                    Continuer l'essai
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.restoreButton}
                onPress={restorePurchases}
              >
                <Text style={styles.restoreButtonText}>
                  Restaurer mes achats
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
  },
  modal: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  benefits: {
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
  },
  benefitText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 12,
    fontWeight: '500',
  },
  pricingContainer: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  priceBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  pricePeriod: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  trustIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trustText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginLeft: 6,
  },
  actions: {
    alignSelf: 'stretch',
    gap: 12,
  },
  subscribeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  continueTrialButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  continueTrialButtonText: {
    color: 'white',
    fontSize: 16,
  },
  restoreButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  restoreButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
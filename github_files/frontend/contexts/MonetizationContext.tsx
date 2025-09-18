import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import { api } from './AuthContext';

// Try to import in-app purchases with fallback
let InAppPurchases: any = null;
try {
  InAppPurchases = require('expo-in-app-purchases');
} catch (error) {
  console.warn('In-App Purchases not available in this environment:', error);
}

export const SUBSCRIPTION_ID = 'dis_maman_premium_monthly';

interface MonetizationStatus {
  is_premium: boolean;
  trial_days_left: number;
  questions_asked: number;
  popup_frequency: string;
  trial_start_date: string;
  last_popup_shown: string;
}

interface MonetizationContextType {
  // Status
  isLoading: boolean;
  isPremium: boolean;
  trialDaysLeft: number;
  questionsThisMonth: number;
  
  // New fields for enhanced monetization
  popupType: 'none' | 'child_selection' | 'monthly_limit' | 'inactive_child' | 'feedback_premium' | 'history_premium';
  isPostTrialSetupRequired: boolean;
  activeChildId: string | null;
  subscriptionType: 'monthly' | 'annual' | null;
  
  // Actions
  refreshStatus: () => Promise<void>;
  selectActiveChild: (childId: string) => Promise<void>;
  purchaseSubscription: (type: 'monthly' | 'annual') => Promise<boolean>;
  showMonetizationPopup: (type: 'child_selection' | 'monthly_limit' | 'inactive_child' | 'feedback_premium' | 'history_premium', extraMessage?: string) => void;
  hideMonetizationPopup: () => void;
  
  // Popup state
  isPopupVisible: boolean;
  popupExtraMessage: string;
}

const MonetizationContext = createContext<MonetizationContextType | null>(null);

export const MonetizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Enhanced state for new monetization system
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [questionsThisMonth, setQuestionsThisMonth] = useState(0);
  const [popupType, setPopupType] = useState<'none' | 'child_selection' | 'monthly_limit' | 'inactive_child' | 'feedback_premium' | 'history_premium'>('none');
  const [isPostTrialSetupRequired, setIsPostTrialSetupRequired] = useState(false);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [subscriptionType, setSubscriptionType] = useState<'monthly' | 'annual' | null>(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [popupExtraMessage, setPopupExtraMessage] = useState('');

  const refreshStatus = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/monetization/status');
      const data = response.data;
      
      setIsPremium(data.is_premium);
      setTrialDaysLeft(data.trial_days_left);
      setQuestionsThisMonth(data.questions_this_month || 0);
      setActiveChildId(data.active_child_id);
      setSubscriptionType(data.subscription_type);
      
      // NOUVELLE LOGIQUE : Détection post-essai avec multiple enfants
      const needsChildSelection = !data.is_premium && 
                                  data.trial_days_left <= 0 && 
                                  data.is_post_trial_setup_required;
      
      console.log('🔍 Post-trial check:', {
        is_premium: data.is_premium,
        trial_days_left: data.trial_days_left,
        needs_selection: needsChildSelection,
        active_child_id: data.active_child_id
      });
      
      setIsPostTrialSetupRequired(needsChildSelection);
      
      // Si l'utilisateur a besoin de sélectionner un enfant, on déclenche le popup
      if (needsChildSelection) {
        console.log('🚨 POPUP SELECTION ENFANT REQUIS post-essai');
        showMonetizationPopup('child_selection');
      }
      
    } catch (error) {
      console.error('Error fetching monetization status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectActiveChild = async (childId: string): Promise<void> => {
    try {
      await api.post('/monetization/select-active-child', { child_id: childId });
      setActiveChildId(childId);
      setIsPostTrialSetupRequired(false);
      setIsPopupVisible(false);
      setPopupType('none');
      
      // Refresh status to get updated data
      await refreshStatus();
    } catch (error) {
      console.error('Error selecting active child:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner cet enfant. Réessayez.');
    }
  };

  const purchaseSubscription = async (type: 'monthly' | 'annual'): Promise<boolean> => {
    try {
      setIsLoading(true);

      // In development, simulate subscription purchase
      Alert.alert(
        '🚧 Mode Développement',
        `Simulation d'achat: ${type === 'monthly' ? '5,99€/mois' : '59,90€/an (2 mois offerts)'}.\n\nEn production, ceci déclencherait le processus d'achat réel.`,
        [
          { text: 'Annuler', style: 'cancel', onPress: () => {} },
          { 
            text: 'Simuler Achat', 
            onPress: async () => {
              try {
                // Simulate successful purchase
                await api.post('/monetization/subscribe', {
                  subscription_type: type,
                  transaction_id: `dev_${Date.now()}`
                });
                
                // Refresh status
                await refreshStatus();
                setIsPopupVisible(false);
                setPopupType('none');
                
                Alert.alert('🎉 Abonnement Activé !', 
                  `Félicitations ! Vous avez maintenant accès à toutes les fonctionnalités Premium de "Dis Maman !"`,
                  [{ text: 'Super !', style: 'default' }]
                );
              } catch (error) {
                console.error('Subscription simulation error:', error);
                Alert.alert('Erreur', 'Erreur lors de la simulation d\'abonnement.');
              }
            }
          }
        ]
      );

      return false; // Return false since we're simulating
    } catch (error: any) {
      console.error('Purchase error:', error);
      Alert.alert('Erreur d\'achat', 'Impossible de traiter l\'abonnement. Réessayez plus tard.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const showMonetizationPopup = (
    type: 'child_selection' | 'monthly_limit' | 'inactive_child' | 'feedback_premium' | 'history_premium',
    extraMessage: string = ''
  ) => {
    setPopupType(type);
    setPopupExtraMessage(extraMessage);
    setIsPopupVisible(true);
  };

  const hideMonetizationPopup = () => {
    setIsPopupVisible(false);
    setPopupType('none');
    setPopupExtraMessage('');
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const value: MonetizationContextType = {
    // Status
    isLoading,
    isPremium,
    trialDaysLeft,
    questionsThisMonth,
    
    // Enhanced fields
    popupType,
    isPostTrialSetupRequired,
    activeChildId,
    subscriptionType,
    
    // Actions
    refreshStatus,
    selectActiveChild,
    purchaseSubscription,
    showMonetizationPopup,
    hideMonetizationPopup,
    
    // Popup state
    isPopupVisible,
    popupExtraMessage,
  };

  return (
    <MonetizationContext.Provider value={value}>
      {children}
    </MonetizationContext.Provider>
  );
};

export const useMonetization = (): MonetizationContextType => {
  const context = useContext(MonetizationContext);
  if (context === undefined) {
    throw new Error('useMonetization must be used within a MonetizationProvider');
  }
  return context;
};

// Cleanup on app unmount
export const disconnectInAppPurchases = async () => {
  try {
    if (InAppPurchases) {
      await InAppPurchases.disconnectAsync();
    }
  } catch (error) {
    console.error('Error disconnecting IAP:', error);
  }
};
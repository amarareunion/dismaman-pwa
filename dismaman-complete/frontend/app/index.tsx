import React, { useEffect, useState, useRef } from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
  StatusBar,
  Keyboard
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useAuth, api } from '../contexts/AuthContext';
import { useMonetization } from '../contexts/MonetizationContext';
import { MonetizationPopup } from '../components/MonetizationPopup';
import { ChildSelectionPopup } from '../components/ChildSelectionPopup';
import Constants from 'expo-constants';

const { width, height } = Dimensions.get('window');

// Types
interface Child {
  id: string;
  name: string;
  gender: 'boy' | 'girl';
  birth_month: number;
  birth_year: number;
  age_months: number;
}

interface Response {
  id: string;
  question: string;
  answer: string;
  child_id: string;
  child_name: string;
  created_at: string;
}

interface MonetizationStatus {
  is_premium: boolean;
  trial_days_left: number;
  questions_asked: number;
  popup_frequency: string;
}

// Animated floating emojis component
const FloatingEmojis = () => {
  const animatedValues = useRef(
    Array.from({ length: 8 }, () => ({
      translateY: new Animated.Value(height + 100),
      opacity: new Animated.Value(0.6),
      scale: new Animated.Value(1),
    }))
  ).current;

  const emojis = ['🌟', '🎈', '🦄', '🌈', '⭐', '💫', '🎨', '🔮'];

  useEffect(() => {
    const startAnimation = () => {
      animatedValues.forEach((anim, index) => {
        const delay = Math.random() * 5000;
        const duration = 8000 + Math.random() * 4000;
        
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(anim.translateY, {
              toValue: -200,
              duration,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(anim.opacity, {
                toValue: 0.8,
                duration: 1000,
                useNativeDriver: true,
              }),
              Animated.timing(anim.opacity, {
                toValue: 0.3,
                duration: duration - 2000,
                useNativeDriver: true,
              }),
              Animated.timing(anim.opacity, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true,
              })
            ]),
            Animated.loop(
              Animated.sequence([
                Animated.timing(anim.scale, {
                  toValue: 1.2,
                  duration: 2000,
                  useNativeDriver: true,
                }),
                Animated.timing(anim.scale, {
                  toValue: 1,
                  duration: 2000,
                  useNativeDriver: true,
                })
              ])
            )
          ]).start(() => {
            // Reset and restart
            anim.translateY.setValue(height + 100);
            anim.opacity.setValue(0.6);
            anim.scale.setValue(1);
          });
        }, delay);
      });
    };

    startAnimation();
    const interval = setInterval(startAnimation, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.floatingContainer}>
      {animatedValues.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.floatingEmoji,
            {
              left: Math.random() * (width - 40),
              transform: [
                { translateY: anim.translateY },
                { scale: anim.scale }
              ],
              opacity: anim.opacity,
            },
          ]}
        >
          <Text style={styles.floatingEmojiText}>{emojis[index]}</Text>
        </Animated.View>
      ))}
    </View>
  );
};

export default function HomeScreen() {
  const { user, logout } = useAuth();
  // Enhanced monetization with new system
  const {
    isPremium,
    trialDaysLeft,
    questionsThisMonth,
    popupType,
    isPostTrialSetupRequired,
    activeChildId,
    isPopupVisible,
    popupExtraMessage,
    showMonetizationPopup,
    hideMonetizationPopup,
    selectActiveChild,
    purchaseSubscription,
    refreshStatus
  } = useMonetization();
  
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [question, setQuestion] = useState('');
  const [currentResponse, setCurrentResponse] = useState<Response | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [showThumbsUp, setShowThumbsUp] = useState(false);
  
  // Animation states for interactive popups
  const [showQuestionAnimation, setShowQuestionAnimation] = useState(false);
  const [showFeedbackAnimation, setShowFeedbackAnimation] = useState(false);
  const [animationMessage, setAnimationMessage] = useState('');
  const [animationType, setAnimationType] = useState<'question' | 'difficult' | 'details' | ''>('');

  // Animation refs
  const thinkingRotation = useRef(new Animated.Value(0)).current;
  const thumbsUpScale = useRef(new Animated.Value(0)).current;
  const responseSlideIn = useRef(new Animated.Value(50)).current;
  
  // Animation values
  const animationOpacity = useRef(new Animated.Value(0)).current;
  const animationScale = useRef(new Animated.Value(0.8)).current;
  
  // Feedback button animations
  const feedbackButtonScale = useRef(new Animated.Value(1)).current;
  const feedbackButtonOpacity = useRef(new Animated.Value(1)).current;
  
  // Feedback animation states
  const [isFeedbackProcessing, setIsFeedbackProcessing] = useState(false);
  const [processingFeedbackType, setProcessingFeedbackType] = useState<'too_complex' | 'need_more_details' | null>(null);

  useEffect(() => {
    loadChildren();
    startThinkingAnimation();
  }, []);

  // Reload children when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadChildren();
    }, [])
  );

  const startThinkingAnimation = () => {
    Animated.loop(
      Animated.timing(thinkingRotation, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  };

  const showThumbsUpAnimation = () => {
    setShowThumbsUp(true);
    Animated.sequence([
      Animated.timing(thumbsUpScale, {
        toValue: 1.2,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(thumbsUpScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(thumbsUpScale, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowThumbsUp(false);
      thumbsUpScale.setValue(0);
    });
  };

  const animateResponseIn = () => {
    responseSlideIn.setValue(50);
    Animated.timing(responseSlideIn, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  const startFeedbackAnimation = (feedbackType: 'too_complex' | 'need_more_details') => {
    setIsFeedbackProcessing(true);
    setProcessingFeedbackType(feedbackType);
    
    // Pulsation animation (battement)
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(feedbackButtonScale, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(feedbackButtonScale, {
          toValue: 0.95,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    
    // Opacity animation (reflet changeant)
    const opacityAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(feedbackButtonOpacity, {
          toValue: 0.7,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(feedbackButtonOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    
    pulseAnimation.start();
    opacityAnimation.start();
  };

  const stopFeedbackAnimation = () => {
    setIsFeedbackProcessing(false);
    setProcessingFeedbackType(null);
    
    // Reset animations to initial state
    Animated.timing(feedbackButtonScale, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    Animated.timing(feedbackButtonOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const askQuestion = async () => {
    if (!question.trim() || !selectedChild) return;

    setIsThinking(true);
    setCurrentResponse(null);
    
    try {
      const response = await api.post('/questions', {
        question: question.trim(),
        child_id: selectedChild.id
      });
      
      setCurrentResponse(response.data);
      setQuestion('');
      setIsThinking(false);
      
      // Animate response in
      animateResponseIn();
      
    } catch (error: any) {
      setIsThinking(false);
      if (error.response?.status === 402) {
        Alert.alert(
          '🌟 Abonnement requis',
          'Tu as utilisé tes 3 questions gratuites d\'aujourd\'hui ! Abonne-toi pour poser des questions illimitées.',
          [
            { text: 'Plus tard', style: 'cancel' },
            { text: 'S\'abonner', onPress: () => router.push('/subscription') }
          ]
        );
      } else {
        Alert.alert('Erreur', 'Impossible de poser la question pour le moment. Vérifie ta connexion internet.');
      }
    }
  };

  const askQuestionForChild = async (child: any) => {
    // Hide keyboard immediately when clicking on child
    Keyboard.dismiss();
    
    // Check if this child is available for non-premium users
    if (!isPremium && activeChildId && activeChildId !== child.id) {
      showMonetizationPopup('inactive_child');
      return;
    }
    
    if (!question.trim() || isThinking) {
      // If no question, just select the child
      setSelectedChild(child);
      return;
    }

    // Check monthly question limit for non-premium users
    if (!isPremium && trialDaysLeft <= 0 && questionsThisMonth >= 1) {
      showMonetizationPopup('monthly_limit', 'Une seule question par mois en version gratuite !');
      return;
    }

    // Clear any previous response and feedback state when starting a new question
    setCurrentResponse(null);

    // Show question animation with child's name
    const questionMessages = [
      `Hmm ${child.name}, laisse-moi réfléchir...`,
      `Bonne question ${child.name} ! 🤔`,
      `${child.name}, je cherche la réponse...`,
      `Intéressant ${child.name} ! Je réfléchis...`
    ];
    const randomMessage = questionMessages[Math.floor(Math.random() * questionMessages.length)];
    showAnimationPopup('question', randomMessage);

    // If there's a question, set child and launch the request immediately
    setSelectedChild(child);
    setIsThinking(true);
    
    try {
      const backendUrl = Constants.expoConfig?.extra?.router?.EXPO_PUBLIC_BACKEND_URL || 'URL_NOT_FOUND';
      console.log('📤 Sending API request to:', backendUrl + '/api/questions');
      const response = await api.post('/questions', {
        question: question.trim(),
        child_id: child.id,
      });

      console.log('✅ API response received:', response.data.answer?.substring(0, 50) + '...');
      console.log('📊 Full response data:', response.data);
      setCurrentResponse(response.data);
      // Effacer la question seulement après avoir reçu la réponse avec succès
      setQuestion('');
      console.log('🔄 Setting isThinking to false');
      setIsThinking(false);

      // Refresh monetization status to update question count
      await refreshStatus();

      // Animate response in
      console.log('🎬 Starting response animation...');
      animateResponseIn();

    } catch (error: any) {
      console.error('❌ API request failed:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.status,
        baseURL: api.defaults.baseURL,
        timeout: api.defaults.timeout
      });
      setIsThinking(false);
      
      if (error.response?.status === 402) {
        // Handle different 402 error types
        const errorMessage = error.response?.data?.detail || 'Premium subscription required';
        
        if (errorMessage === 'Child not active in free version') {
          showMonetizationPopup('inactive_child');
        } else if (errorMessage === 'Monthly question limit reached') {
          showMonetizationPopup('monthly_limit', 'Une seule question par mois en version gratuite !');
        } else {
          Alert.alert(
            '🌟 Abonnement requis',
            'Passez au Premium pour poser des questions illimitées !',
            [
              { text: 'Plus tard', style: 'cancel' },
              { text: 'Voir les offres', onPress: () => showMonetizationPopup('child_selection') }
            ]
          );
        }
      } else {
        Alert.alert('Erreur', 'Impossible de poser la question pour le moment. Vérifie ta connexion internet.');
      }
    }
  };

  const submitFeedback = async (feedback: 'understood' | 'too_complex' | 'need_more_details') => {
    if (!currentResponse) return;

    // Check if feedback buttons are available for non-premium users
    if (!isPremium && trialDaysLeft <= 0 && (feedback === 'too_complex' || feedback === 'need_more_details')) {
      showMonetizationPopup('feedback_premium');
      return;
    }

    // Start animation for feedback buttons (not for "understood")
    if (feedback !== 'understood') {
      startFeedbackAnimation(feedback as 'too_complex' | 'need_more_details');
    }

    try {
      const response = await api.post(`/responses/${currentResponse.id}/feedback`, { 
        response_id: currentResponse.id,
        feedback 
      });
      
      const result = response.data;
      
      if (feedback === 'understood') {
        showThumbsUpAnimation();
        setTimeout(() => {
          Alert.alert('Merci !', '🎉 Super ! Je suis content que tu aies compris !');
        }, 1000);
      } else if (result.regenerate && result.new_response) {
        // Update response with the regenerated version
        setCurrentResponse(result.new_response);
        
        // Stop animation when new response is received
        stopFeedbackAnimation();
        
        // Show appropriate message based on feedback type
        let message = '';
        if (feedback === 'too_complex') {
          message = '🤔 D\'accord ! J\'ai refait ma réponse pour qu\'elle soit plus simple à comprendre !';
          // Show feedback animation
          showAnimationPopup('difficult', '😅 D\'accord, je vais simplifier !');
        } else if (feedback === 'need_more_details') {
          message = '🧠 Parfait ! J\'ai ajouté plus de détails dans ma nouvelle réponse !';
          // Show feedback animation  
          showAnimationPopup('details', '🤓 Plus de détails arrivent !');
        }
        
        // Show success message after animation
        setTimeout(() => {
          Alert.alert('Nouvelle réponse !', message);
        }, 1500);
      } else {
        // Stop animation even if no regeneration happened
        stopFeedbackAnimation();
        
        // Feedback recorded but no regeneration needed
        let message = '';
        switch (feedback) {
          case 'too_complex':
            message = '🤔 D\'accord, je me souviendrai pour adapter mes prochaines réponses !';
            break;
          case 'need_more_details':
            message = '📚 Merci ! Je donnerai plus de détails dans mes prochaines réponses !';
            break;
        }
        Alert.alert('Merci !', message);
      }
      
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      
      // Handle 402 errors for feedback
      if (error.response?.status === 402) {
        const errorMessage = error.response?.data?.detail || '';
        if (errorMessage === 'Feedback buttons available in premium version only') {
          showMonetizationPopup('feedback_premium');
        }
      } else {
        Alert.alert('Erreur', 'Je n\'ai pas pu enregistrer ton avis. Réessaie plus tard !');
      }
      
      // Stop animation on error
      stopFeedbackAnimation();
    }
  };

  const getChildEmoji = (child: Child) => {
    return child.gender === 'boy' ? '👦' : '👧';
  };

  const getChildColor = (index: number) => {
    const colors = [
      { bg: 'rgba(255, 107, 157, 0.8)', border: 'rgba(255, 107, 157, 1)' }, // Rose
      { bg: 'rgba(102, 126, 234, 0.8)', border: 'rgba(102, 126, 234, 1)' }, // Violet
      { bg: 'rgba(255, 193, 7, 0.8)', border: 'rgba(255, 193, 7, 1)' },     // Orange
      { bg: 'rgba(76, 175, 80, 0.8)', border: 'rgba(76, 175, 80, 1)' }      // Vert
    ];
    return colors[index % colors.length];
  };

  const getAgeText = (ageMonths: number) => {
    const years = Math.floor(ageMonths / 12);
    const months = ageMonths % 12;
    
    if (years === 0) return `${months} mois`;
    if (months === 0) return `${years} an${years > 1 ? 's' : ''}`;
    return `${years}a ${months}m`;
  };

  const getUserDisplayName = () => {
    if (user?.first_name) {
      return user.first_name;
    }
    return user?.email?.split('@')[0] || 'Utilisateur';
  };

  const getPremiumBadge = () => {
    if (isPremium) {
      return '👑 Premium';
    }
    if (trialDaysLeft && trialDaysLeft > 0) {
      return `🆓 ${trialDaysLeft}j restants`;
    }
    return '🔒 Essai terminé';
  };

  const handleLogout = async () => {
    await logout();
  };

  // Animation functions
  const showAnimationPopup = (type: 'question' | 'difficult' | 'details', message: string) => {
    setAnimationType(type);
    setAnimationMessage(message);
    setShowQuestionAnimation(type === 'question');
    setShowFeedbackAnimation(type !== 'question');
    
    // Reset animation values
    animationOpacity.setValue(0);
    animationScale.setValue(0.8);
    
    // Animate in
    Animated.parallel([
      Animated.timing(animationOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(animationScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Auto hide after delay
    setTimeout(() => {
      hideAnimationPopup();
    }, type === 'question' ? 2000 : 1500); // Question animation dure plus longtemps
  };

  const hideAnimationPopup = () => {
    Animated.parallel([
      Animated.timing(animationOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(animationScale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowQuestionAnimation(false);
      setShowFeedbackAnimation(false);
      setAnimationType('');
      setAnimationMessage('');
    });
  };

  const getAnimationEmoji = (type: string) => {
    switch (type) {
      case 'question': return '🤔';
      case 'difficult': return '😅';
      case 'details': return '🤓';
      default: return '✨';
    }
  };

  const loadChildren = async () => {
    if (!user) {
      console.log('👤 User not authenticated, skipping children load');
      return;
    }
    
    try {
      console.log('👶 Loading children...');
      const response = await api.get('/children');
      setChildren(response.data);
      if (response.data.length > 0 && !selectedChild) {
        setSelectedChild(response.data[0]);
      }
      console.log(`✅ Loaded ${response.data.length} children`);
    } catch (error) {
      console.warn('⚠️ Could not load children:', error);
    }
  };


  if (!user) {
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

  const rotation = thinkingRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#f093fb']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      <FloatingEmojis />
      
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <SafeAreaView style={styles.safeArea}>
        {/* Header with user info and premium badge */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Text style={styles.welcomeText}>Salut {getUserDisplayName()} ! 👋</Text>
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>{getPremiumBadge()}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsButton}>
            <Ionicons name="settings" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContentContainer}
        >
          {/* Question Input Section */}
          <View style={styles.questionCard}>
            <Text style={styles.questionTitle}>🤔 Que veux-tu savoir ?</Text>
            <View style={styles.questionInputContainer}>
              <TextInput
                style={styles.questionInput}
                placeholder="Tape ta question magique ici... ✨"
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={question}
                onChangeText={setQuestion}
                multiline
                maxLength={200}
                textAlignVertical="top"
              />
            </View>
            {currentResponse && question && (
              <Text style={styles.questionHint}>
                💡 Ta question reste visible pour les boutons de feedback
              </Text>
            )}
          </View>

          {/* Children Selection */}
          {children.length > 0 && (
            <View style={styles.childrenCard}>
              <Text style={styles.sectionTitle}>👶 Qui pose la question ?</Text>
              <View style={styles.childrenGrid}>
                {children.map((child, index) => {
                  const color = getChildColor(index);
                  const isSelected = selectedChild?.id === child.id;
                  return (
                    <TouchableOpacity
                      key={child.id}
                      style={[
                        styles.childButton,
                        {
                          backgroundColor: isSelected ? color.border : color.bg,
                          borderColor: color.border,
                        }
                      ]}
                      onPress={() => askQuestionForChild(child)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.childEmoji}>{getChildEmoji(child)}</Text>
                      <Text style={styles.childName}>{child.name}</Text>
                      <Text style={styles.childAge}>{getAgeText(child.age_months)}</Text>
                      {isSelected && (
                        <View style={styles.selectedIndicator}>
                          <Ionicons name="checkmark-circle" size={16} color="white" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Thinking Animation */}
          {isThinking && (
            <View style={styles.thinkingCard}>
              <Animated.View style={[styles.thinkingIcon, { transform: [{ rotate: rotation }] }]}>
                <Text style={styles.thinkingEmoji}>🤔</Text>
              </Animated.View>
              <Text style={styles.thinkingText}>Je réfléchis à ta question...</Text>
              <View style={styles.thinkingDots}>
                <View style={[styles.dot, styles.dot1]} />
                <View style={[styles.dot, styles.dot2]} />
                <View style={[styles.dot, styles.dot3]} />
              </View>
            </View>
          )}

          {/* AI Response */}
          {console.log('🔍 DEBUG Response display:', {
            currentResponse: !!currentResponse,
            currentResponseContent: currentResponse ? currentResponse.answer?.substring(0, 30) + '...' : 'null',
            isThinking,
            shouldShow: currentResponse && !isThinking
          })}
          {currentResponse && !isThinking && (
            <Animated.View
              style={[
                styles.responseCard,
                { transform: [{ translateY: responseSlideIn }] }
              ]}
            >
              <View style={styles.responseHeader}>
                <Text style={styles.responseTitle}>
                  🤖 Ma réponse pour {currentResponse.child_name}
                </Text>
              </View>
              
              <View style={styles.responseBubble}>
                <Text style={styles.responseText}>{currentResponse.answer}</Text>
              </View>

              {/* Feedback Buttons */}
              <View style={styles.feedbackContainer}>
                <Text style={styles.feedbackTitle}>Comment tu as trouvé ma réponse ? 🤔</Text>
                <View style={styles.feedbackButtons}>
                  <TouchableOpacity
                    style={[styles.feedbackButton, styles.feedbackButtonUnderstood]}
                    onPress={() => submitFeedback('understood')}
                  >
                    <Text style={styles.feedbackButtonText}>😍 Parfait, j'ai compris !</Text>
                  </TouchableOpacity>
                  <View style={styles.feedbackRow}>
                    <Animated.View
                      style={[
                        {
                          opacity: isFeedbackProcessing && processingFeedbackType === 'too_complex' ? feedbackButtonOpacity : 1,
                          transform: [{ 
                            scale: isFeedbackProcessing && processingFeedbackType === 'too_complex' ? feedbackButtonScale : 1 
                          }]
                        }
                      ]}
                    >
                      <TouchableOpacity
                        style={[
                          styles.feedbackButton, 
                          styles.feedbackButtonComplex,
                          isFeedbackProcessing && processingFeedbackType === 'too_complex' && styles.feedbackButtonProcessing
                        ]}
                        onPress={() => submitFeedback('too_complex')}
                        disabled={isFeedbackProcessing}
                      >
                        <Text style={styles.feedbackButtonText}>😅 Trop difficile</Text>
                      </TouchableOpacity>
                    </Animated.View>
                    <Animated.View
                      style={[
                        {
                          opacity: isFeedbackProcessing && processingFeedbackType === 'need_more_details' ? feedbackButtonOpacity : 1,
                          transform: [{ 
                            scale: isFeedbackProcessing && processingFeedbackType === 'need_more_details' ? feedbackButtonScale : 1 
                          }]
                        }
                      ]}
                    >
                      <TouchableOpacity
                        style={[
                          styles.feedbackButton, 
                          styles.feedbackButtonMore,
                          isFeedbackProcessing && processingFeedbackType === 'need_more_details' && styles.feedbackButtonProcessing
                        ]}
                        onPress={() => submitFeedback('need_more_details')}
                        disabled={isFeedbackProcessing}
                      >
                        <Text style={styles.feedbackButtonText}>🤓 Plus d'infos</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Thumbs Up Animation */}
          {showThumbsUp && (
            <Animated.View
              style={[
                styles.thumbsUpContainer,
                { transform: [{ scale: thumbsUpScale }] }
              ]}
            >
              <Text style={styles.thumbsUpEmoji}>👍</Text>
              <Text style={styles.thumbsUpText}>Super !</Text>
            </Animated.View>
          )}

          {/* Navigation Buttons */}
          <View style={styles.navigationContainer}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => {
                // Nouveau: Rediriger vers Premium si l'essai est terminé et pas premium
                if (!isPremium && trialDaysLeft <= 0) {
                  console.log('🔒 Redirection vers Premium pour ajouter un enfant (essai terminé)');
                  router.push('/subscription');
                } else {
                  router.push('/add-child');
                }
              }}
            >
              <Ionicons name="person-add" size={24} color="white" />
              <Text style={styles.navButtonText}>Ajouter enfant</Text>
            </TouchableOpacity>
            
            {/* Historique - Visible pour tous les utilisateurs */}
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => {
                console.log('🎯 Historique button clicked');
                console.log('📊 User status - isPremium:', isPremium, 'trialDaysLeft:', trialDaysLeft, 'isLoading:', isLoading);
                
                // Attendre que MonetizationContext soit chargé avant de vérifier l'accès
                if (isLoading) {
                  console.log('⏳ MonetizationContext is still loading, waiting...');
                  return;
                }
                
                // Si l'utilisateur est premium ou en essai, aller à l'historique
                if (isPremium || trialDaysLeft > 0) {
                  console.log('✅ User has access, navigating to history');
                  router.push('/history');
                } else {
                  // Utiliser le popup de monétisation personnalisé pour les utilisateurs gratuits
                  console.log('🔒 User needs premium, showing popup');
                  showMonetizationPopup('history_premium', 'L\'accès à l\'historique des conversations nécessite un abonnement Premium.');
                }
              }}
            >
              <Ionicons name="time" size={24} color="white" />
              <Text style={styles.navButtonText}>Historique</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => router.push('/subscription')}
            >
              <Ionicons name="star" size={24} color="white" />
              <Text style={styles.navButtonText}>Premium</Text>
            </TouchableOpacity>
          </View>

          {/* No Children Message */}
          {children.length === 0 && (
            <View style={styles.noChildrenContainer}>
              <Text style={styles.noChildrenEmoji}>👶</Text>
              <Text style={styles.noChildrenTitle}>Aucun enfant ajouté</Text>
              <Text style={styles.noChildrenText}>
                Ajoute d'abord un enfant pour commencer à poser des questions !
              </Text>
              <TouchableOpacity
                style={styles.addFirstChildButton}
                onPress={() => router.push('/add-child')}
              >
                <Ionicons name="add-circle" size={24} color="white" />
                <Text style={styles.addFirstChildButtonText}>Ajouter mon premier enfant</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
      </KeyboardAvoidingView>

      {/* Animation Popup */}
      {(showQuestionAnimation || showFeedbackAnimation) && (
        <Animated.View
          style={[
            styles.animationPopup,
            {
              opacity: animationOpacity,
              transform: [{ scale: animationScale }],
            },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.animationEmoji}>
            {getAnimationEmoji(animationType)}
          </Text>
          <Text style={styles.animationText}>{animationMessage}</Text>
        </Animated.View>
      )}

      {/* Monetization Popup */}
      <MonetizationPopup
        visible={isPopupVisible}
        onClose={hideMonetizationPopup}
        type={popupType}
        trialDaysLeft={trialDaysLeft}
        questionsThisMonth={questionsThisMonth}
        extraMessage={popupExtraMessage}
        onSelectChild={selectActiveChild}
        onSubscribe={purchaseSubscription}
      />
      
      {/* Child Selection Popup */}
      {isPostTrialSetupRequired && (
        <ChildSelectionPopup
          visible={isPostTrialSetupRequired}
          children={children}
          onSelectChild={selectActiveChild}
          onClose={() => {}}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'ios' ? 20 : 40, // Espace supplémentaire pour le clavier
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
  floatingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  floatingEmoji: {
    position: 'absolute',
  },
  floatingEmojiText: {
    fontSize: 20,
  },
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  premiumBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  premiumBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  settingsButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  // Question Input Card
  questionCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  questionInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
  },
  questionInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    minHeight: 60,
    maxHeight: 120,
    marginRight: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  questionHint: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  // Children Selection Card
  childrenCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  childrenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  childButton: {
    width: (width - 80) / 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  childEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  childName: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'center',
  },
  childAge: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10,
    padding: 2,
  },
  // Thinking Animation
  thinkingCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  thinkingIcon: {
    marginBottom: 16,
  },
  thinkingEmoji: {
    fontSize: 48,
  },
  thinkingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  thinkingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.6)',
    marginHorizontal: 4,
  },
  dot1: {
    animationDelay: '0s',
  },
  dot2: {
    animationDelay: '0.2s',
  },
  dot3: {
    animationDelay: '0.4s',
  },
  // Response Card
  responseCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  responseTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  responseBubble: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  responseText: {
    color: 'white',
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  // Feedback Styles
  feedbackContainer: {
    alignItems: 'center',
  },
  feedbackTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  feedbackButtons: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  feedbackRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  feedbackButton: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 4,
    marginVertical: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  feedbackButtonUnderstood: {
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
  },
  feedbackButtonComplex: {
    backgroundColor: 'rgba(255, 193, 7, 0.8)',
  },
  feedbackButtonMore: {
    backgroundColor: 'rgba(102, 126, 234, 0.8)',
  },
  feedbackButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  feedbackButtonProcessing: {
    opacity: 0.8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  // Thumbs Up Animation
  thumbsUpContainer: {
    position: 'absolute',
    bottom: 180, // Position juste au-dessus de la zone de feedback
    left: '50%',
    transform: [{ translateX: -75 }], // Centré horizontalement (ajusté pour la largeur)
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.95)',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000, // S'assurer qu'elle soit au-dessus
  },
  thumbsUpEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  thumbsUpText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Animation Popup Styles
  animationPopup: {
    position: 'absolute',
    top: '45%',
    left: '50%',
    transform: [{ translateX: -75 }, { translateY: -40 }],
    backgroundColor: 'rgba(102, 126, 234, 0.95)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 150,
    maxWidth: 280,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 1000,
  },
  animationEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  animationText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Navigation
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    marginBottom: 16,
  },
  navButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minWidth: 100,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  navButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  // No Children
  noChildrenContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  noChildrenEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  noChildrenTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  noChildrenText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    maxWidth: 280,
  },
  addFirstChildButton: {
    backgroundColor: '#ff6b9d',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#ff6b9d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addFirstChildButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

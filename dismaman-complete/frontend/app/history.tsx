import React, { useEffect, useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Alert,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth, api } from '../contexts/AuthContext';
import { useMonetization } from '../contexts/MonetizationContext';
import * as Speech from 'expo-speech';

const { width, height } = Dimensions.get('window');

// Types
interface Child {
  id: string;
  name: string;
  gender: 'boy' | 'girl';
  age_months: number;
}

interface ConversationItem {
  id: string;
  question: string;
  answer: string;
  child_name: string;
  created_at: string;
  feedback?: 'understood' | 'too_complex' | 'need_more_details';
}

interface ChatBubbleProps {
  item: ConversationItem;
  isQuestion: boolean;
}

// Chat Bubble Component
const ChatBubble: React.FC<ChatBubbleProps> = ({ item, isQuestion }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayAudio = async (text: string) => {
    if (isPlaying) {
      Speech.stop();
      setIsPlaying(false);
      return;
    }

    try {
      setIsPlaying(true);
      await Speech.speak(text, {
        language: 'fr-FR',
        pitch: 1.0,
        rate: 0.8,
        onDone: () => setIsPlaying(false),
        onError: () => setIsPlaying(false),
      });
    } catch (error) {
      console.error('TTS Error:', error);
      setIsPlaying(false);
      Alert.alert('Erreur', 'Impossible de lire le texte audio.');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <View style={[
      styles.bubbleContainer,
      isQuestion ? styles.questionBubbleContainer : styles.answerBubbleContainer
    ]}>
      <View style={[
        styles.bubble,
        isQuestion ? styles.questionBubble : styles.answerBubble
      ]}>
        {/* Header with emoji and time */}
        <View style={styles.bubbleHeader}>
          <Text style={styles.bubbleEmoji}>
            {isQuestion ? '🤔' : '🤖'}
          </Text>
          <Text style={styles.bubbleTime}>
            {formatDate(item.created_at)}
          </Text>
          {/* Audio button */}
          <TouchableOpacity
            style={styles.audioButton}
            onPress={() => handlePlayAudio(isQuestion ? item.question : item.answer)}
          >
            <Ionicons 
              name={isPlaying ? 'stop-circle' : 'play-circle'} 
              size={20} 
              color={isQuestion ? '#667eea' : '#4CAF50'} 
            />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <Text style={[
          styles.bubbleText,
          isQuestion ? styles.questionText : styles.answerText
        ]}>
          {isQuestion ? item.question : item.answer}
        </Text>

        {/* Feedback indicator for answers */}
        {!isQuestion && item.feedback && (
          <View style={styles.feedbackIndicator}>
            <Text style={styles.feedbackText}>
              {item.feedback === 'understood' && '😍 Compris !'}
              {item.feedback === 'too_complex' && '😅 Trop difficile'}
              {item.feedback === 'need_more_details' && '🤓 Plus de détails'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};
export default function HistoryScreen() {
  const { user } = useAuth();
  const { isPremium, trialDaysLeft, isLoading: isMonetizationLoading } = useMonetization();
  
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);

  // Vérification des permissions d'accès à l'historique
  const hasHistoryAccess = isPremium || trialDaysLeft > 0;

  useEffect(() => {
    // Wait for MonetizationContext to finish loading before checking access
    if (isMonetizationLoading) {
      console.log('⏳ MonetizationContext is still loading, waiting...');
      return;
    }

    console.log('🔍 Checking history access:', {
      isPremium,
      trialDaysLeft,
      hasHistoryAccess,
      isMonetizationLoading
    });

    // Redirection si pas d'accès APRÈS que le contexte soit chargé
    if (!hasHistoryAccess) {
      console.log('🔒 Accès historique refusé - redirection vers Premium');
      router.replace('/subscription');
      return;
    }
    loadChildren();
  }, [hasHistoryAccess, isMonetizationLoading]);

  useEffect(() => {
    if (selectedChild) {
      loadConversations(selectedChild.id);
    }
  }, [selectedChild]);

  const loadChildren = async () => {
    try {
      setIsLoading(true);
      console.log('👶 Loading children for history...');
      const response = await api.get('/children');
      setChildren(response.data);
      
      if (response.data.length > 0) {
        setSelectedChild(response.data[0]); // Select first child by default
      }
      
      console.log(`✅ Loaded ${response.data.length} children for history`);
    } catch (error) {
      console.error('⚠️ Error loading children:', error);
      Alert.alert('Erreur', 'Impossible de charger les enfants.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversations = async (childId: string) => {
    try {
      setIsLoadingConversations(true);
      console.log('💬 Loading conversations for child:', childId);
      
      const response = await api.get(`/responses/child/${childId}`);
      const conversationData = response.data;
      
      // Create interleaved conversation items (question + answer pairs)
      const conversationItems: ConversationItem[] = [];
      
      conversationData.forEach((item: any) => {
        // Add question bubble
        conversationItems.push({
          id: `${item.id}_question`,
          question: item.question,
          answer: '',
          child_name: item.child_name,
          created_at: item.created_at,
        });
        
        // Add answer bubble
        conversationItems.push({
          id: `${item.id}_answer`,
          question: '',
          answer: item.answer,
          child_name: item.child_name,
          created_at: item.created_at,
          feedback: item.feedback,
        });
      });
      
      setConversations(conversationItems);
      console.log(`✅ Loaded ${conversationData.length} conversations (${conversationItems.length} bubbles)`);
      
    } catch (error) {
      console.error('⚠️ Error loading conversations:', error);
      Alert.alert('Erreur', 'Impossible de charger l\'historique.');
      setConversations([]);
    } finally {
      setIsLoadingConversations(false);
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

  const renderConversationItem = ({ item, index }: { item: ConversationItem; index: number }) => {
    const isQuestion = item.question !== '';
    return <ChatBubble key={item.id} item={item} isQuestion={isQuestion} />;
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

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#f093fb']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📚 Historique des conversations</Text>
          <View style={styles.headerSpace} />
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="white" />
            <Text style={styles.loadingText}>Chargement des enfants...</Text>
          </View>
        ) : (
          <>
            {/* Children Selection */}
            {children.length > 0 && (
              <View style={styles.childrenSection}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.childrenScrollContainer}
                >
                  {children.map((child, index) => {
                    const color = getChildColor(index);
                    const isSelected = selectedChild?.id === child.id;
                    return (
                      <TouchableOpacity
                        key={child.id}
                        style={[
                          styles.childSelector,
                          {
                            backgroundColor: isSelected ? color.border : color.bg,
                            borderColor: color.border,
                          }
                        ]}
                        onPress={() => setSelectedChild(child)}
                      >
                        <Text style={styles.childSelectorEmoji}>{getChildEmoji(child)}</Text>
                        <Text style={styles.childSelectorName}>{child.name}</Text>
                        <Text style={styles.childSelectorAge}>{getAgeText(child.age_months)}</Text>
                        {isSelected && (
                          <View style={styles.selectedIndicator}>
                            <Ionicons name="checkmark-circle" size={14} color="white" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Conversations */}
            <View style={styles.conversationsContainer}>
              {selectedChild && (
                <Text style={styles.conversationsTitle}>
                  💬 Conversations avec {selectedChild.name}
                </Text>
              )}

              {isLoadingConversations ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="white" />
                  <Text style={styles.loadingText}>Chargement des conversations...</Text>
                </View>
              ) : conversations.length > 0 ? (
                <FlatList
                  data={conversations}
                  renderItem={renderConversationItem}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.conversationsScrollContainer}
                />
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Text style={styles.emptyStateEmoji}>🤷‍♀️</Text>
                  <Text style={styles.emptyStateTitle}>Aucune conversation</Text>
                  <Text style={styles.emptyStateText}>
                    {selectedChild ? `${selectedChild.name} n'a pas encore posé de questions` : 'Sélectionne un enfant pour voir ses conversations'}
                  </Text>
                </View>
              )}
            </View>

            {/* No Children Message */}
            {children.length === 0 && (
              <View style={styles.noChildrenContainer}>
                <Text style={styles.noChildrenEmoji}>👶</Text>
                <Text style={styles.noChildrenTitle}>Aucun enfant ajouté</Text>
                <Text style={styles.noChildrenText}>
                  Ajoute d&apos;abord un enfant pour voir ses conversations !
                </Text>
                <TouchableOpacity
                  style={styles.addChildButton}
                  onPress={() => router.push('/settings')}
                >
                  <Ionicons name="add-circle" size={24} color="white" />
                  <Text style={styles.addChildButtonText}>Ajouter un enfant</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
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
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'space-between',
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    flex: 1,
  },
  headerSpace: {
    width: 40,
  },
  // Loading States
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
  // Children Selection
  childrenSection: {
    paddingVertical: 16,
  },
  childrenScrollContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  childSelector: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 2,
    position: 'relative',
  },
  childSelectorEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  childSelectorName: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  childSelectorAge: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: 'rgba(76, 175, 80, 1)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Conversations Container
  conversationsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  conversationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  conversationsScrollContainer: {
    paddingBottom: 20,
  },
  // Chat Bubbles
  bubbleContainer: {
    marginVertical: 6,
  },
  questionBubbleContainer: {
    alignItems: 'flex-end',
  },
  answerBubbleContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionBubble: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderBottomRightRadius: 6,
  },
  answerBubble: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    borderBottomLeftRadius: 6,
  },
  bubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  bubbleEmoji: {
    fontSize: 16,
  },
  bubbleTime: {
    fontSize: 10,
    color: 'rgba(0,0,0,0.6)',
    flex: 1,
    textAlign: 'center',
  },
  audioButton: {
    padding: 2,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  questionText: {
    color: '#333',
  },
  answerText: {
    color: 'white',
  },
  feedbackIndicator: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  feedbackText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontStyle: 'italic',
  },
  // Empty States
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  noChildrenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noChildrenEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  noChildrenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  noChildrenText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  addChildButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 8,
  },
  addChildButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
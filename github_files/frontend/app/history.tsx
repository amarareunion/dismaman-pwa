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
    try {
      if (isPlaying) {
        Speech.stop();
        setIsPlaying(false);
        return;
      }

      setIsPlaying(true);
      
      await Speech.speak(text, {
        language: 'fr-FR',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => setIsPlaying(false),
        onStopped: () => setIsPlaying(false),
        onError: () => setIsPlaying(false),
      });
    } catch (error) {
      console.error('TTS Error:', error);
      setIsPlaying(false);
    }
  };

  const getFeedbackEmoji = (feedback?: string) => {
    switch (feedback) {
      case 'understood': return '😍 Compris';
      case 'too_complex': return '😅 Trop difficile';
      case 'need_more_details': return '🤓 Plus de détails';
      default: return '';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  if (isQuestion) {
    // Question bubble (right side)
    return (
      <View style={styles.questionContainer}>
        <View style={styles.questionBubble}>
          <View style={styles.questionHeader}>
            <Text style={styles.questionEmoji}>🤔</Text>
            <Text style={styles.childName}>{item.child_name}</Text>
          </View>
          <Text style={styles.questionText}>{item.question}</Text>
          <Text style={styles.timestamp}>{formatTime(item.created_at)}</Text>
        </View>
      </View>
    );
  } else {
    // Answer bubble (left side)
    return (
      <View style={styles.answerContainer}>
        <View style={styles.answerBubble}>
          <View style={styles.answerHeader}>
            <Text style={styles.answerEmoji}>🤖</Text>
            <TouchableOpacity
              onPress={() => handlePlayAudio(item.answer)}
              style={styles.playButton}
            >
              <Ionicons
                name={isPlaying ? 'stop-circle' : 'play-circle'}
                size={24}
                color="#007AFF"
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.answerText}>{item.answer}</Text>
          <View style={styles.answerFooter}>
            <Text style={styles.timestamp}>{formatTime(item.created_at)}</Text>
            {item.feedback && (
              <Text style={styles.feedbackText}>{getFeedbackEmoji(item.feedback)}</Text>
            )}
          </View>
        </View>
      </View>
    );
  }
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
      const childrenData = response.data.map((child: any) => ({
        ...child,
        age_months: child.age_months || 0
      }));
      
      setChildren(childrenData);
      console.log(`✅ Loaded ${childrenData.length} children`);
      
      // Auto-select first child if available
      if (childrenData.length > 0 && !selectedChild) {
        setSelectedChild(childrenData[0]);
      }
    } catch (error) {
      console.error('Error loading children:', error);
      Alert.alert('Erreur', 'Impossible de charger la liste des enfants.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversations = async (childId: string) => {
    try {
      setIsLoadingConversations(true);
      console.log(`💬 Loading conversations for child ${childId}...`);
      const response = await api.get(`/responses/child/${childId}`);
      const conversationsData = response.data || [];
      
      console.log(`✅ Loaded ${conversationsData.length} conversations`);
      setConversations(conversationsData);
    } catch (error) {
      console.error('Error loading conversations:', error);
      Alert.alert('Erreur', 'Impossible de charger l\'historique des conversations.');
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const getChildColor = (index: number) => {
    const colors = ['#FF69B4', '#9370DB', '#FF8C00', '#32CD32'];
    return colors[index % colors.length];
  };

  const getChildAge = (ageMonths: number) => {
    const years = Math.floor(ageMonths / 12);
    return years > 0 ? `${years} an${years > 1 ? 's' : ''}` : 'Bébé';
  };

  const renderFlatListData = () => {
    const flatData: Array<{ type: 'question' | 'answer'; item: ConversationItem }> = [];
    
    conversations.forEach(conversation => {
      flatData.push({ type: 'question', item: conversation });
      flatData.push({ type: 'answer', item: conversation });
    });
    
    return flatData;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
          <StatusBar barStyle="light-content" />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Chargement des enfants...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Historique</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {children.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>😊 Aucun enfant ajouté</Text>
              <Text style={styles.emptySubtext}>Ajoutez un enfant dans les paramètres pour voir l'historique</Text>
            </View>
          ) : (
            <>
              {/* Children Selection */}
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.childrenScroll}
                contentContainerStyle={styles.childrenContainer}
              >
                {children.map((child, index) => (
                  <TouchableOpacity
                    key={child.id}
                    onPress={() => setSelectedChild(child)}
                    style={[
                      styles.childCard,
                      { backgroundColor: getChildColor(index) },
                      selectedChild?.id === child.id && styles.selectedChildCard
                    ]}
                  >
                    <Text style={styles.childEmoji}>
                      {child.gender === 'boy' ? '👦' : '👧'}
                    </Text>
                    <Text style={styles.childName}>{child.name}</Text>
                    <Text style={styles.childAge}>{getChildAge(child.age_months)}</Text>
                    {selectedChild?.id === child.id && (
                      <View style={styles.selectedIndicator}>
                        <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Conversations */}
              {selectedChild && (
                <View style={styles.conversationsContainer}>
                  <Text style={styles.conversationsTitle}>
                    💬 Conversations avec {selectedChild.name}
                  </Text>
                  
                  {isLoadingConversations ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#667eea" />
                      <Text style={styles.loadingText}>Chargement des conversations...</Text>
                    </View>
                  ) : conversations.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>😊 Aucune conversation</Text>
                      <Text style={styles.emptySubtext}>Les questions et réponses apparaîtront ici</Text>
                    </View>
                  ) : (
                    <FlatList
                      data={renderFlatListData()}
                      keyExtractor={(item, index) => `${item.item.id}-${item.type}-${index}`}
                      renderItem={({ item }) => (
                        <ChatBubble item={item.item} isQuestion={item.type === 'question'} />
                      )}
                      style={styles.chatList}
                      showsVerticalScrollIndicator={false}
                      inverted={true}
                    />
                  )}
                </View>
              )}
            </>
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Fredoka One',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#667eea',
    fontFamily: 'Fredoka One',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 24,
    color: '#667eea',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Fredoka One',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
  },
  childrenScroll: {
    maxHeight: 120,
  },
  childrenContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  childCard: {
    width: 90,
    height: 100,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    position: 'relative',
  },
  selectedChildCard: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  childEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  childName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Fredoka One',
  },
  childAge: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  selectedIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    width: 25,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  conversationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 15,
    textAlign: 'center',
    fontFamily: 'Fredoka One',
  },
  chatList: {
    flex: 1,
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
    paddingLeft: 50,
  },
  questionBubble: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    padding: 15,
    maxWidth: '80%',
    borderBottomRightRadius: 5,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  questionText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  answerContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 10,
    paddingRight: 50,
  },
  answerBubble: {
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    padding: 15,
    maxWidth: '80%',
    borderBottomLeftRadius: 5,
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  answerEmoji: {
    fontSize: 16,
  },
  playButton: {
    padding: 4,
  },
  answerText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  answerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  feedbackText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
});
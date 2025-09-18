import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  SafeAreaView,
  ScrollView,
  Alert,
  Switch,
  Modal,
  StatusBar,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth, api } from '../contexts/AuthContext';
import { EditProfileModal } from '../components/EditProfileModal';
import { AddChildModal } from '../components/AddChildModal';

interface Child {
  id: string;
  name: string;
  gender: 'boy' | 'girl';
  birth_month: number;
  birth_year: number;
  age_months: number;
}

interface MonetizationStatus {
  is_premium: boolean;
  trial_days_left: number;
  questions_asked: number;
  popup_frequency: string;
}

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [monetizationStatus, setMonetizationStatus] = useState<MonetizationStatus | null>(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // CONFIRMATION LOGOUT STATE - Remplace Alert qui ne marche pas en web
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  
  // Animation states
  const [deletingChildId, setDeletingChildId] = useState<string | null>(null);
  const [childAnimations, setChildAnimations] = useState<Record<string, Animated.Value>>({});

  // Initialize animations for each child
  useEffect(() => {
    const animations: Record<string, Animated.Value> = {};
    children.forEach(child => {
      if (!childAnimations[child.id]) {
        animations[child.id] = new Animated.Value(1); // Start fully visible
      } else {
        animations[child.id] = childAnimations[child.id];
      }
    });
    setChildAnimations(animations);
  }, [children.length]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      loadChildren(),
      loadMonetizationStatus()
    ]);
  };

  const loadChildren = async () => {
    try {
      console.log('🔄 Loading children...');
      const response = await api.get('/children');
      console.log('✅ Children loaded:', response.data.length, 'children found');
      console.log('👶 Children data:', response.data.map(child => ({ id: child.id, name: child.name })));
      setChildren(response.data);
    } catch (error) {
      console.error('❌ Error loading children:', error);
    }
  };

  const loadMonetizationStatus = async () => {
    try {
      const response = await api.get('/monetization/status');
      setMonetizationStatus(response.data);
    } catch (error) {
      console.error('Error loading monetization status:', error);
    }
  };

  const handleChildAdded = async () => {
    console.log('🎉 Child was added, reloading with animation...');
    
    // Force reload the children list
    await loadChildren();
    
    // Add creation animation for new child
    setTimeout(() => {
      const latestChild = children[children.length - 1];
      if (latestChild && childAnimations[latestChild.id]) {
        // Start from invisible and scale up
        const animation = childAnimations[latestChild.id];
        animation.setValue(0);
        
        Animated.sequence([
          Animated.delay(100),
          Animated.timing(animation, {
            toValue: 1.1,
            duration: 200,
            easing: Easing.out(Easing.back(1.2)),
            useNativeDriver: false,
          }),
          Animated.timing(animation, {
            toValue: 1,
            duration: 100,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }),
        ]).start();
      }
    }, 200);
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [childToDelete, setChildToDelete] = useState<Child | null>(null);

  const handleDeleteChild = (child: Child) => {
    console.log('🗑️ Delete button clicked for child:', child.name);
    setChildToDelete(child);
    setShowDeleteModal(true);
  };

  const confirmDeleteChild = async () => {
    if (!childToDelete) return;
    
    console.log('🗑️ Confirmed deletion for child:', childToDelete.name);
    setShowDeleteModal(false);
    await deleteChild(childToDelete.id);
    setChildToDelete(null);
  };

  const cancelDeleteChild = () => {
    console.log('❌ Deletion cancelled for child:', childToDelete?.name);
    setShowDeleteModal(false);
    setChildToDelete(null);
  };

  const deleteChild = async (childId: string) => {
    try {
      setIsLoading(true);
      setDeletingChildId(childId);
      console.log('🗑️ Attempting to delete child with ID:', childId);
      
      // Start deletion animation
      const animation = childAnimations[childId];
      if (animation) {
        Animated.sequence([
          // Scale down slightly
          Animated.timing(animation, {
            toValue: 0.95,
            duration: 100,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }),
          // Fade out and scale down
          Animated.timing(animation, {
            toValue: 0,
            duration: 250,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }),
        ]).start();
      }
      
      // Wait a bit for animation to be visible
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const response = await api.delete(`/children/${childId}`);
      console.log('✅ Delete response:', response.status, response.data);
      
      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, 150));
      
      console.log('🔄 Force reloading children list...');
      await loadChildren();
      
      // Show success message after animation
      setTimeout(() => {
        Alert.alert('✅ Supprimé', 'L\'enfant a été supprimé avec succès.');
      }, 100);
      
    } catch (error: any) {
      console.error('❌ Error deleting child:', error);
      console.error('Error response:', error.response?.status, error.response?.data);
      
      // Reset animation on error
      const animation = childAnimations[childId];
      if (animation) {
        Animated.timing(animation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
      
      Alert.alert('Erreur', 'Impossible de supprimer cet enfant.');
    } finally {
      setIsLoading(false);
      setDeletingChildId(null);
    }
  };

  const handleLogout = async () => {
    // Plus d'Alert - juste mettre à jour l'état pour afficher la confirmation
    console.log('🎯 handleLogout appelé - affichage confirmation');
    setShowLogoutConfirmation(true);
  };
  
  const confirmLogout = async () => {
    console.log('⚡ Déconnexion confirmée - appel logout()');
    try {
      await logout();
      console.log('✅ Logout terminé avec succès');
      setShowLogoutConfirmation(false);
    } catch (error) {
      console.error('❌ Erreur logout:', error);
      setShowLogoutConfirmation(false);
    }
  };
  
  const cancelLogout = () => {
    console.log('❌ Déconnexion annulée');
    setShowLogoutConfirmation(false);
  };

  const getChildEmoji = (gender: 'boy' | 'girl') => {
    return gender === 'boy' ? '👦' : '👧';
  };

  const getAgeText = (ageMonths: number) => {
    const years = Math.floor(ageMonths / 12);
    const months = ageMonths % 12;
    
    if (years === 0) return `${months} mois`;
    if (months === 0) return `${years} an${years > 1 ? 's' : ''}`;
    return `${years}a ${months}m`;
  };

  const getPremiumStatusText = () => {
    if (monetizationStatus?.is_premium) {
      return '👑 Compte Premium';
    }
    if (monetizationStatus?.trial_days_left && monetizationStatus.trial_days_left > 0) {
      return `🆓 ${monetizationStatus.trial_days_left} jour${monetizationStatus.trial_days_left > 1 ? 's' : ''} d'essai restant${monetizationStatus.trial_days_left > 1 ? 's' : ''}`;
    }
    return '🔒 Essai terminé';
  };

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
          <Text style={styles.headerTitle}>Paramètres</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* User Profile Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-circle" size={24} color="white" />
              <Text style={styles.sectionTitle}>Mon Profil</Text>
            </View>
            
            <View style={styles.card}>
              <View style={styles.profileInfo}>
                <View style={styles.profileDetails}>
                  <Text style={styles.profileName}>
                    {user?.first_name} {user?.last_name}
                  </Text>
                  <Text style={styles.profileEmail}>{user?.email}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{getPremiumStatusText()}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setShowEditProfileModal(true)}
                >
                  <Ionicons name="create" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Children Management Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="people" size={24} color="white" />
              <Text style={styles.sectionTitle}>Mes Enfants ({children.length}/4)</Text>
              {children.length < 4 && (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setShowAddChildModal(true)}
                >
                  <Ionicons name="add" size={20} color="white" />
                </TouchableOpacity>
              )}
            </View>

            {children.length === 0 ? (
              <View style={styles.card}>
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateEmoji}>👶</Text>
                  <Text style={styles.emptyStateTitle}>Aucun enfant ajouté</Text>
                  <Text style={styles.emptyStateText}>
                    Ajoute tes enfants pour personnaliser les réponses selon leur âge
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyStateButton}
                    onPress={() => setShowAddChildModal(true)}
                  >
                    <Ionicons name="add-circle" size={20} color="white" />
                    <Text style={styles.emptyStateButtonText}>Ajouter mon premier enfant</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.childrenGrid}>
                {children.map((child, index) => {
                  const animatedValue = childAnimations[child.id] || new Animated.Value(1);
                  const isDeleting = deletingChildId === child.id;
                  
                  return (
                    <Animated.View
                      key={child.id}
                      style={[
                        styles.childCard,
                        {
                          opacity: animatedValue,
                          transform: [
                            {
                              scale: animatedValue,
                            },
                          ],
                        },
                        isDeleting && styles.deletingCard,
                      ]}
                    >
                      <View style={styles.childHeader}>
                        <Text style={styles.childEmoji}>{getChildEmoji(child.gender)}</Text>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDeleteChild(child)}
                          disabled={isLoading}
                          activeOpacity={0.7} // Feedback visuel lors du clic
                        >
                          <Ionicons 
                            name="trash" 
                            size={20} // Augmenté de 16 à 20 pour plus de visibilité
                            color={isLoading ? "#ccc" : "#ff6b9d"} 
                          />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.childName}>{child.name}</Text>
                      <Text style={styles.childAge}>{getAgeText(child.age_months)}</Text>
                      <Text style={styles.childBirthDate}>
                        {child.birth_month}/{child.birth_year}
                      </Text>
                    </Animated.View>
                  );
                })}
              </View>
            )}
          </View>

          {/* App Settings Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="settings" size={24} color="white" />
              <Text style={styles.sectionTitle}>Paramètres App</Text>
            </View>
            
            <View style={styles.card}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Ionicons name="notifications" size={24} color="white" />
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>Notifications</Text>
                    <Text style={styles.settingDescription}>
                      Rappels et nouveautés de l'app
                    </Text>
                  </View>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#767577', true: '#ff6b9d' }}
                  thumbColor={notificationsEnabled ? '#ffffff' : '#f4f3f4'}
                />
              </View>
            </View>
          </View>

          {/* Navigation Section */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.card, styles.navigationCard]}
              onPress={() => router.push('/subscription')}
            >
              <Ionicons name="star" size={24} color="#ffd700" />
              <Text style={styles.navigationText}>Passer Premium</Text>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.card, styles.navigationCard]}
              onPress={() => router.push('/history')}
            >
              <Ionicons name="time" size={24} color="white" />
              <Text style={styles.navigationText}>Historique des conversations</Text>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          {/* Logout Section */}
          <View style={styles.section}>
            <Pressable
              style={({ pressed }) => [
                styles.card,
                styles.logoutCard,
                pressed && styles.logoutButtonPressed
              ]}
              onPress={() => {
                console.log('🔘 Bouton de déconnexion cliqué');
                handleLogout();
              }}
            >
              <Ionicons name="log-out" size={24} color="#ff6b9d" />
              <Text style={styles.logoutText}>Se déconnecter</Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* Modals */}
        <EditProfileModal
          visible={showEditProfileModal}
          onClose={() => setShowEditProfileModal(false)}
          user={user}
          onUpdate={loadData}
        />

        <AddChildModal
          visible={showAddChildModal}
          onClose={() => setShowAddChildModal(false)}
          onChildAdded={handleChildAdded}
          maxReached={children.length >= 4}
        />

        {/* Modal de Confirmation de Suppression */}
        <Modal
          visible={showDeleteModal}
          transparent={true}
          animationType="fade"
          onRequestClose={cancelDeleteChild}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.deleteModalContainer}>
              <View style={styles.deleteModalHeader}>
                <Text style={styles.deleteModalTitle}>🗑️ Supprimer cet enfant</Text>
              </View>
              
              <View style={styles.deleteModalContent}>
                <Text style={styles.deleteModalMessage}>
                  Es-tu sûr(e) de vouloir supprimer{' '}
                  <Text style={styles.deleteModalChildName}>{childToDelete?.name}</Text>{' '}
                  de tes enfants ?
                </Text>
                <Text style={styles.deleteModalWarning}>
                  Cette action est irréversible.
                </Text>
              </View>
              
              <View style={styles.deleteModalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={cancelDeleteChild}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.confirmDeleteButton}
                  onPress={confirmDeleteChild}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.confirmDeleteButtonText}>Supprimer</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        
        {/* CONFIRMATION LOGOUT OVERLAY - Remplace Alert */}
        {showLogoutConfirmation && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            zIndex: 10000,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 20
          }}>
            <View style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 24,
              width: '100%',
              maxWidth: 300,
              alignItems: 'center'
            }}>
              <Text style={{ fontSize: 24, marginBottom: 8 }}>👋</Text>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
                Se déconnecter
              </Text>
              <Text style={{ fontSize: 14, marginBottom: 24, textAlign: 'center', color: '#666' }}>
                Es-tu sûr(e) de vouloir te déconnecter de Dis Maman ! ?
              </Text>
              
              <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#f0f0f0',
                    padding: 12,
                    borderRadius: 8,
                    alignItems: 'center'
                  }}
                  onPress={cancelLogout}
                >
                  <Text style={{ color: '#333', fontWeight: '600' }}>Annuler</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#ff6b9d',
                    padding: 12,
                    borderRadius: 8,
                    alignItems: 'center'
                  }}
                  onPress={confirmLogout}
                >
                  <Text style={{ color: 'white', fontWeight: '600' }}>Se déconnecter</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 12,
    flex: 1,
  },
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 8,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // Profile Section
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  editButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 12,
  },
  // Children Section
  childrenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  childCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
  },
  childHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 8,
  },
  childEmoji: {
    fontSize: 32,
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 107, 157, 0.3)', // Plus visible avec une couleur rose
    borderRadius: 12,
    padding: 8, // Plus grand pour faciliter le clic
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 157, 0.5)',
    minWidth: 32, // Taille minimum garantie
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    textAlign: 'center',
  },
  childAge: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
    textAlign: 'center',
  },
  childBirthDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    maxWidth: 250,
  },
  emptyStateButton: {
    backgroundColor: '#ff6b9d',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Settings Section
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  // Navigation Cards
  navigationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 8,
  },
  navigationText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 12,
    flex: 1,
  },
  // Logout Section
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 107, 157, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 157, 0.4)',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6b9d',
    marginLeft: 8,
  },
  logoutButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  // Animation styles
  deletingCard: {
    opacity: 0.6,
    backgroundColor: 'rgba(255, 107, 157, 0.1)',
  },
  
  // Delete Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  deleteModalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 25,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  deleteModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  deleteModalContent: {
    marginBottom: 30,
  },
  deleteModalMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 10,
  },
  deleteModalChildName: {
    fontWeight: 'bold',
    color: '#ff6b9d',
  },
  deleteModalWarning: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  deleteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmDeleteButton: {
    flex: 1,
    backgroundColor: '#ff6b9d',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmDeleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  DisButton,
  DisCard,
  DisInput,
  DisModal,
  DisBadge,
  DisAvatar,
} from '../components/design-system';

export default function DesignSystemDemo() {
  // Modal states
  const [showDefaultModal, setShowDefaultModal] = useState(false);
  const [showGradientModal, setShowGradientModal] = useState(false);
  const [showBlurModal, setShowBlurModal] = useState(false);

  // Input states
  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [messageValue, setMessageValue] = useState('');

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#f093fb']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <DisButton
            title="Retour"
            variant="ghost"
            size="small"
            icon="arrow-back"
            onPress={() => router.back()}
            style={styles.backButton}
          />
          <Text style={styles.headerTitle}>🎨 Design System</Text>
          <View style={styles.headerSpace} />
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Buttons Section */}
          <DisCard
            header="DisButton - Composant Bouton"
            icon="radio-button-on"
            variant="default"
            slideIn
            slideDirection="left"
          >
            <View style={styles.componentSection}>
              <Text style={styles.sectionDescription}>
                Boutons interactifs avec animations, haptic feedback et différentes variantes
              </Text>
              
              <View style={styles.buttonRow}>
                <DisButton
                  title="Primary"
                  variant="primary"
                  size="medium"
                  onPress={() => Alert.alert('Primary clicked!')}
                />
                <DisButton
                  title="Secondary"
                  variant="secondary"
                  size="medium"
                  onPress={() => Alert.alert('Secondary clicked!')}
                />
              </View>

              <View style={styles.buttonRow}>
                <DisButton
                  title="Success"
                  variant="success"
                  size="small"
                  icon="checkmark-circle"
                  onPress={() => Alert.alert('Success!')}
                />
                <DisButton
                  title="Warning"
                  variant="warning"
                  size="small"
                  icon="warning"
                  onPress={() => Alert.alert('Warning!')}
                />
                <DisButton
                  title="Danger"
                  variant="danger"
                  size="small"
                  icon="close-circle"
                  onPress={() => Alert.alert('Danger!')}
                />
              </View>

              <DisButton
                title="Large avec icône"
                variant="ghost"
                size="large"
                icon="star"
                iconPosition="right"
                fullWidth
                onPress={() => Alert.alert('Large button clicked!')}
                style={{ marginTop: 12 }}
              />
            </View>
          </DisCard>

          {/* Cards Section */}
          <DisCard
            header="DisCard - Composant Carte"
            icon="layers"
            variant="gradient"
            slideIn
            slideDirection="right"
            style={{ marginTop: 16 }}
          >
            <View style={styles.componentSection}>
              <Text style={styles.sectionDescription}>
                Cartes avec animations, gradients et différents styles
              </Text>

              <View style={styles.cardRow}>
                <DisCard
                  variant="primary"
                  size="small"
                  padding="small"
                  pressable
                  bouncy
                  onPress={() => Alert.alert('Card pressée!')}
                >
                  <Text style={styles.cardText}>Carte Primary</Text>
                </DisCard>

                <DisCard
                  variant="success"
                  size="small"
                  padding="small"
                  pressable
                  bouncy
                  onPress={() => Alert.alert('Card pressée!')}
                >
                  <Text style={styles.cardText}>Carte Success</Text>
                </DisCard>
              </View>

              <DisCard
                variant="secondary"
                header="Carte avec header"
                footer="Footer de la carte"
                icon="information-circle"
                pressable
                bouncy
                onPress={() => Alert.alert('Card avec header pressée!')}
                style={{ marginTop: 12 }}
              >
                <Text style={styles.cardContentText}>
                  Cette carte a un header, un footer et du contenu personnalisé.
                </Text>
              </DisCard>
            </View>
          </DisCard>

          {/* Inputs Section */}
          <DisCard
            header="DisInput - Composant Saisie"
            icon="text"
            variant="default"
            slideIn
            slideDirection="bottom"
            style={{ marginTop: 16 }}
          >
            <View style={styles.componentSection}>
              <Text style={styles.sectionDescription}>
                Champs de saisie avec animations et validation
              </Text>

              <DisInput
                label="Email"
                value={emailValue}
                onChangeText={setEmailValue}
                placeholder="votre@email.com"
                keyboardType="email-address"
                leftIcon="mail"
                variant="outlined"
                required
                style={{ marginBottom: 16 }}
              />

              <DisInput
                label="Mot de passe"
                value={passwordValue}
                onChangeText={setPasswordValue}
                placeholder="••••••••"
                secureTextEntry
                variant="filled"
                required
                style={{ marginBottom: 16 }}
              />

              <DisInput
                label="Message"
                value={messageValue}
                onChangeText={setMessageValue}
                placeholder="Votre message..."
                multiline
                numberOfLines={3}
                maxLength={200}
                characterCount
                variant="default"
              />
            </View>
          </DisCard>

          {/* Modals Section */}
          <DisCard
            header="DisModal - Composant Modal"
            icon="layers"
            variant="warning"
            slideIn
            slideDirection="left"
            style={{ marginTop: 16 }}
          >
            <View style={styles.componentSection}>
              <Text style={styles.sectionDescription}>
                Modales avec animations et différents styles
              </Text>

              <View style={styles.buttonRow}>
                <DisButton
                  title="Modal Default"
                  variant="primary"
                  size="small"
                  onPress={() => setShowDefaultModal(true)}
                />
                <DisButton
                  title="Modal Gradient"
                  variant="secondary"
                  size="small"
                  onPress={() => setShowGradientModal(true)}
                />
              </View>

              <DisButton
                title="Modal Blur"
                variant="ghost"
                size="medium"
                icon="eye"
                onPress={() => setShowBlurModal(true)}
                style={{ marginTop: 12 }}
              />
            </View>
          </DisCard>

          {/* Badges Section */}
          <DisCard
            header="DisBadge - Composant Badge"
            icon="bookmark"
            variant="info"
            slideIn
            slideDirection="right"
            style={{ marginTop: 16 }}
          >
            <View style={styles.componentSection}>
              <Text style={styles.sectionDescription}>
                Badges avec animations et couleurs
              </Text>

              <View style={styles.badgeRow}>
                <DisBadge text="Primary" variant="primary" pulse />
                <DisBadge text="Success" variant="success" icon="checkmark" />
                <DisBadge text="Warning" variant="warning" bounce />
                <DisBadge text="Danger" variant="danger" icon="warning" />
              </View>

              <View style={styles.badgeRow}>
                <DisBadge text="Small" variant="info" size="small" />
                <DisBadge text="Medium" variant="secondary" size="medium" />
                <DisBadge text="Large" variant="dark" size="large" />
              </View>
            </View>
          </DisCard>

          {/* Avatars Section */}
          <DisCard
            header="DisAvatar - Composant Avatar"
            icon="person-circle"
            variant="gradient"
            gradientColors={['#FF6B6B', '#4ECDC4', '#45B7D1']}
            slideIn
            slideDirection="bottom"
            style={{ marginTop: 16 }}
          >
            <View style={styles.componentSection}>
              <Text style={styles.sectionDescription}>
                Avatars avec animations et badges
              </Text>

              <View style={styles.avatarRow}>
                <DisAvatar
                  name="John Doe"
                  size="small"
                  variant="default"
                  pulse
                />
                <DisAvatar
                  initials="AB"
                  size="medium"
                  variant="gradient"
                  bounce
                />
                <DisAvatar
                  icon="person"
                  size="large"
                  variant="rounded"
                  backgroundColor="#FF6B6B"
                  badge={<DisBadge text="3" variant="danger" size="small" />}
                />
                <DisAvatar
                  name="Emma"
                  size="xl"
                  variant="default"
                  pressable
                  onPress={() => Alert.alert('Avatar cliqué!')}
                  badge={<DisBadge text="New" variant="success" size="small" />}
                  badgePosition="bottom-right"
                />
              </View>
            </View>
          </DisCard>

          {/* Demo Actions */}
          <DisCard
            header="Actions de Démonstration"
            icon="play-circle"
            variant="default"
            slideIn
            slideDirection="top"
            style={{ marginTop: 16, marginBottom: 32 }}
          >
            <DisButton
              title="🎉 Système de Design Complet !"
              variant="primary"
              size="large"
              icon="star"
              fullWidth
              onPress={() => Alert.alert(
                'Félicitations !',
                'Le système de design "Dis Maman !" est maintenant complet avec tous les composants réutilisables et leurs animations !'
              )}
            />
          </DisCard>
        </ScrollView>

        {/* Modals */}
        <DisModal
          visible={showDefaultModal}
          onClose={() => setShowDefaultModal(false)}
          title="Modal Default"
          variant="default"
          size="medium"
          animationType="bounce"
        >
          <Text style={styles.modalText}>
            Ceci est une modal par défaut avec animation bounce ! 🎉
          </Text>
          <DisButton
            title="Fermer"
            variant="primary"
            onPress={() => setShowDefaultModal(false)}
            style={{ marginTop: 16 }}
          />
        </DisModal>

        <DisModal
          visible={showGradientModal}
          onClose={() => setShowGradientModal(false)}
          title="Modal Gradient"
          variant="gradient"
          size="large"
          animationType="slide"
          position="bottom"
        >
          <Text style={styles.modalGradientText}>
            Modal avec gradient et animation slide ! ✨
          </Text>
          <View style={styles.modalButtonRow}>
            <DisButton
              title="Annuler"
              variant="ghost"
              size="medium"
              onPress={() => setShowGradientModal(false)}
            />
            <DisButton
              title="Confirmer"
              variant="secondary"
              size="medium"
              onPress={() => {
                setShowGradientModal(false);
                Alert.alert('Confirmé !');
              }}
            />
          </View>
        </DisModal>

        <DisModal
          visible={showBlurModal}
          onClose={() => setShowBlurModal(false)}
          title="Modal Blur"
          variant="blur"
          size="medium"
          animationType="fade"
        >
          <Text style={styles.modalText}>
            Modal avec effet blur et animation fade ! 🌟
          </Text>
          <DisInput
            label="Test input dans modal"
            value=""
            onChangeText={() => {}}
            placeholder="Tapez quelque chose..."
            variant="outlined"
            style={{ marginVertical: 16 }}
          />
          <DisButton
            title="OK"
            variant="success"
            icon="checkmark"
            onPress={() => setShowBlurModal(false)}
          />
        </DisModal>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'space-between',
  },
  backButton: {
    width: 80,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    flex: 1,
  },
  headerSpace: {
    width: 80,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  componentSection: {
    gap: 16,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cardContentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: 16,
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
  },
  modalGradientText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
});
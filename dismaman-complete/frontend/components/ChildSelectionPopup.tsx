import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';

interface Child {
  id: string;
  name: string;
  age_months: number;
  gender: 'boy' | 'girl';
}

interface ChildSelectionPopupProps {
  visible: boolean;
  children: Child[];
  onSelectChild: (childId: string) => void;
  onClose: () => void;
}

export const ChildSelectionPopup: React.FC<ChildSelectionPopupProps> = ({
  visible,
  children,
  onSelectChild,
  onClose,
}) => {
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  // Debug logs
  console.log('🎯 ChildSelectionPopup - visible:', visible);
  console.log('👶 ChildSelectionPopup - children count:', children?.length || 0);
  console.log('📊 ChildSelectionPopup - children data:', children);

  const handleConfirm = () => {
    if (!selectedChildId) {
      Alert.alert('Attention', 'Veuillez sélectionner un enfant');
      return;
    }
    onSelectChild(selectedChildId);
  };

  const getChildEmoji = (gender: 'boy' | 'girl') => {
    return gender === 'boy' ? '👦' : '👧';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {}} // Cannot be dismissed
    >
      <View style={styles.overlay}>
        <View style={styles.popup}>
          <Text style={styles.title}>🎁 Fin de l'essai gratuit</Text>
          <Text style={styles.subtitle}>
            Votre mois d'essai est terminé ! En version gratuite, vous pouvez
            conserver un seul enfant actif.
          </Text>

          <Text style={styles.label}>Choisissez l'enfant à conserver :</Text>

          <ScrollView style={styles.childrenContainer}>
            {children && children.length > 0 ? (
              children.map((child) => (
                <TouchableOpacity
                  key={child.id}
                  style={[
                    styles.childOption,
                    selectedChildId === child.id && styles.childOptionSelected,
                  ]}
                  onPress={() => setSelectedChildId(child.id)}
                >
                  <Text style={styles.childEmoji}>{getChildEmoji(child.gender)}</Text>
                  <View style={styles.childInfo}>
                    <Text style={styles.childName}>{child.name}</Text>
                    <Text style={styles.childAge}>{Math.floor(child.age_months / 12)} ans</Text>
                  </View>
                  <View
                    style={[
                      styles.radioButton,
                      selectedChildId === child.id && styles.radioButtonSelected,
                    ]}
                  />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noChildrenContainer}>
                <Text style={styles.noChildrenText}>
                  Aucun enfant trouvé. Veuillez d'abord ajouter des enfants dans les paramètres.
                </Text>
              </View>
            )}
          </ScrollView>

          <Text style={styles.freeVersion}>
            💡 En version gratuite : 1 question par mois maximum
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>Confirmer</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.upgradeButton} onPress={onClose}>
            <Text style={styles.upgradeButtonText}>
              🌟 Passer au Premium - Tous les enfants + Questions illimitées
            </Text>
          </TouchableOpacity>
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
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  childrenContainer: {
    maxHeight: 300,
    marginBottom: 20,
  },
  childOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  childOptionSelected: {
    borderColor: '#667eea',
    backgroundColor: '#f0f4ff',
  },
  childEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  childAge: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  radioButtonSelected: {
    borderColor: '#667eea',
    backgroundColor: '#667eea',
  },
  freeVersion: {
    fontSize: 14,
    color: '#ff6b9d',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  actions: {
    marginBottom: 16,
  },
  confirmButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  upgradeButton: {
    backgroundColor: '#ff6b9d',
    borderRadius: 12,
    padding: 14,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  noChildrenContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noChildrenText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});
import React, { useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
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

export default function AddChildScreen() {
  const [childName, setChildName] = useState('');
  const [gender, setGender] = useState<'boy' | 'girl' | null>(null);
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 18 }, (_, i) => currentYear - i);

  const addChild = async () => {
    if (!childName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le nom de votre enfant');
      return;
    }
    if (!gender) {
      Alert.alert('Erreur', 'Veuillez sélectionner le genre de votre enfant');
      return;
    }
    if (!birthMonth || !birthYear) {
      Alert.alert('Erreur', 'Veuillez sélectionner la date de naissance');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/children', {
        name: childName.trim(),
        gender,
        birth_month: parseInt(birthMonth),
        birth_year: parseInt(birthYear)
      });

      Alert.alert(
        '🎉 Enfant ajouté !',
        `${childName} a été ajouté avec succès !`,
        [
          {
            text: 'OK',
            onPress: () => {
              router.back();
            }
          }
        ]
      );
    } catch (error: any) {
      let message = 'Une erreur est survenue';
      if (error.response?.status === 400) {
        message = 'Maximum 4 enfants autorisés par compte';
      }
      Alert.alert('Erreur', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#f093fb']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Ajouter un enfant</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Child Name */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nom de l'enfant 👶</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Prénom de ton enfant"
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={childName}
                onChangeText={setChildName}
                maxLength={30}
              />
            </View>

            {/* Gender Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Genre 🎭</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    gender === 'girl' && styles.genderButtonSelected
                  ]}
                  onPress={() => setGender('girl')}
                >
                  <Text style={styles.genderEmoji}>👧</Text>
                  <Text style={styles.genderText}>Fille</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    gender === 'boy' && styles.genderButtonSelected
                  ]}
                  onPress={() => setGender('boy')}
                >
                  <Text style={styles.genderEmoji}>👦</Text>
                  <Text style={styles.genderText}>Garçon</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Birth Date */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Date de naissance 🎂</Text>
              
              <View style={styles.dateContainer}>
                <View style={styles.dateSection}>
                  <Text style={styles.dateLabel}>Mois</Text>
                  <ScrollView style={styles.monthPicker} showsVerticalScrollIndicator={false}>
                    {months.map((month, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.monthButton,
                          birthMonth === String(index + 1) && styles.monthButtonSelected
                        ]}
                        onPress={() => setBirthMonth(String(index + 1))}
                      >
                        <Text style={[
                          styles.monthText,
                          birthMonth === String(index + 1) && styles.monthTextSelected
                        ]}>
                          {month}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.dateSection}>
                  <Text style={styles.dateLabel}>Année</Text>
                  <ScrollView style={styles.yearPicker} showsVerticalScrollIndicator={false}>
                    {years.map((year) => (
                      <TouchableOpacity
                        key={year}
                        style={[
                          styles.yearButton,
                          birthYear === String(year) && styles.yearButtonSelected
                        ]}
                        onPress={() => setBirthYear(String(year))}
                      >
                        <Text style={[
                          styles.yearText,
                          birthYear === String(year) && styles.yearTextSelected
                        ]}>
                          {year}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Add Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.addButton,
                (!childName.trim() || !gender || !birthMonth || !birthYear) && styles.addButtonDisabled
              ]}
              onPress={addChild}
              disabled={!childName.trim() || !gender || !birthMonth || !birthYear || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="add-circle" size={24} color="white" />
                  <Text style={styles.addButtonText}>Ajouter mon enfant</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
  keyboardView: {
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 20,
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  genderButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    width: 120,
  },
  genderButtonSelected: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    transform: [{ scale: 1.05 }],
  },
  genderEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  genderText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  dateSection: {
    flex: 1,
  },
  dateLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  monthPicker: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    maxHeight: 200,
  },
  monthButton: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  monthButtonSelected: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  monthText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
  },
  monthTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  yearPicker: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    maxHeight: 200,
  },
  yearButton: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  yearButtonSelected: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  yearText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
  },
  yearTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
  },
  addButton: {
    backgroundColor: '#ff6b9d',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
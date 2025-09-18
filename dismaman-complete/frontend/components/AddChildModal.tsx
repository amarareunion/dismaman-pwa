import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { api } from '../contexts/AuthContext';

interface AddChildModalProps {
  visible: boolean;
  onClose: () => void;
  onChildAdded: () => void;
  maxReached: boolean;
}

interface FormData {
  name: string;
  gender: 'boy' | 'girl';
  birth_month: number;
  birth_year: number;
  complexity_level?: number; // Nouveau champ optionnel
}

const currentYear = new Date().getFullYear();
const minYear = currentYear - 15; // Max 15 years old
const maxYear = currentYear - 3;  // Min 3 years old

const schema = yup.object().shape({
  name: yup
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(20, 'Le nom ne peut pas dépasser 20 caractères')
    .required('Le nom est requis'),
  gender: yup
    .string()
    .oneOf(['boy', 'girl'], 'Le genre doit être sélectionné')
    .required('Le genre est requis'),
  birth_month: yup
    .number()
    .min(1, 'Mois invalide')
    .max(12, 'Mois invalide')
    .required('Le mois est requis'),
  birth_year: yup
    .number()
    .min(minYear, `L'année doit être entre ${minYear} et ${maxYear}`)
    .max(maxYear, `L'année doit être entre ${minYear} et ${maxYear}`)
    .required('L\'année est requise'),
});

const months = [
  { label: 'Janvier', value: 1 },
  { label: 'Février', value: 2 },
  { label: 'Mars', value: 3 },
  { label: 'Avril', value: 4 },
  { label: 'Mai', value: 5 },
  { label: 'Juin', value: 6 },
  { label: 'Juillet', value: 7 },
  { label: 'Août', value: 8 },
  { label: 'Septembre', value: 9 },
  { label: 'Octobre', value: 10 },
  { label: 'Novembre', value: 11 },
  { label: 'Décembre', value: 12 },
];

const years = Array.from(
  { length: maxYear - minYear + 1 },
  (_, i) => maxYear - i
);

export const AddChildModal: React.FC<AddChildModalProps> = ({
  visible,
  onClose,
  onChildAdded,
  maxReached,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      gender: undefined,
      birth_month: undefined,
      birth_year: undefined,
    },
  });

  const selectedGender = watch('gender');
  const selectedMonth = watch('birth_month');
  const selectedYear = watch('birth_year');

  const onSubmit = async (data: FormData) => {
    if (maxReached) {
      Alert.alert('Limite atteinte', 'Tu ne peux pas ajouter plus de 4 enfants.');
      return;
    }

    setIsLoading(true);
    try {
      // Ajouter le complexity_level par défaut
      const childData = {
        ...data,
        complexity_level: 0 // Niveau de complexité par défaut
      };
      
      console.log('Creating child with data:', childData); // Debug log
      const response = await api.post('/children', childData);
      console.log('✅ Child created successfully:', response.data);
      
      // Fermer immédiatement la modal et réinitialiser
      handleClose();
      reset();
      
      // Recharger la liste des enfants
      onChildAdded();
      
      // Délai court puis montrer la confirmation
      setTimeout(() => {
        Alert.alert(
          '🎉 Enfant ajouté !',
          `${data.name} a été ajouté avec succès et apparaît maintenant dans ta liste !`,
          [{ text: 'Super !', style: 'default' }]
        );
      }, 300);

    } catch (error: any) {
      console.error('❌ Error creating child:', error); // Debug log
      let message = 'Une erreur est survenue';
      if (error.response?.status === 400) {
        message = 'Maximum 4 enfants autorisés par compte';
      } else if (error.response?.data?.detail) {
        message = error.response.data.detail;
      }
      Alert.alert('Erreur', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      reset();
      onClose();
    }
  };

  const getMonthName = (month: number) => {
    return months.find(m => m.value === month)?.label || 'Sélectionner';
  };

  const calculateAge = () => {
    if (selectedMonth && selectedYear) {
      const now = new Date();
      const ageMonths = (now.getFullYear() - selectedYear) * 12 + (now.getMonth() + 1 - selectedMonth);
      const years = Math.floor(ageMonths / 12);
      const months = ageMonths % 12;
      
      if (years === 0) return `${months} mois`;
      if (months === 0) return `${years} an${years > 1 ? 's' : ''}`;
      return `${years} an${years > 1 ? 's' : ''} et ${months} mois`;
    }
    return '';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={handleClose}
    >
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.container}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Ajouter un enfant</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.form}>
              {/* Child Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nom de l'enfant</Text>
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[styles.inputContainer, errors.name && styles.inputError]}>
                      <Ionicons name="person" size={20} color="rgba(255,255,255,0.7)" />
                      <TextInput
                        style={styles.input}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder="Prénom de ton enfant"
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        autoCapitalize="words"
                        editable={!isLoading}
                        maxLength={20}
                      />
                    </View>
                  )}
                />
                {errors.name && (
                  <Text style={styles.errorText}>{errors.name.message}</Text>
                )}
              </View>

              {/* Gender Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Genre</Text>
                <Controller
                  control={control}
                  name="gender"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.genderContainer}>
                      <TouchableOpacity
                        style={[
                          styles.genderButton,
                          value === 'girl' && styles.genderButtonSelected,
                          errors.gender && styles.inputError
                        ]}
                        onPress={() => onChange('girl')}
                        disabled={isLoading}
                      >
                        <Text style={styles.genderEmoji}>👧</Text>
                        <Text style={[
                          styles.genderText,
                          value === 'girl' && styles.genderTextSelected
                        ]}>
                          Fille
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[
                          styles.genderButton,
                          value === 'boy' && styles.genderButtonSelected,
                          errors.gender && styles.inputError
                        ]}
                        onPress={() => onChange('boy')}
                        disabled={isLoading}
                      >
                        <Text style={styles.genderEmoji}>👦</Text>
                        <Text style={[
                          styles.genderText,
                          value === 'boy' && styles.genderTextSelected
                        ]}>
                          Garçon
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                />
                {errors.gender && (
                  <Text style={styles.errorText}>{errors.gender.message}</Text>
                )}
              </View>

              {/* Birth Date */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date de naissance</Text>
                <View style={styles.dateContainer}>
                  {/* Month Picker */}
                  <Controller
                    control={control}
                    name="birth_month"
                    render={({ field: { onChange, value } }) => (
                      <TouchableOpacity
                        style={[
                          styles.dateButton,
                          errors.birth_month && styles.inputError
                        ]}
                        onPress={() => setShowMonthPicker(true)}
                        disabled={isLoading}
                      >
                        <Ionicons name="calendar" size={20} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.dateButtonText}>
                          {value ? getMonthName(value) : 'Mois'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.7)" />
                      </TouchableOpacity>
                    )}
                  />

                  {/* Year Picker */}
                  <Controller
                    control={control}
                    name="birth_year"
                    render={({ field: { onChange, value } }) => (
                      <TouchableOpacity
                        style={[
                          styles.dateButton,
                          errors.birth_year && styles.inputError
                        ]}
                        onPress={() => setShowYearPicker(true)}
                        disabled={isLoading}
                      >
                        <Ionicons name="calendar" size={20} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.dateButtonText}>
                          {value ? value.toString() : 'Année'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.7)" />
                      </TouchableOpacity>
                    )}
                  />
                </View>
                {(errors.birth_month || errors.birth_year) && (
                  <Text style={styles.errorText}>
                    {errors.birth_month?.message || errors.birth_year?.message}
                  </Text>
                )}
                
                {/* Age Display */}
                {selectedMonth && selectedYear && (
                  <View style={styles.ageDisplay}>
                    <Ionicons name="time" size={16} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.ageText}>Âge: {calculateAge()}</Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.addButton,
                (!isValid || isLoading || maxReached) && styles.addButtonDisabled
              ]}
              onPress={handleSubmit(onSubmit)}
              disabled={!isValid || isLoading || maxReached}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="add" size={20} color="white" />
                  <Text style={styles.addButtonText}>Ajouter</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Month Picker Modal */}
          <Modal
            visible={showMonthPicker}
            transparent={true}
            animationType="slide"
          >
            <View style={styles.pickerOverlay}>
              <View style={styles.pickerContainer}>
                <View style={styles.pickerHeader}>
                  <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
                    <Text style={styles.pickerCancel}>Annuler</Text>
                  </TouchableOpacity>
                  <Text style={styles.pickerTitle}>Sélectionner le mois</Text>
                  <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
                    <Text style={styles.pickerDone}>OK</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.pickerScroll}>
                  <Controller
                    control={control}
                    name="birth_month"
                    render={({ field: { onChange, value } }) => (
                      <>
                        {months.map((month) => (
                          <TouchableOpacity
                            key={month.value}
                            style={[
                              styles.pickerItem,
                              value === month.value && styles.pickerItemSelected
                            ]}
                            onPress={() => onChange(month.value)}
                          >
                            <Text style={[
                              styles.pickerItemText,
                              value === month.value && styles.pickerItemTextSelected
                            ]}>
                              {month.label}
                            </Text>
                            {value === month.value && (
                              <Ionicons name="checkmark" size={20} color="#ff6b9d" />
                            )}
                          </TouchableOpacity>
                        ))}
                      </>
                    )}
                  />
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Year Picker Modal */}
          <Modal
            visible={showYearPicker}
            transparent={true}
            animationType="slide"
          >
            <View style={styles.pickerOverlay}>
              <View style={styles.pickerContainer}>
                <View style={styles.pickerHeader}>
                  <TouchableOpacity onPress={() => setShowYearPicker(false)}>
                    <Text style={styles.pickerCancel}>Annuler</Text>
                  </TouchableOpacity>
                  <Text style={styles.pickerTitle}>Sélectionner l'année</Text>
                  <TouchableOpacity onPress={() => setShowYearPicker(false)}>
                    <Text style={styles.pickerDone}>OK</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.pickerScroll}>
                  <Controller
                    control={control}
                    name="birth_year"
                    render={({ field: { onChange, value } }) => (
                      <>
                        {years.map((year) => (
                          <TouchableOpacity
                            key={year}
                            style={[
                              styles.pickerItem,
                              value === year && styles.pickerItemSelected
                            ]}
                            onPress={() => onChange(year)}
                          >
                            <Text style={[
                              styles.pickerItemText,
                              value === year && styles.pickerItemTextSelected
                            ]}>
                              {year.toString()}
                            </Text>
                            {value === year && (
                              <Ionicons name="checkmark" size={20} color="#ff6b9d" />
                            )}
                          </TouchableOpacity>
                        ))}
                      </>
                    )}
                  />
                </ScrollView>
              </View>
            </View>
          </Modal>
        </KeyboardAvoidingView>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
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
    paddingTop: 60,
  },
  closeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  form: {
    paddingVertical: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  inputError: {
    borderColor: '#ff6b9d',
    backgroundColor: 'rgba(255,107,157,0.1)',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: 'white',
    marginLeft: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#ff6b9d',
    marginTop: 4,
    marginLeft: 4,
  },
  // Gender Selection
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  genderButtonSelected: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderColor: 'white',
  },
  genderEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  genderText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  genderTextSelected: {
    color: 'white',
  },
  // Date Selection
  dateContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    color: 'white',
    marginLeft: 12,
  },
  ageDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 8,
  },
  ageText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 6,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  addButton: {
    flex: 1,
    backgroundColor: '#ff6b9d',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  // Picker Styles
  pickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  pickerCancel: {
    fontSize: 16,
    color: '#999',
  },
  pickerDone: {
    fontSize: 16,
    color: '#ff6b9d',
    fontWeight: '600',
  },
  picker: {
    height: 200,
  },
  pickerScroll: {
    maxHeight: 300,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerItemSelected: {
    backgroundColor: '#f8f8f8',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333',
  },
  pickerItemTextSelected: {
    color: '#ff6b9d',
    fontWeight: '600',
  },
});
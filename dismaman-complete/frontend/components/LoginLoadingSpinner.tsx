import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface LoginLoadingSpinnerProps {
  isVisible: boolean;
  message?: string;
}

export const LoginLoadingSpinner: React.FC<LoginLoadingSpinnerProps> = ({ 
  isVisible, 
  message = 'Connexion en cours...' 
}) => {
  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    minWidth: 200,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    color: '#333333',
  },
});

export default LoginLoadingSpinner;

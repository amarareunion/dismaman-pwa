import React from 'react';
import { Slot } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { MonetizationProvider } from '../contexts/MonetizationContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <MonetizationProvider>
        <Slot />
      </MonetizationProvider>
    </AuthProvider>
  );
}
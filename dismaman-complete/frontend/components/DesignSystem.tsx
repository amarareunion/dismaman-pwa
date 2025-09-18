import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ViewStyle,
  TextStyle,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Color System
export const colors = {
  // Primary gradients
  primary: ['#667eea', '#764ba2'],
  secondary: ['#f093fb', '#f5576c'],
  success: ['#10b981', '#059669'],
  warning: ['#f59e0b', '#f97316'],
  error: ['#ef4444', '#dc2626'],
  
  // Status colors
  trial: '#8b5cf6',
  premium: '#f59e0b',
  expired: '#ef4444',
  
  // Interface colors
  background: '#f8fafc',
  cardBg: 'rgba(255, 255, 255, 0.95)',
  cardBgDark: 'rgba(255, 255, 255, 0.1)',
  text: '#1f2937',
  textMuted: '#6b7280',
  textLight: 'rgba(255, 255, 255, 0.9)',
  
  // Glassmorphism
  glass: 'rgba(255, 255, 255, 0.15)',
  glassStrong: 'rgba(255, 255, 255, 0.25)',
};

// Typography System
export const typography = {
  // Fun titles
  title: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.text,
  },
  
  // Subtitles
  subtitle: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.text,
  },
  
  // Body text
  body: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  
  // Playful text for children
  playful: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.primary[0],
  },
  
  // Button text
  button: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
    fontSize: 16,
    fontWeight: '600' as const,
    color: 'white',
  },
};

// DisButton Component
interface DisButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export const DisButton: React.FC<DisButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  disabled = false,
  loading = false,
  style,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!disabled && !loading) {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getButtonColors = () => {
    switch (variant) {
      case 'primary': return colors.primary;
      case 'secondary': return colors.secondary;
      case 'success': return colors.success;
      case 'warning': return colors.warning;
      case 'error': return colors.error;
      default: return colors.primary;
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'small': return { paddingHorizontal: 16, paddingVertical: 8, fontSize: 14 };
      case 'medium': return { paddingHorizontal: 24, paddingVertical: 12, fontSize: 16 };
      case 'large': return { paddingHorizontal: 32, paddingVertical: 16, fontSize: 18 };
    }
  };

  const buttonSize = getButtonSize();
  const gradientColors = getButtonColors();

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }] },
        style,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={gradientColors}
          style={[
            styles.button,
            {
              paddingHorizontal: buttonSize.paddingHorizontal,
              paddingVertical: buttonSize.paddingVertical,
            },
            disabled && styles.buttonDisabled,
          ]}
        >
          {loading ? (
            <Animated.View style={styles.buttonContent}>
              <Text style={[typography.button, { fontSize: buttonSize.fontSize }]}>
                Chargement...
              </Text>
            </Animated.View>
          ) : (
            <View style={styles.buttonContent}>
              {icon && (
                <Ionicons
                  name={icon}
                  size={buttonSize.fontSize + 4}
                  color="white"
                  style={styles.buttonIcon}
                />
              )}
              <Text style={[typography.button, { fontSize: buttonSize.fontSize }]}>
                {title}
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// DisCard Component
interface DisCardProps {
  children: React.ReactNode;
  variant?: 'glass' | 'solid';
  style?: ViewStyle;
}

export const DisCard: React.FC<DisCardProps> = ({
  children,
  variant = 'glass',
  style,
}) => {
  return (
    <View
      style={[
        styles.card,
        variant === 'glass' ? styles.cardGlass : styles.cardSolid,
        style,
      ]}
    >
      {children}
    </View>
  );
};

// DisBadge Component
interface DisBadgeProps {
  text: string;
  variant?: 'trial' | 'premium' | 'expired';
  animated?: boolean;
}

export const DisBadge: React.FC<DisBadgeProps> = ({
  text,
  variant = 'trial',
  animated = false,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animated) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animated]);

  const getBadgeColor = () => {
    switch (variant) {
      case 'trial': return colors.trial;
      case 'premium': return colors.premium;
      case 'expired': return colors.expired;
      default: return colors.trial;
    }
  };

  return (
    <Animated.View
      style={[
        styles.badge,
        { backgroundColor: getBadgeColor() },
        { transform: [{ scale: animated ? pulseAnim : 1 }] },
      ]}
    >
      <Text style={styles.badgeText}>{text}</Text>
    </Animated.View>
  );
};

// DisAvatar Component
interface DisAvatarProps {
  gender: 'boy' | 'girl';
  size?: 'small' | 'medium' | 'large';
}

export const DisAvatar: React.FC<DisAvatarProps> = ({
  gender,
  size = 'medium',
}) => {
  const getAvatarSize = () => {
    switch (size) {
      case 'small': return 32;
      case 'medium': return 48;
      case 'large': return 64;
    }
  };

  const avatarSize = getAvatarSize();
  const emoji = gender === 'boy' ? '👦' : '👧';

  return (
    <View
      style={[
        styles.avatar,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
        },
      ]}
    >
      <Text style={{ fontSize: avatarSize * 0.6 }}>{emoji}</Text>
    </View>
  );
};

// Common Styles
const styles = StyleSheet.create({
  // Button styles
  button: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  
  // Card styles
  card: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
  },
  cardGlass: {
    backgroundColor: colors.glass,
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardSolid: {
    backgroundColor: colors.cardBg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Badge styles
  badge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Avatar styles
  avatar: {
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});
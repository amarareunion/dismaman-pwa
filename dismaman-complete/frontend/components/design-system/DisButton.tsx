import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface DisButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  bouncy?: boolean;
  hapticFeedback?: boolean;
  style?: any;
}

const DisButton: React.FC<DisButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  bouncy = true,
  hapticFeedback = true,
  style,
}) => {
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const pressAnimation = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || loading) return;
    
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (bouncy) {
      Animated.spring(scaleAnimation, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    } else {
      Animated.timing(pressAnimation, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (disabled || loading) return;

    if (bouncy) {
      Animated.spring(scaleAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    } else {
      Animated.timing(pressAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePress = () => {
    if (disabled || loading) return;
    
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    onPress();
  };

  const getButtonStyle = () => {
    const baseStyle = [styles.button];
    
    // Variant styles
    switch (variant) {
      case 'primary':
        baseStyle.push(styles.primaryButton);
        break;
      case 'secondary':
        baseStyle.push(styles.secondaryButton);
        break;
      case 'success':
        baseStyle.push(styles.successButton);
        break;
      case 'warning':
        baseStyle.push(styles.warningButton);
        break;
      case 'danger':
        baseStyle.push(styles.dangerButton);
        break;
      case 'ghost':
        baseStyle.push(styles.ghostButton);
        break;
    }

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.push(styles.smallButton);
        break;
      case 'medium':
        baseStyle.push(styles.mediumButton);
        break;
      case 'large':
        baseStyle.push(styles.largeButton);
        break;
    }

    // State styles
    if (disabled) {
      baseStyle.push(styles.disabledButton);
    }

    if (fullWidth) {
      baseStyle.push(styles.fullWidthButton);
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.buttonText];
    
    // Variant text styles
    switch (variant) {
      case 'primary':
        baseStyle.push(styles.primaryButtonText);
        break;
      case 'secondary':
        baseStyle.push(styles.secondaryButtonText);
        break;
      case 'success':
        baseStyle.push(styles.successButtonText);
        break;
      case 'warning':
        baseStyle.push(styles.warningButtonText);
        break;
      case 'danger':
        baseStyle.push(styles.dangerButtonText);
        break;
      case 'ghost':
        baseStyle.push(styles.ghostButtonText);
        break;
    }

    // Size text styles
    switch (size) {
      case 'small':
        baseStyle.push(styles.smallButtonText);
        break;
      case 'medium':
        baseStyle.push(styles.mediumButtonText);
        break;
      case 'large':
        baseStyle.push(styles.largeButtonText);
        break;
    }

    if (disabled) {
      baseStyle.push(styles.disabledButtonText);
    }

    return baseStyle;
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'medium':
        return 20;
      case 'large':
        return 24;
      default:
        return 20;
    }
  };

  const getIconColor = () => {
    if (disabled) return 'rgba(255,255,255,0.4)';
    
    switch (variant) {
      case 'primary':
      case 'success':
      case 'warning':
      case 'danger':
        return 'white';
      case 'secondary':
        return '#667eea';
      case 'ghost':
        return 'white';
      default:
        return 'white';
    }
  };

  const animatedStyle = {
    transform: [{ scale: bouncy ? scaleAnimation : pressAnimation }],
  };

  return (
    <Animated.View style={[animatedStyle, style]}>
      <TouchableOpacity
        style={getButtonStyle()}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={bouncy ? 1 : 0.8}
      >
        {loading ? (
          <ActivityIndicator 
            size="small" 
            color={variant === 'secondary' ? '#667eea' : 'white'} 
          />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <Ionicons 
                name={icon} 
                size={getIconSize()} 
                color={getIconColor()} 
                style={styles.leftIcon} 
              />
            )}
            <Text style={getTextStyle()}>{title}</Text>
            {icon && iconPosition === 'right' && (
              <Ionicons 
                name={icon} 
                size={getIconSize()} 
                color={getIconColor()} 
                style={styles.rightIcon} 
              />
            )}
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // Base button styles
  button: {
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },

  // Variant styles
  primaryButton: {
    backgroundColor: '#667eea',
    borderWidth: 0,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 2,
    borderColor: '#667eea',
  },
  successButton: {
    backgroundColor: '#4CAF50',
    borderWidth: 0,
  },
  warningButton: {
    backgroundColor: '#FF9800',
    borderWidth: 0,
  },
  dangerButton: {
    backgroundColor: '#F44336',
    borderWidth: 0,
  },
  ghostButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  // Size styles
  smallButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },
  mediumButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 44,
  },
  largeButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    minHeight: 52,
  },

  // State styles
  disabledButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'rgba(255,255,255,0.2)',
    shadowOpacity: 0,
    elevation: 0,
  },
  fullWidthButton: {
    width: '100%',
  },

  // Text styles
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Fredoka One' : 'Roboto',
  },

  // Variant text styles
  primaryButtonText: {
    color: 'white',
  },
  secondaryButtonText: {
    color: '#667eea',
  },
  successButtonText: {
    color: 'white',
  },
  warningButtonText: {
    color: 'white',
  },
  dangerButtonText: {
    color: 'white',
  },
  ghostButtonText: {
    color: 'white',
  },

  // Size text styles
  smallButtonText: {
    fontSize: 14,
  },
  mediumButtonText: {
    fontSize: 16,
  },
  largeButtonText: {
    fontSize: 18,
  },

  // State text styles
  disabledButtonText: {
    color: 'rgba(255,255,255,0.4)',
  },

  // Icon styles
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
});

export default DisButton;
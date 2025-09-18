import React, { useState, useRef, useEffect } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface DisInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  errorMessage?: string;
  successMessage?: string;
  variant?: 'default' | 'filled' | 'outlined' | 'underlined';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  focusAnimationEnabled?: boolean;
  bouncy?: boolean;
  hapticFeedback?: boolean;
  characterCount?: boolean;
  required?: boolean;
  style?: any;
  inputStyle?: any;
}

const DisInput: React.FC<DisInputProps> = ({
  value,
  onChangeText,
  placeholder,
  label,
  errorMessage,
  successMessage,
  variant = 'default',
  size = 'medium',
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
  leftIcon,
  rightIcon,
  onRightIconPress,
  focusAnimationEnabled = true,
  bouncy = true,
  hapticFeedback = true,
  characterCount = false,
  required = false,
  style,
  inputStyle,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecureVisible, setIsSecureVisible] = useState(!secureTextEntry);
  
  const focusAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const labelAnimation = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    // Animate label based on focus and value
    Animated.timing(labelAnimation, {
      toValue: (isFocused || value) ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const handleFocus = () => {
    setIsFocused(true);
    
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (focusAnimationEnabled) {
      Animated.parallel([
        Animated.timing(focusAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        bouncy ? Animated.spring(scaleAnimation, {
          toValue: 1.02,
          useNativeDriver: true,
          tension: 300,
          friction: 10,
        }) : Animated.timing(scaleAnimation, { toValue: 1, duration: 0, useNativeDriver: true }),
      ]).start();
    }
  };

  const handleBlur = () => {
    setIsFocused(false);

    if (focusAnimationEnabled) {
      Animated.parallel([
        Animated.timing(focusAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        bouncy ? Animated.spring(scaleAnimation, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 10,
        }) : Animated.timing(scaleAnimation, { toValue: 1, duration: 0, useNativeDriver: true }),
      ]).start();
    }
  };

  const toggleSecureVisibility = () => {
    setIsSecureVisible(!isSecureVisible);
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const getContainerStyle = () => {
    const baseStyle = [styles.container];

    // Variant styles
    switch (variant) {
      case 'default':
        baseStyle.push(styles.defaultContainer);
        break;
      case 'filled':
        baseStyle.push(styles.filledContainer);
        break;
      case 'outlined':
        baseStyle.push(styles.outlinedContainer);
        break;
      case 'underlined':
        baseStyle.push(styles.underlinedContainer);
        break;
    }

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.push(styles.smallContainer);
        break;
      case 'medium':
        baseStyle.push(styles.mediumContainer);
        break;
      case 'large':
        baseStyle.push(styles.largeContainer);
        break;
    }

    // State styles
    if (isFocused) {
      baseStyle.push(styles.focusedContainer);
    }

    if (errorMessage) {
      baseStyle.push(styles.errorContainer);
    }

    if (successMessage) {
      baseStyle.push(styles.successContainer);
    }

    if (disabled) {
      baseStyle.push(styles.disabledContainer);
    }

    return baseStyle;
  };

  const getInputStyle = () => {
    const baseStyle = [styles.input];

    // Size input styles
    switch (size) {
      case 'small':
        baseStyle.push(styles.smallInput);
        break;
      case 'medium':
        baseStyle.push(styles.mediumInput);
        break;
      case 'large':
        baseStyle.push(styles.largeInput);
        break;
    }

    // Multiline styles
    if (multiline) {
      baseStyle.push(styles.multilineInput);
    }

    // Icon padding
    if (leftIcon) {
      baseStyle.push(styles.inputWithLeftIcon);
    }

    if (rightIcon || (secureTextEntry && !isSecureVisible)) {
      baseStyle.push(styles.inputWithRightIcon);
    }

    if (disabled) {
      baseStyle.push(styles.disabledInput);
    }

    return baseStyle;
  };

  const getLabelStyle = () => {
    const animatedFontSize = labelAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    });

    const animatedTop = labelAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [size === 'large' ? 20 : size === 'small' ? 12 : 16, -8],
    });

    return {
      ...styles.floatingLabel,
      fontSize: animatedFontSize,
      top: animatedTop,
      color: errorMessage ? '#F44336' : 
            successMessage ? '#4CAF50' : 
            isFocused ? '#667eea' : 'rgba(0,0,0,0.6)',
    };
  };

  const getBorderColor = () => {
    if (errorMessage) return '#F44336';
    if (successMessage) return '#4CAF50';
    if (isFocused) return '#667eea';
    return 'rgba(0,0,0,0.2)';
  };

  const animatedBorderColor = focusAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,0,0,0.2)', getBorderColor()],
  });

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 18;
      case 'medium':
        return 20;
      case 'large':
        return 22;
      default:
        return 20;
    }
  };

  const getIconColor = () => {
    if (disabled) return 'rgba(0,0,0,0.3)';
    if (errorMessage) return '#F44336';
    if (successMessage) return '#4CAF50';
    if (isFocused) return '#667eea';
    return 'rgba(0,0,0,0.5)';
  };

  return (
    <View style={style}>
      <Animated.View 
        style={[
          getContainerStyle(),
          variant === 'outlined' && { borderColor: animatedBorderColor },
          { transform: [{ scale: scaleAnimation }] }
        ]}
      >
        {/* Floating Label */}
        {label && variant !== 'underlined' && (
          <Animated.Text style={getLabelStyle()}>
            {label}{required && ' *'}
          </Animated.Text>
        )}

        {/* Input Container */}
        <View style={styles.inputContainer}>
          {/* Left Icon */}
          {leftIcon && (
            <Ionicons 
              name={leftIcon} 
              size={getIconSize()} 
              color={getIconColor()} 
              style={styles.leftIconStyle} 
            />
          )}

          {/* Text Input */}
          <TextInput
            style={[getInputStyle(), inputStyle]}
            value={value}
            onChangeText={onChangeText}
            placeholder={variant === 'underlined' || !label ? placeholder : undefined}
            placeholderTextColor="rgba(0,0,0,0.4)"
            onFocus={handleFocus}
            onBlur={handleBlur}
            editable={!disabled}
            multiline={multiline}
            numberOfLines={multiline ? numberOfLines : 1}
            maxLength={maxLength}
            secureTextEntry={secureTextEntry && !isSecureVisible}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoCorrect={autoCorrect}
            textAlignVertical={multiline ? 'top' : 'center'}
          />

          {/* Right Icon / Secure Text Toggle */}
          {(rightIcon || secureTextEntry) && (
            <TouchableOpacity
              onPress={secureTextEntry ? toggleSecureVisibility : onRightIconPress}
              style={styles.rightIconContainer}
            >
              <Ionicons 
                name={
                  secureTextEntry 
                    ? (isSecureVisible ? 'eye-off' : 'eye')
                    : rightIcon!
                } 
                size={getIconSize()} 
                color={getIconColor()} 
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Underlined Label */}
        {label && variant === 'underlined' && (
          <Text style={[styles.underlinedLabel, { color: getBorderColor() }]}>
            {label}{required && ' *'}
          </Text>
        )}
      </Animated.View>

      {/* Character Count */}
      {characterCount && maxLength && (
        <Text style={styles.characterCount}>
          {value.length}/{maxLength}
        </Text>
      )}

      {/* Error Message */}
      {errorMessage && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}

      {/* Success Message */}
      {successMessage && (
        <Text style={styles.successText}>{successMessage}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Container styles
  container: {
    marginVertical: 8,
    position: 'relative',
  },
  defaultContainer: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  filledContainer: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 12,
    borderWidth: 0,
  },
  outlinedContainer: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 2,
  },
  underlinedContainer: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.2)',
  },

  // Size container styles
  smallContainer: {
    minHeight: 40,
  },
  mediumContainer: {
    minHeight: 48,
  },
  largeContainer: {
    minHeight: 56,
  },

  // State container styles
  focusedContainer: {
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  errorContainer: {
    borderColor: '#F44336',
  },
  successContainer: {
    borderColor: '#4CAF50',
  },
  disabledContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderColor: 'rgba(0,0,0,0.1)',
  },

  // Input container
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  // Input styles
  input: {
    flex: 1,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    includeFontPadding: false,
  },
  smallInput: {
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mediumInput: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  largeInput: {
    fontSize: 18,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  multilineInput: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  inputWithLeftIcon: {
    paddingLeft: 8,
  },
  inputWithRightIcon: {
    paddingRight: 8,
  },
  disabledInput: {
    color: 'rgba(0,0,0,0.4)',
  },

  // Label styles
  floatingLabel: {
    position: 'absolute',
    left: 16,
    backgroundColor: 'white',
    paddingHorizontal: 4,
    fontWeight: '500',
    zIndex: 1,
  },
  underlinedLabel: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 0,
    fontWeight: '500',
  },

  // Icon styles
  leftIconStyle: {
    marginLeft: 12,
    marginRight: 8,
  },
  rightIconContainer: {
    padding: 8,
    marginRight: 8,
  },

  // Helper text styles
  characterCount: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.6)',
    textAlign: 'right',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
    marginLeft: 4,
  },
  successText: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 4,
    marginLeft: 4,
  },
});

export default DisInput;
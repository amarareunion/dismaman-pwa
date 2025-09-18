import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DisBadgeProps {
  text: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'light' | 'dark';
  size?: 'small' | 'medium' | 'large';
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  pulse?: boolean;
  bounce?: boolean;
  style?: any;
}

const DisBadge: React.FC<DisBadgeProps> = ({
  text,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  pulse = false,
  bounce = false,
  style,
}) => {
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const bounceAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (pulse) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    if (bounce) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnimation, {
            toValue: 1.05,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnimation, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [pulse, bounce]);

  const getBadgeStyle = () => {
    const baseStyle = [styles.badge];

    // Variant styles
    switch (variant) {
      case 'primary':
        baseStyle.push(styles.primaryBadge);
        break;
      case 'secondary':
        baseStyle.push(styles.secondaryBadge);
        break;
      case 'success':
        baseStyle.push(styles.successBadge);
        break;
      case 'warning':
        baseStyle.push(styles.warningBadge);
        break;
      case 'danger':
        baseStyle.push(styles.dangerBadge);
        break;
      case 'info':
        baseStyle.push(styles.infoBadge);
        break;
      case 'light':
        baseStyle.push(styles.lightBadge);
        break;
      case 'dark':
        baseStyle.push(styles.darkBadge);
        break;
    }

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.push(styles.smallBadge);
        break;
      case 'medium':
        baseStyle.push(styles.mediumBadge);
        break;
      case 'large':
        baseStyle.push(styles.largeBadge);
        break;
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.badgeText];

    // Variant text styles
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'success':
      case 'warning':
      case 'danger':
      case 'info':
      case 'dark':
        baseStyle.push(styles.lightText);
        break;
      case 'light':
        baseStyle.push(styles.darkText);
        break;
    }

    // Size text styles
    switch (size) {
      case 'small':
        baseStyle.push(styles.smallText);
        break;
      case 'medium':
        baseStyle.push(styles.mediumText);
        break;
      case 'large':
        baseStyle.push(styles.largeText);
        break;
    }

    return baseStyle;
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 12;
      case 'medium':
        return 14;
      case 'large':
        return 16;
      default:
        return 14;
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'light':
        return '#333';
      default:
        return 'white';
    }
  };

  const getAnimatedStyle = () => {
    const animatedStyle: any = {};
    
    if (pulse) {
      animatedStyle.transform = [{ scale: pulseAnimation }];
    }
    
    if (bounce) {
      if (animatedStyle.transform) {
        animatedStyle.transform.push({ scale: bounceAnimation });
      } else {
        animatedStyle.transform = [{ scale: bounceAnimation }];
      }
    }

    return animatedStyle;
  };

  return (
    <Animated.View style={[getBadgeStyle(), getAnimatedStyle(), style]}>
      {icon && iconPosition === 'left' && (
        <Ionicons 
          name={icon} 
          size={getIconSize()} 
          color={getIconColor()} 
          style={styles.leftIcon} 
        />
      )}
      <Text style={getTextStyle()}>{text}</Text>
      {icon && iconPosition === 'right' && (
        <Ionicons 
          name={icon} 
          size={getIconSize()} 
          color={getIconColor()} 
          style={styles.rightIcon} 
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // Base badge styles
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },

  // Variant styles
  primaryBadge: {
    backgroundColor: '#667eea',
  },
  secondaryBadge: {
    backgroundColor: '#6c757d',
  },
  successBadge: {
    backgroundColor: '#4CAF50',
  },
  warningBadge: {
    backgroundColor: '#FF9800',
  },
  dangerBadge: {
    backgroundColor: '#F44336',
  },
  infoBadge: {
    backgroundColor: '#2196F3',
  },
  lightBadge: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  darkBadge: {
    backgroundColor: '#343a40',
  },

  // Size styles
  smallBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    minHeight: 20,
  },
  mediumBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    minHeight: 24,
  },
  largeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 28,
  },

  // Text styles
  badgeText: {
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Fredoka One' : 'Roboto',
    textAlign: 'center',
  },
  lightText: {
    color: 'white',
  },
  darkText: {
    color: '#333',
  },

  // Size text styles
  smallText: {
    fontSize: 10,
  },
  mediumText: {
    fontSize: 12,
  },
  largeText: {
    fontSize: 14,
  },

  // Icon styles
  leftIcon: {
    marginRight: 4,
  },
  rightIcon: {
    marginLeft: 4,
  },
});

export default DisBadge;
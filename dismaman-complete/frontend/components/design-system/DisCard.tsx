import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface DisCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'gradient';
  size?: 'small' | 'medium' | 'large';
  padding?: 'none' | 'small' | 'medium' | 'large';
  margin?: 'none' | 'small' | 'medium' | 'large';
  shadow?: boolean;
  borderRadius?: 'none' | 'small' | 'medium' | 'large' | 'xl';
  pressable?: boolean;
  onPress?: () => void;
  slideIn?: boolean;
  slideDirection?: 'left' | 'right' | 'top' | 'bottom';
  bouncy?: boolean;
  hapticFeedback?: boolean;
  header?: string;
  footer?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  gradientColors?: string[];
  style?: any;
}

const DisCard: React.FC<DisCardProps> = ({
  children,
  variant = 'default',
  size = 'medium',
  padding = 'medium',
  margin = 'medium',
  shadow = true,
  borderRadius = 'medium',
  pressable = false,
  onPress,
  slideIn = false,
  slideDirection = 'bottom',
  bouncy = false,
  hapticFeedback = true,
  header,
  footer,
  icon,
  gradientColors,
  style,
}) => {
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const opacityAnimation = useRef(new Animated.Value(slideIn ? 0 : 1)).current;

  useEffect(() => {
    if (slideIn) {
      // Set initial position
      let initialValue = 50;
      switch (slideDirection) {
        case 'left':
          slideAnimation.setValue(-initialValue);
          break;
        case 'right':
          slideAnimation.setValue(initialValue);
          break;
        case 'top':
          slideAnimation.setValue(-initialValue);
          break;
        case 'bottom':
          slideAnimation.setValue(initialValue);
          break;
      }

      // Animate in
      Animated.parallel([
        Animated.spring(slideAnimation, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnimation, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [slideIn]);

  const handlePressIn = () => {
    if (!pressable) return;
    
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (bouncy) {
      Animated.spring(scaleAnimation, {
        toValue: 0.98,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!pressable) return;

    if (bouncy) {
      Animated.spring(scaleAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    }
  };

  const handlePress = () => {
    if (!pressable || !onPress) return;
    
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    onPress();
  };

  const getCardStyle = () => {
    const baseStyle = [styles.card];

    // Variant styles
    switch (variant) {
      case 'default':
        baseStyle.push(styles.defaultCard);
        break;
      case 'primary':
        baseStyle.push(styles.primaryCard);
        break;
      case 'secondary':
        baseStyle.push(styles.secondaryCard);
        break;
      case 'success':
        baseStyle.push(styles.successCard);
        break;
      case 'warning':
        baseStyle.push(styles.warningCard);
        break;
      case 'danger':
        baseStyle.push(styles.dangerCard);
        break;
      case 'gradient':
        // Will be handled by LinearGradient
        baseStyle.push(styles.gradientCard);
        break;
    }

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.push(styles.smallCard);
        break;
      case 'medium':
        baseStyle.push(styles.mediumCard);
        break;
      case 'large':
        baseStyle.push(styles.largeCard);
        break;
    }

    // Padding styles
    switch (padding) {
      case 'none':
        baseStyle.push(styles.noPadding);
        break;
      case 'small':
        baseStyle.push(styles.smallPadding);
        break;
      case 'medium':
        baseStyle.push(styles.mediumPadding);
        break;
      case 'large':
        baseStyle.push(styles.largePadding);
        break;
    }

    // Margin styles
    switch (margin) {
      case 'none':
        baseStyle.push(styles.noMargin);
        break;
      case 'small':
        baseStyle.push(styles.smallMargin);
        break;
      case 'medium':
        baseStyle.push(styles.mediumMargin);
        break;
      case 'large':
        baseStyle.push(styles.largeMargin);
        break;
    }

    // Border radius styles
    switch (borderRadius) {
      case 'none':
        baseStyle.push(styles.noBorderRadius);
        break;
      case 'small':
        baseStyle.push(styles.smallBorderRadius);
        break;
      case 'medium':
        baseStyle.push(styles.mediumBorderRadius);
        break;
      case 'large':
        baseStyle.push(styles.largeBorderRadius);
        break;
      case 'xl':
        baseStyle.push(styles.xlBorderRadius);
        break;
    }

    // Shadow styles
    if (shadow) {
      baseStyle.push(styles.shadow);
    }

    return baseStyle;
  };

  const getAnimatedStyle = () => {
    const animatedStyle: any = {
      opacity: opacityAnimation,
      transform: [{ scale: scaleAnimation }],
    };

    if (slideIn) {
      if (slideDirection === 'left' || slideDirection === 'right') {
        animatedStyle.transform.push({ translateX: slideAnimation });
      } else {
        animatedStyle.transform.push({ translateY: slideAnimation });
      }
    }

    return animatedStyle;
  };

  const renderContent = () => (
    <>
      {(header || icon) && (
        <View style={styles.cardHeader}>
          {icon && (
            <Ionicons 
              name={icon} 
              size={20} 
              color={variant === 'gradient' || variant === 'primary' ? 'white' : '#667eea'} 
              style={styles.headerIcon} 
            />
          )}
          {header && (
            <Text style={[
              styles.headerText,
              { color: variant === 'gradient' || variant === 'primary' ? 'white' : '#333' }
            ]}>
              {header}
            </Text>
          )}
        </View>
      )}
      
      <View style={styles.cardContent}>
        {children}
      </View>
      
      {footer && (
        <View style={styles.cardFooter}>
          <Text style={[
            styles.footerText,
            { color: variant === 'gradient' || variant === 'primary' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.6)' }
          ]}>
            {footer}
          </Text>
        </View>
      )}
    </>
  );

  const CardWrapper = pressable ? TouchableOpacity : View;
  const cardProps = pressable ? {
    onPress: handlePress,
    onPressIn: handlePressIn,
    onPressOut: handlePressOut,
    activeOpacity: bouncy ? 1 : 0.8,
  } : {};

  return (
    <Animated.View style={[getAnimatedStyle(), style]}>
      {variant === 'gradient' ? (
        <LinearGradient
          colors={gradientColors || ['#667eea', '#764ba2', '#f093fb']}
          style={getCardStyle()}
        >
          <CardWrapper {...cardProps}>
            {renderContent()}
          </CardWrapper>
        </LinearGradient>
      ) : (
        <CardWrapper style={getCardStyle()} {...cardProps}>
          {renderContent()}
        </CardWrapper>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // Base card styles
  card: {
    backgroundColor: 'white',
    overflow: 'hidden',
  },

  // Variant styles
  defaultCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  primaryCard: {
    backgroundColor: '#667eea',
  },
  secondaryCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 2,
    borderColor: '#667eea',
  },
  successCard: {
    backgroundColor: '#4CAF50',
  },
  warningCard: {
    backgroundColor: '#FF9800',
  },
  dangerCard: {
    backgroundColor: '#F44336',
  },
  gradientCard: {
    backgroundColor: 'transparent',
  },

  // Size styles
  smallCard: {
    minHeight: 80,
  },
  mediumCard: {
    minHeight: 120,
  },
  largeCard: {
    minHeight: 160,
  },

  // Padding styles
  noPadding: {
    padding: 0,
  },
  smallPadding: {
    padding: 12,
  },
  mediumPadding: {
    padding: 20,
  },
  largePadding: {
    padding: 28,
  },

  // Margin styles
  noMargin: {
    margin: 0,
  },
  smallMargin: {
    margin: 8,
  },
  mediumMargin: {
    marginVertical: 12,
    marginHorizontal: 16,
  },
  largeMargin: {
    margin: 20,
  },

  // Border radius styles
  noBorderRadius: {
    borderRadius: 0,
  },
  smallBorderRadius: {
    borderRadius: 8,
  },
  mediumBorderRadius: {
    borderRadius: 16,
  },
  largeBorderRadius: {
    borderRadius: 24,
  },
  xlBorderRadius: {
    borderRadius: 32,
  },

  // Shadow styles
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  // Content styles
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerIcon: {
    marginRight: 8,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Fredoka One' : 'Roboto',
  },
  cardContent: {
    flex: 1,
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  footerText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default DisCard;
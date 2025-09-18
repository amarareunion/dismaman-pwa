import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface DisAvatarProps {
  source?: { uri: string } | number;
  name?: string;
  initials?: string;
  size?: 'small' | 'medium' | 'large' | 'xl' | number;
  variant?: 'default' | 'rounded' | 'square' | 'gradient';
  borderColor?: string;
  borderWidth?: number;
  backgroundColor?: string;
  textColor?: string;
  gradientColors?: string[];
  icon?: keyof typeof Ionicons.glyphMap;
  badge?: React.ReactNode;
  badgePosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  pressable?: boolean;
  onPress?: () => void;
  pulse?: boolean;
  bounce?: boolean;
  hapticFeedback?: boolean;
  style?: any;
}

const DisAvatar: React.FC<DisAvatarProps> = ({
  source,
  name,
  initials,
  size = 'medium',
  variant = 'default',
  borderColor = '#667eea',
  borderWidth = 0,
  backgroundColor = '#667eea',
  textColor = 'white',
  gradientColors,
  icon,
  badge,
  badgePosition = 'top-right',
  pressable = false,
  onPress,
  pulse = false,
  bounce = false,
  hapticFeedback = true,
  style,
}) => {
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const bounceAnimation = useRef(new Animated.Value(1)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;

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
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [pulse, bounce]);

  const handlePressIn = () => {
    if (!pressable) return;
    
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    Animated.spring(scaleAnimation, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    if (!pressable) return;

    Animated.spring(scaleAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePress = () => {
    if (!pressable || !onPress) return;
    
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    onPress();
  };

  const getAvatarSize = () => {
    if (typeof size === 'number') return size;
    
    switch (size) {
      case 'small':
        return 32;
      case 'medium':
        return 48;
      case 'large':
        return 64;
      case 'xl':
        return 80;
      default:
        return 48;
    }
  };

  const getAvatarStyle = () => {
    const avatarSize = getAvatarSize();
    const baseStyle = [
      styles.avatar,
      {
        width: avatarSize,
        height: avatarSize,
        borderColor,
        borderWidth,
      }
    ];

    // Variant styles
    switch (variant) {
      case 'default':
        baseStyle.push({ borderRadius: avatarSize / 2 });
        break;
      case 'rounded':
        baseStyle.push({ borderRadius: 8 });
        break;
      case 'square':
        baseStyle.push({ borderRadius: 0 });
        break;
      case 'gradient':
        baseStyle.push({ borderRadius: avatarSize / 2 });
        break;
    }

    if (!source && !icon) {
      baseStyle.push({ backgroundColor });
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const avatarSize = getAvatarSize();
    const baseStyle = [
      styles.avatarText,
      {
        fontSize: avatarSize / 2.5,
        color: textColor,
      }
    ];

    return baseStyle;
  };

  const getIconSize = () => {
    const avatarSize = getAvatarSize();
    return avatarSize / 2;
  };

  const getInitials = () => {
    if (initials) return initials;
    if (name) {
      return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .substring(0, 2);
    }
    return '?';
  };

  const getBadgePosition = () => {
    const avatarSize = getAvatarSize();
    const badgeSize = 20;
    const offset = badgeSize / 3;

    switch (badgePosition) {
      case 'top-right':
        return {
          position: 'absolute' as const,
          top: -offset,
          right: -offset,
        };
      case 'top-left':
        return {
          position: 'absolute' as const,
          top: -offset,
          left: -offset,
        };
      case 'bottom-right':
        return {
          position: 'absolute' as const,
          bottom: -offset,
          right: -offset,
        };
      case 'bottom-left':
        return {
          position: 'absolute' as const,
          bottom: -offset,
          left: -offset,
        };
    }
  };

  const getAnimatedStyle = () => {
    const transforms = [{ scale: scaleAnimation }];
    
    if (pulse) {
      transforms.push({ scale: pulseAnimation });
    }
    
    if (bounce) {
      transforms.push({ scale: bounceAnimation });
    }

    return { transform: transforms };
  };

  const renderAvatarContent = () => {
    if (source) {
      return (
        <Image
          source={source}
          style={[getAvatarStyle(), { borderWidth: 0 }]}
          resizeMode="cover"
        />
      );
    }

    if (icon) {
      return (
        <Ionicons
          name={icon}
          size={getIconSize()}
          color={textColor}
        />
      );
    }

    return (
      <Text style={getTextStyle()}>
        {getInitials()}
      </Text>
    );
  };

  const AvatarWrapper = pressable ? TouchableOpacity : View;
  const avatarProps = pressable ? {
    onPress: handlePress,
    onPressIn: handlePressIn,
    onPressOut: handlePressOut,
    activeOpacity: 0.8,
  } : {};

  return (
    <Animated.View style={[getAnimatedStyle(), style]}>
      <View style={styles.avatarContainer}>
        {variant === 'gradient' ? (
          <LinearGradient
            colors={gradientColors || ['#667eea', '#764ba2']}
            style={getAvatarStyle()}
          >
            <AvatarWrapper style={styles.avatarContent} {...avatarProps}>
              {renderAvatarContent()}
            </AvatarWrapper>
          </LinearGradient>
        ) : (
          <AvatarWrapper style={getAvatarStyle()} {...avatarProps}>
            {renderAvatarContent()}
          </AvatarWrapper>
        )}

        {/* Badge */}
        {badge && (
          <View style={getBadgePosition()}>
            {badge}
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarContent: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Fredoka One' : 'Roboto',
    textAlign: 'center',
  },
});

export default DisAvatar;
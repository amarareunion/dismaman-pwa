import React, { useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

interface DisModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  variant?: 'default' | 'gradient' | 'blur';
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  position?: 'center' | 'bottom' | 'top';
  animationType?: 'slide' | 'fade' | 'bounce';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  hapticFeedback?: boolean;
  gradientColors?: string[];
  backdropOpacity?: number;
  borderRadius?: number;
  style?: any;
}

const DisModal: React.FC<DisModalProps> = ({
  visible,
  onClose,
  title,
  children,
  variant = 'default',
  size = 'medium',
  position = 'center',
  animationType = 'slide',
  showCloseButton = true,
  closeOnBackdrop = true,
  hapticFeedback = true,
  gradientColors,
  backdropOpacity = 0.5,
  borderRadius = 20,
  style,
}) => {
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.9)).current;
  const backdropAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      if (hapticFeedback) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Animate in
      const animations = [
        Animated.timing(backdropAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ];

      switch (animationType) {
        case 'slide':
          slideAnimation.setValue(position === 'bottom' ? height : position === 'top' ? -height : 50);
          animations.push(
            Animated.spring(slideAnimation, {
              toValue: 0,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            })
          );
          break;
        case 'fade':
          fadeAnimation.setValue(0);
          animations.push(
            Animated.timing(fadeAnimation, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            })
          );
          break;
        case 'bounce':
          scaleAnimation.setValue(0.7);
          fadeAnimation.setValue(0);
          animations.push(
            Animated.parallel([
              Animated.spring(scaleAnimation, {
                toValue: 1,
                useNativeDriver: true,
                tension: 150,
                friction: 8,
              }),
              Animated.timing(fadeAnimation, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }),
            ])
          );
          break;
      }

      Animated.parallel(animations).start();
    } else {
      // Animate out
      const animations = [
        Animated.timing(backdropAnimation, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ];

      switch (animationType) {
        case 'slide':
          animations.push(
            Animated.timing(slideAnimation, {
              toValue: position === 'bottom' ? height : position === 'top' ? -height : 50,
              duration: 250,
              useNativeDriver: true,
            })
          );
          break;
        case 'fade':
          animations.push(
            Animated.timing(fadeAnimation, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            })
          );
          break;
        case 'bounce':
          animations.push(
            Animated.parallel([
              Animated.spring(scaleAnimation, {
                toValue: 0.7,
                useNativeDriver: true,
                tension: 150,
                friction: 8,
              }),
              Animated.timing(fadeAnimation, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
              }),
            ])
          );
          break;
      }

      Animated.parallel(animations).start();
    }
  }, [visible]);

  const handleClose = () => {
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  const handleBackdropPress = () => {
    if (closeOnBackdrop) {
      handleClose();
    }
  };

  const getModalStyle = () => {
    const baseStyle = [styles.modal];

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.push(styles.smallModal);
        break;
      case 'medium':
        baseStyle.push(styles.mediumModal);
        break;
      case 'large':
        baseStyle.push(styles.largeModal);
        break;
      case 'fullscreen':
        baseStyle.push(styles.fullscreenModal);
        break;
    }

    // Position styles
    switch (position) {
      case 'top':
        baseStyle.push(styles.topModal);
        break;
      case 'center':
        baseStyle.push(styles.centerModal);
        break;
      case 'bottom':
        baseStyle.push(styles.bottomModal);
        break;
    }

    return baseStyle;
  };

  const getContainerStyle = () => {
    const baseStyle = [styles.modalContainer, { borderRadius }];

    // Variant styles
    switch (variant) {
      case 'default':
        baseStyle.push(styles.defaultContainer);
        break;
      case 'gradient':
        // Will be handled by LinearGradient
        baseStyle.push(styles.gradientContainer);
        break;
      case 'blur':
        baseStyle.push(styles.blurContainer);
        break;
    }

    return baseStyle;
  };

  const getAnimatedStyle = () => {
    const animatedStyle: any = {};

    switch (animationType) {
      case 'slide':
        if (position === 'bottom' || position === 'top') {
          animatedStyle.transform = [{ translateY: slideAnimation }];
        } else {
          animatedStyle.transform = [{ translateY: slideAnimation }];
        }
        break;
      case 'fade':
        animatedStyle.opacity = fadeAnimation;
        break;
      case 'bounce':
        animatedStyle.opacity = fadeAnimation;
        animatedStyle.transform = [{ scale: scaleAnimation }];
        break;
    }

    return animatedStyle;
  };

  const renderModalContent = () => (
    <>
      {/* Header */}
      {(title || showCloseButton) && (
        <View style={styles.modalHeader}>
          {title && (
            <Text style={[
              styles.modalTitle,
              { color: variant === 'gradient' ? 'white' : '#333' }
            ]}>
              {title}
            </Text>
          )}
          {showCloseButton && (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
            >
              <Ionicons 
                name="close" 
                size={24} 
                color={variant === 'gradient' ? 'white' : '#666'} 
              />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Content */}
      <ScrollView 
        style={styles.modalContent}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="light-content" />
      
      {/* Backdrop */}
      <Animated.View 
        style={[
          styles.backdrop,
          { 
            opacity: backdropAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, backdropOpacity],
            })
          }
        ]}
      >
        <TouchableOpacity
          style={styles.backdropTouchable}
          onPress={handleBackdropPress}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Modal */}
      <Animated.View style={[getModalStyle(), getAnimatedStyle(), style]}>
        {variant === 'gradient' ? (
          <LinearGradient
            colors={gradientColors || ['#667eea', '#764ba2', '#f093fb']}
            style={getContainerStyle()}
          >
            {renderModalContent()}
          </LinearGradient>
        ) : variant === 'blur' ? (
          <BlurView intensity={100} style={getContainerStyle()}>
            {renderModalContent()}
          </BlurView>
        ) : (
          <View style={getContainerStyle()}>
            {renderModalContent()}
          </View>
        )}
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Backdrop styles
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
  },
  backdropTouchable: {
    flex: 1,
  },

  // Modal styles
  modal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  // Size styles
  smallModal: {
    justifyContent: 'center',
  },
  mediumModal: {
    justifyContent: 'center',
  },
  largeModal: {
    justifyContent: 'center',
  },
  fullscreenModal: {
    paddingHorizontal: 0,
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24,
  },

  // Position styles
  topModal: {
    justifyContent: 'flex-start',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  centerModal: {
    justifyContent: 'center',
  },
  bottomModal: {
    justifyContent: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },

  // Container styles
  modalContainer: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  defaultContainer: {
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  gradientContainer: {
    backgroundColor: 'transparent',
  },
  blurContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  // Content styles
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Fredoka One' : 'Roboto',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
});

export default DisModal;
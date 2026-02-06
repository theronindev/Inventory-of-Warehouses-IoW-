/**
 * Custom Button Component
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { Colors } from '../constants/colors';

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon = null,
  style,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return Colors.backgroundDark;
    switch (variant) {
      case 'primary': return Colors.primary;
      case 'secondary': return Colors.accent;
      case 'outline': return 'transparent';
      case 'danger': return Colors.error;
      case 'success': return Colors.success;
      default: return Colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return Colors.textMuted;
    if (variant === 'outline') return Colors.primary;
    return Colors.white;
  };

  const getPadding = () => {
    switch (size) {
      case 'small': return { paddingVertical: 6, paddingHorizontal: 12 };
      case 'large': return { paddingVertical: 14, paddingHorizontal: 24 };
      default: return { paddingVertical: 10, paddingHorizontal: 16 };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small': return 12;
      case 'large': return 16;
      default: return 14;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getPadding(),
        { backgroundColor: getBackgroundColor() },
        variant === 'outline' && styles.outline,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={[styles.text, { color: getTextColor(), fontSize: getFontSize() }]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  outline: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Button;

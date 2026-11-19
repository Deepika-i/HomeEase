
import React, { useRef } from 'react';

import {
  Animated,
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native';

type AnimatedButtonProps = {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

export default function AnimatedButton({
  children,
  onPress,
  style,
  disabled = false,
}: AnimatedButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale }],
      }}
    >
      <Pressable
        style={style}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

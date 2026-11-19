
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';

type AnimatedCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
};

export default function AnimatedCard({
  children,
  style,
  delay = 0,
}: AnimatedCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 450,
        delay,
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => {
      animation.stop();
    };
  }, [fadeAnim, slideAnim, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View>{children}</View>
    </Animated.View>
  );
}

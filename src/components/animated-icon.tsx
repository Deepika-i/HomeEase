
import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
} from 'react-native';

const DURATION = 600;

export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let mounted = true;

    SplashScreen.hideAsync().catch(() => {});

    const animation = Animated.sequence([
      Animated.delay(300),
      Animated.timing(opacity, {
        toValue: 0,
        duration: DURATION,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished && mounted) {
        setVisible(false);
      }
    });

    return () => {
      mounted = false;
      animation.stop();
    };
  }, [opacity]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.splashOverlay,
        { opacity },
      ]}
    >
      <Image
        style={styles.image}
        source={require('@/assets/images/expo-logo.png')}
        contentFit="contain"
      />
    </Animated.View>
  );
}

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Image
        style={styles.glow}
        source={require('@/assets/images/logo-glow.png')}
        contentFit="contain"
      />

      <View style={styles.background} />

      <Image
        style={styles.image}
        source={require('@/assets/images/expo-logo.png')}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
  },
  glow: {
    width: 201,
    height: 201,
    position: 'absolute',
  },
  image: {
    width: 76,
    height: 71,
  },
  background: {
    borderRadius: 40,
    backgroundColor: '#0274DF',
    width: 128,
    height: 128,
    position: 'absolute',
  },
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#208AEF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});

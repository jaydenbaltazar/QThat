// components/RotatingVinyl.tsx
import React, { useEffect } from 'react';
import { StyleSheet, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';

interface Props {
  isSpinning: boolean;
  coverImage?: string;
  resetKey: number;   
}

const RotatingVinyl: React.FC<Props> = ({ isSpinning, coverImage, resetKey }) => {
  const rotation = useSharedValue(0);

  /* resetKey changes → instantly reset angle */
  useEffect(() => {
    cancelAnimation(rotation);
    rotation.value = 0;
  }, [resetKey]);

  /* play / pause spinning */
  useEffect(() => {
    if (isSpinning) {
      rotation.value = withRepeat(
        withTiming(rotation.value + 360, {
          duration: 6000,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    } else {
      cancelAnimation(rotation);
      // keep current angle (no rewind)
    }
  }, [isSpinning]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Image source={require('../assets/images/vinyl2.png')} style={styles.vinyl} />
      <Image
        source={
          coverImage
            ? { uri: coverImage }
            : require('../assets/images/frank2.jpg')
        }
        style={styles.center}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  vinyl: {
    width: 300,
    height: 300,
    borderRadius: 150,
    position: 'absolute',
  },
  center: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
});

export default RotatingVinyl;

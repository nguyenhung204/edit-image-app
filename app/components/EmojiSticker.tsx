import React, { forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { safeFontSize } from '../utils/styleUtils';

type Props = {
  emoji: string;
  size?: number;
  onDelete?: () => void;
};

export type EmojiStickerRef = {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
};

const EmojiSticker = forwardRef<EmojiStickerRef, Props>(({ emoji, size = 50, onDelete }, ref) => {
  // Validate emoji prop để tránh crash
  if (!emoji || typeof emoji !== 'string' || emoji.trim() === '') {
    console.warn('EmojiSticker: Invalid emoji prop:', emoji);
    return null; // Return null thay vì crash
  }

  const safeSize = safeFontSize(size); // Sử dụng inline function
  const scaleImage = useSharedValue(1); // Bắt đầu với scale = 1 thay vì size
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const savedRotation = useSharedValue(0);

  // Pinch gesture for zoom
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const newScale = Math.max(0.3, Math.min(3, savedScale.value * event.scale));
      scaleImage.value = newScale;
    })
    .onEnd(() => {
      savedScale.value = Math.max(0.3, Math.min(3, scaleImage.value));
    });

  // Rotation gesture
  const rotationGesture = Gesture.Rotation()
    .onUpdate((event) => {
      rotation.value = savedRotation.value + event.rotation;
    })
    .onEnd(() => {
      savedRotation.value = rotation.value;
    });

  // Double tap to reset
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => {
      scaleImage.value = withSpring(1);
      savedScale.value = 1;
      rotation.value = withSpring(0);
      savedRotation.value = 0;
    });

  // Pan gesture for dragging
  const drag = Gesture.Pan().onChange(event => {
    translateX.value += event.changeX;
    translateY.value += event.changeY;
  });

  // Combined gestures - sử dụng Simultaneous để có thể drag + zoom + rotate cùng lúc
  const composed = Gesture.Simultaneous(drag, pinchGesture, rotationGesture, doubleTap);

  const containerStyle = useAnimatedStyle(() => {
    const safeScale = Math.max(0.3, Math.min(3, scaleImage.value));
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: safeScale },
        { rotate: `${rotation.value}rad` },
      ],
    };
  });

  const zoomIn = () => {
    const currentScale = Math.abs(scaleImage.value || 1);
    const newScale = Math.min(currentScale * 1.2, 3);
    scaleImage.value = withSpring(newScale);
    savedScale.value = newScale;
  };

  const zoomOut = () => {
    const currentScale = Math.abs(scaleImage.value || 1);
    const newScale = Math.max(currentScale * 0.8, 0.3);
    scaleImage.value = withSpring(newScale);
    savedScale.value = newScale;
  };

  const reset = () => {
    scaleImage.value = withSpring(1);
    savedScale.value = 1;
    rotation.value = withSpring(0);
    savedRotation.value = 0;
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
  };

  useImperativeHandle(ref, () => ({
    zoomIn,
    zoomOut,
    reset,
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[containerStyle, styles.stickerContainer]}>
        <View style={styles.emojiWrapper}>
          <Text style={[styles.emoji, { fontSize: safeSize }]}>
            {emoji}
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
});

export default EmojiSticker;

const styles = StyleSheet.create({
  stickerContainer: {
    position: 'absolute',
    top: 100,
    left: 100,
  },
  emojiWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    minWidth: 60,
    minHeight: 60,
  },
  emoji: {
    textAlign: 'center',
  },
});
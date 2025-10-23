import React, { forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

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

const EmojiSticker = forwardRef<EmojiStickerRef, Props>(({ emoji, size = 80, onDelete }, ref) => {
  const scaleImage = useSharedValue(size);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const savedRotation = useSharedValue(0);

  // Pinch gesture for zoom
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scaleImage.value = savedScale.value * event.scale * size;
    })
    .onEnd(() => {
      savedScale.value = scaleImage.value / size;
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
      scaleImage.value = withSpring(size);
      savedScale.value = 1;
      rotation.value = withSpring(0);
      savedRotation.value = 0;
    });

  // Pan gesture for dragging
  const drag = Gesture.Pan().onChange(event => {
    translateX.value += event.changeX;
    translateY.value += event.changeY;
  });

  // Combined gestures
  const composed = Gesture.Simultaneous(
    drag,
    Gesture.Simultaneous(pinchGesture, rotationGesture)
  );

  const containerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: translateX.value,
        },
        {
          translateY: translateY.value,
        },
        {
          scale: scaleImage.value / size,
        },
        {
          rotate: `${rotation.value}rad`,
        },
      ],
    };
  });

  const zoomIn = () => {
    const newScale = Math.min(scaleImage.value * 1.2, size * 3);
    scaleImage.value = withSpring(newScale);
    savedScale.value = newScale / size;
  };

  const zoomOut = () => {
    const newScale = Math.max(scaleImage.value * 0.8, size * 0.3);
    scaleImage.value = withSpring(newScale);
    savedScale.value = newScale / size;
  };

  const reset = () => {
    scaleImage.value = withSpring(size);
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
        <GestureDetector gesture={doubleTap}>
          <View style={styles.emojiWrapper}>
            <Text style={[styles.emoji, { fontSize: size }]}>
              {emoji}
            </Text>
          </View>
        </GestureDetector>
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
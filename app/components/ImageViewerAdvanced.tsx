import { Image } from 'expo-image';
import React from 'react';
import { Dimensions, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

type Props = {
  imgSource: ImageSourcePropType;
  selectedImage?: string;
  frameUri?: string;
  onImageTransform?: (scale: number, translateX: number, translateY: number) => void;
  editable?: boolean;
};

const { width: screenWidth } = Dimensions.get('window');
const IMAGE_WIDTH = 320;
const IMAGE_HEIGHT = 440;
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;

export default function ImageViewer({ 
  imgSource, 
  selectedImage, 
  frameUri,
  onImageTransform,
  editable = true
}: Props) {
  const imageSource = selectedImage ? { uri: selectedImage } : imgSource;
  
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const updateTransform = (newScale: number, newTranslateX: number, newTranslateY: number) => {
    if (onImageTransform) {
      onImageTransform(newScale, newTranslateX, newTranslateY);
    }
  };

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      if (!editable) return;
      
      const newScale = savedScale.value * event.scale;
      scale.value = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);
    })
    .onEnd(() => {
      if (!editable) return;
      
      savedScale.value = scale.value;
      runOnJS(updateTransform)(scale.value, translateX.value, translateY.value);
    });

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (!editable) return;
      
      // Giới hạn di chuyển trong phạm vi hợp lý
      const maxTranslateX = (IMAGE_WIDTH * (scale.value - 1)) / 2;
      const maxTranslateY = (IMAGE_HEIGHT * (scale.value - 1)) / 2;
      
      const newTranslateX = savedTranslateX.value + event.translationX;
      const newTranslateY = savedTranslateY.value + event.translationY;
      
      translateX.value = Math.min(Math.max(newTranslateX, -maxTranslateX), maxTranslateX);
      translateY.value = Math.min(Math.max(newTranslateY, -maxTranslateY), maxTranslateY);
    })
    .onEnd(() => {
      if (!editable) return;
      
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      runOnJS(updateTransform)(scale.value, translateX.value, translateY.value);
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => {
      if (!editable) return;
      
      if (scale.value > 1) {
        // Reset về mặc định
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        runOnJS(updateTransform)(1, 0, 0);
      } else {
        // Zoom in
        scale.value = withSpring(2);
        savedScale.value = 2;
        runOnJS(updateTransform)(2, translateX.value, translateY.value);
      }
    });

  const composedGesture = Gesture.Simultaneous(
    panGesture,
    pinchGesture,
    doubleTapGesture
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  return (
    <View style={styles.container}>
      <GestureDetector gesture={editable ? composedGesture : Gesture.Manual()}>
        <Animated.View style={[styles.imageContainer, animatedStyle]}>
          <Image source={imageSource} style={styles.image} />
        </Animated.View>
      </GestureDetector>
      
      {/* Overlay khung ảnh */}
      {frameUri && (
        <View style={styles.frameContainer}>
          <Image source={{ uri: frameUri }} style={styles.frameImage} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 18,
  },
  imageContainer: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  frameContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none', // Cho phép tương tác với ảnh bên dưới
  },
  frameImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
});
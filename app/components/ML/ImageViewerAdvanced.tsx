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
  allowFrameDrag?: boolean;
};

/**
 * ImageViewer với zoom và pan gestures
 * - Scale tối thiểu = 1 (ảnh luôn fill đầy container, không thu nhỏ)
 * - Scale tối đa = 3 (zoom in tối đa 3 lần)
 * - Pan chỉ hoạt động khi đã zoom (scale > 1)
 * - Double tap để toggle giữa zoom 1x và 1.5x
 */

const { width: screenWidth } = Dimensions.get('window');
const IMAGE_WIDTH = 320;
const IMAGE_HEIGHT = 440;
const MIN_SCALE = 1; // Không cho phép thu nhỏ dưới kích thước container
const MAX_SCALE = 3;

export default function ImageViewer({ 
  imgSource, 
  selectedImage, 
  frameUri,
  onImageTransform,
  editable = true,
  allowFrameDrag = false
}: Props) {
  const imageSource = selectedImage ? { uri: selectedImage } : imgSource;
  
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Frame position for dragging
  const frameTranslateX = useSharedValue(0);
  const frameTranslateY = useSharedValue(0);
  const savedFrameX = useSharedValue(0);
  const savedFrameY = useSharedValue(0);

  const updateTransform = (newScale: number, newTranslateX: number, newTranslateY: number) => {
    if (onImageTransform) {
      onImageTransform(newScale, newTranslateX, newTranslateY);
    }
  };

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      if (!editable) return;
      
      const newScale = savedScale.value * event.scale;
      const clampedScale = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);
      
      // Tính toán focal point tương đối với ảnh (không phải container)
      const focalX = event.focalX - IMAGE_WIDTH / 2;
      const focalY = event.focalY - IMAGE_HEIGHT / 2;
      
      // Tính toán translation để zoom từ focal point
      const scaleDiff = clampedScale - savedScale.value;
      const newTranslateX = savedTranslateX.value - focalX * scaleDiff / savedScale.value;
      const newTranslateY = savedTranslateY.value - focalY * scaleDiff / savedScale.value;
      
      // Áp dụng giới hạn di chuyển
      const scaledWidth = IMAGE_WIDTH * clampedScale;
      const scaledHeight = IMAGE_HEIGHT * clampedScale;
      const maxTranslateX = Math.max(0, (scaledWidth - IMAGE_WIDTH) / 2);
      const maxTranslateY = Math.max(0, (scaledHeight - IMAGE_HEIGHT) / 2);
      
      scale.value = clampedScale;
      translateX.value = Math.min(Math.max(newTranslateX, -maxTranslateX), maxTranslateX);
      translateY.value = Math.min(Math.max(newTranslateY, -maxTranslateY), maxTranslateY);
    })
    .onEnd(() => {
      if (!editable) return;
      
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      runOnJS(updateTransform)(scale.value, translateX.value, translateY.value);
    });

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (!editable) return;
      
      // Chỉ cho phép pan khi đã zoom (scale > 1)
      if (scale.value <= 1) return;
      
      // Tính toán giới hạn di chuyển để ảnh không bị kéo ra ngoài container
      const scaledWidth = IMAGE_WIDTH * scale.value;
      const scaledHeight = IMAGE_HEIGHT * scale.value;
      
      // Giới hạn di chuyển: chỉ cho phép kéo đến khi viền ảnh chạm viền container
      const maxTranslateX = Math.max(0, (scaledWidth - IMAGE_WIDTH) / 2);
      const maxTranslateY = Math.max(0, (scaledHeight - IMAGE_HEIGHT) / 2);
      
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
        // Reset về kích thước đầy container (scale = 1)
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        runOnJS(updateTransform)(1, 0, 0);
      } else {
        // Zoom in đến 2x (vẫn trong phạm vi container)
        scale.value = withSpring(1.5);
        savedScale.value = 1.5;
        runOnJS(updateTransform)(1.5, translateX.value, translateY.value);
      }
    });

  // Frame drag gesture
  const framePanGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (!allowFrameDrag) return;
      frameTranslateX.value = savedFrameX.value + event.translationX;
      frameTranslateY.value = savedFrameY.value + event.translationY;
    })
    .onEnd(() => {
      if (!allowFrameDrag) return;
      savedFrameX.value = frameTranslateX.value;
      savedFrameY.value = frameTranslateY.value;
    });

  const composedGesture = Gesture.Simultaneous(
    panGesture,
    pinchGesture,
    doubleTapGesture
  );

  const animatedStyle = useAnimatedStyle(() => {
    // Đảm bảo scale không bao giờ nhỏ hơn 1 (không thu nhỏ hơn container)
    const safeScale = Math.max(1, Math.min(MAX_SCALE, scale.value));
    
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: safeScale },
      ],
      // Giữ kích thước container cố định, chỉ scale nội dung
      width: IMAGE_WIDTH,
      height: IMAGE_HEIGHT,
    };
  });

  const frameAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: frameTranslateX.value },
        { translateY: frameTranslateY.value },
      ],
    };
  });

  return (
    <View style={styles.container}>
      <GestureDetector gesture={editable ? composedGesture : Gesture.Manual()}>
        <Animated.View style={[styles.imageContainer, animatedStyle]}>
          <Image source={imageSource} style={styles.image} contentFit="cover" />
        </Animated.View>
      </GestureDetector>
      
      {/* Overlay khung ảnh */}
      {frameUri && (
        <GestureDetector gesture={allowFrameDrag ? framePanGesture : Gesture.Manual()}>
          <Animated.View style={[styles.frameContainer, frameAnimatedStyle]}>
            <Image source={{ uri: frameUri }} style={styles.frameImage} contentFit="cover" />
          </Animated.View>
        </GestureDetector>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    position: 'relative',
    overflow: 'hidden', // Giữ ảnh trong khung khi zoom
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
    pointerEvents: 'auto', // Cho phép tương tác để kéo khung
  },
  frameImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
});
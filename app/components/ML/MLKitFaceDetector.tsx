import { Ionicons } from '@expo/vector-icons';
import FaceDetection, {
  Face,
  FaceDetectionOptions
} from '@react-native-ml-kit/face-detection';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';

type Props = {
  imageUri: string;
  frameUri?: string;
  onFaceDetected?: (adjustedImageUri: string, faceData?: any) => void;
  autoCenter?: boolean;
  onImagePositionChange?: (x: number, y: number) => void;
};

const IMAGE_WIDTH = 320;
const IMAGE_HEIGHT = 440;
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;

export default function MLKitFaceDetector({ 
  imageUri, 
  frameUri,
  onFaceDetected, 
  autoCenter = true,
  onImagePositionChange
}: Props) {
  const [processedImage, setProcessedImage] = useState<string>(imageUri);
  const [faces, setFaces] = useState<Face[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [faceDetectionSupported, setFaceDetectionSupported] = useState<boolean>(true);
  const [showManualOptions, setShowManualOptions] = useState<boolean>(false);

  // Image position and scale animation values
  const imageTranslateX = useSharedValue(0);
  const imageTranslateY = useSharedValue(0);
  const savedImageX = useSharedValue(0);
  const savedImageY = useSharedValue(0);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  useEffect(() => {
    detectFaces();
  }, [imageUri]);

  const detectFaces = async () => {
    if (!imageUri) return;
    
    setIsProcessing(true);
    try {
      // Cấu hình ML Kit Face Detection
      const options: FaceDetectionOptions = {
        performanceMode: 'accurate',
        landmarkMode: 'none',
        classificationMode: 'none',
        minFaceSize: 0.1,
        contourMode: 'none',
      };

      // Sử dụng ML Kit để detect faces
      const detectedFaces = await FaceDetection.detect(imageUri, options);
      
      setFaces(detectedFaces);
      setFaceDetectionSupported(true);

      if (detectedFaces.length > 0 && autoCenter) {
        const centeredImage = await centerFaceInImage(imageUri, detectedFaces[0]);
        setProcessedImage(centeredImage);
        onFaceDetected?.(centeredImage, detectedFaces[0]);
      } else if (detectedFaces.length === 0) {
        // Không tìm thấy khuôn mặt, hiển thị tùy chọn manual
        setShowManualOptions(true);
        setProcessedImage(imageUri);
      } else {
        setProcessedImage(imageUri);
      }
    } catch (error) {
      console.warn('Face detection not available, falling back to manual mode:', error);
      setFaceDetectionSupported(false);
      setShowManualOptions(true);
      setProcessedImage(imageUri);
    } finally {
      setIsProcessing(false);
    }
  };

  const centerFaceInImage = async (uri: string, face: Face): Promise<string> => {
    try {
      // ML Kit Face có structure: frame { left, top, width, height }
      const bounds = face.frame;
      
      // Tính toán center của khuôn mặt
      const faceCenterX = bounds.left + bounds.width / 2;
      const faceCenterY = bounds.top + bounds.height / 2;
      
      // Mở rộng vùng crop để bao gồm cả khuôn mặt và một phần xung quanh
      const expandFactor = 4; // Tăng từ 1.8 lên 4 để lấy rộng hơn
      const expandedWidth = bounds.width * expandFactor;
      const expandedHeight = bounds.height * expandFactor;
      
      // Tính toán vị trí crop
      let cropX = faceCenterX - expandedWidth / 2;
      let cropY = faceCenterY - expandedHeight / 2;
      
      // Đảm bảo crop không âm
      cropX = Math.max(0, cropX);
      cropY = Math.max(0, cropY);
      
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            crop: {
              originX: cropX,
              originY: cropY,
              width: expandedWidth,
              height: expandedHeight,
            },
          },
          {
            resize: {
              width: IMAGE_WIDTH,
              height: IMAGE_HEIGHT,
            },
          },
        ],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      return manipulatedImage.uri;
    } catch (error) {
      console.error('Error centering face:', error);
      // Fallback: just resize image
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: IMAGE_WIDTH,
              height: IMAGE_HEIGHT,
            },
          },
        ],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipulatedImage.uri;
    }
  };

  const cropImageManually = async (cropType: 'top' | 'center' | 'bottom') => {
    setIsProcessing(true);
    try {
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            resize: {
              width: IMAGE_WIDTH,
              height: IMAGE_HEIGHT,
            },
          },
        ],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      setProcessedImage(manipulatedImage.uri);
      onFaceDetected?.(manipulatedImage.uri, faces.length > 0 ? faces[0] : null);
      setShowManualOptions(false);
    } catch (error) {
      console.error('Error cropping image:', error);
      Alert.alert('Lỗi', 'Không thể xử lý ảnh');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetToOriginal = () => {
    setProcessedImage(imageUri);
    setShowManualOptions(true);
  };

  // Pinch gesture for zoom
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const newScale = savedScale.value * event.scale;
      scale.value = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      // Notify parent about transform change
      if (onImagePositionChange) {
        onImagePositionChange(imageTranslateX.value, imageTranslateY.value);
      }
    });

  // Image drag gesture
  const imagePanGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Tính toán giới hạn di chuyển dựa trên scale
      const scaledWidth = IMAGE_WIDTH * scale.value;
      const scaledHeight = IMAGE_HEIGHT * scale.value;
      
      const maxTranslateX = Math.max(0, (scaledWidth - IMAGE_WIDTH) / 2);
      const maxTranslateY = Math.max(0, (scaledHeight - IMAGE_HEIGHT) / 2);
      
      const newTranslateX = savedImageX.value + event.translationX;
      const newTranslateY = savedImageY.value + event.translationY;
      
      imageTranslateX.value = Math.min(Math.max(newTranslateX, -maxTranslateX), maxTranslateX);
      imageTranslateY.value = Math.min(Math.max(newTranslateY, -maxTranslateY), maxTranslateY);
    })
    .onEnd(() => {
      savedImageX.value = imageTranslateX.value;
      savedImageY.value = imageTranslateY.value;
      
      // Notify parent about transform change
      if (onImagePositionChange) {
        onImagePositionChange(imageTranslateX.value, imageTranslateY.value);
      }
    });

  // Double tap gesture for zoom toggle
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => {
      if (scale.value > 1) {
        // Reset về scale = 1
        scale.value = withSpring(1);
        imageTranslateX.value = withSpring(0);
        imageTranslateY.value = withSpring(0);
        savedScale.value = 1;
        savedImageX.value = 0;
        savedImageY.value = 0;
        // Notify parent about reset
        if (onImagePositionChange) {
          onImagePositionChange(0, 0);
        }
      } else {
        // Zoom in đến 2x
        scale.value = withSpring(2);
        savedScale.value = 2;
        // Notify parent about zoom
        if (onImagePositionChange) {
          onImagePositionChange(imageTranslateX.value, imageTranslateY.value);
        }
      }
    });

  const composedGesture = Gesture.Simultaneous(
    imagePanGesture,
    pinchGesture,
    doubleTapGesture
  );

  const imageAnimatedStyle = useAnimatedStyle(() => {
    const safeScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale.value));
    
    return {
      transform: [
        { translateX: imageTranslateX.value },
        { translateY: imageTranslateY.value },
        { scale: safeScale },
      ],
      width: IMAGE_WIDTH * safeScale,
      height: IMAGE_HEIGHT * safeScale,
    };
  });

  // Reset image position and scale when imageUri changes
  useEffect(() => {
    imageTranslateX.value = withSpring(0);
    imageTranslateY.value = withSpring(0);
    scale.value = withSpring(1);
    savedImageX.value = 0;
    savedImageY.value = 0;
    savedScale.value = 1;
  }, [imageUri]);

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.imageContainer, imageAnimatedStyle]}>
          <Image source={{ uri: processedImage }} style={styles.image} />
        </Animated.View>
      </GestureDetector>
      
      {isProcessing && (
        <View style={styles.overlay}>
          <View style={styles.processingIndicator} />
          <Text style={styles.processingText}>
            {faceDetectionSupported ? 'Đang nhận diện khuôn mặt với ML Kit...' : 'Đang xử lý...'}
          </Text>
        </View>
      )}

      {showManualOptions && !isProcessing && (
        <View style={styles.manualOptions}>
          <Text style={styles.optionsTitle}>
            {faceDetectionSupported 
              ? 'Không tìm thấy khuôn mặt. Tự động fit ảnh?' 
              : 'Tự động fit ảnh?'}
          </Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => cropImageManually('center')}
            >
              <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
              <Text style={styles.optionText}>Có</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => {
                setShowManualOptions(false);
                setProcessedImage(imageUri);
              }}
            >
              <Ionicons name="close-circle" size={20} color="#FF3B30" />
              <Text style={styles.optionText}>Không</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!showManualOptions && !isProcessing && faces.length > 0 && (
        <View style={styles.faceDetectedInfo}>
          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          <Text style={styles.faceDetectedText}>
            ML Kit: {faces.length} khuôn mặt
          </Text>
        </View>
      )}

      {!showManualOptions && !isProcessing && (
        <TouchableOpacity style={styles.resetButton} onPress={resetToOriginal}>
          <Ionicons name="refresh" size={16} color="#666" />
          <Text style={styles.resetText}>Chỉnh lại</Text>
        </TouchableOpacity>
      )}

      {/* Frame overlay */}
      {frameUri && (
        <View style={styles.frameContainer}>
          <Image source={{ uri: frameUri }} style={styles.frameImage} contentFit="cover" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    overflow: 'hidden',
    borderRadius: 18,
  },
  imageContainer: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
  },
  image: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    borderRadius: 18,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  processingIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    opacity: 0.8,
  },
  processingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  manualOptions: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 15,
  },
  optionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  optionButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    minWidth: 80,
    flex: 1,
    marginHorizontal: 5,
  },
  optionText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
    fontWeight: '500',
  },
  faceDetectedInfo: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  faceDetectedText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 4,
    fontWeight: '600',
  },
  resetButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  resetText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  frameContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  frameImage: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    borderRadius: 18,
  },
});
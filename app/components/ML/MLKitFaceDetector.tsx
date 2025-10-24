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
const MIN_SCALE = 1; // Không cho phép thu nhỏ dưới kích thước container
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

      console.log('Image:', IMAGE_HEIGHT, IMAGE_WIDTH);
      console.log('Detected faces:', detectedFaces);
      
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
      // Get the original image dimensions first
      const imageInfo = await ImageManipulator.manipulateAsync(uri, [], { 
        format: ImageManipulator.SaveFormat.JPEG 
      });
      
      // ML Kit Face có structure: frame { left, top, width, height }
      const bounds = face.frame;
      const originalWidth = imageInfo.width;
      const originalHeight = imageInfo.height;
      
      console.log('Original image dimensions:', originalWidth, 'x', originalHeight);
      console.log('Face bounds:', bounds);
      
      // Ensure face bounds are within image bounds
      const faceLeft = Math.max(0, Math.min(bounds.left, originalWidth));
      const faceTop = Math.max(0, Math.min(bounds.top, originalHeight));
      const faceRight = Math.max(faceLeft, Math.min(bounds.left + bounds.width, originalWidth));
      const faceBottom = Math.max(faceTop, Math.min(bounds.top + bounds.height, originalHeight));
      
      // Recalculate face dimensions with bounds checking
      const faceWidth = faceRight - faceLeft;
      const faceHeight = faceBottom - faceTop;
      
      // Calculate face center
      const faceCenterX = faceLeft + faceWidth / 2;
      const faceCenterY = faceTop + faceHeight / 2;
      
      // Expand the crop area around the face
      const expandFactor = 2.5; // Reduced from 4 to be more conservative
      const expandedWidth = Math.min(faceWidth * expandFactor, originalWidth);
      const expandedHeight = Math.min(faceHeight * expandFactor, originalHeight);
      
      // Calculate crop position, ensuring it stays within image bounds
      let cropX = faceCenterX - expandedWidth / 2;
      let cropY = faceCenterY - expandedHeight / 2;
      
      // Adjust crop position to stay within image bounds
      cropX = Math.max(0, Math.min(cropX, originalWidth - expandedWidth));
      cropY = Math.max(0, Math.min(cropY, originalHeight - expandedHeight));
      
      // Ensure crop dimensions don't exceed image bounds
      const finalWidth = Math.min(expandedWidth, originalWidth - cropX);
      const finalHeight = Math.min(expandedHeight, originalHeight - cropY);
      
      console.log('Crop params:', {
        originX: cropX, 
        originY: cropY, 
        width: finalWidth,
        height: finalHeight 
      });
      
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            crop: {
              originX: cropX,
              originY: cropY,
              width: finalWidth,
              height: finalHeight,
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
      const clampedScale = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);
      
      // Tính toán focal point tương đối với container (trong khung 320x440)
      const focalX = event.focalX - IMAGE_WIDTH / 2;
      const focalY = event.focalY - IMAGE_HEIGHT / 2;
      
      // Tính toán translation để zoom từ focal point
      const scaleDiff = clampedScale - savedScale.value;
      const newTranslateX = savedImageX.value - focalX * scaleDiff / savedScale.value;
      const newTranslateY = savedImageY.value - focalY * scaleDiff / savedScale.value;
      
      // Áp dụng giới hạn di chuyển để giữ ảnh trong khung
      const scaledWidth = IMAGE_WIDTH * clampedScale;
      const scaledHeight = IMAGE_HEIGHT * clampedScale;
      const maxTranslateX = Math.max(0, (scaledWidth - IMAGE_WIDTH) / 2);
      const maxTranslateY = Math.max(0, (scaledHeight - IMAGE_HEIGHT) / 2);
      
      scale.value = clampedScale;
      imageTranslateX.value = Math.min(Math.max(newTranslateX, -maxTranslateX), maxTranslateX);
      imageTranslateY.value = Math.min(Math.max(newTranslateY, -maxTranslateY), maxTranslateY);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      savedImageX.value = imageTranslateX.value;
      savedImageY.value = imageTranslateY.value;
      if (onImagePositionChange) {
        onImagePositionChange(imageTranslateX.value, imageTranslateY.value);
      }
    });

  // Image drag gesture
  const imagePanGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (scale.value <= 1) {
        // Khi scale = 1, không cho phép kéo
        return;
      }
      
      // Tính toán giới hạn di chuyển để đảm bảo ảnh luôn có phần hiển thị trong container
      const scaledWidth = IMAGE_WIDTH * scale.value;
      const scaledHeight = IMAGE_HEIGHT * scale.value;
      
      // Giới hạn di chuyển: chỉ cho phép kéo đến khi viền ảnh chạm viền container
      // Không cho kéo quá xa khiến ảnh biến mất hoàn toàn
      const maxTranslateX = Math.max(0, (scaledWidth - IMAGE_WIDTH) / 2);
      const maxTranslateY = Math.max(0, (scaledHeight - IMAGE_HEIGHT) / 2);
      
      const newTranslateX = savedImageX.value + event.translationX;
      const newTranslateY = savedImageY.value + event.translationY;
      
      // Giới hạn chặt chẽ hơn để ảnh không bị kéo ra ngoài container
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
        // Reset về kích thước đầy container (scale = 1)
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
        // Zoom in đến 1.5x (giống ImageViewerAdvanced)
        scale.value = withSpring(1.5);
        savedScale.value = 1.5;
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
    // Đảm bảo scale không bao giờ nhỏ hơn 1 (không thu nhỏ hơn container)
    const safeScale = Math.max(1, Math.min(MAX_SCALE, scale.value));
    
    return {
      transform: [
        { translateX: imageTranslateX.value },
        { translateY: imageTranslateY.value },
        { scale: safeScale },
      ],
      // Giữ kích thước container cố định, chỉ scale nội dung
      width: IMAGE_WIDTH,
      height: IMAGE_HEIGHT,
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
    overflow: 'hidden', // Giữ ảnh trong khung khi zoom
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
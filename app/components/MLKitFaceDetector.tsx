import { Ionicons } from '@expo/vector-icons';
import FaceDetection, {
    Face,
    FaceDetectionOptions
} from '@react-native-ml-kit/face-detection';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  imageUri: string;
  onFaceDetected?: (adjustedImageUri: string) => void;
  autoCenter?: boolean;
};

const IMAGE_WIDTH = 320;
const IMAGE_HEIGHT = 440;

export default function MLKitFaceDetector({ 
  imageUri, 
  onFaceDetected, 
  autoCenter = true 
}: Props) {
  const [processedImage, setProcessedImage] = useState<string>(imageUri);
  const [faces, setFaces] = useState<Face[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [faceDetectionSupported, setFaceDetectionSupported] = useState<boolean>(true);
  const [showManualOptions, setShowManualOptions] = useState<boolean>(false);

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
        onFaceDetected?.(centeredImage);
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
      const expandFactor = 1.8; // Mở rộng 80% xung quanh khuôn mặt
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
      onFaceDetected?.(manipulatedImage.uri);
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

  return (
    <View style={styles.container}>
      <Image source={{ uri: processedImage }} style={styles.image} />
      
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
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
});
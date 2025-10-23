import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Frame, FrameStorage } from '../../utils/FrameStorage';

type Props = {
  isVisible: boolean;
  onClose: () => void;
  onFrameSelect: (frame: Frame | null) => void;
  selectedFrame?: Frame | null;
};

const { width: screenWidth } = Dimensions.get('window');

export default function FrameSelector({ 
  isVisible, 
  onClose, 
  onFrameSelect,
  selectedFrame 
}: Props) {
  const [currentSelectedFrame, setCurrentSelectedFrame] = useState<Frame | null>(selectedFrame || null);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Khung "Không khung" mặc định
  const noFrameOption: Frame = {
    id: 'none',
    name: 'Không khung',
    uri: '',
    preview: '',
    isCustom: false
  };

  // Load frames từ storage khi component mount
  const loadFrames = useCallback(async () => {
    try {
      setIsLoading(true);
      const savedFrames = await FrameStorage.getFrames();
      setFrames([noFrameOption, ...savedFrames]);
    } catch (error) {
      console.error('Error loading frames:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách khung ảnh');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isVisible) {
      loadFrames();
    }
  }, [isVisible, loadFrames]);

  const handleFramePress = (frame: Frame) => {
    const frameToSelect = frame.id === 'none' ? null : frame;
    setCurrentSelectedFrame(frameToSelect);
  };

  const handleConfirm = () => {
    onFrameSelect(currentSelectedFrame);
    onClose();
  };

  const handleImportFrame = async () => {
    try {
      // Yêu cầu quyền truy cập thư viện ảnh
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Quyền truy cập', 'Cần quyền truy cập thư viện ảnh để import khung');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 5.5], // Tỉ lệ phù hợp với khung ảnh
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Tạo frame mới
        const newFrame: Frame = {
          id: FrameStorage.generateFrameId(),
          name: `Khung ${frames.length}`,
          uri: asset.uri,
          preview: asset.uri,
          isCustom: true
        };

        // Lưu vào storage
        await FrameStorage.saveFrame(newFrame);
        
        // Refresh danh sách
        await loadFrames();
        
        Alert.alert('Thành công', 'Đã thêm khung ảnh mới');
      }
    } catch (error) {
      console.error('Error importing frame:', error);
      Alert.alert('Lỗi', 'Không thể import khung ảnh');
    }
  };

  const handleDeleteFrame = async (frameId: string) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc muốn xóa khung này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await FrameStorage.deleteFrame(frameId);
              await loadFrames();
              
              // Nếu khung đang được chọn bị xóa, reset selection
              if (currentSelectedFrame?.id === frameId) {
                setCurrentSelectedFrame(null);
              }
              
              Alert.alert('Thành công', 'Đã xóa khung ảnh');
            } catch (error) {
              console.error('Error deleting frame:', error);
              Alert.alert('Lỗi', 'Không thể xóa khung ảnh');
            }
          }
        }
      ]
    );
  };

  const renderFrameItem = ({ item }: { item: Frame }) => {
    const isSelected = currentSelectedFrame?.id === item.id || 
                      (currentSelectedFrame === null && item.id === 'none');

    return (
      <TouchableOpacity
        style={[styles.frameItem, isSelected && styles.selectedFrameItem]}
        onPress={() => handleFramePress(item)}
      >
        <View style={styles.framePreview}>
          {item.id === 'none' ? (
            <View style={styles.noFramePreview}>
              <Ionicons name="close-circle-outline" size={40} color="#666" />
            </View>
          ) : (
            <Image source={{ uri: item.preview }} style={styles.previewImage} />
          )}
        </View>
        <Text style={styles.frameName}>{item.name}</Text>
        
        {/* Nút xóa cho khung custom */}
        {item.isCustom && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteFrame(item.id)}
          >
            <Ionicons name="trash-outline" size={16} color="#ff4444" />
          </TouchableOpacity>
        )}
        
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderAddFrameButton = () => (
    <TouchableOpacity
      style={styles.addFrameButton}
      onPress={handleImportFrame}
    >
      <View style={styles.addFramePreview}>
        <Ionicons name="add" size={40} color="#007AFF" />
      </View>
      <Text style={styles.frameName}>Thêm khung</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.title}>Chọn khung ảnh</Text>
            <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
              <Text style={styles.confirmText}>Xong</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={[...frames, { id: 'add_button', name: '', uri: '', preview: '', isCustom: false } as Frame]}
            renderItem={({ item }) => {
              if (item.id === 'add_button') {
                return renderAddFrameButton();
              }
              return renderFrameItem({ item });
            }}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.framesList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  confirmButton: {
    padding: 5,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  framesList: {
    padding: 20,
  },
  frameItem: {
    flex: 1,
    margin: 10,
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#f8f8f8',
    position: 'relative',
  },
  selectedFrameItem: {
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  framePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noFramePreview: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  frameName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
  deleteButton: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 4,
  },
  addFrameButton: {
    flex: 1,
    margin: 10,
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#f0f7ff',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  addFramePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});




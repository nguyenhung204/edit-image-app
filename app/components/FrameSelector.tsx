import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

type Frame = {
  id: string;
  name: string;
  uri: string;
  preview: string;
};

type Props = {
  isVisible: boolean;
  onClose: () => void;
  onFrameSelect: (frame: Frame | null) => void;
  selectedFrame?: Frame | null;
};

const { width: screenWidth } = Dimensions.get('window');

// Mock data cho các khung - trong thực tế bạn sẽ load từ assets
const FRAMES: Frame[] = [
  {
    id: 'none',
    name: 'Không khung',
    uri: '',
    preview: ''
  },
  {
    id: 'classic',
    name: 'Khung cổ điển',
    uri: 'https://via.placeholder.com/320x440/FFFFFF/000000?text=Classic+Frame',
    preview: 'https://via.placeholder.com/100x100/FFFFFF/000000?text=Classic'
  },
  {
    id: 'modern',
    name: 'Khung hiện đại',
    uri: 'https://via.placeholder.com/320x440/000000/FFFFFF?text=Modern+Frame',
    preview: 'https://via.placeholder.com/100x100/000000/FFFFFF?text=Modern'
  },
  {
    id: 'vintage',
    name: 'Khung vintage',
    uri: 'https://via.placeholder.com/320x440/8B4513/FFFFFF?text=Vintage+Frame',
    preview: 'https://via.placeholder.com/100x100/8B4513/FFFFFF?text=Vintage'
  },
  {
    id: 'floral',
    name: 'Khung hoa',
    uri: 'https://via.placeholder.com/320x440/FFB6C1/000000?text=Floral+Frame',
    preview: 'https://via.placeholder.com/100x100/FFB6C1/000000?text=Floral'
  },
  {
    id: 'geometric',
    name: 'Khung hình học',
    uri: 'https://via.placeholder.com/320x440/4169E1/FFFFFF?text=Geometric+Frame',
    preview: 'https://via.placeholder.com/100x100/4169E1/FFFFFF?text=Geometric'
  }
];

export default function FrameSelector({ 
  isVisible, 
  onClose, 
  onFrameSelect,
  selectedFrame 
}: Props) {
  const [currentSelectedFrame, setCurrentSelectedFrame] = useState<Frame | null>(selectedFrame || null);

  const handleFramePress = (frame: Frame) => {
    const frameToSelect = frame.id === 'none' ? null : frame;
    setCurrentSelectedFrame(frameToSelect);
  };

  const handleConfirm = () => {
    onFrameSelect(currentSelectedFrame);
    onClose();
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
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

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
            data={FRAMES}
            renderItem={renderFrameItem}
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
});

export type { Frame };

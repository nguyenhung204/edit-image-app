import domtoimage from 'dom-to-image';
import * as MediaLibrary from 'expo-media-library';
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { captureRef } from 'react-native-view-shot';
import Button from '../components/Button';
import CameraImagePicker from '../components/CameraImagePicker';
import CircleButton from '../components/CircleButton';
import EmojiList from '../components/EmojiList';
import EmojiPicker from '../components/EmojiPicker';
import EmojiSticker, { EmojiStickerRef } from '../components/EmojiSticker';
import FrameSelector, { type Frame } from '../components/FrameSelector';
import IconButton from '../components/IconButton';
import ImageViewerAdvanced from '../components/ImageViewerAdvanced';
import MLKitFaceDetector from '../components/MLKitFaceDetector';

const PlaceholderImage = require('@/assets/images/background-image.png');

export default function Index() {
  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
  const [showAppOptions, setShowAppOptions] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isFrameModalVisible, setIsFrameModalVisible] = useState<boolean>(false);
  const [isCameraPickerVisible, setIsCameraPickerVisible] = useState<boolean>(false);
  const [pickedEmoji, setPickedEmoji] = useState<string | undefined>(undefined);
  const [selectedFrame, setSelectedFrame] = useState<Frame | null>(null);
  const [faceDetectedImage, setFaceDetectedImage] = useState<string | undefined>(undefined);
  const [useFaceDetection, setUseFaceDetection] = useState<boolean>(true);
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();

  const imageRef = useRef<View>(null);
  const stickerRef = useRef<EmojiStickerRef>(null);

  useEffect(() => {
    if (!permissionResponse?.granted) {
      requestPermission();
    }
  }, []);

  const pickImageAsync = async () => {
    setIsCameraPickerVisible(true);
  };

  const handleImageSelected = (uri: string) => {
    setSelectedImage(uri);
    setShowAppOptions(true);
    setUseFaceDetection(true);
  };

  const handleFaceDetected = (adjustedImageUri: string) => {
    setFaceDetectedImage(adjustedImageUri);
  };

  const onReset = () => {
    setShowAppOptions(false);
    setSelectedImage(undefined);
    setFaceDetectedImage(undefined);
    setSelectedFrame(null);
    setPickedEmoji(undefined);
  };

  const onAddSticker = () => {
    setIsModalVisible(true);
  };

  const onAddFrame = () => {
    setIsFrameModalVisible(true);
  };

  const onModalClose = () => {
    setIsModalVisible(false);
  };

  const onFrameModalClose = () => {
    setIsFrameModalVisible(false);
  };

  const onFrameSelect = (frame: Frame | null) => {
    setSelectedFrame(frame);
  };

  const onSaveImageAsync = async () => {
    if (Platform.OS !== 'web') {
      try {
        const localUri = await captureRef(imageRef, {
          height: 440,
          quality: 1,
        });

        await MediaLibrary.saveToLibraryAsync(localUri);
        if (localUri) {
          alert('Saved!');
        }
      } catch (e) {
        console.log(e);
      }
    } else {
      try {
        if (imageRef.current) {
          const dataUrl = await domtoimage.toJpeg(imageRef.current as any, {
            quality: 0.95,
            width: 320,
            height: 440,
          });

          let link = document.createElement('a');
          link.download = 'sticker-smash.jpeg';
          link.href = dataUrl;
          link.click();
        }
      } catch (e) {
        console.log(e);
      }
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.imageContainer}>
        <View ref={imageRef} collapsable={false}>
          {useFaceDetection && selectedImage ? (
            <MLKitFaceDetector
              imageUri={selectedImage}
              onFaceDetected={handleFaceDetected}
              autoCenter={true}
            />
          ) : (
            <ImageViewerAdvanced
              imgSource={PlaceholderImage}
              selectedImage={faceDetectedImage || selectedImage}
              frameUri={selectedFrame?.uri}
              editable={showAppOptions}
            />
          )}
          {pickedEmoji && (
            <EmojiSticker 
              ref={stickerRef}
              emoji={pickedEmoji}
              size={50}
            />
          )}
        </View>
      </View>
      
      {showAppOptions ? (
        <View style={styles.optionsContainer}>
          <View style={styles.optionsRow}>
            <IconButton icon="refresh" label="Reset" onPress={onReset} />
            <IconButton icon="crop" label="Khung" onPress={onAddFrame} />
            <CircleButton onPress={onAddSticker} />
            <IconButton icon="save-alt" label="Save" onPress={onSaveImageAsync} />
          </View>
        </View>
      ) : (
        <View style={styles.footerContainer}>
          <Button theme="primary" label="Chọn ảnh" onPress={pickImageAsync} />
          <Button label="Sử dụng ảnh này" onPress={() => setShowAppOptions(true)} />
        </View>
      )}
      <EmojiPicker isVisible={isModalVisible} onClose={onModalClose}>
        <EmojiList onSelect={setPickedEmoji} onCloseModal={onModalClose} />
      </EmojiPicker>
      
      <FrameSelector
        isVisible={isFrameModalVisible}
        onClose={onFrameModalClose}
        onFrameSelect={onFrameSelect}
        selectedFrame={selectedFrame}
      />
      
      <CameraImagePicker
        isVisible={isCameraPickerVisible}
        onClose={() => setIsCameraPickerVisible(false)}
        onImageSelected={handleImageSelected}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    alignItems: 'center',
  },
  imageContainer: {
    flex: 1,
    paddingTop: 50,
  },
  stickerContainer: {
    position: 'absolute',
    top: 100,
    left: 100,
  },
  footerContainer: {
    flex: 1 / 3,
    alignItems: 'center',
  },
  optionsContainer: {
    position: 'absolute',
    bottom: 80,
  },
  optionsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 15,
  },
});

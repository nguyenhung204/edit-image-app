import AsyncStorage from '@react-native-async-storage/async-storage';

export type Frame = {
  id: string;
  name: string;
  uri: string;
  preview: string;
  isCustom?: boolean;
};

const STORAGE_KEY = 'custom_frames';

export class FrameStorage {
  // Lấy tất cả khung đã lưu
  static async getFrames(): Promise<Frame[]> {
    try {
      const framesJson = await AsyncStorage.getItem(STORAGE_KEY);
      if (framesJson) {
        return JSON.parse(framesJson);
      }
      return [];
    } catch (error) {
      console.error('Error loading frames:', error);
      return [];
    }
  }

  // Lưu khung mới
  static async saveFrame(frame: Frame): Promise<void> {
    try {
      const existingFrames = await this.getFrames();
      const updatedFrames = [...existingFrames, { ...frame, isCustom: true }];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFrames));
    } catch (error) {
      console.error('Error saving frame:', error);
      throw error;
    }
  }

  // Xóa khung
  static async deleteFrame(frameId: string): Promise<void> {
    try {
      const existingFrames = await this.getFrames();
      const updatedFrames = existingFrames.filter(frame => frame.id !== frameId);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFrames));
    } catch (error) {
      console.error('Error deleting frame:', error);
      throw error;
    }
  }

  // Xóa tất cả khung
  static async clearFrames(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing frames:', error);
      throw error;
    }
  }

  // Tạo ID duy nhất cho khung
  static generateFrameId(): string {
    return `frame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
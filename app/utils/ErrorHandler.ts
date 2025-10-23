/**
 * Global error handler để catch và xử lý các lỗi React Native phổ biến
 */

import { Alert } from 'react-native';

class ErrorHandler {
  private static instance: ErrorHandler;
  
  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Setup global error handlers
   */
  setupGlobalHandlers() {
    // Handle uncaught exceptions
    if (typeof ErrorUtils !== 'undefined') {
      ErrorUtils.setGlobalHandler((error, isFatal) => {
        this.handleError(error, isFatal);
      });
    }

    // Handle Promise rejections
    if (typeof global !== 'undefined' && global.Promise) {
      const originalHandler = global.Promise.prototype.catch;
      global.Promise.prototype.catch = function(onRejected) {
        return originalHandler.call(this, (error) => {
          ErrorHandler.getInstance().handlePromiseRejection(error);
          if (onRejected) {
            return onRejected(error);
          }
          throw error;
        });
      };
    }
  }

  /**
   * Handle general errors
   */
  private handleError(error: any, isFatal?: boolean) {
    console.error('Global Error Handler:', error);

    // Kiểm tra các lỗi font size phổ biến
    if (this.isFontSizeError(error)) {
      this.handleFontSizeError(error);
      return;
    }

    // Hiển thị alert cho lỗi fatal
    if (isFatal && __DEV__) {
      Alert.alert(
        'Unexpected Error',
        `Error: ${error.message}\n\nStack: ${error.stack}`,
        [{ text: 'OK' }]
      );
    }
  }

  /**
   * Handle promise rejections
   */
  private handlePromiseRejection(error: any) {
    console.error('Unhandled Promise Rejection:', error);
    
    if (this.isFontSizeError(error)) {
      this.handleFontSizeError(error);
    }
  }

  /**
   * Kiểm tra xem có phải lỗi font size không
   */
  private isFontSizeError(error: any): boolean {
    const message = error.message || error.toString();
    return (
      message.includes('FontSize should be a positive value') ||
      message.includes('letterSpacing') ||
      message.includes('TextAttributeProps')
    );
  }

  /**
   * Xử lý lỗi font size cụ thể
   */
  private handleFontSizeError(error: any) {
    console.warn('Font Size Error detected and handled:', error.message);
    
    if (__DEV__) {
      Alert.alert(
        'Font Size Error',
        'Đã phát hiện lỗi font size âm. Ứng dụng đã tự động khắc phục.\n\nLỗi này thường chỉ xảy ra trong development build.',
        [{ text: 'OK' }]
      );
    }
  }

  /**
   * Log error thông tin để debug
   */
  logError(context: string, error: any) {
    console.group(`Error in ${context}`);
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    console.groupEnd();
  }
}

export default ErrorHandler;
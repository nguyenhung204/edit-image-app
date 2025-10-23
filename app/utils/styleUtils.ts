/**
 * Utility functions để xử lý các vấn đề về font và style trong React Native development build
 */

/**
 * Đảm bảo fontSize luôn là số dương và trong phạm vi hợp lý
 * @param fontSize - Giá trị fontSize cần validate
 * @param minSize - Kích thước tối thiểu (mặc định: 8)
 * @param maxSize - Kích thước tối đa (mặc định: 100)
 * @returns fontSize an toàn
 */
export function safeFontSize(fontSize: number | undefined, minSize: number = 8, maxSize: number = 100): number {
  if (typeof fontSize !== 'number' || isNaN(fontSize) || fontSize < 0) {
    return minSize;
  }
  return Math.max(minSize, Math.min(maxSize, Math.abs(fontSize)));
}

/**
 * Đảm bảo letterSpacing không âm (letterSpacing âm có thể gây lỗi trong development build)
 * @param letterSpacing - Giá trị letterSpacing cần validate
 * @returns letterSpacing an toàn
 */
export function safeLetterSpacing(letterSpacing: number | undefined): number {
  if (typeof letterSpacing !== 'number' || isNaN(letterSpacing)) {
    return 0;
  }
  return Math.max(0, letterSpacing);
}

/**
 * Xử lý style object để đảm bảo tất cả các giá trị font đều an toàn
 * @param style - Style object cần validate
 * @returns Style object đã được validate
 */
export function safeTextStyle(style: any): any {
  if (!style) return style;
  
  const processedStyle = { ...style };
  
  if (typeof processedStyle.fontSize === 'number') {
    processedStyle.fontSize = safeFontSize(processedStyle.fontSize);
  }
  
  if (typeof processedStyle.letterSpacing === 'number') {
    processedStyle.letterSpacing = safeLetterSpacing(processedStyle.letterSpacing);
  }
  
  return processedStyle;
}

/**
 * Validate và clamp scale values để tránh các vấn đề với transform
 * @param scale - Giá trị scale cần validate
 * @param minScale - Scale tối thiểu (mặc định: 0.1)
 * @param maxScale - Scale tối đa (mặc định: 5)
 * @returns Scale an toàn
 */
export function safeScale(scale: number | undefined, minScale: number = 0.1, maxScale: number = 5): number {
  if (typeof scale !== 'number' || isNaN(scale) || scale <= 0) {
    return 1;
  }
  return Math.max(minScale, Math.min(maxScale, Math.abs(scale)));
}
# Edit Image App

Ứng dụng chỉnh sửa ảnh di động được phát triển bằng React Native và Expo, tích hợp công nghệ ML Kit để nhận diện khuôn mặt và các tính năng chỉnh sửa ảnh thông minh.

## Mô tả dự án

Edit Image App là một ứng dụng di động hiện đại cho phép người dùng chỉnh sửa ảnh với các tính năng sau:

- **Nhận diện khuôn mặt tự động**: Sử dụng ML Kit Face Detection để tự động phát hiện và căn giữa khuôn mặt trong ảnh
- **Thêm emoji sticker**: Chọn và đặt emoji lên ảnh với khả năng kéo thả và thay đổi kích thước
- **Khung ảnh đa dạng**: Thêm các khung trang trí cho ảnh
- **Chụp ảnh và chọn từ thư viện**: Hỗ trợ chụp ảnh trực tiếp hoặc chọn từ thư viện thiết bị
- **Zoom và pan**: Phóng to, thu nhỏ và di chuyển ảnh một cách linh hoạt
- **Lưu ảnh**: Xuất ảnh đã chỉnh sửa về thư viện hoặc tải về thiết bị

## Công nghệ sử dụng

### Framework và Libraries chính
- **React Native**: Framework phát triển ứng dụng đa nền tảng
- **Expo**: Nền tảng phát triển React Native
- **TypeScript**: Ngôn ngữ lập trình có type system
- **React Native Reanimated**: Thư viện animation hiệu năng cao
- **React Native Gesture Handler**: Xử lý cử chỉ touch

### Machine Learning & Computer Vision
- **@react-native-ml-kit/face-detection**: ML Kit Face Detection API
- **expo-image-manipulator**: Xử lý và chỉnh sửa ảnh

### UI/UX Components
- **@expo/vector-icons**: Bộ icon đa dạng
- **expo-image**: Component hiển thị ảnh tối ưu
- **react-native-emoji-modal**: Modal chọn emoji

### Camera & Media
- **expo-camera**: Chụp ảnh và quay video
- **expo-image-picker**: Chọn ảnh từ thư viện
- **expo-media-library**: Truy cập và lưu media
- **react-native-view-shot**: Capture screenshot

### Storage & Utils
- **@react-native-async-storage/async-storage**: Lưu trữ dữ liệu local
- **expo-haptics**: Phản hồi xúc giác

## Cấu trúc dự án

```
app/
├── (tabs)/                 # Tab navigation
│   ├── index.tsx          # Màn hình chính
│   └── about.tsx          # Màn hình giới thiệu
├── components/            # Components tái sử dụng
│   ├── Button.tsx         # Nút bấm tùy chỉnh
│   ├── CameraImagePicker.tsx  # Component chọn ảnh
│   ├── EmojiPicker.tsx    # Modal chọn emoji
│   ├── EmojiSticker.tsx   # Sticker emoji
│   └── ML/                # Components Machine Learning
│       ├── MLKitFaceDetector.tsx  # Nhận diện khuôn mặt
│       ├── FrameSelector.tsx      # Chọn khung ảnh
│       └── ImageViewerAdvanced.tsx # Hiển thị ảnh nâng cao
└── utils/                 # Tiện ích
    ├── ErrorHandler.ts    # Xử lý lỗi
    ├── FrameStorage.ts    # Quản lý khung ảnh
    └── styleUtils.ts      # Tiện ích style
```

## Tính năng chính

### 1. Nhận diện khuôn mặt thông minh
- Tự động phát hiện khuôn mặt trong ảnh sử dụng ML Kit
- Căn giữa và crop ảnh theo khuôn mặt
- Fallback về chế độ manual khi không phát hiện được khuôn mặt

### 2. Chỉnh sửa ảnh tương tác
- Zoom in/out với pinch gesture (1x - 3x)
- Pan để di chuyển ảnh
- Double tap để reset về kích thước gốc
- Giữ ảnh luôn trong khung container

### 3. Thêm sticker và decoration
- Thư viện emoji phong phú
- Kéo thả emoji trên ảnh
- Resize emoji bằng cử chỉ
- Xóa emoji bằng long press

### 4. Khung ảnh đa dạng
- Nhiều loại khung trang trí
- Preview khung trước khi áp dụng
- Lưu trữ khung trong AsyncStorage

## Cài đặt và chạy dự án

### Yêu cầu hệ thống
- Node.js 18+
- npm hoặc yarn
- Expo CLI
- Android Studio (cho Android)
- Xcode (cho iOS)

### Các bước cài đặt

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd edit-image-app
   ```

2. **Cài đặt dependencies**
   ```bash
   npm install
   ```

3. **Chạy ứng dụng**
   ```bash
   npx expo start
   ```

4. **Chạy trên thiết bị cụ thể**
   ```bash
   # Android
   npx expo run:android
   
   # iOS
   npx expo run:ios
   
   # Web
   npx expo start --web
   ```

## Scripts có sẵn

- `npm start`: Khởi động Expo development server
- `npm run android`: Build và chạy trên Android
- `npm run ios`: Build và chạy trên iOS
- `npm run web`: Chạy trên web browser
- `npm run lint`: Kiểm tra code style với ESLint
- `npm run reset-project`: Reset project về trạng thái ban đầu

## Quyền truy cập

Ứng dụng yêu cầu các quyền sau:
- **Camera**: Chụp ảnh mới
- **Photo Library**: Truy cập thư viện ảnh
- **Storage**: Lưu ảnh đã chỉnh sửa

## Build và Deploy

### Development Build
```bash
eas build --profile development
```

### Production Build
```bash
eas build --profile production
```

### Submit to App Store
```bash
eas submit
```

## Tính năng nổi bật

- **AI-Powered**: Sử dụng ML Kit để nhận diện khuôn mặt tự động
- **Cross-Platform**: Chạy trên iOS, Android và Web
- **Performance**: Sử dụng React Native Reanimated cho animation mượt mà
- **User-Friendly**: Giao diện trực quan, dễ sử dụng
- **Offline**: Hoạt động được khi không có internet

## Hỗ trợ và đóng góp

Dự án này được phát triển bởi @nguyenhung204. Mọi góp ý và đóng góp đều được hoan nghênh.

## License

Dự án này được phát hành dưới giấy phép MIT.

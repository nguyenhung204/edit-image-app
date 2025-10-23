import React from 'react';
import { StyleSheet, View } from 'react-native';
import EmojiSelector from 'react-native-emoji-modal';

type Props = {
  onSelect: (emoji: string) => void;
  onCloseModal: () => void;
};

export default function EmojiList({ onSelect, onCloseModal }: Props) {
  const handleEmojiSelect = (emoji: any) => {
    console.log('Selected emoji:', emoji);
    // Xử lý các định dạng emoji khác nhau
    let emojiChar = '';
    if (typeof emoji === 'string') {
      emojiChar = emoji;
    } else if (emoji.emoji) {
      emojiChar = emoji.emoji;
    } else if (emoji.char) {
      emojiChar = emoji.char;
    } else if (emoji.code) {
      emojiChar = emoji.code;
    } else {
      emojiChar = '😀'; // fallback
    }
    
    onSelect(emojiChar);
    onCloseModal();
  };

  return (
    <View style={styles.container}>
      <EmojiSelector
        onEmojiSelected={handleEmojiSelect}
        columns={8}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
  },
});

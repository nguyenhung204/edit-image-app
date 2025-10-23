import React from 'react';
import { StyleSheet, View } from 'react-native';
import EmojiSelector from 'react-native-emoji-selector';

type Props = {
  onSelect: (emoji: string) => void;
  onCloseModal: () => void;
};

export default function EmojiList({ onSelect, onCloseModal }: Props) {
  const handleEmojiSelect = (emoji: string) => {
    onSelect(emoji);
    onCloseModal();
  };

  return (
    <View style={styles.container}>
      <EmojiSelector
        onEmojiSelected={handleEmojiSelect}
        showTabs={true}
        showSearchBar={true}
        showSectionTitles={true}
        category={undefined}
        columns={8}
        placeholder="Search..."
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

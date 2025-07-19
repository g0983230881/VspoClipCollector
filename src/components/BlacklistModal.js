import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker'; // 導入 Picker
import { getBlacklist, addToBlacklist, removeFromBlacklist } from '../utils/storage';

const BlacklistModal = ({ isVisible, onClose, allChannels, onBlacklistChange }) => {
  const [currentBlacklist, setCurrentBlacklist] = useState([]);
  const [channelsToBlock, setChannelsToBlock] = useState([]);
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [selectedChannelName, setSelectedChannelName] = useState('');

  const loadBlacklistAndChannels = async () => {
    const blacklist = await getBlacklist();
    setCurrentBlacklist(blacklist);

    const availableChannels = allChannels.filter(channel => 
      !blacklist.some(b => b.id === channel.id)
    ).sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'));
    setChannelsToBlock(availableChannels);
    setSelectedChannelId(''); // Reset selection
    setSelectedChannelName('');
  };

  useEffect(() => {
    if (isVisible) {
      loadBlacklistAndChannels();
    }
  }, [isVisible, allChannels]);

  const handleAddToBlacklist = async () => {
    if (selectedChannelId && selectedChannelName) {
      const newBlacklist = await addToBlacklist({ id: selectedChannelId, name: selectedChannelName });
      setCurrentBlacklist(newBlacklist);
      onBlacklistChange(newBlacklist); // Notify parent of change
      loadBlacklistAndChannels(); // Reload available channels
    } else {
      Alert.alert("提示", "請選擇一個頻道來封鎖。");
    }
  };

  const handleRemoveFromBlacklist = async (channelId) => {
    const newBlacklist = await removeFromBlacklist(channelId);
    setCurrentBlacklist(newBlacklist);
    onBlacklistChange(newBlacklist); // Notify parent of change
    loadBlacklistAndChannels(); // Reload available channels
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>管理個人黑名單</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>已封鎖清單</Text>
            <ScrollView style={styles.blockedList}>
              {currentBlacklist.length > 0 ? (
                currentBlacklist.map(channel => (
                  <View key={channel.id} style={styles.blockedItem}>
                    <Text style={styles.blockedItemText} numberOfLines={1}>{channel.name}</Text>
                    <TouchableOpacity
                      style={styles.unblockButton}
                      onPress={() => handleRemoveFromBlacklist(channel.id)}
                    >
                      <Text style={styles.unblockButtonText}>解除封鎖</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyListText}>目前沒有已封鎖的頻道。</Text>
              )}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>新增封鎖</Text>
            <View style={styles.addBlockContainer}>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedChannelId}
                  onValueChange={(itemValue, itemIndex) => {
                    setSelectedChannelId(itemValue);
                    setSelectedChannelName(channelsToBlock.find(c => c.id === itemValue)?.name || '');
                  }}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  <Picker.Item label="-- 請選擇要封鎖的頻道 --" value="" />
                  {channelsToBlock.map(c => (
                    <Picker.Item key={c.id} label={c.name} value={c.id} />
                  ))}
                </Picker>
              </View>
              <TouchableOpacity style={styles.blockButton} onPress={handleAddToBlacklist}>
                <Text style={styles.blockButtonText}>封鎖</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>關閉</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1f2937', // gray-800
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4b5563', // gray-600
    width: '90%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ef4444', // red-400
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d1d5db', // gray-300
    marginBottom: 10,
  },
  blockedList: {
    maxHeight: 150,
    backgroundColor: '#111827', // gray-900
    borderRadius: 8,
    padding: 10,
  },
  blockedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#374151', // gray-700
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  blockedItemText: {
    color: '#d1d5db', // gray-300
    flexShrink: 1,
    marginRight: 10,
  },
  unblockButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: '#dc2626', // red-600
  },
  unblockButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  emptyListText: {
    color: '#9ca3af', // gray-400
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 10,
  },
  addBlockContainer: {
    flexDirection: 'column', // Changed to column for better layout on small screens
    alignItems: 'stretch',
  },
  selectInput: {
    backgroundColor: '#374151', // gray-700
    color: '#fff',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4b5563', // gray-600
    marginBottom: 20,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#4b5563', // gray-600
    borderRadius: 6,
    backgroundColor: '#374151', // gray-700
    marginBottom: 10,
    overflow: 'hidden', // Ensures borderRadius is applied to children
  },
  picker: {
    height: 50, // Adjust height as needed
    color: '#fff', // Text color for selected item
  },
  pickerItem: {
    color: '#fff', // Text color for list items (iOS only, Android uses picker's color)
  },
  blockButton: {
    backgroundColor: '#ef4444', // red-600
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  blockButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#4b5563', // gray-600
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default BlacklistModal;
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Linking, Clipboard, Alert } from 'react-native';

const CURRENT_APP_VERSION = 'V9.0'; // 應用程式當前版本

const UpdateModal = ({ isVisible, onClose }) => {
  const [updateStatus, setUpdateStatus] = useState('checking'); // 'checking', 'latest', 'new_version', 'failed'
  const [latestVersion, setLatestVersion] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const isWebView = () => {
    // 在 React Native 環境中，通常不會運行在 WebView 中
    // 但如果應用程式是通過 WebView 容器（如某些混合框架）啟動的，這裡可能需要更複雜的判斷
    // 對於純 React Native，我們假設它不是 WebView
    return false; 
  };

  const checkForUpdates = async () => {
    setUpdateStatus('checking');
    setErrorMessage(null);
    try {
      const response = await fetch('https://api.github.com/repos/renachiouo/vspo_clip_collector/commits?per_page=1');
      if (!response.ok) throw new Error(`GitHub API 請求失敗 (${response.status})`);
      
      const data = await response.json();
      const latestCommitMessage = data[0]?.commit?.message || '';
      
      const versionMatch = latestCommitMessage.match(/V(\d+\.\d+(\.\d+)?)/);
      const fetchedLatestVersion = versionMatch ? `V${versionMatch[1]}` : null;

      if (!fetchedLatestVersion) {
        throw new Error('無法從最新的 commit 中解析版本號。');
      }

      setLatestVersion(fetchedLatestVersion);

      if (fetchedLatestVersion === CURRENT_APP_VERSION) {
        setUpdateStatus('latest');
      } else {
        setUpdateStatus('new_version');
      }
    } catch (error) {
      console.error('檢查更新時發生錯誤:', error);
      setErrorMessage(error.message);
      setUpdateStatus('failed');
    }
  };

  useEffect(() => {
    if (isVisible) {
      checkForUpdates();
    }
  }, [isVisible]);

  const renderContent = () => {
    switch (updateStatus) {
      case 'checking':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.modalTitle}>檢查更新中...</Text>
            <Text style={styles.messageText}>正在從 GitHub 獲取最新版本資訊，請稍候...</Text>
          </View>
        );
      case 'latest':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.modalTitle}>檢查完成</Text>
            <Text style={styles.messageText}>您目前使用的已是最新版本 ({CURRENT_APP_VERSION})。</Text>
          </View>
        );
      case 'new_version':
        const releaseUrl = "https://github.com/renachiouo/vspo_clip_collector/releases";
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.modalTitle}>發現新版本！</Text>
            <Text style={styles.messageText}>
              目前最新版本為 <Text style={styles.strongText}>{latestVersion}</Text>，您使用的版本為 {CURRENT_APP_VERSION}。
              {'\n\n'}建議更新以獲取最新的功能與修正。
            </Text>
            {isWebView() ? (
              <View style={styles.downloadSection}>
                <Text style={styles.downloadHint}>請複製以下網址，並在您的手機瀏覽器中開啟以下載更新：</Text>
                <TextInput
                  style={styles.urlInput}
                  value={releaseUrl}
                  editable={false}
                  selectTextOnFocus={true}
                />
                <TouchableOpacity style={styles.copyButton} onPress={() => { Clipboard.setString(releaseUrl); Alert.alert("已複製", "下載網址已複製到剪貼簿。"); }}>
                  <Text style={styles.copyButtonText}>複製網址</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={() => Linking.openURL(releaseUrl)}
              >
                <Text style={styles.downloadButtonText}>前往下載頁面</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      case 'failed':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.modalTitle}>檢查失敗</Text>
            <Text style={styles.messageText}>
              無法完成更新檢查，請稍後再試。
              {'\n'}錯誤訊息: <Text style={styles.errorText}>{errorMessage}</Text>
            </Text>
          </View>
        );
      default:
        return null;
    }
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
          {renderContent()}
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
  contentContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#06b6d4', // cyan-400
    marginBottom: 10,
    textAlign: 'center',
  },
  messageText: {
    color: '#d1d5db', // gray-300
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  strongText: {
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ef4444', // red-500
    fontWeight: 'bold',
  },
  downloadSection: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#111827', // gray-900
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  downloadHint: {
    color: '#9ca3af', // gray-400
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'center',
  },
  urlInput: {
    backgroundColor: '#374151', // gray-700
    color: '#fff',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4b5563', // gray-600
    width: '100%',
    textAlign: 'center',
  },
  copyButton: {
    marginTop: 10,
    backgroundColor: '#6366f1', // indigo-600
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  copyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  downloadButton: {
    marginTop: 20,
    backgroundColor: '#6366f1', // indigo-600
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  downloadButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: '#4b5563', // gray-600
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default UpdateModal;
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Linking,
  Alert,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchAllDataFromProxy } from '../api/youtubeApi';
import { getBlacklist, saveBlacklist, addToBlacklist, removeFromBlacklist } from '../utils/storage';
import { vspoJPMembers, otherMemberGroups, getAllMembers, isColorLight } from '../utils/memberData';
import VideoCard from '../components/VideoCard';
import VideoListItem from '../components/VideoListItem';
import ChannelGridCard from '../components/ChannelGridCard';
import BlacklistModal from '../components/BlacklistModal'; // 導入黑名單模態框
import UpdateModal from '../components/UpdateModal'; // 導入更新模態框
import Notification from '../components/Notification'; // 導入通知元件
// import { Video, Channel, AppState } from '../types'; // 在 JS 專案中，我們不直接導入類型

const CURRENT_APP_VERSION = 'V9.0';
const PROXY_ENDPOINT = 'https://vspo-proxy-git-main-renas-projects-c8ce958b.vercel.app'; // 再次定義以防萬一

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const [state, setState] = useState({
    allVideos: [],
    blacklist: [],
    isLoading: true,
    isUpdatingInBackground: false, // 用於背景更新的狀態
    lastUpdated: null,
    apiError: null,
    totalVisits: 0,
    todayVisits: 0,
    activeView: 'latest', // 'latest' 或 'all'
    activeVideoTypeFilter: 'all', // 'all', 'video', 'short'
    currentPage: 1,
    itemsPerPage: 10,
    activeMemberFilter: 'all',
    activeChannelFilter: null,
  });

  const [isBlacklistModalVisible, setIsBlacklistModalVisible] = useState(false); // 新增黑名單模態框狀態
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false); // 新增更新模態框狀態
  const [isFilterMenuVisible, setIsFilterMenuVisible] = useState(false);
  const [filterMenuPosition, setFilterMenuPosition] = useState({ top: 0, left: 0 });
  const filterButtonRef = useRef(null);
  const notificationRef = useRef(null);

  const initializeApp = useCallback(async (force = false, password = '', mode = 'normal') => {
    // 根據是否為強制更新，決定是前景載入還是背景更新
    if (force) {
      setState(prevState => ({ ...prevState, isUpdatingInBackground: true }));

      fetchAllDataFromProxy(force, password, mode)
        .then(dataPackage => {
          setState(prevState => ({
            ...prevState,
            allVideos: dataPackage.videos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)),
            lastUpdated: new Date(dataPackage.timestamp),
            totalVisits: dataPackage.totalVisits || 0,
            todayVisits: dataPackage.todayVisits || 0,
            isUpdatingInBackground: false,
          }));
          notificationRef.current?.show('資料已成功更新！', 'success');
        })
        .catch(error => {
          console.error("背景更新失敗:", error);
          let errorMessage = error.message;
          if (errorMessage && errorMessage.toLowerCase().includes('quota')) {
            errorMessage = "API 每日配額已用盡";
          }
          notificationRef.current?.show(`更新失敗: ${errorMessage}`, 'error');
          setState(prevState => ({ ...prevState, isUpdatingInBackground: false }));
        });

    } else {
      // 原本的初次載入邏輯
      setState(prevState => ({ ...prevState, isLoading: true, apiError: null }));
      try {
        const initialBlacklist = await getBlacklist();
        const dataPackage = await fetchAllDataFromProxy(force, password, mode);
        setState(prevState => ({
          ...prevState,
          allVideos: dataPackage.videos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)),
          lastUpdated: new Date(dataPackage.timestamp),
          totalVisits: dataPackage.totalVisits || 0,
          todayVisits: dataPackage.todayVisits || 0,
          blacklist: initialBlacklist,
          isLoading: false,
        }));
      } catch (error) {
        console.error("初始化失敗:", error);
        let errorMessage = error.message;
        if (errorMessage && errorMessage.toLowerCase().includes('quota')) {
          errorMessage = "API 每日配額已用盡";
        }
        setState(prevState => ({ ...prevState, apiError: errorMessage, isLoading: false }));
      }
    }
  }, []);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  // Secret Trigger Logic
  const [secretTrigger, setSecretTrigger] = useState('');
  useEffect(() => {
    if (secretTrigger === 'renachi') {
      Alert.prompt(
        "管理員模式",
        "請輸入密碼：",
        [
          {
            text: "取消",
            onPress: () => setSecretTrigger(''),
            style: "cancel"
          },
          {
            text: "確認",
            onPress: (password) => {
              const parts = password.split(',');
              const pass = parts[0];
              const mode = parts[1] || 'normal';
              Alert.alert(`正在以 ${mode} 模式執行指令...`);
              initializeApp(true, pass, mode);
              setSecretTrigger('');
            }
          }
        ],
        "plain-text"
      );
    }
  }, [secretTrigger]);

  // 輔助函數：格式化數字
  const formatNumber = (num) => {
    if (typeof num !== 'number') return 'N/A';
    if (num >= 10000) return `${(num / 10000).toFixed(1)}萬`;
    return num.toLocaleString();
  };

  // 輔助函數：計算時間差
  const timeAgo = (dateStr) => {
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    const intervals = { '年': 31536000, '個月': 2592000, '天': 86400, '小時': 3600, '分鐘': 60 };
    for (let unit in intervals) {
      if (seconds / intervals[unit] > 1) return `${Math.floor(seconds / intervals[unit])} ${unit}前`;
    }
    return "剛剛";
  };

  // 輔助函數：判斷顏色深淺
  // isColorLight 已經在 memberData.js 中定義並導出，這裡不再重複

  // 篩選影片邏輯
  const visibleVideos = state.allVideos.filter(video => !state.blacklist.some(b => b.id === video.channelId));

  let baseFilteredVideos;
  if (state.activeChannelFilter) {
    baseFilteredVideos = visibleVideos.filter(video => video.channelId === state.activeChannelFilter.id);
  } else if (state.activeMemberFilter !== 'all') {
    const filterKeyword = state.activeMemberFilter.toLowerCase();
    baseFilteredVideos = visibleVideos.filter(video => {
      if (typeof video.searchableText !== 'string') {
        return false;
      }
      return video.searchableText.includes(filterKeyword);
    });
  } else {
    baseFilteredVideos = visibleVideos;
  }

  const isClassificationAvailable = visibleVideos.length > 0 && visibleVideos.some(v => v.videoType);
  let filteredVideos;
  if (isClassificationAvailable && state.activeVideoTypeFilter !== 'all') {
    filteredVideos = baseFilteredVideos.filter(v => v.videoType === state.activeVideoTypeFilter);
  } else {
    filteredVideos = baseFilteredVideos;
  }

  let videosForChannelList = baseFilteredVideos;

  // 渲染邏輯將在後續步驟中添加
  return (
    <>
      <SafeAreaView style={styles.safeArea}>
        <Notification ref={notificationRef} />
        {state.isUpdatingInBackground && (
          <View style={styles.updateBanner}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.updateBannerText}>正在背景更新資料...</Text>
          </View>
        )}
        <ScrollView style={styles.scrollView} stickyHeaderIndices={[1]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setSecretTrigger(prev => prev + 'r')}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>
                  れなち's{'\n'}VSPO中文精華收集處
                </Text>
                <Text style={styles.versionText}>{CURRENT_APP_VERSION}</Text>
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.topBar}>
            <View style={styles.topBarStats}>
              <Text style={styles.statText}>👀 總人次: <Text style={styles.statValue}>{formatNumber(state.totalVisits)}</Text></Text>
              <Text style={styles.statText}>☀️ 今日人次: <Text style={styles.statValue}>{formatNumber(state.todayVisits)}</Text></Text>
              {state.lastUpdated && (
                <Text style={styles.statText}>資料時間: {state.lastUpdated.toLocaleTimeString('en-US', { timeZone: 'Asia/Taipei' })}</Text>
              )}
            </View>
            <View style={styles.topBarActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => Linking.openURL("https://docs.google.com/forms/d/e/1FAIpQLSdPXcKRZdp6KgVcw_yiXhDy979wrl3y42knIh5fIjP1tGUZBQ/viewform?usp=sharing&ouid=104059498550822009260")}
              >
                <Text style={styles.actionButtonText}>回報遺漏頻道/影片</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setIsBlacklistModalVisible(true)} // 打開黑名單模態框
              >
                <Text style={styles.actionButtonText}>管理黑名單</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setIsUpdateModalVisible(true)} // 打開更新模態框
              >
                <Text style={styles.actionButtonText}>檢查更新</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.mainContent}>
            {/* 成員篩選區塊 */}
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>成員篩選</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.memberFilterList}>
                <TouchableOpacity
                  style={[styles.filterBtn, state.activeMemberFilter === 'all' && styles.filterBtnActiveAll]}
                  onPress={() => setState(prevState => ({ ...prevState, activeMemberFilter: 'all', activeChannelFilter: null, currentPage: 1 }))}
                >
                  <Text style={[styles.filterBtnText, state.activeMemberFilter === 'all' && styles.filterBtnTextActiveAll]}>顯示全部</Text>
                </TouchableOpacity>
                {vspoJPMembers.map((member, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.filterBtn,
                      { backgroundColor: member.color },
                      state.activeMemberFilter === member.filter_keyword && styles.filterBtnActive,
                    ]}
                    onPress={() => setState(prevState => ({ ...prevState, activeMemberFilter: member.filter_keyword, activeChannelFilter: null, currentPage: 1 }))}
                  >
                    <Text style={[
                      styles.filterBtnText,
                      { color: member.forceWhiteText ? '#FFFFFF' : (isColorLight(member.color) ? '#1f2937' : '#f9fafb') }
                    ]}>
                      {member.name_jp}
                    </Text>
                  </TouchableOpacity>
                ))}
                {Object.keys(otherMemberGroups).map(groupName => (
                  <React.Fragment key={groupName}>
                    <Text style={styles.filterGroupDivider}>{groupName}</Text>
                    {otherMemberGroups[groupName].map((member, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.filterBtn,
                          { backgroundColor: member.color },
                          state.activeMemberFilter === member.filter_keyword && styles.filterBtnActive,
                        ]}
                        onPress={() => setState(prevState => ({ ...prevState, activeMemberFilter: member.filter_keyword, activeChannelFilter: null, currentPage: 1 }))}
                      >
                        <Text style={[
                          styles.filterBtnText,
                          { color: member.forceWhiteText ? '#FFFFFF' : (isColorLight(member.color) ? '#1f2937' : '#f9fafb') }
                        ]}>
                          {member.name_jp}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </React.Fragment>
                ))}
              </ScrollView>
            </View>

            {/* 影片列表區塊 */}
            <View style={styles.videoSection}>
              {state.isLoading ? (
                <ActivityIndicator size="large" color="#06b6d4" style={styles.loadingIndicator} />
              ) : state.apiError ? (
                <View style={styles.errorDisplay}>
                  <Text style={styles.errorText}>發生錯誤！</Text>
                  <Text style={styles.errorHint}>{state.apiError}</Text>
                  {state.apiError.toLowerCase().includes('quota') && (
                    <Text style={styles.errorHint}>請等待台灣時間下午 4 點後，配額將會自動重置。</Text>
                  )}
                </View>
              ) : (
                <>
                  {state.activeChannelFilter && (
                    <View style={styles.filterBanner}>
                      <Text style={styles.filterBannerText}>目前篩選中：<Text style={styles.filterBannerStrong}>{state.activeChannelFilter.name}</Text></Text>
                      <TouchableOpacity
                        onPress={() => setState(prevState => ({ ...prevState, activeChannelFilter: null }))}
                        style={styles.clearFilterBtn}
                      >
                        <Text style={styles.clearFilterBtnText}>X</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <View style={styles.videosHeader}>
                    <Text style={styles.videosTitle}>精華影片</Text>
                    <View style={styles.filterControls}>
                      {/* Dropdown-like filter */}
                      <View style={styles.typeFilterContainer}>
                        <TouchableOpacity
                          ref={filterButtonRef}
                          style={[
                            styles.typeFilterDropdownButton,
                            state.isUpdatingInBackground && styles.typeFilterDropdownButtonDisabled,
                          ]}
                          disabled={state.isUpdatingInBackground}
                          onPress={() => {
                            if (state.isUpdatingInBackground) return;
                            filterButtonRef.current.measure((fx, fy, width, height, px, py) => {
                              setFilterMenuPosition({ top: py + height, left: px });
                              setIsFilterMenuVisible(true);
                            });
                          }}
                        >
                          <Text style={styles.typeFilterDropdownButtonText}>
                            {state.activeVideoTypeFilter === 'all' ? '全部' : state.activeVideoTypeFilter === 'video' ? '只看影片' : '只看Shorts'}
                          </Text>
                          <Text style={styles.dropdownArrow}>▼</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.tabButtons}>
                        <TouchableOpacity
                          style={[styles.tabBtn, state.activeView === 'latest' && styles.tabBtnActive]}
                          onPress={() => setState(prevState => ({ ...prevState, activeView: 'latest' }))}
                        >
                          <Text style={styles.tabBtnText}>{width >= 1280 ? '最新12部' : '最新10部'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.tabBtn, state.activeView === 'all' && styles.tabBtnActive]}
                          onPress={() => setState(prevState => ({ ...prevState, activeView: 'all', currentPage: 1 }))}
                        >
                          <Text style={styles.tabBtnText}>一個月內</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* 影片列表渲染邏輯 */}
                  {state.activeView === 'latest' ? (
                    <View style={styles.videoGrid}>
                      {filteredVideos.slice(0, width >= 1280 ? 12 : 10).map((video, index) => (
                        <VideoCard key={video.id || index} video={video} isShortsMode={state.activeVideoTypeFilter === 'short'} />
                      ))}
                    </View>
                  ) : (
                    <View style={styles.videoList}>
                      {filteredVideos.slice((state.currentPage - 1) * state.itemsPerPage, state.currentPage * state.itemsPerPage).map((video, index) => (
                        <VideoListItem key={video.id || index} video={video} />
                      ))}
                      {/* 分頁控制將在後續組件中實現 */}
                    </View>
                  )}

                  {/* 頻道列表區塊 */}
                  <View style={styles.channelSection}>
                    <Text style={styles.channelTitle}>精華頻道列表</Text>
                    <Text style={styles.channelSubtitle}>僅列出30天內有發布新影片之頻道</Text>
                    <View style={styles.channelGrid}>
                      {Object.values(
                        videosForChannelList.reduce((acc, video) => {
                          if (!acc[video.channelId]) {
                            acc[video.channelId] = { id: video.channelId, name: video.channelTitle, subscriberCount: video.subscriberCount, latestVideo: video, avatarUrl: video.channelAvatarUrl };
                          }
                          return acc;
                        }, {})
                      )
                      .filter(channel => new Date(channel.latestVideo.publishedAt) > new Date(new Date().setDate(new Date().getDate() - 30)))
                      .sort((a, b) => new Date(b.latestVideo.publishedAt) - new Date(a.latestVideo.publishedAt))
                      .map((channel, index) => (
                        <ChannelGridCard key={channel.id || index} channel={channel} onFilterChannel={(channelId, channelName) => setState(prevState => ({ ...prevState, activeMemberFilter: 'all', activeChannelFilter: { id: channelId, name: channelName }, currentPage: 1 }))} />
                      ))}
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
      <BlacklistModal
        isVisible={isBlacklistModalVisible}
        onClose={() => setIsBlacklistModalVisible(false)}
        allChannels={[...new Map(state.allVideos.map(v => [v.channelId, { id: v.channelId, name: v.channelTitle }])).values()]}
        onBlacklistChange={(newBlacklist) => setState(prevState => ({ ...prevState, blacklist: newBlacklist }))}
      />
      <UpdateModal
        isVisible={isUpdateModalVisible}
        onClose={() => setIsUpdateModalVisible(false)}
      />

      <Modal
        transparent={true}
        visible={isFilterMenuVisible}
        animationType="fade"
        onRequestClose={() => setIsFilterMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsFilterMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.dropdownMenu, { top: filterMenuPosition.top, left: filterMenuPosition.left }]}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setState(prevState => ({ ...prevState, activeVideoTypeFilter: 'all', currentPage: 1 }));
                setIsFilterMenuVisible(false);
              }}
            >
              <Text style={styles.dropdownItemText}>全部</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setState(prevState => ({ ...prevState, activeVideoTypeFilter: 'video', currentPage: 1 }));
                setIsFilterMenuVisible(false);
              }}
            >
              <Text style={styles.dropdownItemText}>只看影片</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setState(prevState => ({ ...prevState, activeVideoTypeFilter: 'short', currentPage: 1 }));
                setIsFilterMenuVisible(false);
              }}
            >
              <Text style={styles.dropdownItemText}>只看Shorts</Text>
            </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111827',
  },
  updateBanner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#6366f1', // indigo-500
    width: '100%',
  },
  updateBannerText: {
    color: '#FFFFFF',
    marginLeft: 10,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 30,
    marginBottom: 20,
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#06b6d4', // cyan-400
    textAlign: 'center',
    lineHeight: 40,
  },
  versionText: {
    fontSize: 16,
    color: '#6b7280', // gray-500
    marginTop: 5,
  },
  topBar: {
    backgroundColor: 'rgba(17, 24, 39, 0.8)', // gray-900/80
    paddingVertical: 15,
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937', // gray-800
    alignItems: 'center',
  },
  topBarStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  statText: {
    fontSize: 14,
    color: '#9ca3af', // gray-400
    marginHorizontal: 10,
  },
  statValue: {
    fontWeight: 'bold',
  },
  topBarActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  actionButton: {
    marginHorizontal: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6366f1', // indigo-400
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 15,
  },
  filterSection: {
    backgroundColor: 'rgba(31, 41, 55, 0.5)', // gray-800/50
    padding: 15,
    borderRadius: 8,
    marginBottom: 30,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d1d5db', // gray-300
    borderBottomWidth: 1,
    borderBottomColor: '#4b5563', // gray-600
    paddingBottom: 10,
    marginBottom: 15,
  },
  memberFilterList: {
    flexDirection: 'row',
    paddingBottom: 10, // for horizontal scroll indicator
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
    fontWeight: '600',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  filterBtnActiveAll: {
    backgroundColor: '#6366f1', // indigo-500
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  filterBtnText: {
    fontSize: 14,
    color: '#f9fafb', // gray-50
  },
  filterBtnTextActiveAll: {
    color: '#ffffff',
  },
  filterGroupDivider: {
    fontSize: 12,
    color: '#9ca3af', // gray-500
    paddingTop: 10,
    paddingBottom: 5,
    paddingLeft: 5,
    whiteSpace: 'nowrap',
  },
  loadingIndicator: {
    marginTop: 50,
  },
  errorDisplay: {
    backgroundColor: 'rgba(185, 28, 28, 0.5)', // red-900/50
    borderColor: '#ef4444', // red-500
    borderWidth: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
  },
  errorText: {
    fontWeight: 'bold',
    color: '#fecaca', // red-200
    fontSize: 16,
  },
  errorHint: {
    marginTop: 5,
    fontSize: 12,
    color: '#fecaca', // red-200
    textAlign: 'center',
  },
  filterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(109, 40, 217, 0.5)', // purple-900/50
    color: '#d8b4fe', // purple-200
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  filterBannerText: {
    color: '#d8b4fe',
    fontSize: 16,
  },
  filterBannerStrong: {
    fontWeight: 'bold',
  },
  clearFilterBtn: {
    padding: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  clearFilterBtnText: {
    color: '#d8b4fe',
    fontWeight: 'bold',
  },
  videosHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  videosTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: '#06b6d4', // cyan-400
    paddingLeft: 15,
  },
  filterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
    width: '100%',
  },
  typeFilterContainer: {
    position: 'relative',
    marginRight: 10,
  },
  typeFilterDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151', // gray-700
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
  },
  typeFilterDropdownButtonDisabled: {
    backgroundColor: '#4b5563', // gray-600
    opacity: 0.5,
  },
  typeFilterDropdownButtonText: {
    color: '#d1d5db', // gray-300
    fontWeight: 'bold',
    marginRight: 5,
  },
  dropdownArrow: {
    color: '#d1d5db',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dropdownMenu: {
    position: 'absolute',
    backgroundColor: '#1f2937', // gray-800
    borderRadius: 6,
    padding: 10,
    width: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  dropdownItemText: {
    color: '#d1d5db', // gray-300
    fontSize: 16,
  },
  tabButtons: {
    flexDirection: 'row',
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
    backgroundColor: '#374151', // gray-700
    marginRight: 10,
  },
  tabBtnActive: {
    backgroundColor: '#4f46e5', // indigo-600
  },
  tabBtnText: {
    color: '#d1d5db', // gray-300
    fontWeight: 'bold',
  },
  videoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  videoList: {
    // 列表樣式，每個項目將由 VideoListItem 組件渲染
  },
  channelSection: {
    marginTop: 40,
  },
  channelTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: '#a855f7', // purple-400
    paddingLeft: 15,
    marginBottom: 5,
  },
  channelSubtitle: {
    fontSize: 12,
    color: '#9ca3af', // gray-500
    marginLeft: 19, // 與標題對齊
    marginBottom: 20,
  },
  channelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});

export default HomeScreen;
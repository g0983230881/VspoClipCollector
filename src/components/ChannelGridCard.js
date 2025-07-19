import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Linking } from 'react-native';

const { width } = Dimensions.get('window');

const ChannelGridCard = ({ channel, onFilterChannel }) => {
  const formatNumber = (num) => {
    if (typeof num !== 'number') return 'N/A';
    if (num >= 10000) return `${(num / 10000).toFixed(1)}萬`;
    return num.toLocaleString();
  };

  const timeAgo = (dateStr) => {
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    const intervals = { '年': 31536000, '個月': 2592000, '天': 86400, '小時': 3600, '分鐘': 60 };
    for (let unit in intervals) {
      if (seconds / intervals[unit] > 1) return `${Math.floor(seconds / intervals[unit])} ${unit}前`;
    }
    return "剛剛";
  };

  const video = channel.latestVideo;

  return (
    <View style={styles.card}>
      <View style={styles.overlay} />
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => Linking.openURL(`https://www.youtube.com/channel/${channel.id}`)} style={styles.avatarLink}>
            <Image source={{ uri: channel.avatarUrl }} style={styles.avatar} />
          </TouchableOpacity>
          <View style={styles.channelInfo}>
            <TouchableOpacity onPress={() => Linking.openURL(`https://www.youtube.com/channel/${channel.id}`)}>
              <Text style={styles.channelName} numberOfLines={1}>{channel.name}</Text>
            </TouchableOpacity>
            <Text style={styles.subscriberCount}>{formatNumber(channel.subscriberCount)} 位訂閱者</Text>
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => onFilterChannel(channel.id, channel.name)}
          >
            <Text style={styles.filterButtonText}>篩選</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.latestVideoLabel}>最新影片:</Text>
        {video && (
          <TouchableOpacity onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${video.id}`)} style={styles.videoThumbnailContainer}>
            <Image
              source={{ uri: video.thumbnail }}
              style={styles.videoThumbnail}
              onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
            />
          </TouchableOpacity>
        )}
        
        {video && (
          <View style={styles.videoInfoContainer}>
            <TouchableOpacity onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${video.id}`)} style={styles.videoTitleLink}>
              <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
            </TouchableOpacity>
            <View style={styles.videoMetaContainer}>
              <Text style={styles.videoMetaText}>{formatNumber(video.viewCount)} 次觀看</Text>
              <Text style={styles.videoMetaText}>{timeAgo(video.publishedAt)}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: width / 2 - 25, // 考慮到左右 padding 和中間間距
    backgroundColor: '#1f2937', // gray-800
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(17, 24, 39, 0.7)', // gray-900/70
    // backdropFilter: 'blur(4px)', // React Native 不直接支持 CSS backdrop-filter
  },
  contentContainer: {
    position: 'relative',
    zIndex: 10,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  avatarLink: {
    marginRight: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#374151', // gray-700
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  channelInfo: {
    flex: 1,
    minWidth: 0,
  },
  channelName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d8b4fe', // purple-300
  },
  subscriberCount: {
    fontSize: 12,
    color: '#d1d5db', // gray-300
  },
  filterButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  filterButtonText: {
    color: '#d8b4fe', // purple-300
    fontSize: 12,
  },
  latestVideoLabel: {
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#9ca3af', // gray-400
    marginBottom: 5,
  },
  videoThumbnailContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#374151', // gray-700/50
    overflow: 'hidden',
    marginTop: 5,
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  videoInfoContainer: {
    padding: 10,
    flexGrow: 1,
    marginTop: 'auto',
  },
  videoTitleLink: {
    flexGrow: 1,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f9fafb', // gray-100
    lineHeight: 20,
    marginBottom: 5,
  },
  videoMetaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(75, 85, 99, 0.5)', // gray-500/50
  },
  videoMetaText: {
    fontSize: 12,
    color: '#d1d5db', // gray-300
  },
});

export default ChannelGridCard;
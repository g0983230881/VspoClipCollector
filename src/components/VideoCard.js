import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Linking } from 'react-native';

const { width } = Dimensions.get('window');

const VideoCard = ({ video }) => {
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

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${video.id}`)} style={styles.thumbnailContainer}>
        <Image
          source={{ uri: video.thumbnail }}
          style={styles.thumbnail}
          onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
        />
      </TouchableOpacity>
      <View style={styles.infoContainer}>
        <TouchableOpacity onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${video.id}`)} style={styles.titleLink}>
          <Text style={styles.title} numberOfLines={2}>{video.title}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL(`https://www.youtube.com/channel/${video.channelId}`)} style={styles.channelLink}>
          <Image source={{ uri: video.channelAvatarUrl }} style={styles.channelAvatar} />
          <Text style={styles.channelTitle} numberOfLines={1}>{video.channelTitle}</Text>
        </TouchableOpacity>
        <View style={styles.metaContainer}>
          <Text style={styles.metaText}>{formatNumber(video.viewCount)} 次觀看</Text>
          <Text style={styles.metaText}>{timeAgo(video.publishedAt)}</Text>
        </View>
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
  },
  thumbnailContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#374151', // gray-700
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  infoContainer: {
    padding: 10,
    flexGrow: 1,
  },
  titleLink: {
    flexGrow: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f9fafb', // gray-100
    lineHeight: 20,
    marginBottom: 5,
  },
  channelLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  channelAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#374151', // gray-700
    marginRight: 8,
  },
  channelTitle: {
    fontSize: 12,
    color: '#9ca3af', // gray-400
    flexShrink: 1,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#374151', // gray-700
  },
  metaText: {
    fontSize: 12,
    color: '#9ca3af', // gray-400
  },
});

export default VideoCard;
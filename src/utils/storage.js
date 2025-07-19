import AsyncStorage from '@react-native-async-storage/async-storage';

const BLACKLIST_KEY = 'vspo_channel_blacklist';

export const getBlacklist = async () => {
  try {
    const stored = await AsyncStorage.getItem(BLACKLIST_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("讀取黑名單失敗:", e);
    return [];
  }
};

export const saveBlacklist = async (blacklist) => {
  try {
    await AsyncStorage.setItem(BLACKLIST_KEY, JSON.stringify(blacklist));
  } catch (e) {
    console.error("儲存黑名單失敗:", e);
  }
};

export const addToBlacklist = async (channel) => {
  const currentBlacklist = await getBlacklist();
  if (!currentBlacklist.some(item => item.id === channel.id)) {
    const newBlacklist = [...currentBlacklist, channel];
    await saveBlacklist(newBlacklist);
    return newBlacklist;
  }
  return currentBlacklist;
};

export const removeFromBlacklist = async (channelId) => {
  const currentBlacklist = await getBlacklist();
  const newBlacklist = currentBlacklist.filter(item => item.id !== channelId);
  await saveBlacklist(newBlacklist);
  return newBlacklist;
};
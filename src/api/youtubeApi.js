// 從原網站代碼移植的 API 服務

const PROXY_ENDPOINT = 'https://vspo-proxy-git-main-renas-projects-c8ce958b.vercel.app';

export const fetchAllDataFromProxy = async (force = false, password = '', mode = 'normal') => {
  try {
    const url = new URL(`${PROXY_ENDPOINT}/api/youtube`);
    if (force) {
      url.searchParams.append('force_refresh', 'true');
      url.searchParams.append('password', password);
      if (mode === 'deep') {
        url.searchParams.append('mode', 'deep');
      }
    }
    
    const response = await fetch(url.toString());
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};
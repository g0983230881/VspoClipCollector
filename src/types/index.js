// 雖然是 JS 專案，但保留類型定義的結構有助於理解資料形狀

/**
 * @typedef {object} Video
 * @property {string} id
 * @property {string} title
 * @property {string} channelId
 * @property {string} channelTitle
 * @property {string} channelAvatarUrl
 * @property {string} thumbnail
 * @property {string} publishedAt
 * @property {number} viewCount
 * @property {string} [searchableText]
 */

/**
 * @typedef {object} Channel
 * @property {string} id
 * @property {string} name
 * @property {number} [subscriberCount]
 * @property {string} [avatarUrl]
 * @property {Video} [latestVideo]
 */

/**
 * @typedef {object} AppState
 * @property {Video[]} allVideos
 * @property {Channel[]} blacklist
 * @property {boolean} isLoading
 * @property {Date | null} lastUpdated
 * @property {string | null} apiError
 * @property {number} totalVisits
 * @property {number} todayVisits
 * @property {'latest' | 'all'} activeView
 * @property {number} currentPage
 * @property {number} itemsPerPage
 * @property {string} activeMemberFilter
 * @property {Channel | null} activeChannelFilter
 */
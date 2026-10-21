// Storage names shared by the full stores (web-store.ts, collections.ts) and the small
// recordRecentPage (recent-page.ts), so they always read and write the same data.

/** Every key the site writes to localStorage starts with this, so keys() never sees other data. */
export const STORAGE_PREFIX = 'hk:'

/** Recently opened pages: key and length of the list. */
export const RECENTS_KEY = 'recents'
export const RECENTS_LIMIT = 10

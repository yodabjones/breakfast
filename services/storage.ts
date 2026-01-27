import { RatingEntry } from '../types';

// Unique public key for MorningGlory data
const API_KEY_KV = 'mg_v1_dashboard_key_8822';
const API_URL = `https://kvdb.io/A3mP8u8q9z7B5e4r2t1y6/${API_KEY_KV}`;

export const loadRatings = async (): Promise<RatingEntry[]> => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      if (response.status === 404) return [];
      throw new Error('Cloud storage unreachable');
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Failed to load ratings from cloud:', error);
    const localData = localStorage.getItem('morningglory_backup');
    return localData ? JSON.parse(localData) : [];
  }
};

export const saveRatings = async (ratings: RatingEntry[]): Promise<void> => {
  try {
    // We use PUT to overwrite the value of our key in the KV store
    const response = await fetch(API_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ratings),
    });

    if (!response.ok) throw new Error(`Sync failed: ${response.statusText}`);

    localStorage.setItem('morningglory_backup', JSON.stringify(ratings));
  } catch (error) {
    console.error('Failed to save ratings to cloud:', error);
    throw error;
  }
};
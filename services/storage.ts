
import { RatingEntry } from '../types';

// Using a unique public bucket for MorningGlory shared data
const BUCKET_ID = 'morningglory_shared_v1_99x';
const API_URL = `https://kvdb.io/6v2v6fF9j6f7a6f7a6f7a6f/${BUCKET_ID}`;

/**
 * Loads all ratings from the shared cloud database.
 */
export const loadRatings = async (): Promise<RatingEntry[]> => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      if (response.status === 404) return []; // Bucket doesn't exist yet
      throw new Error('Cloud storage unreachable');
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Failed to load ratings from cloud:', error);
    // Fallback to local storage if cloud is down, but we want to encourage cloud use
    const localData = localStorage.getItem('morningglory_backup');
    return localData ? JSON.parse(localData) : [];
  }
};

/**
 * Saves the entire ratings array to the shared cloud database.
 */
export const saveRatings = async (ratings: RatingEntry[]): Promise<void> => {
  try {
    // Save to cloud
    const response = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify(ratings),
    });
    
    if (!response.ok) throw new Error('Failed to sync with cloud');

    // Also keep a local backup just in case
    localStorage.setItem('morningglory_backup', JSON.stringify(ratings));
  } catch (error) {
    console.error('Failed to save ratings to cloud:', error);
    throw error;
  }
};


export type Category = 'coffee' | 'food' | 'ambience';

export interface Ratings {
  coffee: number;
  food: number;
  ambience: number;
}

export interface Notes {
  coffee: string;
  food: string;
  ambience: string;
}

export interface RatingEntry {
  id: string;
  restaurantName: string;
  username: string;
  date: string;
  time: string;
  ratings: Ratings;
  notes: Notes;
  totalScore: number;
  createdAt: number;
}

export type SortOption = 'date-new' | 'date-old' | 'score-high' | 'score-low' | 'name-asc';

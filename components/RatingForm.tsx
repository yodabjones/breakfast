
import React, { useState } from 'react';
import { RatingEntry, Ratings, Notes } from '../types';
import StarRating from './StarRating';

interface RatingFormProps {
  onAdd: (entry: Omit<RatingEntry, 'id' | 'totalScore' | 'createdAt'>) => void;
}

const RatingForm: React.FC<RatingFormProps> = ({ onAdd }) => {
  const [restaurantName, setRestaurantName] = useState('');
  const [username, setUsername] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  
  const [ratings, setRatings] = useState<Ratings>({ coffee: 0, food: 0, ambience: 0 });
  const [notes, setNotes] = useState<Notes>({ coffee: '', food: '', ambience: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantName || !username || !date || !time) {
      alert('Please fill in all required fields.');
      return;
    }

    onAdd({
      restaurantName,
      username,
      date,
      time,
      ratings,
      notes
    });

    // Reset form
    setRestaurantName('');
    setRatings({ coffee: 0, food: 0, ambience: 0 });
    setNotes({ coffee: '', food: '', ambience: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100">
      <h3 className="text-xl font-bold text-gray-800 mb-6 brand-font border-b border-orange-50 pb-2 italic">Add a Morning Moment</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Restaurant Name*</label>
          <input
            type="text"
            required
            value={restaurantName}
            onChange={(e) => setRestaurantName(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition-all"
            placeholder="e.g. Sunny Side Cafe"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Your Username*</label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition-all"
            placeholder="e.g. BreakfastLover99"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Date*</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Time*</label>
          <input
            type="time"
            required
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition-all"
          />
        </div>
      </div>

      <div className="space-y-6">
        {(['coffee', 'food', 'ambience'] as const).map((cat) => (
          <div key={cat} className="p-4 bg-orange-50/30 rounded-xl border border-orange-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <label className="text-sm font-bold text-gray-800 uppercase tracking-wider">{cat}</label>
              <StarRating 
                value={ratings[cat]} 
                onChange={(val) => setRatings(prev => ({ ...prev, [cat]: val }))}
                size="lg"
              />
            </div>
            <textarea
              placeholder={`Add a note about the ${cat}...`}
              value={notes[cat]}
              onChange={(e) => setNotes(prev => ({ ...prev, [cat]: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-100 outline-none h-20 resize-none text-sm"
            />
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4 bg-orange-100/50 p-4 rounded-xl">
          <span className="text-lg font-bold text-gray-800 brand-font italic">Total Morning Score</span>
          <span className="text-3xl font-black text-orange-600">
            {ratings.coffee + ratings.food + ratings.ambience}<span className="text-sm text-gray-500 font-medium ml-1">/15</span>
          </span>
        </div>
        <button
          type="submit"
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-100 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          Publish Rating
        </button>
      </div>
    </form>
  );
};

export default RatingForm;

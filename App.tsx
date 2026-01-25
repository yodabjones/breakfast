
import React, { useState, useEffect, useMemo } from 'react';
import { RatingEntry, SortOption } from './types';
import { loadRatings, saveRatings } from './services/storage';
import RatingForm from './components/RatingForm';
import StarRating from './components/StarRating';
import { getAIBreakfastSummary } from './services/geminiService';

const App: React.FC = () => {
  const [ratings, setRatings] = useState<RatingEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date-new');
  const [activeRestaurantSummary, setActiveRestaurantSummary] = useState<{name: string, summary: string} | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  
  // New States for Cloud Sync
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const fetchCloudData = async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const cloudData = await loadRatings();
      setRatings(cloudData);
    } catch (err) {
      setSyncError('Failed to sync with cloud. Displaying local cache.');
    } finally {
      setIsSyncing(false);
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchCloudData();
  }, []);

  const handleAddRating = async (newEntry: Omit<RatingEntry, 'id' | 'totalScore' | 'createdAt'>) => {
    setIsSyncing(true);
    const entry: RatingEntry = {
      ...newEntry,
      id: crypto.randomUUID(),
      totalScore: newEntry.ratings.coffee + newEntry.ratings.food + newEntry.ratings.ambience,
      createdAt: Date.now()
    };
    
    const updatedRatings = [entry, ...ratings];
    setRatings(updatedRatings);

    try {
      await saveRatings(updatedRatings);
    } catch (err) {
      setSyncError('Failed to upload to cloud. Your changes are local for now.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteRating = async (id: string) => {
    if (confirm('Are you sure you want to delete this rating?')) {
      setIsSyncing(true);
      const updatedRatings = ratings.filter(r => r.id !== id);
      setRatings(updatedRatings);
      
      try {
        await saveRatings(updatedRatings);
      } catch (err) {
        setSyncError('Failed to delete from cloud.');
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const handleGenerateSummary = async (restaurantName: string) => {
    setIsSummaryLoading(true);
    const restaurantEntries = ratings.filter(r => r.restaurantName.toLowerCase() === restaurantName.toLowerCase());
    const summary = await getAIBreakfastSummary(restaurantName, restaurantEntries);
    setActiveRestaurantSummary({ name: restaurantName, summary });
    setIsSummaryLoading(false);
  };

  const filteredAndSortedRatings = useMemo(() => {
    let result = ratings.filter(r => 
      r.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-new': return b.createdAt - a.createdAt;
        case 'date-old': return a.createdAt - b.createdAt;
        case 'score-high': return b.totalScore - a.totalScore;
        case 'score-low': return a.totalScore - b.totalScore;
        case 'name-asc': return a.restaurantName.localeCompare(b.restaurantName);
        default: return 0;
      }
    });

    return result;
  }, [ratings, searchTerm, sortBy]);

  const uniqueRestaurants: string[] = Array.from(new Set(ratings.map(r => r.restaurantName)));

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-[#fcfaf7] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 bg-orange-500 rounded-3xl flex items-center justify-center text-white shadow-2xl animate-bounce mb-6">
          <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>
        </div>
        <h2 className="text-2xl font-black text-gray-900 brand-font mb-2">Syncing Morning Stories...</h2>
        <p className="text-gray-500 font-medium">Fetching the world's breakfast consensus.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white border-b border-orange-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-100">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>
            </div>
            <h1 className="text-2xl font-black text-gray-900 brand-font tracking-tight">Morning<span className="text-orange-600">Glory</span></h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`}></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {isSyncing ? 'Syncing with Cloud' : 'Cloud Connected'}
                </span>
              </div>
              <div className="text-xs font-medium text-gray-500">
                <span className="text-orange-600 font-bold">{ratings.length}</span> Global Ratings
              </div>
            </div>
            <button 
              onClick={fetchCloudData}
              disabled={isSyncing}
              className="p-2 hover:bg-orange-50 rounded-xl transition-colors text-gray-400 hover:text-orange-600"
              title="Refresh from cloud"
            >
              <svg className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
          </div>
        </div>
        {syncError && (
          <div className="bg-red-50 text-red-600 text-[10px] font-bold py-1 text-center border-b border-red-100 uppercase tracking-widest">
            {syncError}
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form & Stats */}
        <div className="lg:col-span-4 space-y-8">
          <section>
            <RatingForm onAdd={handleAddRating} />
          </section>

          {uniqueRestaurants.length > 0 && (
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4 brand-font">Popular Spots</h3>
              <div className="flex flex-wrap gap-2">
                {uniqueRestaurants.slice(0, 8).map(name => (
                  <button
                    key={name}
                    onClick={() => handleGenerateSummary(name)}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-orange-50 text-gray-600 hover:text-orange-700 rounded-lg text-sm border border-gray-100 transition-colors flex items-center gap-2 group"
                  >
                    {name}
                    <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </button>
                ))}
              </div>
            </section>
          )}

          {activeRestaurantSummary && (
            <section className="bg-orange-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3.005 3.005 0 013.75-2.906z"></path></svg>
              </div>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold flex items-center gap-2">
                  <span className="p-1 bg-white/20 rounded">AI Insights</span>
                  {activeRestaurantSummary.name}
                </h4>
                <button onClick={() => setActiveRestaurantSummary(null)} className="hover:bg-white/10 rounded-full p-1 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <p className="text-sm leading-relaxed opacity-95 italic">
                "{activeRestaurantSummary.summary}"
              </p>
            </section>
          )}

          {isSummaryLoading && (
            <div className="flex items-center justify-center p-8 bg-white rounded-2xl border border-dashed border-orange-200">
               <div className="flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium text-orange-600 italic">Asking the morning spirits for insights...</span>
               </div>
            </div>
          )}
        </div>

        {/* Right Column: List & Filters */}
        <div className="lg:col-span-8 space-y-6">
          {/* Controls */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                placeholder="Search global ratings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-100 outline-none transition-all"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-100 outline-none font-medium text-gray-700"
            >
              <option value="date-new">Newest First</option>
              <option value="date-old">Oldest First</option>
              <option value="score-high">Highest Score</option>
              <option value="score-low">Lowest Score</option>
              <option value="name-asc">Restaurant (A-Z)</option>
            </select>
          </div>

          {/* List */}
          <div className="space-y-4">
            {filteredAndSortedRatings.length > 0 ? (
              filteredAndSortedRatings.map((entry) => (
                <div key={entry.id} className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-orange-200 transition-all p-6 relative">
                  <button 
                    onClick={() => handleDeleteRating(entry.id)}
                    className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>

                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="text-xl font-bold text-gray-900 brand-font">{entry.restaurantName}</h4>
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-black rounded uppercase tracking-tighter">Verified Plate</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400 font-medium">
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          {entry.username}
                        </span>
                        <span className="flex items-center gap-1">
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                           {entry.date} at {entry.time}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Morning Score</div>
                        <div className="text-2xl font-black text-gray-800 leading-none">{entry.totalScore}<span className="text-xs text-gray-400 font-medium ml-0.5">/15</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-6 border-t border-gray-50">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Coffee</span>
                        <StarRating value={entry.ratings.coffee} readonly size="sm" />
                      </div>
                      <p className="text-sm text-gray-600 italic line-clamp-2">{entry.notes.coffee || "No coffee notes..."}</p>
                    </div>
                    <div className="space-y-2 border-y md:border-y-0 md:border-x border-gray-50 md:px-6 py-4 md:py-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Food</span>
                        <StarRating value={entry.ratings.food} readonly size="sm" />
                      </div>
                      <p className="text-sm text-gray-600 italic line-clamp-2">{entry.notes.food || "No food notes..."}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Ambience</span>
                        <StarRating value={entry.ratings.ambience} readonly size="sm" />
                      </div>
                      <p className="text-sm text-gray-600 italic line-clamp-2">{entry.notes.ambience || "No ambience notes..."}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 brand-font">No morning stories found</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">Be the first to share a shared global rating!</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="mt-20 py-10 text-center border-t border-gray-100">
        <p className="text-sm text-gray-400 font-medium">© 2024 MorningGlory Shared Labs. Data powered by KVDB.</p>
        <div className="mt-2 flex justify-center gap-4">
          <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">A shared breakfast world</span>
        </div>
      </footer>
    </div>
  );
};

export default App;

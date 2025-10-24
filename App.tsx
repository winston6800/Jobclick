
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BriefcaseIcon, ResetIcon, HistoryIcon } from './components/Icons';

interface TrackerData {
  count: number;
  date: string; // YYYY-MM-DD
}

/**
 * Custom hook to get the current date string (YYYY-MM-DD) and update it
 * automatically when the day changes.
 */
const useDate = () => {
  const getTodayDateString = () => new Date().toLocaleDateString('en-CA');
  const [todayDate, setTodayDate] = useState(getTodayDateString());

  useEffect(() => {
    // Check the date every second to see if it has changed.
    const interval = setInterval(() => {
      const newDate = getTodayDateString();
      if (newDate !== todayDate) {
        setTodayDate(newDate);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [todayDate]);

  return todayDate;
};


const App: React.FC = () => {
  const [history, setHistory] = useState<TrackerData[]>([]);
  const [isClient, setIsClient] = useState<boolean>(false);
  const todayDate = useDate();

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Load data from localStorage on initial mount
  useEffect(() => {
    if (!isClient) return;
    try {
      const storedData = localStorage.getItem('jobApplicationHistory');
      const loadedHistory: TrackerData[] = storedData ? JSON.parse(storedData) : [];
      setHistory(loadedHistory);
    } catch (error) {
      console.error("Failed to parse history data from localStorage", error);
      setHistory([]);
    }
  }, [isClient]);

  // Effect to ensure today's entry exists. Runs on mount and when date changes.
  useEffect(() => {
    if(!isClient) return;

    setHistory(currentHistory => {
      const hasTodayEntry = currentHistory.some(entry => entry.date === todayDate);
      if (!hasTodayEntry) {
        // Automatically add today's entry at the top if it's a new day.
        return [{ date: todayDate, count: 0 }, ...currentHistory];
      }
      return currentHistory;
    });
  }, [todayDate, isClient]);

  // Save data to localStorage whenever history changes
  useEffect(() => {
    if (!isClient || history.length === 0) return;
    localStorage.setItem('jobApplicationHistory', JSON.stringify(history));
  }, [history, isClient]);
  
  const todayCount = useMemo(() => {
      return history.find(entry => entry.date === todayDate)?.count ?? 0;
  }, [history, todayDate]);

  const incrementCount = useCallback(() => {
    setHistory(currentHistory => {
        return currentHistory.map(entry => 
            entry.date === todayDate 
            ? { ...entry, count: entry.count + 1 } 
            : entry
        );
    });
  }, [todayDate]);

  const resetCount = useCallback(() => {
    if (window.confirm('Are you sure you want to reset your count for today?')) {
      setHistory(currentHistory => {
        return currentHistory.map(entry => 
            entry.date === todayDate 
            ? { ...entry, count: 0 } 
            : entry
        );
      });
    }
  }, [todayDate]);

  const summaryStats = useMemo(() => {
    if (history.length === 0) {
      return { total: 0, last7DaysTotal: 0, bestDay: { count: 0 } };
    }
    const total = history.reduce((sum, entry) => sum + entry.count, 0);
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // Including today, so 6 days back
    const sevenDaysAgoStr = sevenDaysAgo.toLocaleDateString('en-CA');

    const last7DaysTotal = history
      .filter(entry => entry.date >= sevenDaysAgoStr)
      .reduce((sum, entry) => sum + entry.count, 0);
    
    const bestDay = history.reduce((max, entry) => entry.count > max.count ? entry : max, { count: 0, date: ''});

    return { total, last7DaysTotal, bestDay };
  }, [history]);
  
  const today = new Date();
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = today.toLocaleDateString('en-US', dateOptions);

  const formatHistoryDate = (dateString: string) => {
    const date = new Date(dateString);
    // Add timezone offset to prevent date from being off by one day
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', weekday: 'short' });
  };


  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white flex items-center justify-center p-4 font-mono">
      <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-6 sm:p-8 text-center flex flex-col items-center">
        <div className="absolute top-0 -translate-y-1/2 bg-cyan-500 p-4 rounded-full shadow-lg shadow-cyan-500/30 border-2 border-slate-700">
          <BriefcaseIcon className="h-8 w-8 text-slate-900" />
        </div>

        <div className="mt-8">
            <h1 className="text-3xl font-bold text-slate-100 tracking-wide">Job Application Tracker</h1>
            <p className="text-slate-400 mt-1">{formattedDate}</p>
        </div>

        <div className="my-10 sm:my-12">
            <p className="text-sm text-cyan-400 uppercase tracking-widest">Jobs Applied Today</p>
            <div 
              className="text-8xl sm:text-9xl font-bold text-slate-50 tabular-nums my-2 bg-clip-text text-transparent bg-gradient-to-b from-slate-50 to-slate-300"
              style={{ textShadow: '0 0 15px rgba(255, 255, 255, 0.1)' }}
            >
              {isClient ? todayCount : 0}
            </div>
        </div>

        <button 
          onClick={incrementCount}
          className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-4 px-8 rounded-lg text-2xl transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-100 shadow-lg shadow-cyan-500/20 focus:outline-none focus:ring-4 focus:ring-cyan-500/50"
          aria-label="Increment job application count"
        >
          +1 Applied
        </button>
        
        <button 
          onClick={resetCount}
          className="group mt-6 text-slate-500 hover:text-red-400 transition-colors duration-200 flex items-center gap-2 text-sm"
        >
          <ResetIcon className="h-4 w-4 transition-transform duration-300 group-hover:rotate-[-180deg]" />
          Reset Count
        </button>

        {/* New History Section */}
        <div className="w-full mt-10 pt-6 border-t border-slate-700/50">
          <div className="grid grid-cols-3 gap-4 text-center mb-6">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Total</p>
              <p className="text-2xl font-bold text-slate-200" title={`Total applications: ${summaryStats.total}`}>{summaryStats.total}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Last 7 Days</p>
              <p className="text-2xl font-bold text-slate-200" title={`Applications in last 7 days: ${summaryStats.last7DaysTotal}`}>{summaryStats.last7DaysTotal}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Best Day</p>
              <p className="text-2xl font-bold text-slate-200" title={`Best day: ${summaryStats.bestDay.count} applications`}>{summaryStats.bestDay.count}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-slate-300 mb-3 px-2">
              <HistoryIcon className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Application History</h2>
          </div>
          
          <div className="w-full max-h-48 overflow-y-auto bg-slate-900/50 rounded-lg p-2 border border-slate-700/50" role="log" aria-live="polite">
            {history.filter(entry => entry.count > 0 && entry.date !== todayDate).length > 0 ? (
              <ul className="space-y-2">
                {history
                  .filter(entry => entry.count > 0 && entry.date !== todayDate) // Exclude today and days with 0 applications
                  .map(entry => (
                    <li key={entry.date} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-md text-sm">
                      <span className="text-slate-400">{formatHistoryDate(entry.date)}</span>
                      <span className="font-bold text-cyan-400 text-base">{entry.count}</span>
                    </li>
                  ))
                }
              </ul>
            ) : (
              <div className="text-center p-4 text-slate-500 text-sm">
                Your past activity will appear here.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default App;

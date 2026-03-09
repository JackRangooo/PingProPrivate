import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Star, Trophy, Activity, Medal } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../App';
import { Link } from 'react-router-dom';

type SortOption = 'stars' | 'points' | 'winrate';

export default function Leaderboard() {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('stars');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, 'users'));
      const usersData = snapshot.docs.map(doc => {
        const data = doc.data();
        const totalGames = (data.casualWins || 0) + (data.casualLosses || 0);
        const winRate = totalGames > 0 ? Math.round(((data.casualWins || 0) / totalGames) * 100) : 0;
        return { ...data, winRate, totalGames };
      });
      setUsers(usersData);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const sortedUsers = [...users].sort((a, b) => {
    if (sortBy === 'stars') {
      if (b.casualStars === a.casualStars) return b.winRate - a.winRate;
      return (b.casualStars || 0) - (a.casualStars || 0);
    }
    if (sortBy === 'points') {
      if (b.rankedPoints === a.rankedPoints) return b.winRate - a.winRate;
      return (b.rankedPoints || 0) - (a.rankedPoints || 0);
    }
    if (sortBy === 'winrate') {
      if (b.winRate === a.winRate) return b.totalGames - a.totalGames;
      return (b.winRate || 0) - (a.winRate || 0);
    }
    return 0;
  });

  const getRankColor = (index: number) => {
    if (index === 0) return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    if (index === 1) return 'text-zinc-300 bg-zinc-300/10 border-zinc-300/20';
    if (index === 2) return 'text-amber-600 bg-amber-600/10 border-amber-600/20';
    return 'text-zinc-500 bg-zinc-900/50 border-white/5';
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Medal className="w-6 h-6 text-yellow-400" />;
    if (index === 1) return <Medal className="w-6 h-6 text-zinc-300" />;
    if (index === 2) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="text-lg font-bold w-6 text-center">{index + 1}</span>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
          <Award className="w-8 h-8 text-emerald-500" /> Global Rankings
        </h1>
        <p className="text-zinc-400 font-medium">See how you stack up against the rest of the club.</p>
      </header>

      {/* Sort Controls */}
      <div className="flex p-1 bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-2xl">
        <button
          onClick={() => setSortBy('stars')}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all',
            sortBy === 'stars' ? 'bg-emerald-500 text-zinc-950 shadow-lg' : 'text-zinc-400 hover:text-white'
          )}
        >
          <Star className={clsx("w-4 h-4", sortBy === 'stars' ? "fill-zinc-950" : "")} />
          Stars
        </button>
        <button
          onClick={() => setSortBy('points')}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all',
            sortBy === 'points' ? 'bg-amber-500 text-zinc-950 shadow-lg' : 'text-zinc-400 hover:text-white'
          )}
        >
          <Trophy className="w-4 h-4" />
          Points
        </button>
        <button
          onClick={() => setSortBy('winrate')}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all',
            sortBy === 'winrate' ? 'bg-blue-500 text-zinc-950 shadow-lg' : 'text-zinc-400 hover:text-white'
          )}
        >
          <Activity className="w-4 h-4" />
          Win Rate
        </button>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-zinc-500 font-medium">Loading rankings...</div>
        ) : (
          <AnimatePresence mode="popLayout">
            {sortedUsers.map((user, index) => {
              const isMe = user.uid === userProfile?.uid;
              
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, type: "spring", bounce: 0.3 }}
                  key={user.uid}
                  className={clsx(
                    "flex items-center justify-between p-4 rounded-2xl border transition-all",
                    isMe ? "bg-emerald-500/10 border-emerald-500/30 ring-1 ring-emerald-500/50" : getRankColor(index)
                  )}
                >
                  <Link to={`/player/${user.uid}`} className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-8">
                      {getRankIcon(index)}
                    </div>
                    <img 
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`} 
                      alt={user.displayName} 
                      className="w-12 h-12 rounded-full border-2 border-zinc-800"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="font-bold text-white text-lg flex items-center gap-2">
                        {user.displayName}
                        {isMe && <span className="text-[10px] bg-emerald-500 text-zinc-950 px-2 py-0.5 rounded-full uppercase tracking-wider">You</span>}
                      </div>
                      <div className="text-xs text-zinc-400 font-medium">
                        {user.totalGames} Matches Played
                      </div>
                    </div>
                  </Link>

                  <div className="text-right">
                    {sortBy === 'stars' && (
                      <div className="flex items-center gap-1.5 text-xl font-black text-emerald-400">
                        {user.casualStars} <Star className="w-5 h-5 fill-current" />
                      </div>
                    )}
                    {sortBy === 'points' && (
                      <div className="flex items-center gap-1.5 text-xl font-black text-amber-400">
                        {user.rankedPoints} <Trophy className="w-5 h-5" />
                      </div>
                    )}
                    {sortBy === 'winrate' && (
                      <div className="flex items-center gap-1.5 text-xl font-black text-blue-400">
                        {user.winRate}% <Activity className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}

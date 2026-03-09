import { useEffect, useState } from 'react';
import { useAuth, Match } from '../App';
import { collection, query, where, onSnapshot, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Swords, Star, ArrowRight, Activity, Search, User, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

export default function Dashboard() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!userProfile) return;

    const matchesRef = collection(db, 'matches');
    const q = query(
      matchesRef,
      where('status', 'in', ['completed', 'ongoing', 'accepted']),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const matchesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
      const userMatches = matchesData.filter(m => m.player1Id === userProfile.uid || m.player2Id === userProfile.uid);
      setRecentMatches(userMatches);
    });

    return () => unsubscribe();
  }, [userProfile]);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const usersRef = collection(db, 'users');
        // Simple prefix search (case-sensitive in Firestore, but we'll do our best)
        const q = query(
          usersRef,
          where('displayName', '>=', searchQuery),
          where('displayName', '<=', searchQuery + '\uf8ff'),
          limit(5)
        );
        
        const snapshot = await getDocs(q);
        const results = snapshot.docs
          .map(doc => ({ uid: doc.id, ...doc.data() }))
          .filter(u => u.uid !== userProfile?.uid);
        setSearchResults(results);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, userProfile]);

  if (!userProfile) return null;

  const winRate = userProfile.casualWins + userProfile.casualLosses > 0
    ? Math.round((userProfile.casualWins / (userProfile.casualWins + userProfile.casualLosses)) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
            Welcome back, {userProfile.displayName.split(' ')[0]}
          </h1>
          <p className="text-zinc-400 font-medium">Ready for your next match?</p>
        </div>
        <Link to="/profile" className="w-12 h-12 rounded-full overflow-hidden border-2 border-zinc-800">
          <img src={userProfile.photoURL || `https://ui-avatars.com/api/?name=${userProfile.displayName}&background=random`} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </Link>
      </header>

      {/* Search Bar */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input 
            type="text"
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <AnimatePresence>
          {searchQuery.length >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              {isSearching ? (
                <div className="p-4 text-center text-zinc-500 text-sm font-medium">Searching...</div>
              ) : searchResults.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {searchResults.map((result) => (
                    <button
                      key={result.uid}
                      onClick={() => {
                        navigate(`/player/${result.uid}`);
                        setSearchQuery('');
                      }}
                      className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left"
                    >
                      <img 
                        src={result.photoURL || `https://ui-avatars.com/api/?name=${result.displayName}&background=random`} 
                        alt={result.displayName} 
                        className="w-10 h-10 rounded-full border border-zinc-800"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="font-bold text-white">{result.displayName}</div>
                        <div className="text-xs text-zinc-500">{result.selectedTitle || 'Novice Player'}</div>
                      </div>
                      <User className="w-4 h-4 text-zinc-600 ml-auto" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-zinc-500 text-sm font-medium">No players found</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Star className="w-16 h-16 text-emerald-500" />
          </div>
          <div className="flex items-center gap-2 text-emerald-400 mb-4">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-xs font-bold uppercase tracking-wider">Casual Rank</span>
          </div>
          <div>
            <div className="text-4xl font-bold text-white mb-1">{userProfile.casualStars}</div>
            <div className="text-sm text-zinc-500 font-medium">Stars Earned</div>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Activity className="w-16 h-16 text-blue-500" />
          </div>
          <div className="flex items-center gap-2 text-blue-400 mb-4">
            <Activity className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Win Rate</span>
          </div>
          <div>
            <div className="text-4xl font-bold text-white mb-1">{winRate}%</div>
            <div className="text-sm text-zinc-500 font-medium">{userProfile.casualWins}W - {userProfile.casualLosses}L</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Link to="/play" state={{ tab: 'casual' }} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-2xl p-4 flex items-center justify-center gap-2 font-bold transition-colors">
          <Swords className="w-5 h-5" />
          Challenge Player
        </Link>
        <Link to="/play" state={{ tab: 'ranked' }} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl p-4 flex items-center justify-center gap-2 font-bold transition-colors">
          <Trophy className="w-5 h-5" />
          Ranked Match
        </Link>
      </div>

      {/* Recent Matches */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Recent Matches</h2>
          <Link to="/profile" className="text-sm text-emerald-400 font-medium flex items-center gap-1 hover:text-emerald-300">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentMatches.length === 0 ? (
          <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-8 text-center">
            <p className="text-zinc-500 font-medium">No recent matches found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentMatches.map(match => {
              const isPlayer1 = match.player1Id === userProfile.uid;
              const opponentName = isPlayer1 ? match.player2Name : match.player1Name;
              const opponentPhoto = isPlayer1 ? match.player2Photo : match.player1Photo;
              const myScore = isPlayer1 ? match.player1Score : match.player2Score;
              const opponentScore = isPlayer1 ? match.player2Score : match.player1Score;
              const isWinner = match.winnerId === userProfile.uid;
              const isCompleted = match.status === 'completed';

              return (
                <Link
                  key={match.id}
                  to={`/match/${match.id}`}
                  className="block bg-zinc-900/50 border border-white/5 rounded-2xl p-4 hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={opponentPhoto || `https://ui-avatars.com/api/?name=${opponentName}&background=random`} alt={opponentName} className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                      <div>
                        <div className="font-bold text-white">{opponentName}</div>
                        <div className="text-xs text-zinc-500 font-medium">
                          {match.type === 'casual' ? 'Casual Match' : 'Ranked Match'} • {formatDistanceToNow(match.createdAt?.toDate() || new Date(), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    
                    {isCompleted ? (
                      <div className="text-right">
                        <div className={`font-bold text-lg ${isWinner ? 'text-emerald-400' : 'text-red-400'}`}>
                          {myScore} - {opponentScore}
                        </div>
                        <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                          {isWinner ? 'Victory' : 'Defeat'}
                        </div>
                      </div>
                    ) : (
                      <div className="text-right">
                        <div className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                          {match.status}
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Star, Activity, X, Medal, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import { UserProfile, Trophy as TrophyType } from '../App';

export default function PlayerProfile() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTrophy, setSelectedTrophy] = useState<TrophyType | null>(null);

  useEffect(() => {
    if (!uid) return;
    const fetchPlayer = async () => {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPlayer(docSnap.data() as UserProfile);
      }
      setLoading(false);
    };
    fetchPlayer();
  }, [uid]);

  if (loading) return <div className="text-center py-12 text-zinc-500 font-medium">Loading player profile...</div>;
  if (!player) return <div className="text-center py-12 text-zinc-500 font-medium">Player not found.</div>;

  const casualWinRate = player.casualWins + player.casualLosses > 0
    ? Math.round((player.casualWins / (player.casualWins + player.casualLosses)) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-12"
    >
      <header className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-zinc-900/50 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-white">Player Profile</h1>
      </header>

      <div className="flex items-center gap-4">
        <div className="relative">
          <img 
            src={player.photoURL || `https://ui-avatars.com/api/?name=${player.displayName}&background=random`} 
            alt={player.displayName} 
            className="w-20 h-20 rounded-full border-4 border-zinc-900 shadow-xl" 
            referrerPolicy="no-referrer" 
          />
          <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-zinc-950 p-1 rounded-full border-2 border-zinc-950">
            <Star className="w-4 h-4 fill-current" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">{player.displayName}</h2>
          <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-widest">
            {player.selectedTitle || 'Novice Player'}
          </div>
        </div>
      </div>

      {/* Display Stand (Cabinet) */}
      <section className="relative">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" /> Trophy Showcase
        </h2>

        <div className="bg-zinc-900/80 border-x-8 border-t-8 border-zinc-800 rounded-t-3xl p-6 shadow-2xl relative">
          <div className="grid grid-cols-3 gap-4 relative z-10">
            {(player.showcase || []).map((slot) => {
              const trophy = player.inventory?.trophies?.find(t => t.id === slot.trophyId);
              return (
                <div 
                  key={slot.slotId}
                  onClick={() => trophy && setSelectedTrophy(trophy)}
                  className={clsx(
                    "aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all",
                    trophy 
                      ? "bg-zinc-950/50 border-amber-500/30 cursor-pointer hover:border-amber-500/60" 
                      : "bg-zinc-950/20 border-white/5"
                  )}
                >
                  {trophy ? (
                    <div className="flex flex-col items-center">
                      <Trophy className={clsx(
                        "w-10 h-10 mb-1 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]",
                        trophy.rank === 1 ? "text-yellow-400" : trophy.rank === 2 ? "text-zinc-300" : "text-amber-600"
                      )} />
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter text-center px-1 truncate w-full">
                        {trophy.name}
                      </span>
                    </div>
                  ) : (
                    <Trophy className="w-8 h-8 opacity-5 text-zinc-700" />
                  )}
                </div>
              );
            })}
          </div>
          <div className="h-4 bg-zinc-800 rounded-full mt-4 shadow-inner" />
        </div>
        <div className="h-6 bg-zinc-900 rounded-b-3xl border-x-8 border-b-8 border-zinc-800 shadow-xl" />
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-5">
          <div className="flex items-center gap-2 text-emerald-400 mb-4">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-xs font-bold uppercase tracking-wider">Casual Stats</span>
          </div>
          <div className="text-3xl font-black text-white">{player.casualStars} <span className="text-sm font-medium text-zinc-500">Stars</span></div>
          <div className="text-xs text-zinc-500 font-medium mt-1">{player.casualWins}W - {player.casualLosses}L ({casualWinRate}%)</div>
        </div>
        
        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-5">
          <div className="flex items-center gap-2 text-amber-400 mb-4">
            <Trophy className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Ranked Stats</span>
          </div>
          <div className="text-3xl font-black text-white">{player.rankedPoints} <span className="text-sm font-medium text-zinc-500">Points</span></div>
          <div className="text-xs text-zinc-500 font-medium mt-1">Avg Rank: #{player.averageRank || '-'}</div>
        </div>
      </div>

      {/* Trophy Detail Modal */}
      <AnimatePresence>
        {selectedTrophy && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTrophy(null)}
              className="fixed inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-zinc-900 border border-white/10 rounded-[40px] p-10 max-w-sm w-full text-center shadow-[0_0_100px_rgba(245,158,11,0.2)]"
            >
              <Trophy className={clsx(
                "w-32 h-32 mx-auto mb-8 drop-shadow-[0_0_30px_rgba(245,158,11,0.5)]",
                selectedTrophy.rank === 1 ? "text-yellow-400" : selectedTrophy.rank === 2 ? "text-zinc-300" : "text-amber-600"
              )} />
              <h2 className="text-3xl font-black text-white mb-2">{selectedTrophy.name}</h2>
              <p className="text-emerald-400 font-bold uppercase tracking-widest text-sm mb-8">{selectedTrophy.tournamentName}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-zinc-950 p-4 rounded-2xl">
                  <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Rank</div>
                  <div className="text-xl font-black text-white">#{selectedTrophy.rank}</div>
                </div>
                <div className="bg-zinc-950 p-4 rounded-2xl">
                  <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Date</div>
                  <div className="text-sm font-black text-white">{selectedTrophy.date}</div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedTrophy(null)}
                className="w-full bg-white text-zinc-950 py-4 rounded-2xl font-bold text-lg hover:bg-zinc-200 transition-all"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

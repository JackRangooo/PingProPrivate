import { useState, useEffect } from 'react';
import { useAuth, Trophy as TrophyType } from '../App';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  LogOut, 
  Star, 
  Trophy, 
  Activity, 
  Calendar, 
  Medal, 
  X, 
  Moon, 
  Sun, 
  Package,
  ChevronRight,
  Info
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

export default function Profile() {
  const { userProfile, logOut, theme, toggleTheme } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [selectedTrophy, setSelectedTrophy] = useState<TrophyType | null>(null);
  const [inventoryTab, setInventoryTab] = useState<'trophies' | 'titles'>('trophies');

  if (!userProfile) return null;

  const handleSelectTitle = async (title: string) => {
    const userRef = doc(db, 'users', userProfile.uid);
    await updateDoc(userRef, { selectedTitle: title });
  };

  const handlePlaceTrophy = async (slotId: number, trophyId: string | null) => {
    const newShowcase = (userProfile.showcase || []).map(slot => 
      slot.slotId === slotId ? { ...slot, trophyId } : slot
    );
    const userRef = doc(db, 'users', userProfile.uid);
    await updateDoc(userRef, { showcase: newShowcase });
  };

  const casualWinRate = userProfile.casualWins + userProfile.casualLosses > 0
    ? Math.round((userProfile.casualWins / (userProfile.casualWins + userProfile.casualLosses)) * 100)
    : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img 
              src={userProfile.photoURL || `https://ui-avatars.com/api/?name=${userProfile.displayName}&background=random`} 
              alt={userProfile.displayName} 
              className="w-20 h-20 rounded-full border-4 border-zinc-900 shadow-xl" 
              referrerPolicy="no-referrer" 
            />
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-zinc-950 p-1 rounded-full border-2 border-zinc-950">
              <Star className="w-4 h-4 fill-current" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{userProfile.displayName}</h1>
            <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-widest">
              {userProfile.selectedTitle || 'Novice Player'}
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-12 h-12 rounded-2xl bg-zinc-900/50 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-all active:scale-95"
        >
          <Settings className="w-6 h-6" />
        </button>
      </header>

      {/* Display Stand (Cabinet) */}
      <section className="relative">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" /> Trophy Showcase
          </h2>
          <button 
            onClick={() => setIsInventoryOpen(true)}
            className="text-sm text-emerald-400 font-bold flex items-center gap-1 hover:text-emerald-300"
          >
            <Package className="w-4 h-4" /> Backpack
          </button>
        </div>

        {/* The Cabinet UI */}
        <div className="bg-zinc-900/80 border-x-8 border-t-8 border-zinc-800 rounded-t-3xl p-6 shadow-2xl relative">
          <div className="grid grid-cols-3 gap-4 relative z-10">
            {(userProfile.showcase || []).map((slot) => {
              const trophy = userProfile.inventory?.trophies?.find(t => t.id === slot.trophyId);
              return (
                <div 
                  key={slot.slotId}
                  onClick={() => trophy ? setSelectedTrophy(trophy) : setIsInventoryOpen(true)}
                  className={clsx(
                    "aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer group",
                    trophy 
                      ? "bg-zinc-950/50 border-amber-500/30 hover:border-amber-500/60" 
                      : "bg-zinc-950/20 border-white/5 hover:bg-zinc-950/40 hover:border-white/10"
                  )}
                >
                  {trophy ? (
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center"
                    >
                      <Trophy className={clsx(
                        "w-10 h-10 mb-1 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]",
                        trophy.rank === 1 ? "text-yellow-400" : trophy.rank === 2 ? "text-zinc-300" : "text-amber-600"
                      )} />
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter text-center px-1 truncate w-full">
                        {trophy.name}
                      </span>
                    </motion.div>
                  ) : (
                    <div className="text-zinc-700 group-hover:text-zinc-500 transition-colors">
                      <Trophy className="w-8 h-8 opacity-20" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {/* Shelf Base */}
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
          <div className="text-3xl font-black text-white">{userProfile.casualStars} <span className="text-sm font-medium text-zinc-500">Stars</span></div>
          <div className="text-xs text-zinc-500 font-medium mt-1">{userProfile.casualWins}W - {userProfile.casualLosses}L ({casualWinRate}%)</div>
        </div>
        
        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-5">
          <div className="flex items-center gap-2 text-amber-400 mb-4">
            <Trophy className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Ranked Stats</span>
          </div>
          <div className="text-3xl font-black text-white">{userProfile.rankedPoints} <span className="text-sm font-medium text-zinc-500">Points</span></div>
          <div className="text-xs text-zinc-500 font-medium mt-1">Avg Rank: #{userProfile.averageRank || '-'}</div>
        </div>
      </div>

      {/* Settings Sidebar */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-80 bg-zinc-950 border-l border-white/10 z-[70] p-8 flex flex-col"
            >
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-2xl font-bold text-white">Settings</h2>
                <button onClick={() => setIsSettingsOpen(false)} className="text-zinc-500 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-8 flex-1">
                <section>
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Appearance</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => theme === 'light' && toggleTheme()}
                      className={clsx(
                        "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                        theme === 'dark' ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" : "bg-zinc-900 border-white/5 text-zinc-500"
                      )}
                    >
                      <Moon className="w-6 h-6" />
                      <span className="text-xs font-bold">Dark</span>
                    </button>
                    <button 
                      onClick={() => theme === 'dark' && toggleTheme()}
                      className={clsx(
                        "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                        theme === 'light' ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" : "bg-zinc-900 border-white/5 text-zinc-500"
                      )}
                    >
                      <Sun className="w-6 h-6" />
                      <span className="text-xs font-bold">Light</span>
                    </button>
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Account</h3>
                  <button 
                    onClick={logOut}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 font-bold hover:bg-red-500 hover:text-white transition-all"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                </section>
              </div>

              <div className="text-center text-[10px] text-zinc-600 font-medium">
                PingPong Pro v1.2.0 • Made with ❤️
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Inventory Modal */}
      <AnimatePresence>
        {isInventoryOpen && (
          <div className="fixed inset-0 z-[80] flex items-end justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInventoryOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-lg bg-zinc-900 rounded-t-[40px] p-8 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                    <Package className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Backpack</h2>
                </div>
                <button onClick={() => setIsInventoryOpen(false)} className="text-zinc-500">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex gap-4 mb-8">
                <button 
                  onClick={() => setInventoryTab('trophies')}
                  className={clsx(
                    "flex-1 py-3 rounded-xl font-bold transition-all",
                    inventoryTab === 'trophies' ? "bg-white text-zinc-950" : "bg-zinc-800 text-zinc-500"
                  )}
                >
                  Trophies
                </button>
                <button 
                  onClick={() => setInventoryTab('titles')}
                  className={clsx(
                    "flex-1 py-3 rounded-xl font-bold transition-all",
                    inventoryTab === 'titles' ? "bg-white text-zinc-950" : "bg-zinc-800 text-zinc-500"
                  )}
                >
                  Titles
                </button>
              </div>

              {inventoryTab === 'trophies' ? (
                <div className="grid grid-cols-2 gap-4">
                  {(userProfile.inventory?.trophies || []).map(t => (
                    <div 
                      key={t.id} 
                      className="bg-zinc-950 border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center group relative"
                    >
                      <Trophy className={clsx(
                        "w-12 h-12 mb-3",
                        t.rank === 1 ? "text-yellow-400" : t.rank === 2 ? "text-zinc-300" : "text-amber-600"
                      )} />
                      <div className="font-bold text-white text-sm mb-1">{t.name}</div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-widest">{t.tournamentName}</div>
                      
                      <div className="mt-4 flex gap-2 w-full">
                        <button 
                          onClick={() => setSelectedTrophy(t)}
                          className="flex-1 bg-zinc-800 p-2 rounded-lg text-zinc-400 hover:text-white"
                        >
                          <Info className="w-4 h-4 mx-auto" />
                        </button>
                        <button 
                          onClick={() => {
                            const currentSlot = (userProfile.showcase || []).find(s => s.trophyId === t.id);
                            if (currentSlot) {
                              handlePlaceTrophy(currentSlot.slotId, null);
                            } else {
                              const emptySlot = (userProfile.showcase || []).find(s => !s.trophyId);
                              if (emptySlot) handlePlaceTrophy(emptySlot.slotId, t.id);
                              else alert('Showcase is full! Remove a trophy first.');
                            }
                          }}
                          className={clsx(
                            "flex-1 p-2 rounded-lg font-bold text-[10px] uppercase",
                            (userProfile.showcase || []).some(s => s.trophyId === t.id) ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
                          )}
                        >
                          {(userProfile.showcase || []).some(s => s.trophyId === t.id) ? 'Remove' : 'Display'}
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!userProfile.inventory?.trophies || userProfile.inventory.trophies.length === 0) && (
                    <div className="col-span-2 py-12 text-center text-zinc-600 font-medium">
                      Win tournaments to earn trophies!
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {(userProfile.inventory?.titles || []).map(title => (
                    <button
                      key={title}
                      onClick={() => handleSelectTitle(title)}
                      className={clsx(
                        "w-full p-4 rounded-2xl border flex items-center justify-between transition-all",
                        userProfile.selectedTitle === title 
                          ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" 
                          : "bg-zinc-950 border-white/5 text-zinc-500 hover:border-white/10"
                      )}
                    >
                      <span className="font-bold">{title}</span>
                      {userProfile.selectedTitle === title && <Check className="w-5 h-5" />}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
    </div>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

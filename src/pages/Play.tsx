import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Trophy } from 'lucide-react';
import clsx from 'clsx';
import CasualMatch from './CasualMatch';
import Tournaments from './Tournaments';

export default function Play() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'casual' | 'ranked'>(
    location.state?.tab === 'ranked' ? 'ranked' : 'casual'
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-6">Play</h1>
        
        {/* Custom Tab Switcher */}
        <div className="flex p-1 bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-2xl">
          <button
            onClick={() => setActiveTab('casual')}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all relative',
              activeTab === 'casual' ? 'text-zinc-950' : 'text-zinc-400 hover:text-white'
            )}
          >
            {activeTab === 'casual' && (
              <motion.div layoutId="play-tab-bg" className="absolute inset-0 bg-emerald-500 rounded-xl" />
            )}
            <span className="relative z-10 flex items-center gap-2"><Swords className="w-4 h-4" /> Casual</span>
          </button>
          <button
            onClick={() => setActiveTab('ranked')}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all relative',
              activeTab === 'ranked' ? 'text-zinc-950' : 'text-zinc-400 hover:text-white'
            )}
          >
            {activeTab === 'ranked' && (
              <motion.div layoutId="play-tab-bg" className="absolute inset-0 bg-amber-500 rounded-xl" />
            )}
            <span className="relative z-10 flex items-center gap-2"><Trophy className="w-4 h-4" /> Ranked</span>
          </button>
        </div>
      </header>

      <main className="relative">
        <AnimatePresence mode="wait">
          {activeTab === 'casual' ? (
            <motion.div 
              key="casual" 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 10 }} 
              transition={{ duration: 0.2 }}
            >
              <CasualMatch />
            </motion.div>
          ) : (
            <motion.div 
              key="ranked" 
              initial={{ opacity: 0, x: 10 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -10 }} 
              transition={{ duration: 0.2 }}
            >
              <Tournaments />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </motion.div>
  );
}

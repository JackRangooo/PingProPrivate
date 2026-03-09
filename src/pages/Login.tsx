import { useAuth } from '../App';
import { Navigate } from 'react-router-dom';
import { Swords, LogIn } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const { user, signIn } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,_#064e3b_0%,_transparent_60%)] opacity-30 blur-[100px]" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center max-w-sm w-full"
      >
        <div className="w-24 h-24 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
          <Swords className="w-12 h-12 text-emerald-400" />
        </div>
        
        <h1 className="text-4xl font-bold tracking-tighter text-white mb-3 text-center">
          PingPong Pro
        </h1>
        <p className="text-zinc-400 text-center mb-12 font-medium">
          The private club for serious players. Track matches, climb the ranks.
        </p>

        <button
          onClick={signIn}
          className="w-full flex items-center justify-center gap-3 bg-white text-zinc-950 px-6 py-4 rounded-2xl font-semibold text-lg hover:bg-zinc-200 transition-colors active:scale-[0.98]"
        >
          <LogIn className="w-5 h-5" />
          Sign in with Google
        </button>
      </motion.div>
    </div>
  );
}

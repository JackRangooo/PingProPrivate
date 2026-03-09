import React, { createContext, useContext, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

// Contexts
interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
}

export interface Trophy {
  id: string;
  name: string;
  tournamentName: string;
  rank: number;
  date: string;
}

export interface ShowcaseSlot {
  slotId: number;
  trophyId: string | null;
}

export interface Match {
  id: string;
  player1Id: string;
  player2Id: string;
  player1Name: string;
  player2Name: string;
  player1Photo: string;
  player2Photo: string;
  player1Score: number | null;
  player2Score: number | null;
  player1Confirmed: boolean;
  player2Confirmed: boolean;
  status: 'pending' | 'accepted' | 'ongoing' | 'completed' | 'declined' | 'cancelled';
  type: 'casual' | 'ranked';
  winnerId: string | null;
  createdAt: any;
  updatedAt: any;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  casualStars: number;
  casualWins: number;
  casualLosses: number;
  rankedPoints: number;
  rankedWins: number;
  rankedLosses: number;
  averageRank: number;
  tournamentsPlayed: number;
  inventory: {
    trophies: Trophy[];
    titles: string[];
  };
  showcase: ShowcaseSlot[];
  selectedTitle: string | null;
  theme: 'dark' | 'light';
  createdAt: any;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

// Auth Provider
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const data = userSnap.data() as UserProfile;
          // Ensure legacy profiles have required fields
          const profileWithDefaults: UserProfile = {
            ...data,
            inventory: data.inventory || { trophies: [], titles: ['Novice Player'] },
            showcase: data.showcase || [
              { slotId: 1, trophyId: null },
              { slotId: 2, trophyId: null },
              { slotId: 3, trophyId: null },
            ],
            selectedTitle: data.selectedTitle || 'Novice Player',
            theme: data.theme || 'dark',
          };
          setUserProfile(profileWithDefaults);
          setTheme(profileWithDefaults.theme);
        } else {
          const newProfile: UserProfile = {
            uid: currentUser.uid,
            displayName: currentUser.displayName || 'Player',
            photoURL: currentUser.photoURL || '',
            casualStars: 0,
            casualWins: 0,
            casualLosses: 0,
            rankedPoints: 0,
            rankedWins: 0,
            rankedLosses: 0,
            averageRank: 0,
            tournamentsPlayed: 0,
            inventory: {
              trophies: [],
              titles: ['Novice Player']
            },
            showcase: [
              { slotId: 1, trophyId: null },
              { slotId: 2, trophyId: null },
              { slotId: 3, trophyId: null },
            ],
            selectedTitle: 'Novice Player',
            theme: 'dark',
            createdAt: serverTimestamp(),
          };
          await setDoc(userRef, newProfile);
          setUserProfile(newProfile);
          setTheme('dark');
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleTheme = async () => {
    if (!user) return;
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { theme: newTheme });
  };

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in', error);
      alert('Failed to sign in. Please try again.');
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, theme, toggleTheme, signIn, logOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route
const ProtectedRoute = () => {
  const { user, loading, theme } = useAuth();

  if (loading) {
    return (
      <div className={clsx(
        "min-h-screen flex items-center justify-center transition-colors duration-300",
        theme === 'dark' ? "bg-zinc-950 text-zinc-100" : "bg-zinc-50 text-zinc-900"
      )}>
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

// Layout
import Navigation from './components/Navigation';

const Layout = () => {
  const { theme } = useAuth();
  return (
    <div className={clsx(
      "min-h-screen font-sans pb-20 md:pb-0 md:pl-64 transition-colors duration-300",
      theme === 'dark' ? "bg-zinc-950 text-zinc-100" : "bg-zinc-50 text-zinc-900"
    )}>
      <Navigation />
      <main className="max-w-3xl mx-auto p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
};

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Play from './pages/Play';
import Profile from './pages/Profile';
import MatchDetails from './pages/MatchDetails';
import Leaderboard from './pages/Leaderboard';
import PlayerProfile from './pages/PlayerProfile';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/play" element={<Play />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/player/:uid" element={<PlayerProfile />} />
              <Route path="/match/:id" element={<MatchDetails />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

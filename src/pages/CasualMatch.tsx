import { useState, useEffect } from 'react';
import { useAuth, Match } from '../App';
import { collection, query, getDocs, setDoc, doc, serverTimestamp, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Search, Swords, Clock, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

export default function CasualMatch() {
  const { userProfile, theme } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [pendingMatches, setPendingMatches] = useState<Match[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userProfile) return;

    const fetchUsers = async () => {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('uid', '!=', userProfile.uid));
      const snapshot = await getDocs(q);
      const usersData = snapshot.docs.map(doc => doc.data());
      setUsers(usersData);
    };

    fetchUsers();

    const matchesRef = collection(db, 'matches');
    const qMatches = query(
      matchesRef,
      where('status', 'in', ['pending', 'accepted', 'ongoing']),
      where('type', '==', 'casual')
    );

    const unsubscribe = onSnapshot(qMatches, (snapshot) => {
      const matchesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
      const relevantMatches = matchesData.filter(m => m.player1Id === userProfile.uid || m.player2Id === userProfile.uid);
      setPendingMatches(relevantMatches);
    });

    return () => unsubscribe();
  }, [userProfile]);

  const handleChallenge = async (opponent: any) => {
    if (!userProfile) return;

    const matchId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const matchRef = doc(db, 'matches', matchId);

    const newMatch = {
      id: matchId,
      type: 'casual',
      status: 'pending',
      player1Id: userProfile.uid,
      player1Name: userProfile.displayName,
      player1Photo: userProfile.photoURL,
      player2Id: opponent.uid,
      player2Name: opponent.displayName,
      player2Photo: opponent.photoURL,
      player1Confirmed: false,
      player2Confirmed: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(matchRef, newMatch);
      alert(`Challenge sent to ${opponent.displayName}!`);
    } catch (error) {
      console.error('Error creating match', error);
      alert('Failed to send challenge.');
    }
  };

  const filteredUsers = users.filter(u => u.displayName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8">
      {/* Active/Pending Matches */}
      {pendingMatches.length > 0 && (
        <section>
          <h2 className={clsx("text-lg font-bold mb-4 flex items-center gap-2", theme === 'dark' ? "text-white" : "text-zinc-900")}>
            <Clock className="w-5 h-5 text-amber-500" /> Active Challenges
          </h2>
          <div className="space-y-3">
            {pendingMatches.map(match => {
              const isChallenger = match.player1Id === userProfile?.uid;
              const opponentName = isChallenger ? match.player2Name : match.player1Name;
              
              return (
                <div key={match.id} className={clsx(
                  "border rounded-2xl p-4 flex items-center justify-between transition-colors",
                  theme === 'dark' ? "bg-zinc-900/50 border-white/5" : "bg-white border-zinc-200 shadow-sm"
                )}>
                  <div>
                    <div className={clsx("font-bold", theme === 'dark' ? "text-white" : "text-zinc-900")}>
                      {isChallenger ? `Waiting for ${opponentName}` : `${opponentName} challenged you`}
                    </div>
                    <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider mt-1">{match.status}</div>
                  </div>
                  <button
                    onClick={() => navigate(`/match/${match.id}`)}
                    className={clsx(
                      "px-4 py-2 rounded-xl text-sm font-bold transition-colors",
                      theme === 'dark' ? "bg-zinc-800 hover:bg-zinc-700 text-white" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900"
                    )}
                  >
                    View
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Find Players */}
      <section>
        <h2 className={clsx("text-lg font-bold mb-4 flex items-center gap-2", theme === 'dark' ? "text-white" : "text-zinc-900")}>
          <Search className="w-5 h-5 text-emerald-500" /> Find Opponents
        </h2>
        
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search players by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={clsx(
              "w-full border rounded-2xl py-4 pl-12 pr-4 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50",
              theme === 'dark' ? "bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600" : "bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 shadow-sm"
            )}
          />
        </div>

        <div className="space-y-3">
          {filteredUsers.map(user => (
            <div key={user.uid} className={clsx(
              "border rounded-2xl p-4 flex items-center justify-between transition-colors",
              theme === 'dark' ? "bg-zinc-900/30 border-white/5 hover:bg-zinc-800/30" : "bg-white border-zinc-200 hover:bg-zinc-50 shadow-sm"
            )}>
              <div className="flex items-center gap-4">
                <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`} alt={user.displayName} className="w-12 h-12 rounded-full" referrerPolicy="no-referrer" />
                <div>
                  <div className={clsx("font-bold text-lg", theme === 'dark' ? "text-white" : "text-zinc-900")}>{user.displayName}</div>
                  <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium">
                    <Star className="w-4 h-4 text-emerald-500 fill-current" />
                    {user.casualStars} Stars
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleChallenge(user)}
                className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center hover:bg-emerald-500 hover:text-zinc-950 transition-colors"
              >
                <Swords className="w-5 h-5" />
              </button>
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-zinc-500 font-medium">
              No players found.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

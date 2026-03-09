import { useState, useEffect } from 'react';
import { useAuth, Trophy as TrophyType } from '../App';
import { collection, query, getDocs, orderBy, limit, doc, updateDoc, arrayUnion, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { Calendar, Users, ChevronRight, Medal, Trophy as TrophyIcon } from 'lucide-react';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export default function Tournaments() {
  const { userProfile } = useAuth();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournaments = async () => {
      const tRef = collection(db, 'tournaments');
      const q = query(tRef, orderBy('createdAt', 'desc'), limit(10));
      const snapshot = await getDocs(q);
      const tData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTournaments(tData);
      setLoading(false);
    };

    fetchTournaments();
  }, []);

  const handleRegister = async (tournamentId: string) => {
    if (!userProfile) return;
    
    try {
      const tRef = doc(db, 'tournaments', tournamentId);
      await updateDoc(tRef, {
        participants: arrayUnion(userProfile.uid)
      });
      alert('Successfully registered for the tournament!');
      setTournaments(prev => prev.map(t => t.id === tournamentId ? { ...t, participants: [...t.participants, userProfile.uid] } : t));
    } catch (error) {
      console.error('Error registering', error);
      alert('Failed to register.');
    }
  };

  const handleEndTournament = async (tournament: any) => {
    if (!window.confirm('Are you sure you want to end this tournament and award prizes? (Admin Only Simulation)')) return;

    try {
      const participants = tournament.participants || [];
      if (participants.length === 0) return;

      // Simulate winners (in real app, this would be based on bracket results)
      const shuffled = [...participants].sort(() => 0.5 - Math.random());
      const winners = shuffled.slice(0, 3);
      
      const batch = writeBatch(db);

      // Award Trophies to Top 3
      for (let i = 0; i < winners.length; i++) {
        const userId = winners[i];
        const rank = i + 1;
        const trophy: TrophyType = {
          id: uuidv4(),
          name: rank === 1 ? 'Gold Cup' : rank === 2 ? 'Silver Cup' : 'Bronze Cup',
          tournamentName: tournament.name || 'Weekly Championship',
          rank: rank as 1 | 2 | 3,
          date: format(new Date(), 'yyyy-MM-dd')
        };

        const userRef = doc(db, 'users', userId);
        batch.update(userRef, {
          'inventory.trophies': arrayUnion(trophy)
        });
      }

      // Award "Tournament Participant" title to all
      for (const userId of participants) {
        const userRef = doc(db, 'users', userId);
        batch.update(userRef, {
          'inventory.titles': arrayUnion('Tournament Participant')
        });
      }

      // Update tournament status
      const tRef = doc(db, 'tournaments', tournament.id);
      batch.update(tRef, { status: 'completed', winnerId: winners[0] });

      await batch.commit();
      alert('Tournament ended! Trophies and titles have been awarded.');
      setTournaments(prev => prev.map(t => t.id === tournament.id ? { ...t, status: 'completed' } : t));
    } catch (error) {
      console.error('Error ending tournament', error);
      alert('Failed to end tournament.');
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-zinc-500 font-medium">Loading tournaments...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Current/Upcoming Tournament */}
      <section>
        <h2 className="text-lg font-bold text-white mb-4">This Week</h2>
        
        {tournaments.length > 0 ? (
          <div className="bg-gradient-to-br from-amber-500/20 to-zinc-900/50 border border-amber-500/30 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Medal className="w-32 h-32 text-amber-500" />
            </div>
            
            <div className="relative z-10">
              <div className="inline-block bg-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
                {tournaments[0].status}
              </div>
              
              <h3 className="text-2xl font-black text-white mb-2">{tournaments[0].name || 'Weekly Championship'}</h3>
              <div className="flex items-center gap-4 text-sm text-zinc-400 font-medium mb-6">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(tournaments[0].startDate.toDate(), 'MMM d')} - {format(tournaments[0].endDate.toDate(), 'MMM d')}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {tournaments[0].participants?.length || 0} Registered
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {tournaments[0].status === 'registration' && (
                  <button
                    onClick={() => handleRegister(tournaments[0].id)}
                    disabled={tournaments[0].participants?.includes(userProfile?.uid)}
                    className="bg-amber-500 hover:bg-amber-400 text-zinc-950 px-8 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {tournaments[0].participants?.includes(userProfile?.uid) ? 'Registered' : 'Join Tournament'}
                  </button>
                )}
                
                {tournaments[0].status === 'ongoing' && (
                  <div className="bg-zinc-900/80 border border-white/5 rounded-xl p-4 text-center flex-1">
                    <p className="text-zinc-300 font-medium">Tournament is currently ongoing. Check the brackets!</p>
                  </div>
                )}

                {/* Admin Simulation Button */}
                {tournaments[0].status !== 'completed' && (
                  <button
                    onClick={() => handleEndTournament(tournaments[0])}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2"
                  >
                    <TrophyIcon className="w-4 h-4" /> End & Award
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-8 text-center">
            <p className="text-zinc-500 font-medium">No active tournaments this week.</p>
          </div>
        )}
      </section>

      {/* Past Tournaments */}
      <section>
        <h2 className="text-lg font-bold text-white mb-4">Past Tournaments</h2>
        <div className="space-y-3">
          {tournaments.slice(1).map(t => (
            <div key={t.id} className="bg-zinc-900/30 border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors cursor-pointer">
              <div>
                <div className="font-bold text-white">Week of {format(t.startDate.toDate(), 'MMM d, yyyy')}</div>
                <div className="text-xs text-zinc-500 font-medium mt-1">
                  {t.participants?.length || 0} Participants • Winner: TBD
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600" />
            </div>
          ))}
          {tournaments.length <= 1 && (
            <div className="text-center py-8 text-zinc-500 font-medium">
              No past tournaments found.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

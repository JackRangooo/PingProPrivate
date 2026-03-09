import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { doc, getDoc, updateDoc, serverTimestamp, runTransaction, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'motion/react';
import { Check, X, Trophy, AlertCircle, Loader2 } from 'lucide-react';
import clsx from 'clsx';

export default function MatchDetails() {
  const { id } = useParams();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [myScore, setMyScore] = useState<number | ''>('');
  const [opponentScore, setOpponentScore] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id || !userProfile) return;

    const fetchMatch = async () => {
      const matchRef = doc(db, 'matches', id);
      const matchSnap = await getDoc(matchRef);
      if (matchSnap.exists()) {
        setMatch({ id: matchSnap.id, ...matchSnap.data() });
      } else {
        navigate('/');
      }
      setLoading(false);
    };

    fetchMatch();
  }, [id, userProfile, navigate]);

  if (loading || !match || !userProfile) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const isPlayer1 = match.player1Id === userProfile.uid;
  const isPlayer2 = match.player2Id === userProfile.uid;
  const opponentName = isPlayer1 ? match.player2Name : match.player1Name;
  const opponentPhoto = isPlayer1 ? match.player2Photo : match.player1Photo;
  const myConfirmed = isPlayer1 ? match.player1Confirmed : match.player2Confirmed;
  const opponentConfirmed = isPlayer1 ? match.player2Confirmed : match.player1Confirmed;

  const handleAction = async (action: 'accept' | 'decline' | 'cancel') => {
    setSubmitting(true);
    try {
      const matchRef = doc(db, 'matches', match.id);
      let newStatus = match.status;
      if (action === 'accept') newStatus = 'ongoing';
      if (action === 'decline') newStatus = 'declined';
      if (action === 'cancel') newStatus = 'cancelled';

      await updateDoc(matchRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      setMatch({ ...match, status: newStatus });
    } catch (error) {
      console.error('Error updating match', error);
      alert('Failed to update match status.');
    }
    setSubmitting(false);
  };

  const handleSubmitScore = async () => {
    if (myScore === '' || opponentScore === '') {
      alert('Please enter both scores.');
      return;
    }

    setSubmitting(true);
    try {
      const matchRef = doc(db, 'matches', match.id);
      
      const updates: any = {
        updatedAt: serverTimestamp()
      };

      if (isPlayer1) {
        updates.player1Score = Number(myScore);
        updates.player2Score = Number(opponentScore);
        updates.player1Confirmed = true;
      } else {
        // Player 2 is confirming Player 1's submitted scores, or submitting their own
        // In a real app, we'd check if they match. For simplicity, we assume they agree or overwrite.
        // Actually, let's implement cross-validation.
        if (match.player1Confirmed) {
          if (Number(myScore) === match.player2Score && Number(opponentScore) === match.player1Score) {
            // Scores match!
            updates.player2Confirmed = true;
            updates.status = 'completed';
            
            const p1Wins = match.player1Score > match.player2Score;
            updates.winnerId = p1Wins ? match.player1Id : match.player2Id;
            
            // Update user stats (simplified without transaction for prototype)
            const winnerRef = doc(db, 'users', updates.winnerId);
            const loserRef = doc(db, 'users', p1Wins ? match.player2Id : match.player1Id);
            
            // We should use transaction here, but for prototype we'll just update
            // Note: This is insecure client-side logic, but acceptable for this prototype
            const winnerSnap = await getDoc(winnerRef);
            const loserSnap = await getDoc(loserRef);
            
            if (winnerSnap.exists() && loserSnap.exists()) {
              const wData = winnerSnap.data();
              const lData = loserSnap.data();
              
              await updateDoc(winnerRef, {
                casualWins: (wData.casualWins || 0) + 1,
                casualStars: (wData.casualStars || 0) + 1,
                'inventory.titles': arrayUnion('Match Participant')
              });
              
              await updateDoc(loserRef, {
                casualLosses: (lData.casualLosses || 0) + 1,
                casualStars: Math.max(0, (lData.casualStars || 0) - 1),
                'inventory.titles': arrayUnion('Match Participant')
              });
            }
          } else {
            alert('Scores do not match the opponent\'s submission. Please discuss and resubmit.');
            updates.player1Confirmed = false;
            updates.player2Confirmed = false;
            updates.player1Score = null;
            updates.player2Score = null;
          }
        } else {
          updates.player2Score = Number(myScore);
          updates.player1Score = Number(opponentScore);
          updates.player2Confirmed = true;
        }
      }

      await updateDoc(matchRef, updates);
      
      // Re-fetch match
      const updatedSnap = await getDoc(matchRef);
      setMatch({ id: updatedSnap.id, ...updatedSnap.data() });
      
      if (updates.status === 'completed') {
        alert('Match completed! Scores verified.');
        navigate('/');
      } else if (!updates.player1Confirmed && !updates.player2Confirmed) {
        // Reset case
      } else {
        alert('Score submitted. Waiting for opponent to confirm.');
      }

    } catch (error) {
      console.error('Error submitting score', error);
      alert('Failed to submit score.');
    }
    setSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Match Details</h1>
          <div className="text-sm font-medium uppercase tracking-wider text-emerald-500">{match.status}</div>
        </div>
      </header>

      {/* Players VS */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 relative overflow-hidden flex flex-col items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#064e3b_0%,_transparent_70%)] opacity-20" />
        
        <div className="flex items-center justify-between w-full relative z-10">
          <div className="flex flex-col items-center gap-3">
            <img src={userProfile.photoURL || `https://ui-avatars.com/api/?name=${userProfile.displayName}&background=random`} alt="You" className="w-20 h-20 rounded-full border-4 border-zinc-950 shadow-xl" referrerPolicy="no-referrer" />
            <div className="font-bold text-white text-lg">You</div>
          </div>
          
          <div className="text-3xl font-black text-zinc-700 italic px-4">VS</div>
          
          <div className="flex flex-col items-center gap-3">
            <img src={opponentPhoto || `https://ui-avatars.com/api/?name=${opponentName}&background=random`} alt={opponentName} className="w-20 h-20 rounded-full border-4 border-zinc-950 shadow-xl" referrerPolicy="no-referrer" />
            <div className="font-bold text-white text-lg">{opponentName}</div>
          </div>
        </div>
      </div>

      {/* Actions based on status */}
      {match.status === 'pending' && (
        <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-6 text-center">
          {isPlayer1 ? (
            <>
              <p className="text-zinc-400 mb-6 font-medium">Waiting for {opponentName} to accept the challenge.</p>
              <button
                onClick={() => handleAction('cancel')}
                disabled={submitting}
                className="w-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white py-4 rounded-xl font-bold transition-colors"
              >
                Cancel Challenge
              </button>
            </>
          ) : (
            <>
              <p className="text-zinc-400 mb-6 font-medium">{match.player1Name} has challenged you to a casual match!</p>
              <div className="flex gap-4">
                <button
                  onClick={() => handleAction('decline')}
                  disabled={submitting}
                  className="flex-1 bg-zinc-800 text-white hover:bg-zinc-700 py-4 rounded-xl font-bold transition-colors"
                >
                  Decline
                </button>
                <button
                  onClick={() => handleAction('accept')}
                  disabled={submitting}
                  className="flex-1 bg-emerald-500 text-zinc-950 hover:bg-emerald-400 py-4 rounded-xl font-bold transition-colors"
                >
                  Accept
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {match.status === 'ongoing' && (
        <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6">
          <h2 className="text-xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6 text-emerald-500" /> Record Score
          </h2>
          
          {myConfirmed ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-zinc-300 font-medium text-lg mb-2">Score Submitted</p>
              <p className="text-zinc-500">Waiting for {opponentName} to confirm.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {opponentConfirmed && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3 text-amber-500">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">
                    {opponentName} has submitted their score. Please enter the final score to verify and complete the match.
                  </p>
                </div>
              )}
              
              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <label className="block text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3">Your Score</label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={myScore}
                    onChange={(e) => setMyScore(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-24 h-24 bg-zinc-950 border-2 border-zinc-800 rounded-2xl text-center text-4xl font-black text-white focus:border-emerald-500 focus:outline-none transition-colors"
                  />
                </div>
                <div className="text-3xl font-black text-zinc-700 mt-8">-</div>
                <div className="text-center">
                  <label className="block text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3">Their Score</label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={opponentScore}
                    onChange={(e) => setOpponentScore(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-24 h-24 bg-zinc-950 border-2 border-zinc-800 rounded-2xl text-center text-4xl font-black text-white focus:border-emerald-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
              
              <button
                onClick={handleSubmitScore}
                disabled={submitting}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 py-4 rounded-xl font-bold text-lg transition-colors mt-8"
              >
                {submitting ? 'Submitting...' : 'Submit & Verify'}
              </button>
            </div>
          )}
        </div>
      )}

      {match.status === 'completed' && (
        <div className="bg-zinc-900/50 border border-emerald-500/20 rounded-3xl p-8 text-center">
          <Trophy className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Match Completed</h2>
          <div className="text-4xl font-black text-emerald-400 tracking-tighter mb-6">
            {isPlayer1 ? match.player1Score : match.player2Score} - {isPlayer1 ? match.player2Score : match.player1Score}
          </div>
          <p className="text-zinc-400 font-medium">
            {match.winnerId === userProfile.uid ? 'Victory! You earned a star.' : 'Defeat. You lost a star.'}
          </p>
        </div>
      )}
      
      {(match.status === 'declined' || match.status === 'cancelled') && (
        <div className="bg-zinc-900/30 border border-white/5 rounded-2xl p-8 text-center">
          <p className="text-zinc-500 font-medium text-lg">This match was {match.status}.</p>
        </div>
      )}
    </motion.div>
  );
}

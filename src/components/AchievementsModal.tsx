import React from 'react';
import { useCasino } from '../context/CasinoContext';

const ACHIEVEMENTS_LIST = [
  { id: 'first_win', name: 'First Blood', description: 'Win your first game', icon: '🏆', reward: 100 },
  { id: 'high_roller', name: 'High Roller', description: 'Bet over $1,000 in a single game', icon: '💸', reward: 500 },
  { id: 'millionaire', name: 'Millionaire', description: 'Reach a balance of $1,000,000', icon: '💰', reward: 10000 },
  { id: 'streak_master', name: 'Streak Master', description: 'Win 10 games in a row', icon: '🔥', reward: 2000 },
  { id: 'survivor', name: 'Survivor', description: 'Play 100 games', icon: '🛡️', reward: 1000 },
  { id: 'big_win', name: 'Big Win', description: 'Win over $10,000 in a single game', icon: '💎', reward: 2500 }
];

interface AchievementsModalProps {
  onClose: () => void;
}

const AchievementsModal: React.FC<AchievementsModalProps> = ({ onClose }) => {
  const { state, claimAchievement } = useCasino();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative bg-[#0a0a10] border border-yellow-500/20 rounded-2xl p-6 w-full max-w-2xl animate-bounce-in max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <h3 className="text-2xl font-bold text-white">Achievements</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="grid gap-4">
          {ACHIEVEMENTS_LIST.map((achievement) => {
            const isUnlocked = state.achievements?.unlocked?.includes(achievement.id);
            const isClaimed = state.achievements?.claimed?.includes(achievement.id);

            return (
              <div 
                key={achievement.id}
                className={`flex items-center justify-between p-4 rounded-xl border ${
                  isUnlocked 
                    ? 'bg-yellow-900/10 border-yellow-500/30' 
                    : 'bg-white/5 border-white/5 opacity-70'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                    isUnlocked ? 'bg-yellow-500/20' : 'bg-black/40 grayscale'
                  }`}>
                    {achievement.icon}
                  </div>
                  <div>
                    <h4 className={`font-bold ${isUnlocked ? 'text-yellow-400' : 'text-gray-400'}`}>
                      {achievement.name}
                    </h4>
                    <p className="text-sm text-gray-500">{achievement.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                   <div className="text-right">
                      <span className="text-xs text-gray-500 block uppercase">Reward</span>
                      <span className="font-bold text-green-400">${achievement.reward}</span>
                   </div>
                   
                   {isClaimed ? (
                     <button disabled className="px-4 py-2 bg-white/5 text-gray-500 rounded-lg font-bold text-sm">
                       Claimed
                     </button>
                   ) : isUnlocked ? (
                     <button 
                        onClick={() => claimAchievement(achievement.id, achievement.reward)}
                        className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold rounded-lg text-sm transition-all animate-pulse"
                     >
                       Claim
                     </button>
                   ) : (
                     <div className="px-4 py-2 text-gray-600 font-bold text-sm">
                       Locked
                     </div>
                   )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AchievementsModal;

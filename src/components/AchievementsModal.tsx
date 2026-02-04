import { motion } from 'framer-motion';
import { Banknote, CloudRain, Coins, Flame, Gem, Heart, Shield, Trophy, X, Zap } from 'lucide-react';
import React from 'react';
import { useCasino } from '../context/CasinoContext';

const ACHIEVEMENTS_LIST = [
  { id: 'first_win', name: 'First Blood', description: 'Win your first game', icon: Trophy, reward: 100 },
  { id: 'high_roller', name: 'High Roller', description: 'Bet over $1,000 in a single game', icon: Banknote, reward: 500 },
  { id: 'millionaire', name: 'Millionaire', description: 'Reach a balance of $1,000,000', icon: Coins, reward: 10000 },
  { id: 'streak_master', name: 'Streak Master', description: 'Win 10 games in a row', icon: Flame, reward: 2000 },
  { id: 'survivor', name: 'Survivor', description: 'Play 100 games', icon: Shield, reward: 1000 },
  { id: 'big_win', name: 'Big Win', description: 'Win over $10,000 in a single game', icon: Gem, reward: 2500 },
  { id: 'jackpot_hunter', name: 'Jackpot Hunter', description: 'Win with > 100x multiplier', icon: Zap, reward: 5000 },
  { id: 'bad_luck_brian', name: 'Unlucky', description: 'Lose 10 games in a row', icon: CloudRain, reward: 500 },
  { id: 'loyal_player', name: 'Loyal Player', description: 'Play 500 games', icon: Heart, reward: 2000 }
];

interface AchievementsModalProps {
  onClose: () => void;
}

const AchievementsModal: React.FC<AchievementsModalProps> = ({ onClose }) => {
  const { state, claimAchievement } = useCasino() as any;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-[#0a0a10] border border-yellow-500/20 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl shadow-yellow-500/10"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="text-yellow-500"><Trophy size={32} /></div>
            <h3 className="text-2xl font-bold text-white">Achievements</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 text-gray-400 hover:text-white flex items-center justify-center">
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-4">
          {ACHIEVEMENTS_LIST.map((achievement) => {
            const isUnlocked = state.achievements?.unlocked?.includes(achievement.id);
            const isClaimed = state.achievements?.claimed?.includes(achievement.id);
            const Icon = achievement.icon;

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
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isUnlocked ? 'bg-yellow-500/20 text-yellow-500' : 'bg-black/40 text-gray-600'
                  }`}>
                    <Icon size={24} />
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
      </motion.div>
    </div>
  );
};

export default AchievementsModal;

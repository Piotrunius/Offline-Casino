import React, { useEffect, useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import { formatDistanceToNow } from 'date-fns';
import { Gift, X, Clock, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DailyBonusModalProps {
  onClose: () => void;
}

const DailyBonusModal: React.FC<DailyBonusModalProps> = ({ onClose }) => {
  const { state, claimDailyBonus } = useCasino();
  const [canClaim, setCanClaim] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const checkTimer = () => {
      const lastClaim = state.dailyBonus?.lastClaimed || 0;
      const now = Date.now();
      const diff = now - lastClaim;
      const cooldown = 24 * 60 * 60 * 1000; // 24 hours

      if (diff >= cooldown) {
        setCanClaim(true);
        setTimeLeft('Ready!');
      } else {
        setCanClaim(false);
        const nextClaim = lastClaim + cooldown;
        setTimeLeft(formatDistanceToNow(nextClaim, { addSuffix: true }));
      }
    };

    checkTimer();
    const interval = setInterval(checkTimer, 60000);
    return () => clearInterval(interval);
  }, [state.dailyBonus?.lastClaimed]);

  const handleClaim = () => {
    if (canClaim) {
      claimDailyBonus();
      onClose();
    }
  };

  const currentStreak = state.dailyBonus?.streak || 0;
  const currentReward = Math.min(1000 + currentStreak * 100, 5000);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-[#0a0a10] border border-cyan-500/20 rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl shadow-cyan-500/10"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
        
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 animate-float relative">
          <Gift size={48} />
          {canClaim && (
             <motion.div 
               animate={{ rotate: 360 }}
               transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
               className="absolute inset-0 border-2 border-dashed border-cyan-500/30 rounded-full"
             />
          )}
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-2">Daily Bonus</h3>
        <p className="text-gray-400 mb-6">Come back every 24 hours for free credits!</p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-black/30 rounded-xl p-3 border border-white/5">
            <div className="text-gray-500 text-xs uppercase mb-1 flex items-center justify-center gap-1">
              <Zap size={12} /> Streak
            </div>
            <div className="text-xl font-bold text-yellow-400">{currentStreak} Days</div>
          </div>
          <div className="bg-black/30 rounded-xl p-3 border border-white/5">
            <div className="text-gray-500 text-xs uppercase mb-1 flex items-center justify-center gap-1">
              <Clock size={12} /> Next
            </div>
            <div className="text-xl font-bold text-cyan-400">${Math.min(1000 + (currentStreak + 1) * 100, 5000)}</div>
          </div>
        </div>

        <div className="bg-gradient-to-b from-cyan-900/20 to-black/30 rounded-xl p-4 mb-6 border border-cyan-500/20">
          <div className="text-gray-400 text-xs uppercase mb-1">Current Reward</div>
          <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-400">
            ${currentReward.toLocaleString()}
          </div>
        </div>

        {canClaim ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClaim}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20"
          >
            Claim Bonus
          </motion.button>
        ) : (
          <button disabled className="w-full py-3 bg-gray-800 text-gray-500 font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-2">
            <Clock size={16} />
            Next bonus {timeLeft}
          </button>
        )}
      </motion.div>
    </div>
  );
};

export default DailyBonusModal;

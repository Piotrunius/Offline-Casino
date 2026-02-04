import React, { useEffect, useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import { formatDistanceToNow } from 'date-fns';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative bg-[#0a0a10] border border-cyan-500/20 rounded-2xl p-8 w-full max-w-sm animate-bounce-in text-center">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
        
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-cyan-500/10 flex items-center justify-center text-5xl animate-float">
          🎁
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-2">Daily Bonus</h3>
        <p className="text-gray-400 mb-6">Come back every 24 hours for free credits!</p>

        <div className="bg-black/30 rounded-xl p-4 mb-6">
          <div className="text-gray-500 text-xs uppercase mb-1">Current Reward</div>
          <div className="text-3xl font-black text-cyan-400">$1,000</div>
        </div>

        {canClaim ? (
          <button
            onClick={handleClaim}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20 animate-pulse"
          >
            Claim Bonus
          </button>
        ) : (
          <button disabled className="w-full py-3 bg-gray-800 text-gray-500 font-bold rounded-xl cursor-not-allowed">
            Next bonus {timeLeft}
          </button>
        )}
      </div>
    </div>
  );
};

export default DailyBonusModal;

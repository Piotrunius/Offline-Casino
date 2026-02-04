import { Cherry, Coins, PartyPopper, Sparkles as SparklesIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

const Confetti = ({ count = 50 }) => {
  const colors = ['#ff0', '#f0f', '#0ff', '#f00', '#0f0', '#00f', '#ff8800'];

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {Array(count).fill(null).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.5;
        const duration = 2 + Math.random() * 2;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 6 + Math.random() * 6;
        const rotation = Math.random() * 720;

        return (
          <div
            key={i}
            className="absolute animate-confetti"
            style={{
              left: `${left}%`,
              top: '-20px',
              width: `${size}px`,
              height: `${size * 0.6}px`,
              backgroundColor: color,
              borderRadius: '2px',
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              transform: `rotate(${rotation}deg)`
            }}
          />
        );
      })}
    </div>
  );
};

const GoldCoins = ({ count = 20 }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {Array(count).fill(null).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.3;
        const duration = 1.5 + Math.random() * 1;

        return (
          <div
            key={i}
            className="absolute animate-coins"
            style={{
              left: `${left}%`,
              top: '-40px',
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`
            }}
          >
            <Coins size={32} className="text-yellow-500" />
          </div>
        );
      })}
    </div>
  );
};

const Sparkles = ({ count = 30 }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {Array(count).fill(null).map((_, i) => {
        const left = 20 + Math.random() * 60;
        const top = 20 + Math.random() * 60;
        const delay = Math.random() * 0.5;
        const scale = 0.5 + Math.random() * 1;

        return (
          <div
            key={i}
            className="absolute animate-sparkle"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              animationDelay: `${delay}s`,
              transform: `scale(${scale})`
            }}
          >
            <SparklesIcon size={24} className="text-yellow-200" />
          </div>
        );
      })}
    </div>
  );
};

const JackpotOverlay = ({ multiplier, profit, onComplete }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 100);
    const t2 = setTimeout(() => setStage(2), 400);
    const t3 = setTimeout(() => setStage(3), 1200);
    const t4 = setTimeout(() => {
      setStage(4);
      onComplete?.();
    }, 4000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Dark overlay with radial gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br from-black via-black to-purple-900/30 transition-opacity duration-700 ${stage >= 1 ? 'opacity-95' : 'opacity-0'}`} />

      {/* Pulsating glow effect */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${stage >= 2 ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-yellow-500/20 blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-orange-500/20 blur-2xl animate-pulse" style={{ animationDelay: '0.3s' }} />
      </div>

      {stage >= 1 && <Confetti count={120} />}
      {stage >= 1 && <GoldCoins count={40} />}
      {stage >= 2 && <Sparkles count={40} />}

      <div className={`relative text-center transform transition-all duration-700 ${stage >= 2 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
        {/* Rotating icon with glow */}
        <div className="relative mb-6 animate-jackpot-icon">
          <Cherry size={100} className="mx-auto text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-yellow-500/20 blur-xl animate-pulse" />
          </div>
        </div>

        {/* Main text with enhanced animation */}
        <div className={`text-7xl font-black mb-4 animate-jackpot-text ${stage >= 3 ? 'scale-110' : 'scale-100'} transition-transform duration-500`}>
          <div className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.9)]" style={{
            backgroundSize: '200% auto',
            animation: 'shimmer 2s linear infinite'
          }}>
            JACKPOT!
          </div>
        </div>

        {/* Profit amount with scale animation */}
        <div className={`text-6xl font-black text-green-400 mb-3 drop-shadow-[0_0_20px_rgba(74,222,128,0.8)] transition-all duration-500 ${stage >= 3 ? 'scale-110' : 'scale-100'}`}>
          +${profit.toFixed(2)}
        </div>

        {/* Multiplier badge */}
        <div className="inline-block px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full">
          <div className="text-3xl font-black text-white drop-shadow-lg">
            {multiplier.toFixed(2)}x
          </div>
        </div>

        {/* Decorative rays */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-1 bg-gradient-to-b from-transparent via-yellow-400 to-transparent animate-pulse" style={{ animationDelay: '0.2s' }} />
        </div>
      </div>
    </div>
  );
};

const BigWinOverlay = ({ multiplier, profit, onComplete }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 100);
    const t2 = setTimeout(() => setStage(2), 600);
    const t3 = setTimeout(() => {
      setStage(3);
      onComplete?.();
    }, 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Semi-transparent overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br from-black/60 via-black/70 to-blue-900/30 transition-opacity duration-500 ${stage >= 1 ? 'opacity-100' : 'opacity-0'}`} />

      {/* Glowing background effect */}
      <div className={`absolute inset-0 transition-opacity duration-700 ${stage >= 1 ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-cyan-500/15 blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-green-500/15 blur-2xl animate-pulse" style={{ animationDelay: '0.25s' }} />
      </div>

      <Sparkles count={30} />
      <Confetti count={60} />
      {stage >= 1 && <GoldCoins count={20} />}

      <div className={`relative text-center transition-all duration-600 ${stage >= 1 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'} animate-big-win-bounce`}>
        {/* Icon with glow effect */}
        <div className="relative mb-6">
          <PartyPopper size={80} className="mx-auto text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-big-win-icon" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-cyan-500/20 blur-xl animate-pulse" />
          </div>
        </div>

        {/* Main text */}
        <div className={`text-6xl font-black mb-4 transition-transform duration-500 ${stage >= 2 ? 'scale-110' : 'scale-100'}`}>
          <div className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 drop-shadow-[0_0_25px_rgba(34,211,238,0.8)]" style={{
            backgroundSize: '200% auto',
            animation: 'shimmer 1.5s linear infinite'
          }}>
            BIG WIN!
          </div>
        </div>

        {/* Profit amount */}
        <div className={`text-5xl font-black text-green-400 mb-3 drop-shadow-[0_0_15px_rgba(74,222,128,0.7)] transition-all duration-500 ${stage >= 2 ? 'scale-105' : 'scale-100'}`}>
          +${profit.toFixed(2)}
        </div>

        {/* Multiplier */}
        <div className="inline-block px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full">
          <div className="text-2xl font-black text-white drop-shadow-lg">
            {multiplier.toFixed(2)}x
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute inset-0 -z-10 animate-pulse">
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
        </div>
      </div>
    </div>
  );
};

const NiceWinOverlay = ({ profit, onComplete }) => {
  useEffect(() => {
    const t = setTimeout(onComplete, 1000);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      <div className="text-center animate-bounce-in">
        <div className="text-2xl font-bold text-green-400 animate-pulse">
          +${profit.toFixed(2)}
        </div>
      </div>
    </div>
  );
};

export default function WinEffects({ win, onComplete, enabled = true }) {
  if (!win || !enabled) return null;

  const { profit, multiplier } = win;

  // Jackpot: 10x+ multiplier or 500+ profit
  if (multiplier >= 10 || profit >= 500) {
    return <JackpotOverlay multiplier={multiplier} profit={profit} onComplete={onComplete} />;
  }

  // Big win: 5x+ multiplier or 100+ profit
  if (multiplier >= 5 || profit >= 100) {
    return <BigWinOverlay multiplier={multiplier} profit={profit} onComplete={onComplete} />;
  }

  // Nice win: 2x+ multiplier or 50+ profit
  if (multiplier >= 2 || profit >= 50) {
    return <NiceWinOverlay profit={profit} onComplete={onComplete} />;
  }

  // Small wins - no effect
  if (onComplete) setTimeout(onComplete, 0);
  return null;
}

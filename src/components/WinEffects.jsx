import { Cherry, Coins, DollarSign, PartyPopper, Sparkles as SparklesIcon, Star, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import audioEngine from '../utils/audioEngine';

// Shockwave effect - expanding rings
const Shockwave = ({ delay = 0 }) => {
  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-[99] flex items-center justify-center">
        <div
          className="absolute w-0 h-0 rounded-full border-4 border-yellow-400/60 animate-shockwave"
          style={{ animationDelay: `${delay}s` }}
        />
      </div>
      <div className="fixed inset-0 pointer-events-none z-[99] flex items-center justify-center">
        <div
          className="absolute w-0 h-0 rounded-full border-4 border-orange-400/40 animate-shockwave"
          style={{ animationDelay: `${delay + 0.2}s` }}
        />
      </div>
    </>
  );
};

// Fireworks effect
const Fireworks = ({ count = 8 }) => {
  const colors = ['#fbbf24', '#f59e0b', '#f97316', '#ef4444', '#ec4899', '#a855f7', '#3b82f6', '#10b981'];

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {Array(count).fill(null).map((_, i) => {
        const left = 20 + Math.random() * 60;
        const top = 20 + Math.random() * 40;
        const delay = Math.random() * 1;
        const color = colors[Math.floor(Math.random() * colors.length)];

        return (
          <div
            key={i}
            className="absolute animate-firework"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              animationDelay: `${delay}s`,
            }}
          >
            {/* Particles bursting out */}
            {Array(12).fill(null).map((_, j) => {
              const angle = (j * 360) / 12;
              return (
                <div
                  key={j}
                  className="absolute w-2 h-2 rounded-full animate-firework-particle"
                  style={{
                    backgroundColor: color,
                    boxShadow: `0 0 10px ${color}`,
                    transform: `rotate(${angle}deg)`,
                  }}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// Floating stars
const FloatingStars = ({ count = 20 }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {Array(count).fill(null).map((_, i) => {
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const delay = Math.random() * 1;
        const duration = 2 + Math.random() * 2;

        return (
          <div
            key={i}
            className="absolute animate-float-up-fade"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}
          >
            <Star size={16 + Math.random() * 16} className="text-yellow-300 fill-yellow-300" />
          </div>
        );
      })}
    </div>
  );
};

// Dollar signs floating up
const FloatingDollars = ({ count = 15 }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {Array(count).fill(null).map((_, i) => {
        const left = 10 + Math.random() * 80;
        const delay = Math.random() * 1.5;

        return (
          <div
            key={i}
            className="absolute animate-float-up-fade"
            style={{
              left: `${left}%`,
              bottom: '-50px',
              animationDelay: `${delay}s`,
              animationDuration: '3s',
            }}
          >
            <DollarSign size={24 + Math.random() * 24} className="text-green-400" />
          </div>
        );
      })}
    </div>
  );
};

// Animated counter
const AnimatedCounter = ({ value, duration = 1000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <>${count.toFixed(2)}</>;
};

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
    // Play jackpot sound
    audioEngine.playBigWin();
    setTimeout(() => audioEngine.playWin(), 400);
    setTimeout(() => audioEngine.playCashout(), 800);

    const t1 = setTimeout(() => setStage(1), 100);
    const t2 = setTimeout(() => setStage(2), 400);
    const t3 = setTimeout(() => setStage(3), 1200);
    const t4 = setTimeout(() => {
      setStage(4);
      onComplete?.();
    }, 5000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      {/* Dark overlay with radial gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br from-black via-black to-purple-900/30 transition-opacity duration-700 ${stage >= 1 ? 'opacity-95' : 'opacity-0'} pointer-events-none`} />

      {/* Pulsating glow effect */}
      <div className={`absolute inset-0 transition-opacity duration-1000 pointer-events-none ${stage >= 2 ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-yellow-500/20 blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-orange-500/20 blur-3xl animate-pulse" style={{ animationDelay: '0.3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-red-500/15 blur-2xl animate-pulse" style={{ animationDelay: '0.6s' }} />
      </div>

      {/* Shockwaves */}
      {stage >= 1 && <Shockwave delay={0} />}
      {stage >= 1 && <Shockwave delay={0.5} />}

      {/* Particles */}
      {stage >= 1 && <Confetti count={150} />}
      {stage >= 1 && <GoldCoins count={50} />}
      {stage >= 2 && <Sparkles count={50} />}
      {stage >= 2 && <FloatingStars count={30} />}
      {stage >= 2 && <Fireworks count={12} />}
      {stage >= 2 && <FloatingDollars count={20} />}

      <div className={`relative text-center transform transition-all duration-700 ${stage >= 2 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
        {/* Rotating icon with glow */}
        <div className="relative mb-8 animate-jackpot-icon">
          <Cherry size={120} className="mx-auto text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,1)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-40 h-40 rounded-full bg-yellow-500/30 blur-xl animate-pulse" />
          </div>
          {/* Lightning bolts */}
          <Zap size={40} className="absolute -top-2 -right-2 text-yellow-300 animate-pulse" />
          <Zap size={40} className="absolute -top-2 -left-2 text-yellow-300 animate-pulse" style={{ animationDelay: '0.3s' }} />
        </div>

        {/* Main text with enhanced animation */}
        <div className={`text-8xl font-black mb-6 animate-jackpot-text ${stage >= 3 ? 'scale-110' : 'scale-100'} transition-transform duration-500`}>
          <div className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 drop-shadow-[0_0_40px_rgba(250,204,21,1)] animate-text-glow" style={{
            backgroundSize: '200% auto',
            animation: 'shimmer 1.5s linear infinite, text-glow 1s ease-in-out infinite'
          }}>
            🎰 JACKPOT! 🎰
          </div>
        </div>

        {/* Profit amount with scale animation and counter */}
        <div className={`text-7xl font-black text-green-400 mb-4 drop-shadow-[0_0_30px_rgba(74,222,128,1)] transition-all duration-500 ${stage >= 3 ? 'scale-110' : 'scale-100'} animate-bounce-subtle`}>
          +$<AnimatedCounter value={profit} duration={2000} />
        </div>

        {/* Multiplier badge with glow */}
        <div className="relative inline-block mb-4">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full blur-xl opacity-70 animate-pulse" />
          <div className="relative px-10 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full shadow-2xl">
            <div className="text-4xl font-black text-white drop-shadow-lg">
              {multiplier.toFixed(2)}x MULTIPLIER
            </div>
          </div>
        </div>

        {/* Decorative rays */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-2 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-2 bg-gradient-to-b from-transparent via-yellow-400 to-transparent animate-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-2 bg-gradient-to-r from-transparent via-orange-400 to-transparent animate-pulse rotate-45" style={{ animationDelay: '0.4s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-2 bg-gradient-to-r from-transparent via-orange-400 to-transparent animate-pulse -rotate-45" style={{ animationDelay: '0.6s' }} />
        </div>
      </div>
    </div>
  );
};

const BigWinOverlay = ({ multiplier, profit, onComplete }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Play big win sound
    audioEngine.playWin();
    setTimeout(() => audioEngine.playCashout(), 300);

    const t1 = setTimeout(() => setStage(1), 100);
    const t2 = setTimeout(() => setStage(2), 600);
    const t3 = setTimeout(() => {
      setStage(3);
      onComplete?.();
    }, 3000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      {/* Semi-transparent overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br from-black/60 via-black/70 to-blue-900/30 transition-opacity duration-500 pointer-events-none ${stage >= 1 ? 'opacity-100' : 'opacity-0'}`} />

      {/* Glowing background effect */}
      <div className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${stage >= 1 ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan-500/15 blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full bg-blue-500/15 blur-3xl animate-pulse" style={{ animationDelay: '0.2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-green-500/15 blur-2xl animate-pulse" style={{ animationDelay: '0.4s' }} />
      </div>

      {/* Shockwave */}
      {stage >= 1 && <Shockwave delay={0.1} />}

      {/* Particles */}
      <Sparkles count={40} />
      <Confetti count={80} />
      {stage >= 1 && <GoldCoins count={30} />}
      {stage >= 1 && <FloatingStars count={20} />}
      {stage >= 2 && <Fireworks count={8} />}
      {stage >= 2 && <FloatingDollars count={15} />}

      <div className={`relative text-center transition-all duration-600 ${stage >= 1 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'} animate-big-win-bounce`}>
        {/* Icon with glow effect */}
        <div className="relative mb-8">
          <PartyPopper size={100} className="mx-auto text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,1)] animate-big-win-icon" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-cyan-500/30 blur-xl animate-pulse" />
          </div>
          {/* Stars around */}
          <Star size={30} className="absolute -top-4 -right-4 text-yellow-400 fill-yellow-400 animate-spin-slow" />
          <Star size={30} className="absolute -top-4 -left-4 text-yellow-400 fill-yellow-400 animate-spin-slow" style={{ animationDelay: '0.5s' }} />
        </div>

        {/* Main text */}
        <div className={`text-7xl font-black mb-6 transition-transform duration-500 ${stage >= 2 ? 'scale-110' : 'scale-100'}`}>
          <div className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 drop-shadow-[0_0_30px_rgba(34,211,238,1)] animate-text-glow" style={{
            backgroundSize: '200% auto',
            animation: 'shimmer 1.2s linear infinite, text-glow 0.8s ease-in-out infinite'
          }}>
            💎 BIG WIN! 💎
          </div>
        </div>

        {/* Profit amount with counter */}
        <div className={`text-6xl font-black text-green-400 mb-4 drop-shadow-[0_0_20px_rgba(74,222,128,0.9)] transition-all duration-500 ${stage >= 2 ? 'scale-105' : 'scale-100'} animate-bounce-subtle`}>
          +$<AnimatedCounter value={profit} duration={1500} />
        </div>

        {/* Multiplier */}
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-lg opacity-60 animate-pulse" />
          <div className="relative px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-xl">
            <div className="text-3xl font-black text-white drop-shadow-lg">
              {multiplier.toFixed(2)}x
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute inset-0 -z-10 animate-pulse">
          <div className="absolute top-1/2 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
          <div className="absolute top-0 bottom-0 left-1/2 w-[3px] bg-gradient-to-b from-transparent via-cyan-400 to-transparent" />
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

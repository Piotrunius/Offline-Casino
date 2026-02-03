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
            className="absolute text-4xl animate-coins"
            style={{
              left: `${left}%`,
              top: '-40px',
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`
            }}
          >
            🪙
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
            className="absolute text-3xl animate-sparkle"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              animationDelay: `${delay}s`,
              transform: `scale(${scale})`
            }}
          >
            ✨
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
    const t2 = setTimeout(() => setStage(2), 500);
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className={`absolute inset-0 bg-black/70 transition-opacity duration-500 ${stage >= 1 ? 'opacity-100' : 'opacity-0'}`} />

      {stage >= 1 && <Confetti count={100} />}
      {stage >= 1 && <GoldCoins count={30} />}

      <div className={`relative text-center transform transition-all duration-500 ${stage >= 2 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
        <div className="text-6xl mb-4 animate-bounce">🎰</div>
        <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 animate-pulse mb-2">
          JACKPOT!
        </div>
        <div className="text-4xl font-black text-green-400">
          +${profit.toFixed(2)}
        </div>
        <div className="text-xl text-yellow-400 mt-2">
          {multiplier.toFixed(2)}x
        </div>
      </div>
    </div>
  );
};

const BigWinOverlay = ({ multiplier, profit, onComplete }) => {
  useEffect(() => {
    const t = setTimeout(onComplete, 2000);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      <Sparkles count={20} />
      <div className="text-center animate-bounce-in">
        <div className="text-4xl mb-2">🎉</div>
        <div className="text-3xl font-black text-green-400">
          BIG WIN!
        </div>
        <div className="text-2xl font-bold text-white">
          +${profit.toFixed(2)}
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

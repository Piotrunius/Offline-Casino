import { useCallback, useState, useEffect } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const MULTIPLIER = 2.8;

export default function ThreeCupsGame() {
  const { state, placeBet, addWin, setGlobalBet } = useCasino();
  const [bet, setBet] = useState(state.globalBet || 10);
  const [phase, setPhase] = useState('betting'); // betting, reveal, shuffle, guess, result
  const [ballCup, setBallCup] = useState(1);
  const [cupOrder, setCupOrder] = useState([0, 1, 2]);
  const [lifted, setLifted] = useState(-1);
  const [selected, setSelected] = useState(-1);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [shuffleStep, setShuffleStep] = useState(0);

  const godMode = state.adminSettings?.godMode;
  const fastMode = state.settings.fastMode;

  const startGame = useCallback(async () => {
    if (phase !== 'betting' || bet <= 0 || bet > state.balance) return;

    const confirmed = await placeBet(bet, 'threecups');
    if (!confirmed) return;

    audio.playBet();
    setResult(null);
    setSelected(-1);
    setShuffleStep(0);

    // Random ball position
    const ball = Math.floor(Math.random() * 3);
    setBallCup(ball);
    setCupOrder([0, 1, 2]);
    
    // Show ball
    setPhase('reveal');
    setLifted(ball);
  }, [phase, bet, state.balance, placeBet]);

  // Handle phase transitions
  useEffect(() => {
    if (phase === 'reveal') {
      const timer = setTimeout(() => {
        setLifted(-1);
        setPhase('shuffle');
      }, fastMode ? 800 : 1500);
      return () => clearTimeout(timer);
    }
  }, [phase, fastMode]);

  // Handle shuffling
  useEffect(() => {
    if (phase !== 'shuffle') return;

    const totalShuffles = fastMode ? 6 : 12;
    
    if (shuffleStep >= totalShuffles) {
      setPhase('guess');
      return;
    }

    const timer = setTimeout(() => {
      // Swap two random positions
      const newOrder = [...cupOrder];
      const i = Math.floor(Math.random() * 3);
      let j = Math.floor(Math.random() * 3);
      while (j === i) j = Math.floor(Math.random() * 3);
      
      [newOrder[i], newOrder[j]] = [newOrder[j], newOrder[i]];
      setCupOrder(newOrder);
      setShuffleStep(s => s + 1);
      audio.playClick();
    }, fastMode ? 150 : 300);

    return () => clearTimeout(timer);
  }, [phase, shuffleStep, cupOrder, fastMode]);

  const selectCup = (visualPos) => {
    if (phase !== 'guess') return;

    setSelected(visualPos);
    setPhase('result');
    audio.playClick();

    // Find which original cup is at this position
    const selectedOriginal = cupOrder[visualPos];
    
    // In god mode, ball is always where player clicks
    const actualBall = godMode ? selectedOriginal : ballCup;
    if (godMode) setBallCup(selectedOriginal);

    // Lift all cups to reveal
    setLifted(3); // 3 means all

    setTimeout(() => {
      const won = selectedOriginal === actualBall;
      
      setHistory(h => [{ won, selected: visualPos }, ...h.slice(0, 4)]);

      if (won) {
        const winAmount = bet * MULTIPLIER;
        addWin(winAmount, bet, 'threecups', MULTIPLIER);
        setResult({ won: true, profit: winAmount - bet });
        audio.playWin();
      } else {
        addWin(0, bet, 'threecups', 0);
        setResult({ won: false, profit: -bet });
        audio.playLose();
      }

      setTimeout(() => {
        setLifted(-1);
        setPhase('betting');
      }, 1500);
    }, 500);
  };

  const handleBetChange = (val) => {
    const v = Math.min(Math.max(1, val), state.balance);
    setBet(v);
    setGlobalBet(v);
  };

  // Get visual position of the ball (which slot it appears in)
  const ballVisualPos = cupOrder.indexOf(ballCup);

  return (
    <div className="h-full flex gap-3 p-2">
      {/* Game Area */}
      <div className="flex-1 bg-gradient-to-b from-[#0a0a12] to-[#0f0f1a] rounded-2xl p-4 flex flex-col items-center justify-center">
        {/* Status */}
        <div className="mb-6">
          <span className={`px-4 py-2 rounded-full text-sm font-bold ${
            phase === 'betting' ? 'bg-cyan-600/30 text-cyan-400' :
            phase === 'reveal' ? 'bg-yellow-600/30 text-yellow-400' :
            phase === 'shuffle' ? 'bg-purple-600/30 text-purple-400' :
            phase === 'guess' ? 'bg-green-600/30 text-green-400' :
            'bg-gray-600/30 text-gray-400'
          }`}>
            {phase === 'betting' && 'Place your bet'}
            {phase === 'reveal' && '👀 Watch the ball!'}
            {phase === 'shuffle' && `Shuffling... ${shuffleStep}`}
            {phase === 'guess' && '👆 Pick a cup!'}
            {phase === 'result' && (result?.won ? '🎉 Correct!' : '❌ Wrong!')}
          </span>
        </div>

        {/* Table */}
        <div className="bg-gradient-to-b from-amber-900/40 to-amber-800/30 rounded-2xl p-6 relative">
          {/* Cups */}
          <div className="flex gap-8 justify-center">
            {[0, 1, 2].map((visualPos) => {
              const originalCup = cupOrder[visualPos];
              const isLifted = lifted === originalCup || lifted === 3;
              const hasBall = originalCup === ballCup && (phase === 'reveal' || phase === 'result');
              const isSelected = selected === visualPos;

              return (
                <div
                  key={visualPos}
                  onClick={() => selectCup(visualPos)}
                  className={`relative cursor-pointer transition-transform duration-200 ${
                    phase === 'guess' ? 'hover:scale-105' : ''
                  } ${isSelected ? 'scale-105' : ''}`}
                >
                  {/* Ball */}
                  <div
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full 
                      bg-gradient-to-br from-red-400 to-red-600 shadow-lg transition-opacity duration-300
                      ${hasBall && isLifted ? 'opacity-100' : 'opacity-0'}`}
                  />

                  {/* Cup */}
                  <div
                    className={`relative transition-transform duration-300 ease-out ${
                      isLifted ? '-translate-y-12' : 'translate-y-0'
                    }`}
                  >
                    {/* Cup body - simple inverted trapezoid */}
                    <div className={`w-20 h-24 relative ${isSelected ? 'ring-4 ring-yellow-400 rounded-t-2xl' : ''}`}>
                      <svg viewBox="0 0 80 96" className="w-full h-full">
                        <defs>
                          <linearGradient id={`cupGrad${visualPos}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#b45309" />
                            <stop offset="30%" stopColor="#d97706" />
                            <stop offset="70%" stopColor="#d97706" />
                            <stop offset="100%" stopColor="#92400e" />
                          </linearGradient>
                        </defs>
                        {/* Cup shape */}
                        <path
                          d="M 10 96 L 70 96 L 80 0 L 0 0 Z"
                          fill={`url(#cupGrad${visualPos})`}
                          stroke="#78350f"
                          strokeWidth="3"
                        />
                        {/* Top rim */}
                        <ellipse cx="40" cy="4" rx="38" ry="4" fill="#fbbf24" opacity="0.5" />
                        {/* Shine */}
                        <path
                          d="M 20 10 L 25 90 L 35 90 L 30 10 Z"
                          fill="rgba(255,255,255,0.15)"
                        />
                      </svg>
                    </div>

                    {/* Cup number */}
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-gray-400 text-sm font-bold">
                      #{visualPos + 1}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hint */}
          {phase === 'guess' && (
            <div className="text-center mt-10 text-gray-400 text-sm animate-pulse">
              Click on a cup to reveal the ball!
            </div>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className={`mt-6 px-6 py-3 rounded-xl ${
            result.won ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
          }`}>
            <span className="text-xl font-bold">
              {result.won ? `+$${result.profit.toFixed(2)}` : `-$${Math.abs(result.profit).toFixed(2)}`}
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-72 bg-[#0a0a12] rounded-2xl p-3 flex flex-col gap-3">
        {/* Bet Amount */}
        <div>
          <label className="text-xs text-gray-500 uppercase font-bold">Bet Amount</label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              value={bet}
              onChange={(e) => handleBetChange(Number(e.target.value))}
              disabled={phase !== 'betting'}
              className="w-full bg-black/50 border border-white/10 rounded-lg py-2 pl-8 pr-3 text-white font-bold"
            />
          </div>
          <div className="grid grid-cols-4 gap-1 mt-1">
            <button onClick={() => handleBetChange(1)} disabled={phase !== 'betting'} className="btn-secondary py-1.5 text-xs font-bold">MIN</button>
            <button onClick={() => handleBetChange(bet / 2)} disabled={phase !== 'betting'} className="btn-secondary py-1.5 text-xs font-bold">½</button>
            <button onClick={() => handleBetChange(bet * 2)} disabled={phase !== 'betting'} className="btn-secondary py-1.5 text-xs font-bold">2x</button>
            <button onClick={() => handleBetChange(state.balance)} disabled={phase !== 'betting'} className="btn-secondary py-1.5 text-xs font-bold">MAX</button>
          </div>
        </div>

        {/* Game Info */}
        <div className="bg-black/30 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-2">How to Play</div>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• Watch where the ball is placed</li>
            <li>• Follow the cups as they shuffle</li>
            <li>• Pick the cup with the ball!</li>
          </ul>
          <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between">
            <span className="text-gray-400">Win Payout:</span>
            <span className="text-green-400 font-bold">{MULTIPLIER}x</span>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={startGame}
          disabled={phase !== 'betting' || bet <= 0 || bet > state.balance}
          className={`py-3 rounded-xl font-bold transition-all ${
            phase !== 'betting'
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white'
          }`}
        >
          {phase === 'betting' ? '🎲 START GAME' :
           phase === 'guess' ? '👆 PICK A CUP!' :
           '👀 WATCH...'}
        </button>

        {/* History */}
        {history.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 uppercase font-bold mb-1">History</div>
            <div className="flex gap-1 flex-wrap">
              {history.map((h, i) => (
                <div
                  key={i}
                  className={`px-2 py-1 rounded text-xs font-bold ${
                    h.won ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'
                  }`}
                >
                  Cup #{h.selected + 1}: {h.won ? 'WIN' : 'LOSE'}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

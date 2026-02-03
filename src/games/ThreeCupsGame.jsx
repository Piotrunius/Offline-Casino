import { useCallback, useRef, useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const MULTIPLIER = 2.8; // Payout for correct guess

export default function ThreeCupsGame() {
  const { state, placeBet, addWin, setGlobalBet } = useCasino();
  const [bet, setBet] = useState(state.globalBet || 10);
  const [gamePhase, setGamePhase] = useState('betting'); // betting, showing, shuffling, guessing, result
  const [ballPosition, setBallPosition] = useState(1); // 0, 1, 2
  const [cupPositions, setCupPositions] = useState([0, 1, 2]); // Current visual positions
  const [selectedCup, setSelectedCup] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [cupsLifted, setCupsLifted] = useState([false, false, false]);
  const [shuffleCount, setShuffleCount] = useState(0);
  const animRef = useRef(null);

  const godMode = state.adminSettings?.godMode;

  const startGame = useCallback(async () => {
    if (gamePhase !== 'betting' || bet <= 0 || bet > state.balance) return;

    const confirmed = await placeBet(bet, 'threecups');
    if (!confirmed) return;

    audio.playBet();
    setResult(null);
    setSelectedCup(null);

    // Show ball under middle cup
    const initialBallPos = Math.floor(Math.random() * 3);
    setBallPosition(initialBallPos);
    setCupPositions([0, 1, 2]);
    setGamePhase('showing');

    // Lift cup to show ball
    setCupsLifted([initialBallPos === 0, initialBallPos === 1, initialBallPos === 2]);

    setTimeout(() => {
      // Lower cup
      setCupsLifted([false, false, false]);
      setGamePhase('shuffling');

      // Start shuffling after a brief pause
      setTimeout(() => {
        performShuffle(initialBallPos, [0, 1, 2], 0);
      }, 500);
    }, 1500);
  }, [gamePhase, bet, state.balance, placeBet]);

  const performShuffle = (ballPos, positions, count) => {
    const shuffles = state.settings.fastMode ? 5 : 10;

    if (count >= shuffles) {
      setGamePhase('guessing');
      return;
    }

    // Swap two random cups
    const newPositions = [...positions];
    const idx1 = Math.floor(Math.random() * 3);
    let idx2 = Math.floor(Math.random() * 3);
    while (idx2 === idx1) idx2 = Math.floor(Math.random() * 3);

    // Swap positions
    [newPositions[idx1], newPositions[idx2]] = [newPositions[idx2], newPositions[idx1]];

    // Update ball position if one of swapped cups had the ball
    let newBallPos = ballPos;
    if (positions[idx1] === ballPos) {
      newBallPos = newPositions.indexOf(positions[idx1]);
    } else if (positions[idx2] === ballPos) {
      newBallPos = newPositions.indexOf(positions[idx2]);
    }

    setCupPositions(newPositions);
    setBallPosition(newBallPos);
    setShuffleCount(count + 1);
    audio.playClick();

    setTimeout(() => {
      performShuffle(newBallPos, newPositions, count + 1);
    }, state.settings.fastMode ? 200 : 400);
  };

  const selectCup = (cupIndex) => {
    if (gamePhase !== 'guessing') return;

    setSelectedCup(cupIndex);
    setGamePhase('result');

    // Reveal all cups
    setCupsLifted([true, true, true]);
    audio.playClick();

    setTimeout(() => {
      // Determine actual ball position
      let actualBallCup;
      if (godMode) {
        actualBallCup = cupIndex; // Always win in god mode
        setBallPosition(cupIndex);
      } else {
        actualBallCup = ballPosition;
      }

      const won = cupIndex === actualBallCup;

      setHistory(h => [{ won, selectedCup: cupIndex, ballPos: actualBallCup }, ...h.slice(0, 3)]);

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

      // Reset after showing result
      setTimeout(() => {
        setCupsLifted([false, false, false]);
        setGamePhase('betting');
      }, 2000);
    }, 500);
  };

  const handleBetChange = (val) => {
    const v = Math.min(Math.max(1, val), state.balance);
    setBet(v);
    setGlobalBet(v);
  };

  const getCupStyle = (cupIndex) => {
    const visualPos = cupPositions.indexOf(cupIndex);
    const xPos = visualPos * 120 + 60; // Space cups evenly
    const lifted = cupsLifted[cupIndex];

    return {
      transform: `translateX(${xPos}px) translateY(${lifted ? '-40px' : '0'})`,
      transition: 'transform 0.3s ease-out'
    };
  };

  return (
    <div className="h-full flex gap-4">
      {/* Game Area - LEFT */}
      <div className="flex-1 bg-gradient-to-b from-[#0a0a12] to-[#0f0f1a] rounded-2xl p-4 flex flex-col items-center justify-center relative">
        {/* Table Surface */}
        <div className="w-full max-w-lg bg-gradient-to-b from-amber-900/30 to-amber-800/20 rounded-3xl p-8 relative">
          {/* Game Status */}
          <div className="text-center mb-8">
            <span className={`px-4 py-2 rounded-full text-sm font-bold ${
              gamePhase === 'betting' ? 'bg-cyan-600/30 text-cyan-400' :
              gamePhase === 'showing' ? 'bg-yellow-600/30 text-yellow-400' :
              gamePhase === 'shuffling' ? 'bg-purple-600/30 text-purple-400' :
              gamePhase === 'guessing' ? 'bg-green-600/30 text-green-400' :
              'bg-gray-600/30 text-gray-400'
            }`}>
              {gamePhase === 'betting' && 'Place your bet'}
              {gamePhase === 'showing' && 'Watch the ball!'}
              {gamePhase === 'shuffling' && `Shuffling... (${shuffleCount})`}
              {gamePhase === 'guessing' && 'Pick a cup!'}
              {gamePhase === 'result' && (result?.won ? 'You found it!' : 'Wrong cup!')}
            </span>
          </div>

          {/* Cups Container */}
          <div className="relative h-40 flex justify-center">
            {/* Ball */}
            <div
              className="absolute bottom-2 w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-lg"
              style={{
                left: `${cupPositions.indexOf(ballPosition) * 120 + 76}px`,
                opacity: (gamePhase === 'showing' || gamePhase === 'result') ? 1 : 0,
                transition: 'opacity 0.3s, left 0.3s'
              }}
            />

            {/* Cups */}
            {[0, 1, 2].map((cupIndex) => (
              <div
                key={cupIndex}
                onClick={() => selectCup(cupIndex)}
                className={`absolute bottom-0 cursor-pointer transition-all ${
                  gamePhase === 'guessing' ? 'hover:scale-105' : ''
                } ${selectedCup === cupIndex ? 'ring-4 ring-yellow-400 rounded-t-full' : ''}`}
                style={getCupStyle(cupIndex)}
              >
                {/* Cup */}
                <div className="relative">
                  <div
                    className="w-24 h-28 bg-gradient-to-b from-amber-600 to-amber-800 rounded-t-full shadow-2xl border-4 border-amber-500"
                    style={{
                      clipPath: 'polygon(10% 100%, 90% 100%, 100% 0%, 0% 0%)'
                    }}
                  >
                    {/* Cup Shine */}
                    <div className="absolute inset-x-4 top-2 bottom-2 bg-gradient-to-r from-amber-400/20 via-amber-300/40 to-amber-400/20 rounded-t-full" />
                  </div>

                  {/* Cup Number */}
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-gray-400 font-bold">
                    #{cupIndex + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Hint */}
          {gamePhase === 'guessing' && (
            <div className="text-center mt-12 text-gray-400 text-sm animate-pulse">
              Click on a cup to reveal the ball
            </div>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className={`mt-6 px-8 py-4 rounded-xl ${
            result.won ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
          }`}>
            <div className="text-center">
              <div className="text-sm mb-1">{result.won ? 'Correct!' : 'Wrong!'}</div>
              <span className="text-2xl font-bold">
                {result.won ? `+$${result.profit.toFixed(2)}` : `-$${Math.abs(result.profit).toFixed(2)}`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Controls - RIGHT */}
      <div className="w-80 bg-[#0a0a12] rounded-2xl p-4 flex flex-col gap-4">
        {/* Bet Amount */}
        <div>
          <label className="text-xs text-gray-500 uppercase font-bold">Bet Amount</label>
          <div className="relative mt-2">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
            <input
              type="number"
              value={bet}
              onChange={(e) => handleBetChange(Number(e.target.value))}
              disabled={gamePhase !== 'betting'}
              className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-lg font-bold"
            />
          </div>
          <div className="grid grid-cols-4 gap-2 mt-2">
            <button onClick={() => handleBetChange(1)} disabled={gamePhase !== 'betting'} className="btn-secondary py-2 text-sm font-bold">MIN</button>
            <button onClick={() => handleBetChange(bet / 2)} disabled={gamePhase !== 'betting'} className="btn-secondary py-2 text-sm font-bold">½</button>
            <button onClick={() => handleBetChange(bet * 2)} disabled={gamePhase !== 'betting'} className="btn-secondary py-2 text-sm font-bold">2x</button>
            <button onClick={() => handleBetChange(state.balance)} disabled={gamePhase !== 'betting'} className="btn-secondary py-2 text-sm font-bold">MAX</button>
          </div>
        </div>

        {/* Game Info */}
        <div className="bg-black/30 rounded-xl p-3">
          <div className="text-xs text-gray-500 mb-2">How to Play</div>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• Watch where the ball is placed</li>
            <li>• Follow the cups as they shuffle</li>
            <li>• Pick the cup with the ball!</li>
          </ul>
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="flex justify-between text-gray-400">
              <span>Win Payout:</span>
              <span className="text-green-400 font-bold">{MULTIPLIER}x</span>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={startGame}
          disabled={gamePhase !== 'betting' || bet <= 0 || bet > state.balance}
          className={`py-4 rounded-xl font-bold text-lg transition-all ${
            gamePhase !== 'betting'
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white'
          }`}
        >
          {gamePhase === 'betting' ? 'START GAME' :
           gamePhase === 'guessing' ? 'PICK A CUP!' :
           'WATCH...'}
        </button>

        {/* History */}
        {history.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs text-gray-500 uppercase font-bold mb-2">History</div>
            <div className="space-y-1">
              {history.map((h, i) => (
                <div
                  key={i}
                  className={`flex justify-between px-3 py-2 rounded-lg text-sm ${
                    h.won ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                  }`}
                >
                  <span>Cup #{h.selectedCup + 1}</span>
                  <span className="font-bold">{h.won ? 'WIN' : 'LOSE'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

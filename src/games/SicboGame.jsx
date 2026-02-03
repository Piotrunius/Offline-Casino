import { useCallback, useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

export default function SicboGame() {
  const { state, placeBet, addWin, setGlobalBet } = useCasino();
  const [bet, setBet] = useState(state.globalBet || 10);
  const [betType, setBetType] = useState('big');
  const [dice, setDice] = useState([1, 1, 1]);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const BET_TYPES = {
    small: { label: 'SMALL (4-10)', check: (d) => { const t = d.reduce((a, b) => a + b, 0); return t >= 4 && t <= 10 && !isTriple(d); }, mult: 2 },
    big: { label: 'BIG (11-17)', check: (d) => { const t = d.reduce((a, b) => a + b, 0); return t >= 11 && t <= 17 && !isTriple(d); }, mult: 2 },
    odd: { label: 'ODD', check: (d) => d.reduce((a, b) => a + b, 0) % 2 === 1, mult: 2 },
    even: { label: 'EVEN', check: (d) => d.reduce((a, b) => a + b, 0) % 2 === 0, mult: 2 },
    triple: { label: 'ANY TRIPLE', check: (d) => isTriple(d), mult: 30 },
    specific4: { label: 'TOTAL = 4', check: (d) => d.reduce((a, b) => a + b, 0) === 4, mult: 60 },
    specific17: { label: 'TOTAL = 17', check: (d) => d.reduce((a, b) => a + b, 0) === 17, mult: 60 },
    specific10: { label: 'TOTAL = 10', check: (d) => d.reduce((a, b) => a + b, 0) === 10, mult: 6 },
    specific11: { label: 'TOTAL = 11', check: (d) => d.reduce((a, b) => a + b, 0) === 11, mult: 6 },
    double: { label: 'ANY DOUBLE', check: (d) => hasDouble(d), mult: 10 }
  };

  const isTriple = (d) => d[0] === d[1] && d[1] === d[2];
  const hasDouble = (d) => d[0] === d[1] || d[1] === d[2] || d[0] === d[2];

  const roll = useCallback(() => {
    if (rolling || bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'sicbo')) return;

    setRolling(true);
    setResult(null);
    audio.playBet();

    const finalDice = [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1
    ];

    const duration = state.settings.fastMode ? 800 : 1500;
    let frame = 0;
    const maxFrames = 30;

    const animate = () => {
      if (frame < maxFrames) {
        setDice([
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1
        ]);
        frame++;
        setTimeout(animate, duration / maxFrames);
      } else {
        setDice(finalDice);
        setRolling(false);

        const total = finalDice.reduce((a, b) => a + b, 0);
        const won = BET_TYPES[betType].check(finalDice);
        const mult = won ? BET_TYPES[betType].mult : 0;
        const winAmount = bet * mult;

        setResult({ dice: finalDice, total, won, mult, profit: winAmount - bet });
        setHistory(h => [{ total, won }, ...h.slice(0, 7)]);

        if (won) {
          addWin(winAmount, bet, 'sicbo', mult);
          audio.playWin();
        } else {
          addWin(0, bet, 'sicbo', 0);
          audio.playLose();
        }
      }
    };
    animate();
  }, [rolling, bet, state.balance, betType, state.settings.fastMode, placeBet, addWin]);

  const handleBetChange = (val) => {
    const v = Math.min(Math.max(1, val), state.balance);
    setBet(v);
    setGlobalBet(v);
  };

  const DICE_DOTS = {
    1: [[50, 50]],
    2: [[25, 25], [75, 75]],
    3: [[25, 25], [50, 50], [75, 75]],
    4: [[25, 25], [75, 25], [25, 75], [75, 75]],
    5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
    6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]]
  };

  const Die = ({ value }) => (
    <div className={`w-20 h-20 bg-white rounded-xl shadow-xl relative ${rolling ? 'animate-bounce' : ''}`}>
      {DICE_DOTS[value]?.map((pos, i) => (
        <div
          key={i}
          className="absolute w-3 h-3 bg-gray-900 rounded-full"
          style={{ left: `${pos[0]}%`, top: `${pos[1]}%`, transform: 'translate(-50%, -50%)' }}
        />
      ))}
    </div>
  );

  const total = dice.reduce((a, b) => a + b, 0);

  return (
    <div className="h-full flex gap-4">
      {/* Game Area - LEFT */}
      <div className="flex-1 bg-gradient-to-b from-[#0a0a12] to-[#12081a] rounded-2xl p-6 flex flex-col">
        {/* Title */}
        <div className="text-center mb-4">
          <h2 className="text-3xl font-black bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent">
            SIC BO
          </h2>
          <p className="text-xs text-gray-500 mt-1">Three Dice Fortune</p>
        </div>

        {/* Dice Area */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="flex gap-4">
            {dice.map((d, i) => <Die key={i} value={d} />)}
          </div>

          {/* Total */}
          <div className="bg-black/50 px-8 py-3 rounded-2xl">
            <span className="text-gray-500 text-sm">TOTAL: </span>
            <span className="text-4xl font-black text-white">{total}</span>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={`text-center py-3 rounded-xl ${result.won ? 'bg-green-900/50 border border-green-500/30' : 'bg-red-900/50 border border-red-500/30'}`}>
            <span className={`text-2xl font-black ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? `${result.mult}x WIN! +$${result.profit.toFixed(2)}` : `LOSE -$${bet.toFixed(2)}`}
            </span>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="flex justify-center gap-2 mt-4">
            {history.map((h, i) => (
              <div key={i} className={`w-10 h-10 rounded-lg flex items-center justify-center font-black ${
                h.won ? 'bg-green-600 text-white' : h.total <= 10 ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
              }`}>
                {h.total}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls - RIGHT */}
      <div className="w-72 flex flex-col gap-3">
        <div className="bg-[#0a0a12] rounded-2xl p-4 flex-1 flex flex-col gap-3">
          {/* Bet Type */}
          <div>
            <label className="text-xs text-gray-500 uppercase font-bold">Bet Type</label>
            <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto pr-1">
              {Object.entries(BET_TYPES).map(([key, type]) => (
                <button
                  key={key}
                  onClick={() => !rolling && setBetType(key)}
                  disabled={rolling}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                    betType === key
                      ? 'bg-gradient-to-b from-cyan-500 to-blue-600 text-white shadow-lg'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <div>{type.label}</div>
                  <div className="text-green-400 mt-0.5">{type.mult}x</div>
                </button>
              ))}
            </div>
          </div>

          {/* Bet Amount */}
          <div>
            <label className="text-xs text-gray-500 uppercase font-bold">Bet Amount</label>
            <div className="relative mt-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
              <input
                type="number"
                value={bet}
                onChange={(e) => handleBetChange(Number(e.target.value))}
                disabled={rolling}
                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-lg font-bold"
              />
            </div>
            <div className="grid grid-cols-4 gap-2 mt-2">
              <button onClick={() => handleBetChange(1)} disabled={rolling} className="btn-secondary py-2 text-sm font-bold">MIN</button>
              <button onClick={() => handleBetChange(bet / 2)} disabled={rolling} className="btn-secondary py-2 text-sm font-bold">½</button>
              <button onClick={() => handleBetChange(bet * 2)} disabled={rolling} className="btn-secondary py-2 text-sm font-bold">2x</button>
              <button onClick={() => handleBetChange(state.balance)} disabled={rolling} className="btn-secondary py-2 text-sm font-bold">MAX</button>
            </div>
          </div>

          {/* Potential Win */}
          <div className="bg-black/30 rounded-xl p-3">
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Potential Win</span>
              <span className="text-green-400 font-black text-xl">${(bet * BET_TYPES[betType].mult).toFixed(2)}</span>
            </div>
          </div>

          {/* Roll Button */}
          <button
            onClick={roll}
            disabled={rolling || bet <= 0 || bet > state.balance}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white font-black text-xl disabled:opacity-50 mt-auto shadow-lg shadow-red-500/30"
          >
            {rolling ? '🎲 ROLLING...' : '🎲 ROLL DICE'}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useCallback, useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const EMPTY = 0;
const HUMAN = 1;
const AI = 2;

export default function TicTacToeGame() {
  const { state, placeBet, addWin, setGlobalBet } = useCasino();
  const [bet, setBet] = useState(state.globalBet || 10);
  const [gamePhase, setGamePhase] = useState('betting');
  const [board, setBoard] = useState(Array(9).fill(EMPTY));
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const handleBetChange = (val) => {
    const v = Math.min(Math.max(1, val), state.balance);
    setBet(v);
    setGlobalBet(v);
  };

  const checkWinner = (tiles) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6]
    ];

    for (let line of lines) {
      const [a, b, c] = line;
      if (tiles[a] !== EMPTY && tiles[a] === tiles[b] && tiles[b] === tiles[c]) {
        return tiles[a];
      }
    }
    return EMPTY;
  };

  const getAIMove = (tiles) => {
    // Check if AI can win
    for (let i = 0; i < 9; i++) {
      if (tiles[i] === EMPTY) {
        const test = [...tiles];
        test[i] = AI;
        if (checkWinner(test) === AI) return i;
      }
    }

    // Check if human can win and block
    for (let i = 0; i < 9; i++) {
      if (tiles[i] === EMPTY) {
        const test = [...tiles];
        test[i] = HUMAN;
        if (checkWinner(test) === HUMAN) return i;
      }
    }

    // Take center
    if (tiles[4] === EMPTY) return 4;

    // Take corners
    const corners = [0, 2, 6, 8].filter(i => tiles[i] === EMPTY);
    if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];

    // Take sides
    const sides = [1, 3, 5, 7].filter(i => tiles[i] === EMPTY);
    if (sides.length > 0) return sides[Math.floor(Math.random() * sides.length)];

    return -1;
  };

  const startGame = useCallback(() => {
    if (bet <= 0 || bet > state.balance) return;
    if (!placeBet(bet, 'tictactoe')) return;

    audio.playBet();
    setBoard(Array(9).fill(EMPTY));
    setGamePhase('playing');
    setResult(null);
  }, [bet, state.balance, placeBet]);

  const makeMove = (index) => {
    if (board[index] !== EMPTY || gamePhase !== 'playing') return;

    let newBoard = [...board];
    newBoard[index] = HUMAN;

    let winner = checkWinner(newBoard);
    if (winner === HUMAN) {
      audio.playWin();
      addWin(bet * 2, 'tictactoe');
      setResult({ winner: HUMAN, won: true });
      setHistory(h => [{ won: true }, ...h.slice(0, 4)]);
      setGamePhase('result');
      setBoard(newBoard);
      return;
    }

    if (!newBoard.includes(EMPTY)) {
      audio.playLose();
      setResult({ winner: EMPTY, won: false });
      setHistory(h => [{ won: false }, ...h.slice(0, 4)]);
      setGamePhase('result');
      setBoard(newBoard);
      return;
    }

    // AI Move
    const aiMove = getAIMove(newBoard);
    if (aiMove === -1) {
      audio.playLose();
      setResult({ winner: EMPTY, won: false });
      setHistory(h => [{ won: false }, ...h.slice(0, 4)]);
      setGamePhase('result');
      setBoard(newBoard);
      return;
    }

    newBoard[aiMove] = AI;

    winner = checkWinner(newBoard);
    if (winner === AI) {
      audio.playLose();
      setResult({ winner: AI, won: false });
      setHistory(h => [{ won: false }, ...h.slice(0, 4)]);
      setGamePhase('result');
      setBoard(newBoard);
      return;
    }

    setBoard(newBoard);
  };

  const newGame = () => {
    setBoard(Array(9).fill(EMPTY));
    setResult(null);
    setGamePhase('betting');
  };

  return (
    <div className="h-full flex gap-4">
      {/* Game Area - LEFT */}
      <div className="flex-1 bg-gradient-to-b from-[#0a0a12] to-[#0f0f1a] rounded-2xl p-5 flex flex-col items-center justify-center gap-6">
        {/* Title */}
        <div className="text-2xl font-bold text-cyan-400">
          {gamePhase === 'betting' && 'Tic Tac Toe'}
          {gamePhase === 'playing' && `Your Move (X)`}
          {gamePhase === 'result' && (result?.won ? '🎉 You Win!' : result?.winner === 2 ? '❌ AI Wins' : '🤝 Draw')}
        </div>

        {/* Game Board */}
        <div className="grid grid-cols-3 gap-2 p-4 bg-gray-900 rounded-xl border-2 border-gray-700">
          {board.map((cell, idx) => (
            <button
              key={idx}
              onClick={() => makeMove(idx)}
              disabled={gamePhase !== 'playing' || cell !== EMPTY}
              className="w-20 h-20 bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 rounded-lg text-4xl font-bold transition-all hover:from-gray-700 hover:to-gray-800 disabled:opacity-50"
            >
              {cell === HUMAN ? <span className="text-cyan-400">X</span> : cell === AI ? <span className="text-red-400">O</span> : ''}
            </button>
          ))}
        </div>

        {/* Result Message */}
        {result && (
          <div className={`text-center p-4 rounded-lg ${result.won ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
            <div className={`text-xl font-bold mb-2 ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.won ? `+$${(bet * 2).toFixed(0)}` : 'Game Over'}
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="flex justify-center gap-2 flex-wrap">
            {history.map((h, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  h.won ? 'bg-green-600' : 'bg-red-600'
                }`}
              >
                {h.won ? '✓' : '✗'}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls - RIGHT */}
      <div className="bg-[#0a0a12] rounded-2xl p-4 flex-1 flex flex-col gap-4">
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
        </div>

        {/* Quick Bet */}
        <div className="grid grid-cols-3 gap-2">
          {[10, 25, 50, 100, 250, 500].map(v => (
            <button
              key={v}
              onClick={() => handleBetChange(v)}
              disabled={gamePhase !== 'betting'}
              className={`py-2 rounded-lg text-sm font-bold ${bet === v ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'} disabled:opacity-50`}
            >
              ${v}
            </button>
          ))}
        </div>

        {/* How to Play */}
        <div className="p-3 bg-gray-800/50 rounded-lg">
          <div className="text-xs font-bold text-cyan-400 mb-2">How to Play</div>
          <div className="text-xs text-gray-400 space-y-1">
            <div>• You are X</div>
            <div>• AI is O</div>
            <div>• Get 3 in a row to win</div>
            <div>• Win pays 2:1</div>
            <div>• Draw = Lost bet</div>
          </div>
        </div>

        {/* Rules */}
        <div className="p-3 bg-gray-800/50 rounded-lg">
          <div className="text-xs font-bold text-cyan-400 mb-2">Rules</div>
          <div className="text-xs text-gray-400">
            AI plays with strategy to block and win
          </div>
        </div>

        {/* Action Button */}
        {gamePhase === 'betting' ? (
          <button
            onClick={startGame}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg transition-all mt-auto"
          >
            START GAME
          </button>
        ) : (
          <button
            onClick={newGame}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg mt-auto"
          >
            NEW GAME
          </button>
        )}

        {/* Stats */}
        <div className="text-xs text-gray-500 text-center">
          <div>Your Balance: <span className="text-cyan-400 font-bold">${state.balance.toFixed(0)}</span></div>
        </div>
      </div>
    </div>
  );
}

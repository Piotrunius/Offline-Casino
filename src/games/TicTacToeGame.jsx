import { useCallback, useEffect, useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const WIN_MULTIPLIER = 1.5;
const TIE_MULTIPLIER = 0; // Tie returns nothing (lose)

const WINNING_LINES = [
  [0, 1, 2], // Top row
  [3, 4, 5], // Middle row
  [6, 7, 8], // Bottom row
  [0, 3, 6], // Left column
  [1, 4, 7], // Middle column
  [2, 5, 8], // Right column
  [0, 4, 8], // Diagonal
  [2, 4, 6]  // Anti-diagonal
];

export default function TicTacToeGame() {
  const { state, placeBet, addWin, setGlobalBet } = useCasino();
  const [bet, setBet] = useState(state.globalBet || 10);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gamePhase, setGamePhase] = useState('betting'); // betting, playing, ended
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [winLine, setWinLine] = useState(null);
  const [difficulty, setDifficulty] = useState('medium'); // easy, medium, hard

  const godMode = state.adminSettings?.godMode;

  const checkWinner = (squares) => {
    for (const line of WINNING_LINES) {
      const [a, b, c] = line;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line };
      }
    }
    return null;
  };

  const isBoardFull = (squares) => squares.every(s => s !== null);

  const getAIMove = useCallback((squares, aiDifficulty) => {
    const emptySquares = squares.map((s, i) => s === null ? i : null).filter(i => i !== null);

    if (emptySquares.length === 0) return null;

    // In god mode, AI makes stupid moves
    if (godMode) {
      return emptySquares[Math.floor(Math.random() * emptySquares.length)];
    }

    // Easy: Random moves
    if (aiDifficulty === 'easy') {
      return emptySquares[Math.floor(Math.random() * emptySquares.length)];
    }

    // Check for winning move
    for (const idx of emptySquares) {
      const testBoard = [...squares];
      testBoard[idx] = 'O';
      if (checkWinner(testBoard)?.winner === 'O') {
        return idx;
      }
    }

    // Check for blocking move
    for (const idx of emptySquares) {
      const testBoard = [...squares];
      testBoard[idx] = 'X';
      if (checkWinner(testBoard)?.winner === 'X') {
        return idx;
      }
    }

    // Medium: Random after blocking/winning
    if (aiDifficulty === 'medium') {
      return emptySquares[Math.floor(Math.random() * emptySquares.length)];
    }

    // Hard: Strategic moves
    // Prefer center
    if (squares[4] === null) return 4;

    // Prefer corners
    const corners = [0, 2, 6, 8].filter(i => squares[i] === null);
    if (corners.length > 0) {
      return corners[Math.floor(Math.random() * corners.length)];
    }

    // Any edge
    return emptySquares[Math.floor(Math.random() * emptySquares.length)];
  }, [godMode]);

  const startGame = useCallback(async () => {
    if (gamePhase !== 'betting' || bet <= 0 || bet > state.balance) return;

    const confirmed = await placeBet(bet, 'tictactoe');
    if (!confirmed) return;

    audio.playBet();
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setResult(null);
    setWinLine(null);
    setGamePhase('playing');
  }, [gamePhase, bet, state.balance, placeBet]);

  const makeMove = useCallback((index) => {
    if (gamePhase !== 'playing' || !isPlayerTurn || board[index] !== null) return;

    audio.playClick();
    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);

    // Check for win/tie
    const winResult = checkWinner(newBoard);
    if (winResult) {
      setWinLine(winResult.line);
      endGame('win', newBoard);
      return;
    }

    if (isBoardFull(newBoard)) {
      endGame('tie', newBoard);
      return;
    }

    setIsPlayerTurn(false);
  }, [gamePhase, isPlayerTurn, board]);

  // AI makes move
  useEffect(() => {
    if (gamePhase !== 'playing' || isPlayerTurn) return;

    const timeout = setTimeout(() => {
      const aiMove = getAIMove(board, difficulty);
      if (aiMove === null) return;

      audio.playClick();
      const newBoard = [...board];
      newBoard[aiMove] = 'O';
      setBoard(newBoard);

      // Check for win/tie
      const winResult = checkWinner(newBoard);
      if (winResult) {
        setWinLine(winResult.line);
        endGame('lose', newBoard);
        return;
      }

      if (isBoardFull(newBoard)) {
        endGame('tie', newBoard);
        return;
      }

      setIsPlayerTurn(true);
    }, state.settings.fastMode ? 300 : 700);

    return () => clearTimeout(timeout);
  }, [isPlayerTurn, gamePhase, board, difficulty, getAIMove, state.settings.fastMode]);

  const endGame = (outcome, finalBoard) => {
    setGamePhase('ended');
    setHistory(h => [{ outcome, board: finalBoard }, ...h.slice(0, 3)]);

    if (outcome === 'win') {
      const winAmount = bet * (WIN_MULTIPLIER + 1);
      addWin(winAmount, bet, 'tictactoe', WIN_MULTIPLIER + 1);
      setResult({ won: true, outcome: 'win', profit: winAmount - bet });
      audio.playWin();
    } else if (outcome === 'lose') {
      addWin(0, bet, 'tictactoe', 0);
      setResult({ won: false, outcome: 'lose', profit: -bet });
      audio.playLose();
    } else {
      // Tie - player loses bet
      addWin(0, bet, 'tictactoe', 0);
      setResult({ won: false, outcome: 'tie', profit: -bet });
      audio.playLose();
    }
  };

  const handleBetChange = (val) => {
    const v = Math.min(Math.max(1, val), state.balance);
    setBet(v);
    setGlobalBet(v);
  };

  return (
    <div className="h-full flex gap-4">
      {/* Game Area - LEFT */}
      <div className="flex-1 bg-gradient-to-b from-[#0a0a12] to-[#0f0f1a] rounded-2xl p-4 flex flex-col items-center justify-center">
        {/* Game Status */}
        <div className="mb-6">
          <span className={`px-4 py-2 rounded-full text-sm font-bold ${
            gamePhase === 'betting' ? 'bg-cyan-600/30 text-cyan-400' :
            gamePhase === 'playing' && isPlayerTurn ? 'bg-green-600/30 text-green-400' :
            gamePhase === 'playing' ? 'bg-yellow-600/30 text-yellow-400' :
            result?.won ? 'bg-green-600/30 text-green-400' :
            'bg-red-600/30 text-red-400'
          }`}>
            {gamePhase === 'betting' && 'Place your bet to start'}
            {gamePhase === 'playing' && isPlayerTurn && 'Your turn (X)'}
            {gamePhase === 'playing' && !isPlayerTurn && 'AI thinking...'}
            {gamePhase === 'ended' && result?.outcome === 'win' && '🎉 You win!'}
            {gamePhase === 'ended' && result?.outcome === 'lose' && 'AI wins!'}
            {gamePhase === 'ended' && result?.outcome === 'tie' && 'It\'s a tie!'}
          </span>
        </div>

        {/* Board */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-black/30 rounded-2xl">
          {board.map((cell, index) => (
            <button
              key={index}
              onClick={() => makeMove(index)}
              disabled={gamePhase !== 'playing' || !isPlayerTurn || cell !== null}
              className={`w-24 h-24 rounded-xl text-5xl font-black transition-all ${
                cell === null && gamePhase === 'playing' && isPlayerTurn
                  ? 'bg-gray-800 hover:bg-gray-700 cursor-pointer'
                  : 'bg-gray-800/50 cursor-default'
              } ${winLine?.includes(index) ? 'ring-4 ring-yellow-400' : ''}`}
            >
              {cell === 'X' && <span className="text-cyan-400">X</span>}
              {cell === 'O' && <span className="text-red-400">O</span>}
            </button>
          ))}
        </div>

        {/* Result */}
        {result && (
          <div className={`mt-6 px-8 py-4 rounded-xl ${
            result.won ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
          }`}>
            <div className="text-center">
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

        {/* Difficulty */}
        <div>
          <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">AI Difficulty</label>
          <div className="grid grid-cols-3 gap-2">
            {['easy', 'medium', 'hard'].map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                disabled={gamePhase !== 'betting'}
                className={`py-2 rounded-lg font-bold text-sm transition-all ${
                  difficulty === d
                    ? d === 'easy' ? 'bg-green-600 text-white' :
                      d === 'medium' ? 'bg-yellow-600 text-white' :
                      'bg-red-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Payout Info */}
        <div className="bg-black/30 rounded-xl p-3">
          <div className="flex justify-between text-gray-400">
            <span>Win Payout:</span>
            <span className="text-green-400 font-bold">{WIN_MULTIPLIER + 1}x</span>
          </div>
          <div className="flex justify-between text-gray-400 mt-1">
            <span>Tie:</span>
            <span className="text-red-400 font-bold">Lose bet</span>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Beat the AI to win! Ties count as a loss.
          </div>
        </div>

        {/* Start/New Game Button */}
        <button
          onClick={gamePhase === 'ended' ? () => setGamePhase('betting') : startGame}
          disabled={gamePhase === 'playing' || (gamePhase === 'betting' && (bet <= 0 || bet > state.balance))}
          className={`py-4 rounded-xl font-bold text-lg transition-all ${
            gamePhase === 'playing'
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white'
          }`}
        >
          {gamePhase === 'betting' ? 'START GAME' :
           gamePhase === 'playing' ? 'PLAYING...' :
           'NEW GAME'}
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
                    h.outcome === 'win' ? 'bg-green-900/30 text-green-400' :
                    h.outcome === 'tie' ? 'bg-gray-700/30 text-gray-400' :
                    'bg-red-900/30 text-red-400'
                  }`}
                >
                  <span className="text-xs uppercase">{h.outcome}</span>
                  <span className="font-bold">{h.outcome === 'win' ? 'WIN' : 'LOSE'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LastWins({ history }) {
  if (!history || history.length === 0) return null;

  return (
    <div className="absolute bottom-4 right-4 flex gap-2">
      {history.slice(0, 4).map((h, i) => (
        <div
          key={i}
          className={`px-3 py-2 rounded-lg text-sm font-bold backdrop-blur-sm transition-smooth hover-scale stagger-item animate-bounce-in ${
            h.won
              ? 'bg-green-500/30 text-green-400 border border-green-500/50 hover:border-green-400 hover:bg-green-500/40'
              : 'bg-red-500/30 text-red-400 border border-red-500/50 hover:border-red-400 hover:bg-red-500/40'
          }`}
          style={{ animationDelay: `${i * 50}ms` }}
        >
          {h.mult ? `${h.mult.toFixed(2)}x` : h.won ? '✓' : '✗'}
        </div>
      ))}
    </div>
  );
}

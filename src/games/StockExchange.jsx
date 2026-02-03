import { useCallback, useState, useEffect, useRef } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

// Mock stocks with realistic behaviors
const INITIAL_STOCKS = [
  { symbol: 'NEON', name: 'Neon Industries', price: 150.00, volatility: 0.03, trend: 0.001, sector: 'tech' },
  { symbol: 'GLXY', name: 'Galaxy Corp', price: 85.50, volatility: 0.04, trend: -0.001, sector: 'tech' },
  { symbol: 'BOLT', name: 'Bolt Energy', price: 220.00, volatility: 0.025, trend: 0.002, sector: 'energy' },
  { symbol: 'APEX', name: 'Apex Gaming', price: 45.00, volatility: 0.05, trend: 0.0005, sector: 'gaming' },
  { symbol: 'CRSN', name: 'Crescent Finance', price: 320.00, volatility: 0.02, trend: 0.0015, sector: 'finance' },
  { symbol: 'VOID', name: 'Void Technologies', price: 12.50, volatility: 0.08, trend: -0.002, sector: 'tech' },
  { symbol: 'FLUX', name: 'Flux Dynamics', price: 95.00, volatility: 0.035, trend: 0.001, sector: 'industrial' },
  { symbol: 'NOVA', name: 'Nova Pharmaceuticals', price: 180.00, volatility: 0.03, trend: 0.0025, sector: 'healthcare' },
  { symbol: 'ZETA', name: 'Zeta Mining', price: 28.00, volatility: 0.06, trend: -0.0015, sector: 'materials' },
  { symbol: 'PRMA', name: 'Prima Retail', price: 62.00, volatility: 0.04, trend: 0, sector: 'consumer' }
];

const NEWS_EVENTS = [
  { type: 'positive', message: '{symbol} announces record earnings!', impact: 0.08 },
  { type: 'positive', message: '{symbol} secures major government contract', impact: 0.12 },
  { type: 'positive', message: 'Analysts upgrade {symbol} to BUY', impact: 0.05 },
  { type: 'positive', message: '{symbol} launches revolutionary new product', impact: 0.1 },
  { type: 'negative', message: '{symbol} misses quarterly expectations', impact: -0.07 },
  { type: 'negative', message: 'CEO of {symbol} resigns unexpectedly', impact: -0.1 },
  { type: 'negative', message: '{symbol} faces regulatory investigation', impact: -0.15 },
  { type: 'negative', message: 'Analysts downgrade {symbol} to SELL', impact: -0.06 },
  { type: 'neutral', message: '{symbol} announces stock split', impact: 0 },
  { type: 'neutral', message: '{symbol} to release earnings next week', impact: 0.02 }
];

const SECTORS = ['tech', 'energy', 'gaming', 'finance', 'industrial', 'healthcare', 'materials', 'consumer'];

export default function StockExchange() {
  const { state, setBalance } = useCasino();
  const [stocks, setStocks] = useState(INITIAL_STOCKS);
  const [portfolio, setPortfolio] = useState({});
  const [selectedStock, setSelectedStock] = useState(INITIAL_STOCKS[0]);
  const [orderType, setOrderType] = useState('buy'); // buy, sell
  const [orderAmount, setOrderAmount] = useState(1);
  const [priceHistory, setPriceHistory] = useState({});
  const [news, setNews] = useState([]);
  const [marketStatus, setMarketStatus] = useState('open'); // open, closed
  const [timeSpeed, setTimeSpeed] = useState(1); // 1x, 2x, 5x
  const [chartTimeframe, setChartTimeframe] = useState('1h'); // 1m, 5m, 1h, 1d
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(0);
  const [watchlist, setWatchlist] = useState(['NEON', 'BOLT', 'APEX']);
  const [orderHistory, setOrderHistory] = useState([]);
  const [marketTrend, setMarketTrend] = useState(0); // Overall market direction
  const tickRef = useRef(null);

  // Initialize price history
  useEffect(() => {
    const history = {};
    stocks.forEach(stock => {
      history[stock.symbol] = generateInitialHistory(stock.price, 100);
    });
    setPriceHistory(history);
  }, []);

  // Generate initial price history
  const generateInitialHistory = (currentPrice, points) => {
    const history = [];
    let price = currentPrice * 0.9; // Start 10% lower
    for (let i = 0; i < points; i++) {
      price *= 1 + (Math.random() - 0.48) * 0.02;
      history.push({
        time: Date.now() - (points - i) * 60000,
        price: Math.max(0.01, price)
      });
    }
    return history;
  };

  // Market simulation tick
  useEffect(() => {
    const tick = () => {
      if (marketStatus !== 'open') return;

      // Update market trend randomly
      setMarketTrend(prev => {
        const change = (Math.random() - 0.5) * 0.002;
        return Math.max(-0.01, Math.min(0.01, prev + change));
      });

      // Update all stock prices
      setStocks(prevStocks => prevStocks.map(stock => {
        const marketEffect = marketTrend;
        const randomWalk = (Math.random() - 0.5) * 2 * stock.volatility;
        const trendEffect = stock.trend;
        const priceChange = 1 + marketEffect + randomWalk + trendEffect;
        const newPrice = Math.max(0.01, stock.price * priceChange);
        
        return { ...stock, price: newPrice };
      }));

      // Update price history
      setPriceHistory(prev => {
        const newHistory = { ...prev };
        stocks.forEach(stock => {
          if (newHistory[stock.symbol]) {
            newHistory[stock.symbol] = [
              ...newHistory[stock.symbol].slice(-199),
              { time: Date.now(), price: stock.price }
            ];
          }
        });
        return newHistory;
      });

      // Random news events (1% chance per tick)
      if (Math.random() < 0.01) {
        generateNewsEvent();
      }
    };

    tickRef.current = setInterval(tick, 1000 / timeSpeed);
    return () => clearInterval(tickRef.current);
  }, [marketStatus, stocks, marketTrend, timeSpeed]);

  // Calculate portfolio value
  useEffect(() => {
    let total = 0;
    Object.entries(portfolio).forEach(([symbol, shares]) => {
      const stock = stocks.find(s => s.symbol === symbol);
      if (stock) {
        total += stock.price * shares;
      }
    });
    setTotalPortfolioValue(total);
  }, [portfolio, stocks]);

  const generateNewsEvent = () => {
    const randomStock = stocks[Math.floor(Math.random() * stocks.length)];
    const event = NEWS_EVENTS[Math.floor(Math.random() * NEWS_EVENTS.length)];
    
    const newsItem = {
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      symbol: randomStock.symbol,
      message: event.message.replace('{symbol}', randomStock.symbol),
      type: event.type,
      impact: event.impact
    };

    setNews(prev => [newsItem, ...prev.slice(0, 9)]);

    // Apply news impact to stock price
    setStocks(prev => prev.map(s => {
      if (s.symbol === randomStock.symbol) {
        return { ...s, price: s.price * (1 + event.impact) };
      }
      return s;
    }));

    audio.playClick();
  };

  const executeTrade = useCallback(() => {
    if (!selectedStock || orderAmount <= 0) return;

    const stock = stocks.find(s => s.symbol === selectedStock.symbol);
    if (!stock) return;

    const totalCost = stock.price * orderAmount;

    if (orderType === 'buy') {
      if (totalCost > state.balance) {
        audio.playLose();
        return;
      }

      setBalance(state.balance - totalCost);
      setPortfolio(prev => ({
        ...prev,
        [stock.symbol]: (prev[stock.symbol] || 0) + orderAmount
      }));

      setOrderHistory(prev => [{
        id: Date.now(),
        type: 'buy',
        symbol: stock.symbol,
        shares: orderAmount,
        price: stock.price,
        total: totalCost
      }, ...prev.slice(0, 19)]);

      audio.playBet();
    } else {
      const currentShares = portfolio[stock.symbol] || 0;
      if (orderAmount > currentShares) {
        audio.playLose();
        return;
      }

      setBalance(state.balance + totalCost);
      setPortfolio(prev => {
        const newShares = prev[stock.symbol] - orderAmount;
        if (newShares <= 0) {
          const { [stock.symbol]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [stock.symbol]: newShares };
      });

      setOrderHistory(prev => [{
        id: Date.now(),
        type: 'sell',
        symbol: stock.symbol,
        shares: orderAmount,
        price: stock.price,
        total: totalCost
      }, ...prev.slice(0, 19)]);

      audio.playWin();
    }
  }, [selectedStock, orderAmount, orderType, stocks, state.balance, portfolio, setBalance]);

  const toggleWatchlist = (symbol) => {
    setWatchlist(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  // Mini chart component
  const MiniChart = ({ symbol, width = 100, height = 40 }) => {
    const history = priceHistory[symbol] || [];
    if (history.length < 2) return null;

    const prices = history.map(h => h.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    const points = prices.map((p, i) => {
      const x = (i / (prices.length - 1)) * width;
      const y = height - ((p - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    const isUp = prices[prices.length - 1] > prices[0];

    return (
      <svg width={width} height={height} className="opacity-60">
        <polyline
          points={points}
          fill="none"
          stroke={isUp ? '#22c55e' : '#ef4444'}
          strokeWidth="1.5"
        />
      </svg>
    );
  };

  // Main chart
  const MainChart = () => {
    const history = priceHistory[selectedStock?.symbol] || [];
    if (history.length < 2) return <div className="text-gray-500">Loading...</div>;

    const width = 500;
    const height = 200;
    const prices = history.map(h => h.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    const points = prices.map((p, i) => {
      const x = (i / (prices.length - 1)) * width;
      const y = height - ((p - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    const isUp = prices[prices.length - 1] > prices[0];

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => (
          <g key={pct}>
            <line
              x1="0" y1={height * pct}
              x2={width} y2={height * pct}
              stroke="#333"
              strokeWidth="0.5"
            />
            <text
              x={width + 5}
              y={height * pct + 4}
              fill="#666"
              fontSize="10"
            >
              ${(max - range * pct).toFixed(2)}
            </text>
          </g>
        ))}
        
        {/* Area fill */}
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity="0.3" />
            <stop offset="100%" stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`0,${height} ${points} ${width},${height}`}
          fill="url(#chartGradient)"
        />
        
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={isUp ? '#22c55e' : '#ef4444'}
          strokeWidth="2"
        />
      </svg>
    );
  };

  const getPriceChange = (stock) => {
    const history = priceHistory[stock.symbol] || [];
    if (history.length < 2) return { change: 0, percent: 0 };
    const oldPrice = history[0].price;
    const change = stock.price - oldPrice;
    const percent = (change / oldPrice) * 100;
    return { change, percent };
  };

  return (
    <div className="h-full flex gap-4">
      {/* Left Panel - Market Overview */}
      <div className="w-72 bg-[#0a0a12] rounded-2xl p-4 flex flex-col gap-4 overflow-hidden">
        {/* Market Status */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-white">Market</h2>
            <div className={`text-xs ${marketStatus === 'open' ? 'text-green-400' : 'text-red-400'}`}>
              {marketStatus.toUpperCase()}
            </div>
          </div>
          <button
            onClick={() => setMarketStatus(s => s === 'open' ? 'closed' : 'open')}
            className={`px-3 py-1 rounded text-xs font-bold ${
              marketStatus === 'open' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {marketStatus === 'open' ? 'PAUSE' : 'RESUME'}
          </button>
        </div>

        {/* Speed Control */}
        <div className="flex gap-1">
          {[1, 2, 5].map(speed => (
            <button
              key={speed}
              onClick={() => setTimeSpeed(speed)}
              className={`flex-1 py-1 rounded text-xs font-bold ${
                timeSpeed === speed ? 'bg-cyan-600' : 'bg-gray-800'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>

        {/* Market Trend */}
        <div className="bg-black/30 rounded-lg p-2">
          <div className="text-xs text-gray-500 mb-1">Market Trend</div>
          <div className={`text-lg font-bold ${marketTrend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {marketTrend >= 0 ? '📈' : '📉'} {(marketTrend * 100).toFixed(3)}%
          </div>
        </div>

        {/* Stock List */}
        <div className="flex-1 overflow-y-auto space-y-1">
          <div className="text-xs text-gray-500 mb-2">ALL STOCKS</div>
          {stocks.map(stock => {
            const { change, percent } = getPriceChange(stock);
            const isUp = percent >= 0;
            return (
              <button
                key={stock.symbol}
                onClick={() => setSelectedStock(stock)}
                className={`w-full p-2 rounded-lg transition-all flex items-center gap-2 ${
                  selectedStock?.symbol === stock.symbol
                    ? 'bg-cyan-600/20 border border-cyan-500'
                    : 'bg-black/30 hover:bg-black/50'
                }`}
              >
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{stock.symbol}</span>
                    {watchlist.includes(stock.symbol) && (
                      <span className="text-yellow-400 text-xs">★</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">${stock.price.toFixed(2)}</div>
                </div>
                <div className="text-right">
                  <MiniChart symbol={stock.symbol} width={50} height={20} />
                  <div className={`text-xs font-bold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                    {isUp ? '+' : ''}{percent.toFixed(2)}%
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Area - Chart & Details */}
      <div className="flex-1 bg-gradient-to-b from-[#0a0a12] to-[#0f0f1a] rounded-2xl p-4 flex flex-col gap-4">
        {selectedStock && (
          <>
            {/* Stock Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-white">{selectedStock.symbol}</h2>
                  <button
                    onClick={() => toggleWatchlist(selectedStock.symbol)}
                    className={`text-xl ${watchlist.includes(selectedStock.symbol) ? 'text-yellow-400' : 'text-gray-600'}`}
                  >
                    ★
                  </button>
                </div>
                <div className="text-gray-500">{selectedStock.name}</div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">${selectedStock.price.toFixed(2)}</div>
                {(() => {
                  const { change, percent } = getPriceChange(selectedStock);
                  const isUp = percent >= 0;
                  return (
                    <div className={`text-lg ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                      {isUp ? '+' : ''}{change.toFixed(2)} ({isUp ? '+' : ''}{percent.toFixed(2)}%)
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Chart */}
            <div className="flex-1 bg-black/30 rounded-xl p-4 min-h-[200px]">
              <MainChart />
            </div>

            {/* Stock Info */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-black/30 rounded-lg p-3">
                <div className="text-xs text-gray-500">Sector</div>
                <div className="text-white font-bold capitalize">{selectedStock.sector}</div>
              </div>
              <div className="bg-black/30 rounded-lg p-3">
                <div className="text-xs text-gray-500">Volatility</div>
                <div className="text-white font-bold">{(selectedStock.volatility * 100).toFixed(1)}%</div>
              </div>
              <div className="bg-black/30 rounded-lg p-3">
                <div className="text-xs text-gray-500">Your Shares</div>
                <div className="text-white font-bold">{portfolio[selectedStock.symbol] || 0}</div>
              </div>
              <div className="bg-black/30 rounded-lg p-3">
                <div className="text-xs text-gray-500">Position Value</div>
                <div className="text-white font-bold">
                  ${((portfolio[selectedStock.symbol] || 0) * selectedStock.price).toFixed(2)}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right Panel - Trading & Portfolio */}
      <div className="w-80 bg-[#0a0a12] rounded-2xl p-4 flex flex-col gap-4">
        {/* Account Summary */}
        <div className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">Account Balance</div>
          <div className="text-2xl font-bold text-white">${state.balance.toFixed(2)}</div>
          <div className="mt-2 pt-2 border-t border-white/10">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Portfolio Value:</span>
              <span className="text-white font-bold">${totalPortfolioValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-400">Total Assets:</span>
              <span className="text-green-400 font-bold">${(state.balance + totalPortfolioValue).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Trade Panel */}
        {selectedStock && (
          <div className="bg-black/30 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-3">TRADE {selectedStock.symbol}</div>
            
            {/* Buy/Sell Toggle */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => setOrderType('buy')}
                className={`py-2 rounded-lg font-bold ${
                  orderType === 'buy' ? 'bg-green-600' : 'bg-gray-800 text-gray-400'
                }`}
              >
                BUY
              </button>
              <button
                onClick={() => setOrderType('sell')}
                className={`py-2 rounded-lg font-bold ${
                  orderType === 'sell' ? 'bg-red-600' : 'bg-gray-800 text-gray-400'
                }`}
              >
                SELL
              </button>
            </div>

            {/* Amount */}
            <div className="mb-3">
              <label className="text-xs text-gray-500">Shares</label>
              <input
                type="number"
                value={orderAmount}
                onChange={(e) => setOrderAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-white mt-1"
                min="1"
              />
              <div className="flex gap-1 mt-1">
                {[1, 5, 10, 50].map(n => (
                  <button
                    key={n}
                    onClick={() => setOrderAmount(n)}
                    className="flex-1 py-1 bg-gray-800 rounded text-xs"
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="bg-black/50 rounded-lg p-3 mb-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Total:</span>
                <span className="text-white font-bold">
                  ${(selectedStock.price * orderAmount).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Execute Button */}
            <button
              onClick={executeTrade}
              disabled={
                (orderType === 'buy' && selectedStock.price * orderAmount > state.balance) ||
                (orderType === 'sell' && orderAmount > (portfolio[selectedStock.symbol] || 0))
              }
              className={`w-full py-3 rounded-lg font-bold transition-all ${
                orderType === 'buy'
                  ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400'
                  : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {orderType === 'buy' ? 'BUY' : 'SELL'} {orderAmount} SHARES
            </button>
          </div>
        )}

        {/* Portfolio Holdings */}
        <div className="flex-1 overflow-y-auto">
          <div className="text-xs text-gray-500 mb-2">YOUR PORTFOLIO</div>
          {Object.entries(portfolio).length === 0 ? (
            <div className="text-gray-600 text-sm text-center py-4">
              No holdings yet
            </div>
          ) : (
            <div className="space-y-1">
              {Object.entries(portfolio).map(([symbol, shares]) => {
                const stock = stocks.find(s => s.symbol === symbol);
                if (!stock) return null;
                return (
                  <div
                    key={symbol}
                    onClick={() => setSelectedStock(stock)}
                    className="bg-black/30 rounded-lg p-2 cursor-pointer hover:bg-black/50"
                  >
                    <div className="flex justify-between">
                      <span className="font-bold text-white">{symbol}</span>
                      <span className="text-gray-400">{shares} shares</span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-gray-500">${stock.price.toFixed(2)}</span>
                      <span className="text-green-400">${(shares * stock.price).toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* News Feed */}
        <div className="max-h-40 overflow-y-auto">
          <div className="text-xs text-gray-500 mb-2">NEWS FEED</div>
          {news.length === 0 ? (
            <div className="text-gray-600 text-xs text-center py-2">No news yet</div>
          ) : (
            <div className="space-y-1">
              {news.slice(0, 5).map(item => (
                <div
                  key={item.id}
                  className={`text-xs p-2 rounded ${
                    item.type === 'positive' ? 'bg-green-900/20 text-green-400' :
                    item.type === 'negative' ? 'bg-red-900/20 text-red-400' :
                    'bg-gray-900/20 text-gray-400'
                  }`}
                >
                  <span className="text-gray-500">{item.time}</span> {item.message}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

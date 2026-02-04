import { useCallback, useEffect, useRef, useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import audio from '../utils/audioEngine';

const STOCK_CONFIG = [
  { symbol: 'NEON', name: 'Neon Industries', basePrice: 150, volatility: 0.025, trend: 0.0008, sector: 'tech' },
  { symbol: 'GLXY', name: 'Galaxy Corp', basePrice: 85, volatility: 0.035, trend: -0.0005, sector: 'tech' },
  { symbol: 'BOLT', name: 'Bolt Energy', basePrice: 220, volatility: 0.02, trend: 0.001, sector: 'energy' },
  { symbol: 'APEX', name: 'Apex Gaming', basePrice: 45, volatility: 0.045, trend: 0.0003, sector: 'gaming' },
  { symbol: 'CRSN', name: 'Crescent Finance', basePrice: 320, volatility: 0.018, trend: 0.0012, sector: 'finance' },
  { symbol: 'VOID', name: 'Void Technologies', basePrice: 12, volatility: 0.07, trend: -0.001, sector: 'tech' },
  { symbol: 'FLUX', name: 'Flux Dynamics', basePrice: 95, volatility: 0.03, trend: 0.0006, sector: 'industrial' },
  { symbol: 'NOVA', name: 'Nova Pharmaceuticals', basePrice: 180, volatility: 0.025, trend: 0.002, sector: 'healthcare' },
  { symbol: 'ZETA', name: 'Zeta Mining', basePrice: 28, volatility: 0.055, trend: -0.0008, sector: 'materials' },
  { symbol: 'PRMA', name: 'Prima Retail', basePrice: 62, volatility: 0.035, trend: 0, sector: 'consumer' }
];

const NEWS_EVENTS = [
  { type: 'positive', message: '{symbol} announces record quarterly earnings!', impact: 0.06 },
  { type: 'positive', message: '{symbol} secures major government contract', impact: 0.09 },
  { type: 'positive', message: 'Analysts upgrade {symbol} to STRONG BUY', impact: 0.04 },
  { type: 'positive', message: '{symbol} launches revolutionary new product line', impact: 0.07 },
  { type: 'positive', message: '{symbol} announces strategic partnership', impact: 0.05 },
  { type: 'positive', message: 'Institutional investors increase stake in {symbol}', impact: 0.03 },
  { type: 'positive', message: '{symbol} beats analyst expectations by 20%', impact: 0.08 },
  { type: 'positive', message: '{symbol} expands into emerging markets', impact: 0.04 },
  { type: 'negative', message: '{symbol} misses quarterly expectations', impact: -0.05 },
  { type: 'negative', message: 'CEO of {symbol} announces surprise resignation', impact: -0.08 },
  { type: 'negative', message: '{symbol} faces regulatory investigation', impact: -0.12 },
  { type: 'negative', message: 'Analysts downgrade {symbol} to SELL', impact: -0.05 },
  { type: 'negative', message: '{symbol} reports supply chain disruptions', impact: -0.04 },
  { type: 'negative', message: 'Major lawsuit filed against {symbol}', impact: -0.07 },
  { type: 'negative', message: '{symbol} announces product recall', impact: -0.06 },
  { type: 'negative', message: 'Insider selling detected at {symbol}', impact: -0.03 },
  { type: 'neutral', message: '{symbol} announces 2-for-1 stock split', impact: 0 },
  { type: 'neutral', message: '{symbol} to release earnings next week', impact: 0.015 },
  { type: 'neutral', message: '{symbol} appoints new board member', impact: 0.01 },
  { type: 'neutral', message: '{symbol} opens new headquarters facility', impact: 0.02 },
  { type: 'neutral', message: 'Market watch: {symbol} trading at 52-week high', impact: 0.01 },
  { type: 'neutral', message: '{symbol} increases R&D budget by 15%', impact: 0.02 }
];

export default function StockExchange() {
  const { state, setBalance, updateStockExchange } = useCasino();

  const [stocks, setStocks] = useState(() => {
    const saved = state.stockExchange?.stocks;
    if (saved && saved.length === STOCK_CONFIG.length) {
      return saved;
    }
    // Initialize stocks and save to global context
    const initialStocks = STOCK_CONFIG.map(s => ({ ...s, price: s.basePrice }));
    return initialStocks;
  });

  // Initialize stocks in global context on first load
  useEffect(() => {
    if (!state.stockExchange?.stocks || state.stockExchange.stocks.length === 0) {
      const initialStocks = STOCK_CONFIG.map(s => ({ ...s, price: s.basePrice }));
      updateStockExchange({ stocks: initialStocks });
    }
  }, []);

  const [portfolio, setPortfolio] = useState(state.stockExchange?.portfolio || {});
  const [selectedStock, setSelectedStock] = useState(stocks[0]);
  const [orderType, setOrderType] = useState('buy');
  const [orderAmount, setOrderAmount] = useState(1);
  const [priceHistory, setPriceHistory] = useState(() => {
    const saved = state.stockExchange?.priceHistory;
    if (saved && Object.keys(saved).length > 0) {
      const history = {};
      stocks.forEach(stock => {
        if (saved[stock.symbol] && saved[stock.symbol].length > 0) {
          const savedHistory = [...saved[stock.symbol]];
          savedHistory[savedHistory.length - 1] = {
            time: Date.now(),
            price: stock.price
          };
          history[stock.symbol] = savedHistory;
        } else {
          history[stock.symbol] = generateInitialHistory(stock.price || stock.basePrice, 150);
        }
      });
      return history;
    }
    const history = {};
    stocks.forEach(stock => {
      history[stock.symbol] = generateInitialHistory(stock.price || stock.basePrice, 150);
    });
    return history;
  });
  const [news, setNews] = useState(state.stockExchange?.news || []);
  const [marketStatus, setMarketStatus] = useState('open');
  const [timeSpeed, setTimeSpeed] = useState(1);
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(0);
  const [watchlist, setWatchlist] = useState(state.stockExchange?.watchlist || ['NEON', 'BOLT', 'APEX']);
  const [orderHistory, setOrderHistory] = useState(state.stockExchange?.orderHistory || []);
  const [marketTrend, setMarketTrend] = useState(state.stockExchange?.marketTrend || 0);
  const [, setTick] = useState(0);
  const tickRef = useRef(null);
  const lastSaveRef = useRef(Date.now());

  function generateInitialHistory(currentPrice, points, endAtCurrent = true) {
    const history = [];
    let price = currentPrice * (0.8 + Math.random() * 0.4);

    for (let i = 0; i < points - 1; i++) {
      price *= 1 + (Math.random() - 0.5) * 0.02;
      price = Math.max(0.01, price);
      history.push({
        time: Date.now() - (points - i) * 60000,
        price
      });
    }

    history.push({
      time: Date.now(),
      price: currentPrice
    });

    return history;
  }

  // Save stock exchange state periodically
  useEffect(() => {
    const now = Date.now();
    if (now - lastSaveRef.current > 2000) {
      lastSaveRef.current = now;
      updateStockExchange({
        portfolio,
        watchlist,
        orderHistory: orderHistory.slice(0, 20),
        stocks,
        priceHistory,
        news: news.slice(0, 30),
        marketTrend
      });
    }
  }, [portfolio, watchlist, orderHistory, stocks, priceHistory, news, marketTrend, updateStockExchange]);

  // Sync stocks from global context
  useEffect(() => {
    if (state.stockExchange?.stocks && state.stockExchange.stocks.length > 0) {
      setStocks(state.stockExchange.stocks);
      // Update selected stock with new price
      setSelectedStock(prev => {
        const updated = state.stockExchange.stocks.find(s => s.symbol === prev?.symbol);
        return updated || state.stockExchange.stocks[0];
      });
    }
  }, [state.stockExchange?.stocks]);

  // Sync market trend from global context
  useEffect(() => {
    if (state.stockExchange?.marketTrend !== undefined) {
      setMarketTrend(state.stockExchange.marketTrend);
    }
  }, [state.stockExchange?.marketTrend]);

  // Price history and news updates (local only - doesn't affect header price)
  useEffect(() => {
    const tick = () => {
      if (marketStatus !== 'open') return;

      // Update price history from current stocks
      setPriceHistory(prev => {
        const newHistory = { ...prev };
        stocks.forEach(stock => {
          if (newHistory[stock.symbol]) {
            newHistory[stock.symbol] = [
              ...newHistory[stock.symbol].slice(-249),
              { time: Date.now(), price: stock.price }
            ];
          }
        });
        return newHistory;
      });

      // More frequent news (1.2% chance per tick)
      if (Math.random() < 0.012) {
        generateNewsEvent();
      }

      setTick(t => t + 1);
    };

    tickRef.current = setInterval(tick, 1000 / timeSpeed);
    return () => clearInterval(tickRef.current);
  }, [marketStatus, stocks, timeSpeed]);

  // News auto-delete after 90 seconds
  useEffect(() => {
    const newsCleanup = setInterval(() => {
      const now = Date.now();
      setNews(prev => prev.filter(item => {
        const age = now - (item.createdAt || item.id);
        return age < 90000;
      }));
    }, 1000);
    return () => clearInterval(newsCleanup);
  }, []);

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

  // Update selected stock reference
  useEffect(() => {
    if (selectedStock) {
      const updated = stocks.find(s => s.symbol === selectedStock.symbol);
      if (updated) {
        setSelectedStock(updated);
      }
    }
  }, [stocks, selectedStock]);

  const generateNewsEvent = () => {
    const randomStock = stocks[Math.floor(Math.random() * stocks.length)];
    const event = NEWS_EVENTS[Math.floor(Math.random() * NEWS_EVENTS.length)];

    const newsItem = {
      id: Date.now(),
      createdAt: Date.now(),
      time: new Date().toLocaleTimeString(),
      symbol: randomStock.symbol,
      message: event.message.replace('{symbol}', randomStock.symbol),
      type: event.type,
      impact: event.impact
    };

    setNews(prev => [newsItem, ...prev.slice(0, 29)]);

    // Apply impact
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

  const MainChart = () => {
    const history = priceHistory[selectedStock?.symbol] || [];
    if (history.length < 2) return <div className="text-gray-500">Loading...</div>;

    const width = 900;
    const height = 350;
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
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity="0.4" />
            <stop offset="100%" stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`0,${height} ${points} ${width},${height}`}
          fill="url(#chartGradient)"
        />
        <polyline
          points={points}
          fill="none"
          stroke={isUp ? '#22c55e' : '#ef4444'}
          strokeWidth="3"
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
    <div className="h-full flex gap-4 overflow-hidden">
      {/* Left Panel */}
      <div className="w-80 bg-[#0a0a12] rounded-2xl p-4 flex flex-col gap-4 overflow-hidden">
        {/* Market Status */}
        <div className="flex items-center justify-between flex-shrink-0">
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
        <div className="flex gap-1 flex-shrink-0">
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
        <div className="bg-black/30 rounded-lg p-2 flex-shrink-0">
          <div className="text-xs text-gray-500 mb-1">Market Trend</div>
          <div className={`text-lg font-bold ${marketTrend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {marketTrend >= 0 ? '↑' : '↓'} {(marketTrend * 100).toFixed(3)}%
          </div>
        </div>

        {/* Stock List */}
        <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
          <div className="text-xs text-gray-500 mb-2">ALL STOCKS</div>
          {stocks.map(stock => {
            const { percent } = getPriceChange(stock);
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

      {/* Main Area - LARGE CHART */}
      <div className="flex-1 bg-gradient-to-b from-[#0a0a12] to-[#0f0f1a] rounded-2xl p-6 flex flex-col gap-4 overflow-hidden">
        {selectedStock && (
          <>
            {/* Stock Header */}
            <div className="flex items-start justify-between flex-shrink-0">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-bold text-white">{selectedStock.symbol}</h2>
                  <button
                    onClick={() => toggleWatchlist(selectedStock.symbol)}
                    className={`text-2xl ${watchlist.includes(selectedStock.symbol) ? 'text-yellow-400' : 'text-gray-600'}`}
                  >
                    ★
                  </button>
                </div>
                <div className="text-gray-500">{selectedStock.name}</div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-white">${selectedStock.price.toFixed(2)}</div>
                {(() => {
                  const { change, percent } = getPriceChange(selectedStock);
                  const isUp = percent >= 0;
                  return (
                    <div className={`text-xl ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                      {isUp ? '+' : ''}{change.toFixed(2)} ({isUp ? '+' : ''}{percent.toFixed(2)}%)
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* LARGE CHART */}
            <div className="flex-1 bg-black/50 rounded-xl p-6 min-h-0">
              <MainChart />
            </div>

            {/* Stock Info Grid */}
            <div className="grid grid-cols-5 gap-3 flex-shrink-0">
              <div className="bg-black/30 rounded-lg p-3">
                <div className="text-xs text-gray-500">Sector</div>
                <div className="text-white font-bold capitalize text-sm">{selectedStock.sector}</div>
              </div>
              <div className="bg-black/30 rounded-lg p-3">
                <div className="text-xs text-gray-500">Volatility</div>
                <div className="text-white font-bold text-sm">{(selectedStock.volatility * 100).toFixed(1)}%</div>
              </div>
              <div className="bg-black/30 rounded-lg p-3">
                <div className="text-xs text-gray-500">Your Shares</div>
                <div className="text-white font-bold text-sm">{portfolio[selectedStock.symbol] || 0}</div>
              </div>
              <div className="bg-black/30 rounded-lg p-3">
                <div className="text-xs text-gray-500">Position Value</div>
                <div className="text-white font-bold text-sm">
                  ${((portfolio[selectedStock.symbol] || 0) * selectedStock.price).toFixed(2)}
                </div>
              </div>
              <div className="bg-black/30 rounded-lg p-3">
                <div className="text-xs text-gray-500">24h Change</div>
                <div className={`font-bold text-sm ${getPriceChange(selectedStock).percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {getPriceChange(selectedStock).percent >= 0 ? '+' : ''}{getPriceChange(selectedStock).percent.toFixed(2)}%
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right Panel - Trading & News */}
      <div className="w-80 bg-[#0a0a12] rounded-2xl p-4 flex flex-col gap-4 overflow-hidden">
        {/* Account Summary */}
        <div className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 rounded-xl p-4 flex-shrink-0">
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
          <div className="bg-black/30 rounded-xl p-4 flex-shrink-0">
            <div className="text-xs text-gray-500 mb-3">TRADE {selectedStock.symbol}</div>

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
                    className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs font-bold"
                  >
                    {n}
                  </button>
                ))}
                {orderType === 'buy' && selectedStock && (
                  <button
                    onClick={() => setOrderAmount(Math.floor(state.balance / selectedStock.price))}
                    className="flex-1 py-1.5 bg-green-700 hover:bg-green-600 rounded text-xs font-bold"
                  >
                    MAX
                  </button>
                )}
                {orderType === 'sell' && portfolio[selectedStock.symbol] > 0 && (
                  <button
                    onClick={() => setOrderAmount(portfolio[selectedStock.symbol])}
                    className="flex-1 py-1.5 bg-red-700 hover:bg-red-600 rounded text-xs font-bold"
                  >
                    ALL
                  </button>
                )}
              </div>
            </div>

            <div className="bg-black/50 rounded-lg p-3 mb-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Total:</span>
                <span className="text-white font-bold">
                  ${(selectedStock.price * orderAmount).toFixed(2)}
                </span>
              </div>
            </div>

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
        <div className="flex-shrink-0">
          <div className="text-xs text-gray-500 mb-2">YOUR PORTFOLIO</div>
          {Object.entries(portfolio).length === 0 ? (
            <div className="text-gray-600 text-sm text-center py-4">
              No holdings yet
            </div>
          ) : (
            <div className="space-y-1 max-h-[132px] overflow-y-auto">
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

        {/* News Feed - EXPANDED */}
        <div className="max-h-48 overflow-y-auto flex-shrink-0 border-t border-white/10 pt-2">
          <div className="text-xs text-gray-500 mb-2 font-bold">MARKET NEWS ({news.length})</div>
          {news.length === 0 ? (
            <div className="text-gray-600 text-xs text-center py-2">Waiting for news...</div>
          ) : (
            <div className="space-y-1">
              {news.slice(0, 12).map(item => {
                const age = Date.now() - (item.createdAt || item.id);
                const remaining = Math.max(0, Math.ceil((90000 - age) / 1000));
                return (
                  <div
                    key={item.id}
                    className={`text-xs p-2 rounded relative overflow-hidden border-l-2 ${
                      item.type === 'positive' ? 'bg-green-900/30 border-green-500 text-green-400' :
                      item.type === 'negative' ? 'bg-red-900/30 border-red-500 text-red-400' :
                      'bg-gray-800/30 border-gray-500 text-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute bottom-0 left-0 h-0.5 transition-all ${
                        item.type === 'positive' ? 'bg-green-500' :
                        item.type === 'negative' ? 'bg-red-500' :
                        'bg-gray-500'
                      }`}
                      style={{ width: `${(remaining / 90) * 100}%` }}
                    />
                    <div className="flex justify-between items-start gap-2">
                      <span className="flex-1">{item.message}</span>
                      <span className="text-gray-600 text-[10px] flex-shrink-0">{remaining}s</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

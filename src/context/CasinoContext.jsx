import { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState } from 'react';

const CasinoContext = createContext(null);

// Simple encryption/decryption for export
const ENCRYPTION_KEY = 'OfflineCasino2024';

const encrypt = (data) => {
  const json = JSON.stringify(data);
  let encrypted = '';
  for (let i = 0; i < json.length; i++) {
    const charCode = json.charCodeAt(i) + ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
    encrypted += String.fromCharCode(charCode);
  }
  return btoa(encrypted);
};

const decrypt = (data) => {
  try {
    const decoded = atob(data);
    let decrypted = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) - ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      decrypted += String.fromCharCode(charCode);
    }
    return JSON.parse(decrypted);
  } catch (e) {
    console.error('Decryption failed:', e);
    return null;
  }
};

const initialState = {
  balance: 1000,
  totalBets: 0,
  totalWins: 0,
  totalLosses: 0,
  gamesPlayed: 0,
  biggestWin: 0,
  currentStreak: 0,
  bestStreak: 0,
  freeCreditsUsed: 0,
  globalBet: 50, // Auto-calculated 5% of starting balance
  lastKnownBalance: 1000, // For tracking balance increases
  history: [],
  settings: {
    soundEnabled: true,
    soundVolume: 0.5,
    animationsEnabled: true,
    fastMode: false,
    hotkeys: true,
    confirmLargeBets: true,
    showWinNotifications: true
  }
};

function reducer(state, action) {
  switch (action.type) {
    case 'PLACE_BET': {
      if (action.amount > state.balance || action.amount <= 0) return state;
      return {
        ...state,
        balance: state.balance - action.amount,
        totalBets: state.totalBets + action.amount,
        gamesPlayed: state.gamesPlayed + 1
      };
    }
    case 'ADD_WIN': {
      const profit = action.amount - action.bet;
      const isWin = profit > 0;
      const newStreak = isWin ? state.currentStreak + 1 : 0;
      const newBalance = state.balance + action.amount;
      return {
        ...state,
        balance: newBalance,
        totalWins: state.totalWins + (isWin ? profit : 0),
        biggestWin: Math.max(state.biggestWin, profit),
        currentStreak: newStreak,
        bestStreak: Math.max(state.bestStreak, newStreak),
        history: [
          {
            game: action.game,
            bet: action.bet,
            win: action.amount,
            profit,
            multiplier: action.multiplier,
            timestamp: Date.now()
          },
          ...state.history.slice(0, 99)
        ]
      };
    }
    case 'ADD_LOSS': {
      return {
        ...state,
        totalLosses: state.totalLosses + action.amount,
        currentStreak: 0,
        history: [
          {
            game: action.game,
            bet: action.amount,
            win: 0,
            profit: -action.amount,
            multiplier: 0,
            timestamp: Date.now()
          },
          ...state.history.slice(0, 99)
        ]
      };
    }
    case 'ADD_FREE_CREDITS': {
      return {
        ...state,
        balance: state.balance + action.amount,
        freeCreditsUsed: state.freeCreditsUsed + 1
      };
    }
    case 'UPDATE_SETTINGS': {
      return {
        ...state,
        settings: { ...state.settings, ...action.settings }
      };
    }
    case 'SET_GLOBAL_BET': {
      return {
        ...state,
        globalBet: action.amount
      };
    }
    case 'UPDATE_LAST_KNOWN_BALANCE': {
      return {
        ...state,
        lastKnownBalance: action.balance
      };
    }
    case 'RESET_STATS': {
      return {
        ...state,
        totalBets: 0,
        totalWins: 0,
        totalLosses: 0,
        gamesPlayed: 0,
        biggestWin: 0,
        currentStreak: 0,
        bestStreak: 0,
        history: []
      };
    }
    case 'LOAD_STATE': {
      return { ...state, ...action.state };
    }
    default:
      return state;
  }
}

export function CasinoProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [showLargeBetConfirm, setShowLargeBetConfirm] = useState(null);
  const [showWinNotification, setShowWinNotification] = useState(null);
  const [showBetUpdateSuggestion, setShowBetUpdateSuggestion] = useState(false);
  const prevBalanceRef = useRef(state.balance);

  useEffect(() => {
    const saved = localStorage.getItem('casino_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Calculate initial global bet as 5% of balance
        if (!parsed.globalBet) {
          parsed.globalBet = Math.floor(parsed.balance * 0.05) || 10;
        }
        dispatch({ type: 'LOAD_STATE', state: parsed });
      } catch (e) {
        console.error('Failed to load state:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('casino_state', JSON.stringify({
      balance: state.balance,
      totalBets: state.totalBets,
      totalWins: state.totalWins,
      totalLosses: state.totalLosses,
      gamesPlayed: state.gamesPlayed,
      biggestWin: state.biggestWin,
      currentStreak: state.currentStreak,
      bestStreak: state.bestStreak,
      freeCreditsUsed: state.freeCreditsUsed,
      globalBet: state.globalBet,
      lastKnownBalance: state.lastKnownBalance,
      history: state.history.slice(0, 50),
      settings: state.settings
    }));
  }, [state]);

  // Check for balance increase (90%+ increase suggests bet update)
  useEffect(() => {
    if (state.lastKnownBalance > 0) {
      const increase = (state.balance - state.lastKnownBalance) / state.lastKnownBalance;
      if (increase >= 0.9 && state.balance > state.lastKnownBalance) {
        setShowBetUpdateSuggestion(true);
      }
    }
  }, [state.balance, state.lastKnownBalance]);

  const placeBet = useCallback((amount, game, onConfirm) => {
    if (amount > state.balance || amount <= 0) return false;

    // Check for large bet confirmation
    if (state.settings.confirmLargeBets && amount > state.balance * 0.5) {
      setShowLargeBetConfirm({ amount, game, onConfirm });
      return false;
    }

    dispatch({ type: 'PLACE_BET', amount, game });
    return true;
  }, [state.balance, state.settings.confirmLargeBets]);

  const confirmLargeBet = useCallback(() => {
    if (showLargeBetConfirm) {
      dispatch({ type: 'PLACE_BET', amount: showLargeBetConfirm.amount, game: showLargeBetConfirm.game });
      showLargeBetConfirm.onConfirm?.();
      setShowLargeBetConfirm(null);
      return true;
    }
    return false;
  }, [showLargeBetConfirm]);

  const cancelLargeBet = useCallback(() => {
    setShowLargeBetConfirm(null);
  }, []);

  const addWin = useCallback((amount, bet, game, multiplier) => {
    dispatch({ type: 'ADD_WIN', amount, bet, game, multiplier });

    // Show win notification for big wins (profit > 80% of bet)
    const profit = amount - bet;
    if (state.settings.showWinNotifications && profit > 0 && profit >= bet * 0.8) {
      setShowWinNotification({ profit, multiplier, game });
      setTimeout(() => setShowWinNotification(null), 3000);
    }
  }, [state.settings.showWinNotifications]);

  const addLoss = (amount, game) => {
    dispatch({ type: 'ADD_LOSS', amount, game });
  };

  const addFreeCredits = (amount = 1000) => {
    if (state.freeCreditsUsed >= 3) return false;
    dispatch({ type: 'ADD_FREE_CREDITS', amount });
    return true;
  };

  const updateSettings = (settings) => {
    dispatch({ type: 'UPDATE_SETTINGS', settings });
  };

  const setGlobalBet = (amount) => {
    dispatch({ type: 'SET_GLOBAL_BET', amount });
  };

  const updateLastKnownBalance = () => {
    dispatch({ type: 'UPDATE_LAST_KNOWN_BALANCE', balance: state.balance });
    setShowBetUpdateSuggestion(false);
  };

  const suggestNewBet = () => {
    const newBet = Math.floor(state.balance * 0.05);
    setGlobalBet(newBet);
    updateLastKnownBalance();
  };

  const resetStats = () => {
    dispatch({ type: 'RESET_STATS' });
  };

  const exportProgress = () => {
    const exportData = {
      balance: state.balance,
      totalBets: state.totalBets,
      totalWins: state.totalWins,
      totalLosses: state.totalLosses,
      gamesPlayed: state.gamesPlayed,
      biggestWin: state.biggestWin,
      currentStreak: state.currentStreak,
      bestStreak: state.bestStreak,
      freeCreditsUsed: state.freeCreditsUsed,
      globalBet: state.globalBet,
      history: state.history.slice(0, 50),
      settings: state.settings,
      exportedAt: Date.now()
    };
    return encrypt(exportData);
  };

  const importProgress = (encryptedData) => {
    const data = decrypt(encryptedData);
    if (data && typeof data === 'object' && 'balance' in data) {
      dispatch({ type: 'LOAD_STATE', state: data });
      return true;
    }
    return false;
  };

  return (
    <CasinoContext.Provider value={{
      state,
      placeBet,
      addWin,
      addLoss,
      addFreeCredits,
      updateSettings,
      setGlobalBet,
      resetStats,
      exportProgress,
      importProgress,
      showLargeBetConfirm,
      confirmLargeBet,
      cancelLargeBet,
      showWinNotification,
      showBetUpdateSuggestion,
      suggestNewBet,
      updateLastKnownBalance
    }}>
      {children}
    </CasinoContext.Provider>
  );
}

export function useCasino() {
  const context = useContext(CasinoContext);
  if (!context) {
    throw new Error('useCasino must be used within CasinoProvider');
  }
  return context;
}

export default CasinoContext;

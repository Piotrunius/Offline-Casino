import { createContext, useContext, useEffect, useReducer } from 'react';

const CasinoContext = createContext(null);

// Simple encryption/decryption for export (base64 + character shifting)
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
  history: [],
  settings: {
    soundEnabled: true,
    soundVolume: 0.5,
    animationsEnabled: true,
    fastMode: false,
    hotkeys: true
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
      return {
        ...state,
        balance: state.balance + action.amount,
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

  useEffect(() => {
    const saved = localStorage.getItem('casino_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
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
      history: state.history.slice(0, 50),
      settings: state.settings
    }));
  }, [state]);

  const placeBet = (amount, game) => {
    if (amount > state.balance || amount <= 0) return false;
    dispatch({ type: 'PLACE_BET', amount, game });
    return true;
  };

  const addWin = (amount, bet, game, multiplier) => {
    dispatch({ type: 'ADD_WIN', amount, bet, game, multiplier });
  };

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
      resetStats,
      exportProgress,
      importProgress
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

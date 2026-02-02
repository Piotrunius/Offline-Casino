/**
 * Casino Context - Global State Management
 * Complete rewrite with persistence, profile export/import, and improved features
 */
import { createContext, useCallback, useContext, useEffect, useReducer, useRef } from 'react';
import { calculateStats } from '../utils/gameUtils';
import { generateSeed, hashServerSeed } from '../utils/provablyFair';

// Encryption/decryption helpers
const encryptData = (data, password = 'casino-secret-key') => {
  const str = JSON.stringify(data);
  const encoded = btoa(unescape(encodeURIComponent(str)));
  let encrypted = '';
  for (let i = 0; i < encoded.length; i++) {
    encrypted += String.fromCharCode(encoded.charCodeAt(i) ^ password.charCodeAt(i % password.length));
  }
  return btoa(encrypted);
};

const decryptData = (encrypted, password = 'casino-secret-key') => {
  try {
    const decoded = atob(encrypted);
    let decrypted = '';
    for (let i = 0; i < decoded.length; i++) {
      decrypted += String.fromCharCode(decoded.charCodeAt(i) ^ password.charCodeAt(i % password.length));
    }
    const str = decodeURIComponent(escape(atob(decrypted)));
    return JSON.parse(str);
  } catch {
    return null;
  }
};

// Initial state
const initialState = {
  balance: 500.00,
  username: 'Player',

  clientSeed: generateSeed(16),
  serverSeed: generateSeed(32),
  serverSeedHash: '',
  nonce: 0,

  betHistory: [],

  stats: {
    totalBets: 0,
    totalWagered: 0,
    totalWon: 0,
    netProfit: 0,
    winRate: 0,
    biggestWin: 0,
    biggestLoss: 0,
    currentStreak: 0,
    gamesPlayed: {}
  },

  settings: {
    soundEnabled: true,
    musicEnabled: false,
    soundVolume: 0.7,
    musicVolume: 0.3,
    animations: true,
    fastMode: false,
    showStats: true,
    currency: 'USD',
    hotkeys: true,
    instantBet: false,
    confirmBets: false,
    autoPlaySpeed: 1000,
    stopOnBigWin: false,
    bigWinThreshold: 100
  },

  currentGame: null,
  sidebarOpen: true,
  modalOpen: null,

  autoBet: {
    active: false,
    betsRemaining: 0,
    totalBets: 0,
    stopOnWin: false,
    stopOnLoss: false,
    stopOnProfit: null,
    stopOnLossAmount: null,
    onWinAction: 'reset',
    onWinMultiplier: 2,
    onLossAction: 'reset',
    onLossMultiplier: 2,
    baseBet: 0,
    currentBet: 0,
    initialBalance: 0,
    profit: 0
  },

  sessionId: Date.now(),
  hotGames: [],
  multiplayers: []
};

// Action types
const ActionTypes = {
  SET_BALANCE: 'SET_BALANCE',
  ADD_BALANCE: 'ADD_BALANCE',
  SUBTRACT_BALANCE: 'SUBTRACT_BALANCE',
  PLACE_BET: 'PLACE_BET',
  ADD_WIN: 'ADD_WIN',
  SET_CLIENT_SEED: 'SET_CLIENT_SEED',
  ROTATE_SERVER_SEED: 'ROTATE_SERVER_SEED',
  INCREMENT_NONCE: 'INCREMENT_NONCE',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  SET_CURRENT_GAME: 'SET_CURRENT_GAME',
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  SET_MODAL: 'SET_MODAL',
  START_AUTO_BET: 'START_AUTO_BET',
  STOP_AUTO_BET: 'STOP_AUTO_BET',
  UPDATE_AUTO_BET: 'UPDATE_AUTO_BET',
  RESET_STATS: 'RESET_STATS',
  LOAD_STATE: 'LOAD_STATE',
  SET_USERNAME: 'SET_USERNAME',
  RESET_SESSION: 'RESET_SESSION',
  SET_HOT_GAMES: 'SET_HOT_GAMES',
  UPDATE_MULTIPLAYERS: 'UPDATE_MULTIPLAYERS'
};

// Reducer
const casinoReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_BALANCE:
      return { ...state, balance: Math.max(0, action.payload) };

    case ActionTypes.ADD_BALANCE:
      return { ...state, balance: state.balance + action.payload };

    case ActionTypes.SUBTRACT_BALANCE:
      return { ...state, balance: Math.max(0, state.balance - action.payload) };

    case ActionTypes.PLACE_BET: {
      const newHistory = [...state.betHistory, action.payload].slice(-200);
      const newStats = { ...state.stats };
      if (action.payload.game) {
        newStats.gamesPlayed[action.payload.game] = (newStats.gamesPlayed[action.payload.game] || 0) + 1;
      }
      return {
        ...state,
        balance: Math.max(0, state.balance - action.payload.amount),
        betHistory: newHistory,
        stats: { ...calculateStats(newHistory), gamesPlayed: newStats.gamesPlayed },
        nonce: state.nonce + 1
      };
    }

    case ActionTypes.ADD_WIN: {
      const updatedHistory = state.betHistory.map((bet, index) =>
        index === state.betHistory.length - 1
          ? { ...bet, win: true, payout: action.payload.amount }
          : bet
      );

      let autoBetUpdate = {};
      if (state.autoBet.active) {
        const profit = action.payload.amount - state.autoBet.currentBet;
        autoBetUpdate = {
          autoBet: {
            ...state.autoBet,
            profit: state.autoBet.profit + profit
          }
        };
      }

      return {
        ...state,
        balance: state.balance + action.payload.amount,
        betHistory: updatedHistory,
        stats: { ...calculateStats(updatedHistory), gamesPlayed: state.stats.gamesPlayed },
        ...autoBetUpdate
      };
    }

    case ActionTypes.SET_CLIENT_SEED:
      return { ...state, clientSeed: action.payload };

    case ActionTypes.ROTATE_SERVER_SEED: {
      const newServerSeed = generateSeed(32);
      return {
        ...state,
        serverSeed: newServerSeed,
        serverSeedHash: hashServerSeed(newServerSeed),
        nonce: 0
      };
    }

    case ActionTypes.INCREMENT_NONCE:
      return { ...state, nonce: state.nonce + 1 };

    case ActionTypes.UPDATE_SETTINGS:
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case ActionTypes.SET_CURRENT_GAME:
      return { ...state, currentGame: action.payload };

    case ActionTypes.TOGGLE_SIDEBAR:
      return { ...state, sidebarOpen: action.payload !== undefined ? action.payload : !state.sidebarOpen };

    case ActionTypes.SET_MODAL:
      return { ...state, modalOpen: action.payload };

    case ActionTypes.START_AUTO_BET:
      return {
        ...state,
        autoBet: {
          ...state.autoBet,
          ...action.payload,
          active: true,
          initialBalance: state.balance,
          profit: 0
        }
      };

    case ActionTypes.STOP_AUTO_BET:
      return { ...state, autoBet: { ...state.autoBet, active: false, betsRemaining: 0 } };

    case ActionTypes.UPDATE_AUTO_BET:
      return { ...state, autoBet: { ...state.autoBet, ...action.payload } };

    case ActionTypes.RESET_STATS:
      return {
        ...state,
        betHistory: [],
        stats: { ...initialState.stats }
      };

    case ActionTypes.LOAD_STATE:
      return {
        ...state,
        ...action.payload,
        sessionId: Date.now(),
        autoBet: initialState.autoBet
      };

    case ActionTypes.SET_USERNAME:
      return { ...state, username: action.payload };

    case ActionTypes.RESET_SESSION:
      return {
        ...state,
        sessionId: Date.now(),
        hotGames: action.payload.hotGames || [],
        multiplayers: []
      };

    case ActionTypes.SET_HOT_GAMES:
      return { ...state, hotGames: action.payload };

    case ActionTypes.UPDATE_MULTIPLAYERS:
      return { ...state, multiplayers: action.payload };

    default:
      return state;
  }
};

// Create context
const CasinoContext = createContext(null);

// Provider component
export const CasinoProvider = ({ children }) => {
  const [state, dispatch] = useReducer(casinoReducer, initialState);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    if (!state.serverSeedHash) {
      dispatch({ type: ActionTypes.ROTATE_SERVER_SEED });
    }

    const allGames = ['crash', 'mines', 'dice', 'plinko', 'limbo', 'roulette', 'blackjack', 'coinflip', 'tower', 'keno', 'slots'];
    const shuffled = [...allGames].sort(() => Math.random() - 0.5);
    dispatch({
      type: ActionTypes.RESET_SESSION,
      payload: { hotGames: shuffled.slice(0, 4) }
    });
  }, []);

  useEffect(() => {
    const savedState = localStorage.getItem('casinoState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed && typeof parsed.balance === 'number' && parsed.balance >= 0) {
          dispatch({ type: ActionTypes.LOAD_STATE, payload: parsed });
        }
      } catch (e) {
        console.error('Failed to load saved state:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const stateToSave = {
        balance: state.balance,
        username: state.username,
        clientSeed: state.clientSeed,
        serverSeed: state.serverSeed,
        serverSeedHash: state.serverSeedHash,
        nonce: state.nonce,
        betHistory: state.betHistory.slice(-200),
        stats: state.stats,
        settings: state.settings
      };
      localStorage.setItem('casinoState', JSON.stringify(stateToSave));
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state.balance, state.betHistory, state.settings, state.username, state.nonce]);

  const actions = {
    setBalance: useCallback((amount) => {
      dispatch({ type: ActionTypes.SET_BALANCE, payload: amount });
    }, []),

    addBalance: useCallback((amount) => {
      dispatch({ type: ActionTypes.ADD_BALANCE, payload: amount });
    }, []),

    subtractBalance: useCallback((amount) => {
      dispatch({ type: ActionTypes.SUBTRACT_BALANCE, payload: amount });
    }, []),

    placeBet: useCallback((bet) => {
      dispatch({ type: ActionTypes.PLACE_BET, payload: bet });
    }, []),

    addWin: useCallback((amount, skipBalanceUpdate = false) => {
      dispatch({ type: ActionTypes.ADD_WIN, payload: { amount, skipBalanceUpdate } });
    }, []),

    setClientSeed: useCallback((seed) => {
      dispatch({ type: ActionTypes.SET_CLIENT_SEED, payload: seed });
    }, []),

    rotateServerSeed: useCallback(() => {
      dispatch({ type: ActionTypes.ROTATE_SERVER_SEED });
    }, []),

    incrementNonce: useCallback(() => {
      dispatch({ type: ActionTypes.INCREMENT_NONCE });
    }, []),

    updateSettings: useCallback((settings) => {
      dispatch({ type: ActionTypes.UPDATE_SETTINGS, payload: settings });
    }, []),

    setCurrentGame: useCallback((game) => {
      dispatch({ type: ActionTypes.SET_CURRENT_GAME, payload: game });
    }, []),

    toggleSidebar: useCallback((value) => {
      dispatch({ type: ActionTypes.TOGGLE_SIDEBAR, payload: value });
    }, []),

    setModal: useCallback((modal) => {
      dispatch({ type: ActionTypes.SET_MODAL, payload: modal });
    }, []),

    startAutoBet: useCallback((config) => {
      dispatch({ type: ActionTypes.START_AUTO_BET, payload: config });
    }, []),

    stopAutoBet: useCallback(() => {
      dispatch({ type: ActionTypes.STOP_AUTO_BET });
    }, []),

    updateAutoBet: useCallback((updates) => {
      dispatch({ type: ActionTypes.UPDATE_AUTO_BET, payload: updates });
    }, []),

    resetStats: useCallback(() => {
      dispatch({ type: ActionTypes.RESET_STATS });
    }, []),

    setUsername: useCallback((username) => {
      dispatch({ type: ActionTypes.SET_USERNAME, payload: username });
    }, []),

    exportProgress: useCallback(() => {
      const exportData = {
        version: 1,
        timestamp: Date.now(),
        balance: state.balance,
        username: state.username,
        clientSeed: state.clientSeed,
        nonce: state.nonce,
        betHistory: state.betHistory,
        stats: state.stats,
        settings: state.settings
      };

      const encrypted = encryptData(exportData);
      const blob = new Blob([encrypted], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `casino-progress-${state.username}-${Date.now()}.save`;
      a.click();
      URL.revokeObjectURL(url);
    }, [state]),

    importProgress: useCallback((fileContent) => {
      const decrypted = decryptData(fileContent);
      if (decrypted && decrypted.version === 1) {
        dispatch({
          type: ActionTypes.LOAD_STATE,
          payload: {
            balance: decrypted.balance,
            username: decrypted.username,
            clientSeed: decrypted.clientSeed,
            nonce: decrypted.nonce,
            betHistory: decrypted.betHistory || [],
            stats: decrypted.stats || initialState.stats,
            settings: { ...initialState.settings, ...decrypted.settings }
          }
        });
        return true;
      }
      return false;
    }, []),

    addFreeCredits: useCallback((amount = 1000) => {
      dispatch({ type: ActionTypes.ADD_BALANCE, payload: amount });
    }, [])
  };

  return (
    <CasinoContext.Provider value={{ state, ...actions }}>
      {children}
    </CasinoContext.Provider>
  );
};

export const useCasino = () => {
  const context = useContext(CasinoContext);
  if (!context) {
    throw new Error('useCasino must be used within a CasinoProvider');
  }
  return context;
};

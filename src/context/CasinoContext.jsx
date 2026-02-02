import { createContext, useCallback, useContext, useEffect, useReducer } from 'react';

const generateSeed = (length = 16) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const initialState = {
  balance: 1000,
  currentGame: null,
  sidebarOpen: true,
  modalOpen: null,
  history: [],
  stats: {
    totalBets: 0,
    totalWagered: 0,
    totalWon: 0,
    netProfit: 0,
    biggestWin: 0,
    wins: 0,
    losses: 0
  },
  settings: {
    soundEnabled: true,
    animations: true
  },
  clientSeed: generateSeed(16),
  nonce: 0
};

const ACTIONS = {
  SET_BALANCE: 'SET_BALANCE',
  PLACE_BET: 'PLACE_BET',
  ADD_WIN: 'ADD_WIN',
  SET_GAME: 'SET_GAME',
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  SET_MODAL: 'SET_MODAL',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  RESET_STATS: 'RESET_STATS',
  LOAD_STATE: 'LOAD_STATE'
};

const reducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_BALANCE:
      return { ...state, balance: Math.max(0, action.payload) };

    case ACTIONS.PLACE_BET: {
      const { amount } = action.payload;
      return {
        ...state,
        balance: Math.max(0, state.balance - amount),
        nonce: state.nonce + 1,
        stats: {
          ...state.stats,
          totalBets: state.stats.totalBets + 1,
          totalWagered: state.stats.totalWagered + amount
        }
      };
    }

    case ACTIONS.ADD_WIN: {
      const { amount, bet, game, multiplier } = action.payload;
      const profit = amount - bet;
      const isWin = amount > 0;

      const entry = {
        game, bet, multiplier, payout: amount, profit, win: isWin, timestamp: Date.now()
      };

      return {
        ...state,
        balance: state.balance + amount,
        history: [entry, ...state.history].slice(0, 100),
        stats: {
          ...state.stats,
          totalWon: state.stats.totalWon + amount,
          netProfit: state.stats.netProfit + profit,
          biggestWin: Math.max(state.stats.biggestWin, profit),
          wins: state.stats.wins + (isWin ? 1 : 0),
          losses: state.stats.losses + (isWin ? 0 : 1)
        }
      };
    }

    case ACTIONS.SET_GAME:
      return { ...state, currentGame: action.payload };

    case ACTIONS.TOGGLE_SIDEBAR:
      return { ...state, sidebarOpen: action.payload ?? !state.sidebarOpen };

    case ACTIONS.SET_MODAL:
      return { ...state, modalOpen: action.payload };

    case ACTIONS.UPDATE_SETTINGS:
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case ACTIONS.RESET_STATS:
      return { ...state, stats: initialState.stats, history: [] };

    case ACTIONS.LOAD_STATE:
      return { ...state, ...action.payload };

    default:
      return state;
  }
};

const CasinoContext = createContext(null);

export const CasinoProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const saved = localStorage.getItem('casino_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        dispatch({ type: ACTIONS.LOAD_STATE, payload: parsed });
      } catch (e) {
        console.error('Failed to load state:', e);
      }
    }
  }, []);

  useEffect(() => {
    const toSave = {
      balance: state.balance,
      stats: state.stats,
      history: state.history.slice(0, 50),
      settings: state.settings
    };
    localStorage.setItem('casino_state', JSON.stringify(toSave));
  }, [state.balance, state.stats, state.history, state.settings]);

  const placeBet = useCallback((amount, game) => {
    if (amount > state.balance || amount <= 0) return false;
    dispatch({ type: ACTIONS.PLACE_BET, payload: { amount, game } });
    return true;
  }, [state.balance]);

  const addWin = useCallback((amount, bet, game, multiplier) => {
    dispatch({ type: ACTIONS.ADD_WIN, payload: { amount, bet, game, multiplier } });
  }, []);

  const setCurrentGame = useCallback((game) => {
    dispatch({ type: ACTIONS.SET_GAME, payload: game });
  }, []);

  const toggleSidebar = useCallback((value) => {
    dispatch({ type: ACTIONS.TOGGLE_SIDEBAR, payload: value });
  }, []);

  const setModal = useCallback((modal) => {
    dispatch({ type: ACTIONS.SET_MODAL, payload: modal });
  }, []);

  const updateSettings = useCallback((settings) => {
    dispatch({ type: ACTIONS.UPDATE_SETTINGS, payload: settings });
  }, []);

  const resetStats = useCallback(() => {
    dispatch({ type: ACTIONS.RESET_STATS });
  }, []);

  const addFreeCredits = useCallback((amount = 1000) => {
    dispatch({ type: ACTIONS.SET_BALANCE, payload: state.balance + amount });
  }, [state.balance]);

  return (
    <CasinoContext.Provider value={{
      state,
      placeBet,
      addWin,
      setCurrentGame,
      toggleSidebar,
      setModal,
      updateSettings,
      resetStats,
      addFreeCredits
    }}>
      {children}
    </CasinoContext.Provider>
  );
};

export const useCasino = () => {
  const context = useContext(CasinoContext);
  if (!context) throw new Error('useCasino must be used within CasinoProvider');
  return context;
};

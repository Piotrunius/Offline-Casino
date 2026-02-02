/**
 * Custom React Hooks for Casino Games
 * Complete rewrite with better auto-bet support
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useCasino } from '../context/CasinoContext';
import { playSound } from '../utils/audioEngine';
import { generateOutcome } from '../utils/provablyFair';

// Hook for managing game state
export const useGameState = (initialState = 'idle') => {
    const [gameState, setGameState] = useState(initialState);
    const [isAnimating, setIsAnimating] = useState(false);

    const startGame = useCallback(() => {
        setGameState('playing');
        setIsAnimating(true);
    }, []);

    const endGame = useCallback((result) => {
        setGameState(result);
        setIsAnimating(false);
    }, []);

    const resetGame = useCallback(() => {
        setGameState('idle');
        setIsAnimating(false);
    }, []);

    return {
        gameState,
        isAnimating,
        setIsAnimating,
        startGame,
        endGame,
        resetGame,
        isIdle: gameState === 'idle',
        isPlaying: gameState === 'playing',
        isWon: gameState === 'won',
        isLost: gameState === 'lost'
    };
};

// Hook for bet management
export const useBet = (minBet = 0.01, maxBet = 10000) => {
    const { state, placeBet, addWin, subtractBalance } = useCasino();
    const [betAmount, setBetAmount] = useState(1.00);

    const updateBet = useCallback((amount) => {
        const clamped = Math.max(minBet, Math.min(maxBet, amount));
        setBetAmount(parseFloat(clamped.toFixed(2)));
    }, [minBet, maxBet]);

    const halfBet = useCallback(() => {
        updateBet(betAmount / 2);
    }, [betAmount, updateBet]);

    const doubleBet = useCallback(() => {
        updateBet(Math.min(betAmount * 2, state.balance));
    }, [betAmount, state.balance, updateBet]);

    const maxBetAction = useCallback(() => {
        updateBet(Math.min(state.balance, maxBet));
    }, [state.balance, maxBet, updateBet]);

    const canBet = state.balance >= betAmount && betAmount >= minBet;

    const executeBet = useCallback((gameType, multiplier = 1, customAmount = null) => {
        const amount = customAmount || betAmount;
        if (state.balance < amount || amount < minBet) return null;

        const betData = {
            game: gameType,
            amount: amount,
            multiplier,
            timestamp: Date.now(),
            nonce: state.nonce,
            win: false,
            payout: 0
        };

        placeBet(betData);
        return betData;
    }, [betAmount, state.balance, state.nonce, placeBet, minBet]);

    const resolveWin = useCallback((payout, alreadyDeducted = false) => {
        addWin(payout);
        if (payout > betAmount * 10) {
            playSound('bigWin');
        } else {
            playSound('betWin');
        }
    }, [betAmount, addWin]);

    const resolveLoss = useCallback((alreadyDeducted = false) => {
        playSound('betLose');
    }, []);

    return {
        betAmount,
        setBetAmount: updateBet,
        halfBet,
        doubleBet,
        maxBet: maxBetAction,
        canBet,
        executeBet,
        resolveWin,
        resolveLoss,
        balance: state.balance
    };
};

// Hook for provably fair outcomes
export const useProvablyFair = () => {
    const { state, rotateServerSeed, setClientSeed } = useCasino();

    const generateGameOutcome = useCallback(() => {
        return generateOutcome(state.serverSeed, state.clientSeed, state.nonce);
    }, [state.serverSeed, state.clientSeed, state.nonce]);

    return {
        clientSeed: state.clientSeed,
        serverSeedHash: state.serverSeedHash,
        nonce: state.nonce,
        generateOutcome: generateGameOutcome,
        rotateServerSeed,
        setClientSeed
    };
};

// Hook for auto-betting
export const useAutoBet = (onBet, isGameRunning = false) => {
    const { state, updateAutoBet, stopAutoBet } = useCasino();
    const [isActive, setIsActive] = useState(false);
    const [config, setConfig] = useState({
        numberOfBets: 10,
        stopOnWin: false,
        stopOnLoss: false,
        stopOnProfit: null,
        stopOnLossAmount: null,
        onWinAction: 'reset',
        onWinMultiplier: 2,
        onLossAction: 'reset',
        onLossMultiplier: 2,
        speed: 1000
    });

    const [betsRemaining, setBetsRemaining] = useState(0);
    const [profit, setProfit] = useState(0);
    const [baseBet, setBaseBet] = useState(0);
    const [currentBet, setCurrentBet] = useState(0);

    const intervalRef = useRef(null);
    const isRunningRef = useRef(false);

    const start = useCallback((initialBet, customConfig = null) => {
        const cfg = customConfig || config;
        setIsActive(true);
        setBetsRemaining(cfg.numberOfBets);
        setProfit(0);
        setBaseBet(initialBet);
        setCurrentBet(initialBet);
        isRunningRef.current = true;
    }, [config]);

    const stop = useCallback(() => {
        setIsActive(false);
        setBetsRemaining(0);
        isRunningRef.current = false;
        if (intervalRef.current) {
            clearTimeout(intervalRef.current);
            intervalRef.current = null;
        }
        stopAutoBet();
    }, [stopAutoBet]);

    // Process result and schedule next bet
    const processResult = useCallback((won, multiplier = 1) => {
        if (!isRunningRef.current) return;

        const winAmount = won ? currentBet * multiplier : 0;
        const newProfit = profit + (won ? winAmount - currentBet : -currentBet);
        setProfit(newProfit);

        // Check stop conditions
        if (config.stopOnWin && won) {
            stop();
            return;
        }
        if (config.stopOnLoss && !won) {
            stop();
            return;
        }
        if (config.stopOnProfit && newProfit >= config.stopOnProfit) {
            stop();
            return;
        }
        if (config.stopOnLossAmount && newProfit <= -config.stopOnLossAmount) {
            stop();
            return;
        }

        // Calculate next bet
        let nextBet = baseBet;
        if (won && config.onWinAction === 'increase') {
            nextBet = currentBet * config.onWinMultiplier;
        } else if (!won && config.onLossAction === 'increase') {
            nextBet = currentBet * config.onLossMultiplier;
        }
        setCurrentBet(nextBet);

        // Decrement remaining
        const remaining = betsRemaining - 1;
        setBetsRemaining(remaining);

        if (remaining <= 0) {
            stop();
            return;
        }

        // Schedule next bet
        intervalRef.current = setTimeout(() => {
            if (isRunningRef.current && onBet) {
                onBet(nextBet);
            }
        }, config.speed);
    }, [config, profit, currentBet, baseBet, betsRemaining, stop, onBet]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearTimeout(intervalRef.current);
            }
        };
    }, []);

    return {
        isActive,
        config,
        setConfig,
        start,
        stop,
        processResult,
        betsRemaining,
        profit,
        currentBet
    };
};

// Hook for sound effects
export const useSound = () => {
    const { state } = useCasino();

    const play = useCallback((soundName) => {
        if (state.settings.soundEnabled) {
            playSound(soundName, state.settings.soundVolume);
        }
    }, [state.settings.soundEnabled, state.settings.soundVolume]);

    return { play };
};

// Hook for game history
export const useGameHistory = (maxItems = 20) => {
    const [history, setHistory] = useState([]);

    const addToHistory = useCallback((item) => {
        setHistory(prev => [item, ...prev].slice(0, maxItems));
    }, [maxItems]);

    const clearHistory = useCallback(() => {
        setHistory([]);
    }, []);

    return { history, addToHistory, clearHistory };
};

// Hook for animations
export const useAnimation = (duration = 1000) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const [progress, setProgress] = useState(0);
    const animationRef = useRef(null);
    const startTimeRef = useRef(null);

    const start = useCallback((onProgress, onComplete) => {
        setIsAnimating(true);
        setProgress(0);
        startTimeRef.current = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTimeRef.current;
            const p = Math.min(elapsed / duration, 1);
            setProgress(p);

            if (onProgress) onProgress(p);

            if (p < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                setIsAnimating(false);
                if (onComplete) onComplete();
            }
        };

        animationRef.current = requestAnimationFrame(animate);
    }, [duration]);

    const stop = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
        setIsAnimating(false);
    }, []);

    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    return { isAnimating, progress, start, stop };
};

/**
 * Game Mathematics Utilities
 * Contains payout calculations, odds, and statistical functions
 */

// Format currency
export const formatCurrency = (amount, decimals = 2) => {
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(2)}K`;
    return `$${amount.toFixed(decimals)}`;
};

// Format multiplier
export const formatMultiplier = (mult) => {
    return `${mult.toFixed(2)}x`;
};

// Calculate win amount
export const calculateWin = (betAmount, multiplier) => {
    return betAmount * multiplier;
};

// Crash game odds
export const getCrashOdds = (target) => {
    if (target <= 1) return 0;
    return ((1 / target) * 100 * 0.99).toFixed(2); // 1% house edge
};

// Dice game calculations
export const getDiceMultiplier = (target, rollOver = true) => {
    const winChance = rollOver ? (99.99 - target) : target;
    if (winChance <= 0) return 0;
    return parseFloat(((100 / winChance) * 0.99).toFixed(4)); // 1% house edge
};

export const getDiceWinChance = (target, rollOver = true) => {
    return rollOver ? (99.99 - target) : target;
};

// Mines game calculations
export const getMinesMultiplier = (revealed, totalMines, gridSize = 25) => {
    if (revealed === 0) return 1;

    let multiplier = 1;
    const safeSpots = gridSize - totalMines;

    for (let i = 0; i < revealed; i++) {
        const remainingSafe = safeSpots - i;
        const remainingTotal = gridSize - i;
        multiplier *= remainingTotal / remainingSafe;
    }

    return parseFloat((multiplier * 0.99).toFixed(4)); // 1% house edge
};

// Limbo game odds
export const getLimboOdds = (target) => {
    if (target <= 1) return 100;
    return parseFloat(((1 / target) * 100 * 0.99).toFixed(2)); // 1% house edge
};

// Plinko payouts by risk level
export const getPlinkoPayouts = (risk, rows = 16) => {
    const payouts = {
        low: {
            8: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
            12: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
            16: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16]
        },
        medium: {
            8: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
            12: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
            16: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110]
        },
        high: {
            8: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
            12: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170],
            16: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000]
        }
    };

    return payouts[risk]?.[rows] || payouts.medium[16];
};

// Roulette payouts
export const getRoulettePayouts = () => ({
    straight: 35,      // Single number
    split: 17,         // Two numbers
    street: 11,        // Three numbers
    corner: 8,         // Four numbers
    line: 5,           // Six numbers
    column: 2,         // 12 numbers
    dozen: 2,          // 12 numbers
    even: 1,           // 18 numbers (red/black, odd/even, high/low)
});

export const getRouletteNumberColor = (num) => {
    if (num === 0) return 'green';
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    return redNumbers.includes(num) ? 'red' : 'black';
};

// Blackjack card values
export const getBlackjackCardValue = (card) => {
    if (['J', 'Q', 'K'].includes(card.value)) return 10;
    if (card.value === 'A') return 11;
    return parseInt(card.value);
};

export const calculateBlackjackHand = (cards) => {
    let total = 0;
    let aces = 0;

    for (const card of cards) {
        const value = getBlackjackCardValue(card);
        if (card.value === 'A') aces++;
        total += value;
    }

    while (total > 21 && aces > 0) {
        total -= 10;
        aces--;
    }

    return total;
};

// Keno payouts based on selections - returns full payout table
export const getKenoPayouts = (selections) => {
    const payoutTables = {
        1: { 0: 0, 1: 3.75 },
        2: { 0: 0, 1: 0, 2: 9 },
        3: { 0: 0, 1: 0, 2: 2, 3: 25 },
        4: { 0: 0, 1: 0, 2: 1, 3: 5, 4: 75 },
        5: { 0: 0, 1: 0, 2: 0, 3: 2, 4: 12, 5: 300 },
        6: { 0: 0, 1: 0, 2: 0, 3: 1, 4: 5, 5: 50, 6: 1500 },
        7: { 0: 0, 1: 0, 2: 0, 3: 1, 4: 2, 5: 15, 6: 150, 7: 4500 },
        8: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 2, 5: 8, 6: 50, 7: 500, 8: 10000 },
        9: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 1, 5: 4, 6: 20, 7: 100, 8: 2000, 9: 25000 },
        10: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 2, 6: 10, 7: 50, 8: 500, 9: 5000, 10: 100000 }
    };

    return payoutTables[selections] || {};
};

// Tower game multipliers
export const getTowerMultiplier = (difficulty, level) => {
    const baseMultipliers = {
        easy: 1.31,    // 3 safe out of 4
        medium: 1.47,  // 2 safe out of 3
        hard: 2.94,    // 1 safe out of 3
        expert: 3.92   // 1 safe out of 4
    };

    return parseFloat(Math.pow(baseMultipliers[difficulty] || 1.47, level).toFixed(2));
};

// Video Poker hand rankings
export const evaluatePokerHand = (cards) => {
    const values = cards.map(c => {
        if (c.value === 'A') return 14;
        if (c.value === 'K') return 13;
        if (c.value === 'Q') return 12;
        if (c.value === 'J') return 11;
        return parseInt(c.value);
    }).sort((a, b) => a - b);

    const suits = cards.map(c => c.suit);
    const isFlush = suits.every(s => s === suits[0]);
    const isStraight = values.every((v, i) => i === 0 || v === values[i - 1] + 1) ||
        (values.join(',') === '2,3,4,5,14'); // Ace-low straight

    const valueCounts = {};
    values.forEach(v => valueCounts[v] = (valueCounts[v] || 0) + 1);
    const counts = Object.values(valueCounts).sort((a, b) => b - a);

    if (isFlush && isStraight && values[4] === 14) return { rank: 'royal_flush', multiplier: 800 };
    if (isFlush && isStraight) return { rank: 'straight_flush', multiplier: 50 };
    if (counts[0] === 4) return { rank: 'four_of_kind', multiplier: 25 };
    if (counts[0] === 3 && counts[1] === 2) return { rank: 'full_house', multiplier: 9 };
    if (isFlush) return { rank: 'flush', multiplier: 6 };
    if (isStraight) return { rank: 'straight', multiplier: 4 };
    if (counts[0] === 3) return { rank: 'three_of_kind', multiplier: 3 };
    if (counts[0] === 2 && counts[1] === 2) return { rank: 'two_pair', multiplier: 2 };
    if (counts[0] === 2 && values.some(v => v >= 11)) return { rank: 'jacks_or_better', multiplier: 1 };

    return { rank: 'nothing', multiplier: 0 };
};

// Slot machine symbols and payouts
export const getSlotSymbols = () => [
    { id: 'seven', emoji: '7️⃣', weight: 5, payout: 100 },
    { id: 'diamond', emoji: '💎', weight: 8, payout: 50 },
    { id: 'bell', emoji: '🔔', weight: 10, payout: 25 },
    { id: 'bar', emoji: '📊', weight: 12, payout: 15 },
    { id: 'cherry', emoji: '🍒', weight: 15, payout: 10 },
    { id: 'lemon', emoji: '🍋', weight: 20, payout: 5 },
    { id: 'orange', emoji: '🍊', weight: 20, payout: 5 },
    { id: 'grape', emoji: '🍇', weight: 25, payout: 3 },
    { id: 'watermelon', emoji: '🍉', weight: 25, payout: 3 },
    { id: 'star', emoji: '⭐', weight: 30, payout: 2 }
];

export const calculateSlotPayout = (reels, betAmount) => {
    const symbols = getSlotSymbols();
    const line = reels.map(stop => symbols[stop % symbols.length]);

    // Check for 5 of a kind
    if (line.every(s => s.id === line[0].id)) {
        return { win: true, multiplier: line[0].payout, symbols: line };
    }

    // Check for 4 of a kind
    const counts = {};
    line.forEach(s => counts[s.id] = (counts[s.id] || 0) + 1);
    const maxCount = Math.max(...Object.values(counts));

    if (maxCount >= 4) {
        const symbol = line.find(s => counts[s.id] === maxCount);
        return { win: true, multiplier: symbol.payout * 0.5, symbols: line };
    }

    // Check for 3 of a kind
    if (maxCount >= 3) {
        const symbol = line.find(s => counts[s.id] === maxCount);
        return { win: true, multiplier: symbol.payout * 0.2, symbols: line };
    }

    return { win: false, multiplier: 0, symbols: line };
};

// General statistics
export const calculateStats = (history) => {
    if (!history.length) return {
        totalBets: 0,
        totalWagered: 0,
        totalWon: 0,
        netProfit: 0,
        winRate: 0,
        biggestWin: 0,
        biggestLoss: 0,
        currentStreak: 0
    };

    const totalBets = history.length;
    const totalWagered = history.reduce((sum, bet) => sum + bet.amount, 0);
    const totalWon = history.reduce((sum, bet) => sum + (bet.win ? bet.payout : 0), 0);
    const netProfit = totalWon - totalWagered;
    const wins = history.filter(bet => bet.win);
    const winRate = (wins.length / totalBets) * 100;
    const biggestWin = Math.max(0, ...history.map(bet => bet.win ? bet.payout - bet.amount : 0));
    const biggestLoss = Math.max(0, ...history.map(bet => !bet.win ? bet.amount : 0));

    // Calculate current streak
    let currentStreak = 0;
    for (let i = history.length - 1; i >= 0; i--) {
        if (i === history.length - 1) {
            currentStreak = history[i].win ? 1 : -1;
        } else if ((history[i].win && currentStreak > 0) || (!history[i].win && currentStreak < 0)) {
            currentStreak += history[i].win ? 1 : -1;
        } else {
            break;
        }
    }

    return {
        totalBets,
        totalWagered,
        totalWon,
        netProfit,
        winRate,
        biggestWin,
        biggestLoss,
        currentStreak
    };
};

export default {
    formatCurrency,
    formatMultiplier,
    calculateWin,
    getCrashOdds,
    getDiceMultiplier,
    getDiceWinChance,
    getMinesMultiplier,
    getLimboOdds,
    getPlinkoPayouts,
    getRoulettePayouts,
    getRouletteNumberColor,
    getBlackjackCardValue,
    calculateBlackjackHand,
    getKenoPayouts,
    getTowerMultiplier,
    evaluatePokerHand,
    getSlotSymbols,
    calculateSlotPayout,
    calculateStats
};

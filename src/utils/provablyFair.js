/**
 * Provably Fair System using SHA-256
 * Implements cryptographic verification for all game outcomes
 */
import CryptoJS from 'crypto-js';

// Generate a random hex string
export const generateSeed = (length = 32) => {
    const chars = '0123456789abcdef';
    let result = '';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
        result += chars[array[i] % 16];
    }
    return result;
};

// Generate server seed hash (shown to player before bet)
export const hashServerSeed = (serverSeed) => {
    return CryptoJS.SHA256(serverSeed).toString();
};

// Combine seeds to generate outcome
export const generateOutcome = (serverSeed, clientSeed, nonce) => {
    const combinedSeed = `${serverSeed}-${clientSeed}-${nonce}`;
    const hash = CryptoJS.SHA256(combinedSeed).toString();
    return hash;
};

// Convert hash to float between 0 and 1
export const hashToFloat = (hash, startIndex = 0) => {
    const subHash = hash.substring(startIndex, startIndex + 8);
    const intValue = parseInt(subHash, 16);
    return intValue / 0xffffffff;
};

// Convert hash to integer in range
export const hashToInt = (hash, min, max, startIndex = 0) => {
    const float = hashToFloat(hash, startIndex);
    return Math.floor(float * (max - min + 1)) + min;
};

// Crash game outcome calculation
export const calculateCrashPoint = (hash) => {
    // House edge of 1%
    const houseEdge = 0.01;
    const h = parseInt(hash.substring(0, 13), 16);

    if (h % 33 === 0) {
        return 1.00; // Instant crash
    }

    const e = Math.pow(2, 52);
    const result = (100 * e - h) / (e - h);
    const crashPoint = Math.max(1, Math.floor(result * (1 - houseEdge)) / 100);

    return parseFloat(crashPoint.toFixed(2));
};

// Mines game - generate mine positions
export const generateMinePositions = (hash, mineCount, gridSize = 25) => {
    const positions = new Set();
    let index = 0;

    while (positions.size < mineCount && index < hash.length - 8) {
        const pos = hashToInt(hash, 0, gridSize - 1, index * 2);
        positions.add(pos);
        index++;
    }

    return Array.from(positions);
};

// Dice game - generate roll
export const generateDiceRoll = (hash) => {
    const float = hashToFloat(hash);
    return parseFloat((float * 100).toFixed(2));
};

// Limbo game - generate multiplier
export const generateLimboMultiplier = (hash) => {
    const float = hashToFloat(hash);
    if (float === 0) return 1.00;

    const multiplier = 0.99 / float;
    return Math.max(1.00, parseFloat(multiplier.toFixed(2)));
};

// Plinko game - generate path
export const generatePlinkoPath = (hash, rows = 16) => {
    const path = [];
    for (let i = 0; i < rows; i++) {
        const float = hashToFloat(hash, i * 2);
        path.push(float < 0.5 ? 0 : 1); // 0 = left, 1 = right
    }
    return path;
};

// Roulette game - generate number
export const generateRouletteNumber = (hash) => {
    return hashToInt(hash, 0, 36);
};

// Blackjack - generate deck shuffle
export const generateShuffledDeck = (hash) => {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

    const deck = [];
    for (const suit of suits) {
        for (const value of values) {
            deck.push({ suit, value });
        }
    }

    // Fisher-Yates shuffle using hash
    for (let i = deck.length - 1; i > 0; i--) {
        const j = hashToInt(hash, 0, i, (deck.length - i) * 2);
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
};

// Coin flip outcome
export const generateCoinFlip = (hash) => {
    const float = hashToFloat(hash);
    return float < 0.5 ? 'heads' : 'tails';
};

// Keno game - generate drawn numbers
export const generateKenoNumbers = (hash, count = 10, max = 40) => {
    const numbers = new Set();
    let index = 0;

    while (numbers.size < count && index < hash.length - 8) {
        const num = hashToInt(hash, 1, max, index * 2);
        numbers.add(num);
        index++;
    }

    return Array.from(numbers).sort((a, b) => a - b);
};

// Tower game - generate safe tiles per row
export const generateTowerSafeTiles = (hash, rows, tilesPerRow, safePerRow) => {
    const result = [];

    for (let row = 0; row < rows; row++) {
        const safeTiles = new Set();
        let index = 0;

        while (safeTiles.size < safePerRow && index < 10) {
            const tile = hashToInt(hash, 0, tilesPerRow - 1, (row * 10 + index) * 2);
            safeTiles.add(tile);
            index++;
        }

        result.push(Array.from(safeTiles));
    }

    return result;
};

// Slot machine - generate reel stops
export const generateSlotStops = (hash, reels = 5, symbolsPerReel = 10) => {
    const stops = [];
    for (let i = 0; i < reels; i++) {
        stops.push(hashToInt(hash, 0, symbolsPerReel - 1, i * 2));
    }
    return stops;
};

// Video Poker - generate initial hand and replacements
export const generatePokerHand = (hash, replaceIndices = []) => {
    const deck = generateShuffledDeck(hash);
    const hand = deck.slice(0, 5);

    // Replace cards at specified indices
    replaceIndices.forEach((index, i) => {
        if (index >= 0 && index < 5) {
            hand[index] = deck[5 + i];
        }
    });

    return hand;
};

// Verify a bet's outcome
export const verifyBet = (serverSeed, clientSeed, nonce, expectedOutcome, gameType) => {
    const hash = generateOutcome(serverSeed, clientSeed, nonce);

    let actualOutcome;
    switch (gameType) {
        case 'crash':
            actualOutcome = calculateCrashPoint(hash);
            break;
        case 'dice':
            actualOutcome = generateDiceRoll(hash);
            break;
        case 'limbo':
            actualOutcome = generateLimboMultiplier(hash);
            break;
        case 'roulette':
            actualOutcome = generateRouletteNumber(hash);
            break;
        case 'coinflip':
            actualOutcome = generateCoinFlip(hash);
            break;
        default:
            actualOutcome = hash;
    }

    return {
        verified: JSON.stringify(actualOutcome) === JSON.stringify(expectedOutcome),
        hash,
        actualOutcome,
        expectedOutcome
    };
};

export default {
    generateSeed,
    hashServerSeed,
    generateOutcome,
    hashToFloat,
    hashToInt,
    calculateCrashPoint,
    generateMinePositions,
    generateDiceRoll,
    generateLimboMultiplier,
    generatePlinkoPath,
    generateRouletteNumber,
    generateShuffledDeck,
    generateCoinFlip,
    generateKenoNumbers,
    generateTowerSafeTiles,
    generateSlotStops,
    generatePokerHand,
    verifyBet
};

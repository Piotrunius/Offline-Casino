/**
 * CASINO GAME TEMPLATES
 * =====================
 * Templates for 40+ additional games
 * Each template provides the complete structure for implementing new games
 * following the established patterns of the 10 core games.
 */

// ============================================================================
// GAME TEMPLATE BASE STRUCTURE
// ============================================================================

/*
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCasino } from '../context/CasinoContext';
import { useBet, useProvablyFair, useSound } from '../hooks/useGameHooks';
import BetControls from '../components/BetControls';
// Import specific Lucide icons as needed

const GameTemplate = () => {
  const { state } = useCasino();
  const { betAmount, setBetAmount, canBet, executeBet, resolveWin, resolveLoss, balance } = useBet();
  const { generateOutcome } = useProvablyFair();
  const { play } = useSound();

  // === GAME STATE ===
  const [gamePhase, setGamePhase] = useState('betting'); // betting | playing | result
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  // === GAME LOGIC ===
  const handleBet = async () => {
    if (!canBet) return;

    executeBet('gameName', multiplier);
    setGamePhase('playing');
    play('betPlace');

    // Generate outcome
    const hash = generateOutcome();
    // Use appropriate provablyFair function

    // Animate and resolve
    // ...

    // Resolve win/loss
    if (won) {
      resolveWin(winAmount);
      play('betWin');
    } else {
      resolveLoss();
      play('betLose');
    }

    setGamePhase('result');
  };

  // === RENDER ===
  return (
    <div className="h-full flex flex-col lg:flex-row gap-4">
      {/% Game area %/}
      <div className="flex-1 bg-casino-card border border-casino-border rounded-xl p-4">
        {/% Game visualization %/}
      </div>

      {/% Controls panel %/}
      <div className="w-full lg:w-80 space-y-4">
        <BetControls
          betAmount={betAmount}
          onBetChange={setBetAmount}
          onBet={handleBet}
          balance={balance}
          disabled={gamePhase !== 'betting'}
        />
      </div>
    </div>
  );
};

export default GameTemplate;
*/

// ============================================================================
// CARD GAMES (10 Templates)
// ============================================================================

export const cardGameTemplates = {
    // 1. BACCARAT
    baccarat: {
        name: 'Baccarat',
        description: 'Classic card comparing game',
        outcomes: ['player', 'banker', 'tie'],
        payouts: { player: 2, banker: 1.95, tie: 8 },
        provablyFairFunction: 'generateShuffledDeck',
        logic: `
      - Deal 2 cards each to Player and Banker
      - Calculate totals (face cards = 0, aces = 1)
      - Third card rules apply
      - Closest to 9 wins
    `
    },

    // 2. THREE CARD POKER
    threeCardPoker: {
        name: 'Three Card Poker',
        description: 'Poker variant with 3-card hands',
        handRankings: ['straight_flush', 'three_kind', 'straight', 'flush', 'pair', 'high_card'],
        payouts: { straight_flush: 40, three_kind: 30, straight: 6, flush: 3, pair: 1 },
        provablyFairFunction: 'generateShuffledDeck',
        logic: `
      - Deal 3 cards to player and dealer
      - Player decides to play or fold
      - Compare hands if both play
      - Ante bonus for strong hands
    `
    },

    // 3. CARIBBEAN STUD
    caribbeanStud: {
        name: 'Caribbean Stud Poker',
        description: '5-card poker vs dealer',
        handRankings: ['royal_flush', 'straight_flush', 'four_kind', 'full_house', 'flush', 'straight', 'three_kind', 'two_pair', 'pair', 'high_card'],
        payouts: { royal_flush: 100, straight_flush: 50, four_kind: 20, full_house: 7, flush: 5, straight: 4, three_kind: 3, two_pair: 2, pair: 1 },
        provablyFairFunction: 'generateShuffledDeck',
        logic: `
      - Ante bet required
      - 5 cards dealt to each
      - Dealer shows one card
      - Player folds or raises 2x ante
      - Dealer qualifies with A-K or better
    `
    },

    // 4. CASINO WAR
    casinoWar: {
        name: 'Casino War',
        description: 'High card wins',
        outcomes: ['win', 'lose', 'war'],
        payouts: { win: 2, war_win: 3, surrender: 0.5 },
        provablyFairFunction: 'generateShuffledDeck',
        logic: `
      - One card each
      - Higher card wins
      - Tie = War option
      - War: burn 3, deal 1 more
    `
    },

    // 5. RED DOG
    redDog: {
        name: 'Red Dog',
        description: 'Predict if third card falls between two',
        spreadPayouts: { 1: 5, 2: 4, 3: 2, 4: 1, '5+': 1 },
        provablyFairFunction: 'generateShuffledDeck',
        logic: `
      - Two cards dealt
      - Calculate spread between cards
      - Bet if third card falls between
      - Can raise before third card
    `
    },

    // 6. PAI GOW POKER
    paiGowPoker: {
        name: 'Pai Gow Poker',
        description: 'Split 7 cards into two hands',
        hands: ['high_hand', 'low_hand'],
        provablyFairFunction: 'generateShuffledDeck',
        logic: `
      - 7 cards dealt
      - Split into 5-card high and 2-card low
      - Both must beat dealer to win
      - One win = push
    `
    },

    // 7. HIGH-LOW (HILO)
    hilo: {
        name: 'Hi-Lo',
        description: 'Predict if next card is higher or lower',
        options: ['higher', 'lower', 'same'],
        payouts: { correct: 2, same: 12 },
        provablyFairFunction: 'generateShuffledDeck',
        logic: `
      - Show one card
      - Predict next card
      - Continue for multiplier chain
      - Wrong = lose all
    `
    },

    // 8. PONTOON
    pontoon: {
        name: 'Pontoon',
        description: 'British blackjack variant',
        terms: { pontoon: '21 with 2 cards', five_card_trick: '5 cards under 21' },
        payouts: { pontoon: 2.5, five_card_trick: 2, win: 1 },
        provablyFairFunction: 'generateShuffledDeck',
        logic: `
      - Similar to blackjack
      - Both dealer cards face down
      - Must hit on 14 or less
      - Pontoon beats 21
    `
    },

    // 9. SPANISH 21
    spanish21: {
        name: 'Spanish 21',
        description: 'Blackjack without 10s',
        bonusPayouts: { '777': 3, '678': 2, 'suited_777': 50 },
        provablyFairFunction: 'generateShuffledDeck',
        logic: `
      - Standard blackjack rules
      - No 10 cards in deck
      - Player 21 always wins
      - Bonus payouts for specific hands
    `
    },

    // 10. DOUBLE EXPOSURE
    doubleExposure: {
        name: 'Double Exposure',
        description: 'Blackjack with both dealer cards shown',
        houseEdgeRecovery: ['ties_lose', 'blackjack_pays_even'],
        provablyFairFunction: 'generateShuffledDeck',
        logic: `
      - Both dealer cards face up
      - Modified rules to offset advantage
      - Dealer wins ties (except blackjack)
      - Blackjack pays 1:1
    `
    }
};

// ============================================================================
// DICE GAMES (8 Templates)
// ============================================================================

export const diceGameTemplates = {
    // 1. CRAPS
    craps: {
        name: 'Craps',
        description: 'Classic casino dice game',
        bets: ['pass_line', 'dont_pass', 'come', 'dont_come', 'field', 'place', 'hardways'],
        payouts: { pass: 1, field: 1, hardways: 7 - 9 },
        provablyFairFunction: 'generateDiceRoll', // roll 2 dice
        logic: `
      - Come out roll establishes point
      - Pass line wins on 7/11, loses on 2/3/12
      - Hit point before 7 to win
      - Multiple bet types available
    `
    },

    // 2. SIC BO
    sicBo: {
        name: 'Sic Bo',
        description: 'Ancient Chinese dice game',
        bets: ['small', 'big', 'specific_triple', 'any_triple', 'specific_double', 'two_dice_combo', 'single_die', 'total'],
        payouts: { small_big: 1, triple: 180, any_triple: 30 },
        provablyFairFunction: 'generateDiceRoll', // roll 3 dice
        logic: `
      - Three dice rolled
      - Bet on totals, combinations, triples
      - Small (4-10) / Big (11-17)
      - Multiple simultaneous bets
    `
    },

    // 3. CHUCK-A-LUCK
    chuckALuck: {
        name: 'Chuck-a-Luck',
        description: 'Carnival dice game',
        bets: ['single', 'triple', 'big', 'small'],
        payouts: { single_1x: 1, single_2x: 2, single_3x: 10, triple: 30 },
        provablyFairFunction: 'generateDiceRoll',
        logic: `
      - Three dice in cage
      - Bet on numbers 1-6
      - Payout based on matches
      - Triple jackpot option
    `
    },

    // 4. KLONDIKE
    klondike: {
        name: 'Klondike',
        description: 'Beat the banker with 5 dice',
        rankings: ['five_kind', 'four_kind', 'full_house', 'straight', 'three_kind', 'two_pair', 'pair', 'nothing'],
        payouts: { win: 2, tie: 0 },
        provablyFairFunction: 'generateDiceRoll', // roll 5 dice twice
        logic: `
      - Both roll 5 dice
      - Poker-style rankings
      - Highest ranking wins
      - Can reroll non-scoring dice
    `
    },

    // 5. HAZARD
    hazard: {
        name: 'Hazard',
        description: 'Historical precursor to craps',
        mainNumbers: [5, 6, 7, 8, 9],
        outcomes: ['nicks', 'out', 'chance'],
        provablyFairFunction: 'generateDiceRoll',
        logic: `
      - Caster chooses main (5-9)
      - First roll determines outcome
      - Nicks/Outs based on main
      - Otherwise establish chance
    `
    },

    // 6. UNDER OVER 7
    underOver7: {
        name: 'Under Over 7',
        description: 'Simple dice prediction',
        bets: ['under', 'seven', 'over'],
        payouts: { under: 1, seven: 4, over: 1 },
        provablyFairFunction: 'generateDiceRoll',
        logic: `
      - Roll two dice
      - Bet under 7, exactly 7, or over 7
      - Simple and fast
      - 7 has highest payout
    `
    },

    // 7. ROLL THE BONES
    rollTheBones: {
        name: 'Roll the Bones',
        description: 'Target number dice game',
        targetMultipliers: { 2: 35, 3: 17, 4: 11, 5: 8, 6: 6, 7: 5, 8: 6, 9: 8, 10: 11, 11: 17, 12: 35 },
        provablyFairFunction: 'generateDiceRoll',
        logic: `
      - Pick target number (2-12)
      - Roll two dice
      - Match = win multiplier
      - Higher risk = higher reward
    `
    },

    // 8. LIGHTNING DICE
    lightningDice: {
        name: 'Lightning Dice',
        description: 'Three dice with multipliers',
        lightningMultipliers: [50, 100, 200, 500, 1000],
        basePayout: 'varies_by_total',
        provablyFairFunction: 'generateDiceRoll',
        logic: `
      - Bet on totals (3-18)
      - Random lightning multipliers
      - Three dice dropped in tower
      - Multiplied wins possible
    `
    }
};

// ============================================================================
// WHEEL/SPINNER GAMES (6 Templates)
// ============================================================================

export const wheelGameTemplates = {
    // 1. WHEEL OF FORTUNE
    wheelOfFortune: {
        name: 'Wheel of Fortune',
        description: 'Classic spinning wheel',
        segments: [1, 2, 5, 10, 20, 40, 'BONUS'],
        payouts: { 1: 1, 2: 2, 5: 5, 10: 10, 20: 20, 40: 40 },
        provablyFairFunction: 'generateRouletteNumber', // adapt for segments
        logic: `
      - Bet on segment values
      - Spin the wheel
      - Land on bet = win multiplier
      - Bonus wheel for jackpot
    `
    },

    // 2. DREAM CATCHER
    dreamCatcher: {
        name: 'Dream Catcher',
        description: 'Live casino wheel game',
        segments: { 1: 23, 2: 15, 5: 7, 10: 4, 20: 2, 40: 1, '2x': 1, '7x': 1 },
        multiplierSegments: ['2x', '7x'],
        provablyFairFunction: 'generateRouletteNumber',
        logic: `
      - Money wheel concept
      - Multiplier segments
      - Re-spin on multiplier
      - Previous bet multiplied
    `
    },

    // 3. SPIN A WIN
    spinAWin: {
        name: 'Spin a Win',
        description: 'Multiplier wheel game',
        segments: [1, 2, 5, 10, 20, 40],
        multipliers: ['2x', '3x', '5x', '7x'],
        provablyFairFunction: 'generateRouletteNumber',
        logic: `
      - Bet on numbers
      - Spin for result
      - Multipliers can stack
      - Multiple spins possible
    `
    },

    // 4. MONOPOLY LIVE
    monopolyLive: {
        name: 'Monopoly Live',
        description: 'Board game wheel hybrid',
        segments: [1, 2, 5, 10, '2_ROLLS', '4_ROLLS', 'CHANCE'],
        bonusFeature: 'monopoly_board',
        provablyFairFunction: 'generateRouletteNumber',
        logic: `
      - Bet on segments
      - Bonus = play Monopoly board
      - Collect multipliers on board
      - Chance cards for prizes
    `
    },

    // 5. CRAZY TIME
    crazyTime: {
        name: 'Crazy Time',
        description: 'Ultimate wheel game',
        segments: [1, 2, 5, 10, 'pachinko', 'cash_hunt', 'coin_flip', 'crazy_time'],
        bonusGames: 4,
        provablyFairFunction: 'generateRouletteNumber',
        logic: `
      - Multiple bonus games
      - Each bonus unique mechanic
      - Massive multiplier potential
      - Top slot for extra mult
    `
    },

    // 6. LIGHTNING WHEEL
    lightningWheel: {
        name: 'Lightning Wheel',
        description: 'Electrified number wheel',
        numbers: Array.from({ length: 54 }, (_, i) => i + 1),
        lightningNumbers: 'random_5',
        multipliers: [50, 100, 200, 500],
        provablyFairFunction: 'generateRouletteNumber',
        logic: `
      - Pick numbers on wheel
      - Random lightning strikes
      - Multiplied wins
      - 54 number wheel
    `
    }
};

// ============================================================================
// INSTANT WIN GAMES (8 Templates)
// ============================================================================

export const instantWinTemplates = {
    // 1. SCRATCH CARDS
    scratchCards: {
        name: 'Scratch Cards',
        description: 'Virtual scratch cards',
        gridSize: '3x3',
        symbols: ['💎', '7️⃣', '🍀', '⭐', '🎰'],
        payouts: { three_match: 'varies_by_symbol' },
        provablyFairFunction: 'generateSlotResult',
        logic: `
      - Reveal 9 symbols
      - Match 3 = win
      - Different symbol values
      - Instant gratification
    `
    },

    // 2. INSTANT KENO
    instantKeno: {
        name: 'Instant Keno',
        description: 'Fast keno variant',
        picks: '1-10',
        draws: 20,
        grid: 80,
        provablyFairFunction: 'generateKenoNumbers',
        logic: `
      - Pick up to 10 numbers
      - 20 numbers drawn instantly
      - Payout based on matches
      - No waiting
    `
    },

    // 3. PICK'EM
    pickEm: {
        name: "Pick'em",
        description: 'Choose and reveal',
        options: 12,
        picks: 2,
        prizes: ['multipliers', 'instant_wins', 'bonus'],
        provablyFairFunction: 'generateRandomSelection',
        logic: `
      - 12 hidden prizes
      - Pick 2 to reveal
      - Win what you reveal
      - One contains jackpot
    `
    },

    // 4. DIAMOND RUSH
    diamondRush: {
        name: 'Diamond Rush',
        description: 'Gem collection instant game',
        gems: ['💎', '💠', '🔷', '🔶', '🔹'],
        collectTarget: 3,
        provablyFairFunction: 'generateSlotResult',
        logic: `
      - Reveal gems one by one
      - Collect 3 matching = win
      - 3 skulls = game over
      - Continue until end
    `
    },

    // 5. CASH ERUPTION
    cashEruption: {
        name: 'Cash Eruption',
        description: 'Volcano themed instant win',
        levels: ['base', 'minor', 'major', 'grand'],
        multipliers: [5, 10, 50, 500],
        provablyFairFunction: 'generateRandomSelection',
        logic: `
      - Volcano erupts
      - Reveal multiplier level
      - Grand eruption = jackpot
      - Quick animations
    `
    },

    // 6. GOLD RUSH
    goldRush: {
        name: 'Gold Rush',
        description: 'Mining themed instant game',
        symbols: ['nugget', 'ore', 'diamond', 'dynamite'],
        collectToWin: 3,
        provablyFairFunction: 'generateRandomSelection',
        logic: `
      - Mine for treasures
      - Collect 3 nuggets
      - Diamond = bonus
      - Dynamite = end
    `
    },

    // 7. PENALTY SHOOTOUT
    penaltyShootout: {
        name: 'Penalty Shootout',
        description: 'Football instant game',
        attempts: 5,
        goalProbability: 0.7,
        provablyFairFunction: 'generateCoinFlip', // adapt
        logic: `
      - Take 5 penalties
      - Choose corner
      - Keeper AI guesses
      - Goals = win
    `
    },

    // 8. DARTS
    darts: {
        name: 'Darts',
        description: 'Virtual dart throwing',
        zones: ['bullseye', 'triple', 'double', 'single', 'miss'],
        payouts: { bullseye: 50, triple_20: 25, double: 5, single: 1 },
        provablyFairFunction: 'generateRandomSelection',
        logic: `
      - Aim at board
      - Random accuracy factor
      - Hit zone = payout
      - Multiple throws
    `
    }
};

// ============================================================================
// SLOT-STYLE GAMES (8 Templates)
// ============================================================================

export const slotGameTemplates = {
    // 1. CLASSIC SLOTS
    classicSlots: {
        name: 'Classic Slots',
        description: '3-reel classic machine',
        reels: 3,
        symbols: ['7️⃣', '🍒', '🍋', 'BAR', '💎'],
        paylines: 1,
        provablyFairFunction: 'generateSlotResult',
        logic: `
      - 3 reels, center payline
      - Match 3 symbols
      - 7s = jackpot
      - Simple and fast
    `
    },

    // 2. VIDEO SLOTS
    videoSlots: {
        name: 'Video Slots',
        description: '5-reel modern slots',
        reels: 5,
        rows: 3,
        paylines: 25,
        features: ['wilds', 'scatters', 'free_spins', 'bonus'],
        provablyFairFunction: 'generateSlotResult',
        logic: `
      - 5x3 grid
      - Multiple paylines
      - Wild substitutions
      - Scatter triggers bonus
    `
    },

    // 3. MEGAWAYS
    megaways: {
        name: 'Megaways Slots',
        description: 'Variable reel slots',
        reelsRange: '2-7 symbols per reel',
        maxWays: 117649,
        features: ['cascading', 'multipliers', 'free_spins'],
        provablyFairFunction: 'generateSlotResult',
        logic: `
      - Variable symbols per reel
      - Ways to win system
      - Cascading wins
      - Increasing multipliers
    `
    },

    // 4. FRUIT MACHINE
    fruitMachine: {
        name: 'Fruit Machine',
        description: 'UK pub style slots',
        features: ['nudge', 'hold', 'gamble', 'trail'],
        reels: 3,
        provablyFairFunction: 'generateSlotResult',
        logic: `
      - Nudge and hold features
      - Gamble option
      - Bonus trails
      - Skill elements
    `
    },

    // 5. CLUSTER PAYS
    clusterPays: {
        name: 'Cluster Pays',
        description: 'Match clusters instead of lines',
        gridSize: '7x7',
        minCluster: 5,
        cascading: true,
        provablyFairFunction: 'generateSlotResult',
        logic: `
      - Match 5+ adjacent
      - Clusters disappear
      - New symbols fall
      - Chain reactions
    `
    },

    // 6. INFINITY REELS
    infinityReels: {
        name: 'Infinity Reels',
        description: 'Expanding reel slots',
        startingReels: 3,
        expansionTrigger: 'any_win',
        maxExpansion: 'unlimited',
        provablyFairFunction: 'generateSlotResult',
        logic: `
      - Start with 3 reels
      - Win adds reel
      - Continues until no win
      - Multiplier increases
    `
    },

    // 7. BONUS BUY SLOTS
    bonusBuySlots: {
        name: 'Bonus Buy Slots',
        description: 'Buy bonus feature directly',
        buyInCost: '100x bet',
        guaranteedFeature: 'free_spins',
        provablyFairFunction: 'generateSlotResult',
        logic: `
      - Normal slot gameplay
      - Option to buy bonus
      - Skip to free spins
      - Higher variance
    `
    },

    // 8. PROGRESSIVE JACKPOT
    progressiveJackpot: {
        name: 'Progressive Jackpot',
        description: 'Growing jackpot slots',
        jackpotLevels: ['mini', 'minor', 'major', 'grand'],
        contributionRate: '2% of bet',
        provablyFairFunction: 'generateSlotResult',
        logic: `
      - Portion feeds jackpot
      - Random jackpot trigger
      - Wheel determines level
      - Resets after win
    `
    }
};

// ============================================================================
// GAME IMPLEMENTATION HELPER
// ============================================================================

export const implementGame = (template) => {
    return `
    /**
     * ${template.name}
     * ${template.description}
     *
     * Implementation Steps:
     * 1. Create ${template.name.replace(/\s/g, '')}Game.jsx in /src/games/
     * 2. Import and add to games object in App.jsx
     * 3. Add provably fair function if needed
     * 4. Add to Sidebar navigation
     * 5. Configure payouts in gameUtils.js
     *
     * Game Logic:
     * ${template.logic}
     *
     * Provably Fair Function: ${template.provablyFairFunction}
     */
  `;
};

// ============================================================================
// COMPLETE GAME LIST (50 Games)
// ============================================================================

export const COMPLETE_GAME_LIST = [
    // CORE GAMES (Implemented)
    { id: 'crash', name: 'Crash', category: 'originals', status: 'complete' },
    { id: 'mines', name: 'Mines', category: 'originals', status: 'complete' },
    { id: 'dice', name: 'Dice', category: 'originals', status: 'complete' },
    { id: 'plinko', name: 'Plinko', category: 'originals', status: 'complete' },
    { id: 'limbo', name: 'Limbo', category: 'originals', status: 'complete' },
    { id: 'roulette', name: 'Roulette', category: 'table', status: 'complete' },
    { id: 'blackjack', name: 'Blackjack', category: 'table', status: 'complete' },
    { id: 'coinflip', name: 'Coin Flip', category: 'originals', status: 'complete' },
    { id: 'tower', name: 'Tower', category: 'originals', status: 'complete' },
    { id: 'keno', name: 'Keno', category: 'lottery', status: 'complete' },

    // CARD GAMES (Templates)
    { id: 'baccarat', name: 'Baccarat', category: 'table', status: 'template' },
    { id: 'three-card-poker', name: 'Three Card Poker', category: 'table', status: 'template' },
    { id: 'caribbean-stud', name: 'Caribbean Stud', category: 'table', status: 'template' },
    { id: 'casino-war', name: 'Casino War', category: 'table', status: 'template' },
    { id: 'red-dog', name: 'Red Dog', category: 'table', status: 'template' },
    { id: 'pai-gow', name: 'Pai Gow Poker', category: 'table', status: 'template' },
    { id: 'hilo', name: 'Hi-Lo', category: 'originals', status: 'template' },
    { id: 'pontoon', name: 'Pontoon', category: 'table', status: 'template' },
    { id: 'spanish21', name: 'Spanish 21', category: 'table', status: 'template' },
    { id: 'double-exposure', name: 'Double Exposure', category: 'table', status: 'template' },

    // DICE GAMES (Templates)
    { id: 'craps', name: 'Craps', category: 'table', status: 'template' },
    { id: 'sic-bo', name: 'Sic Bo', category: 'table', status: 'template' },
    { id: 'chuck-a-luck', name: 'Chuck-a-Luck', category: 'table', status: 'template' },
    { id: 'klondike', name: 'Klondike', category: 'dice', status: 'template' },
    { id: 'hazard', name: 'Hazard', category: 'dice', status: 'template' },
    { id: 'under-over', name: 'Under Over 7', category: 'dice', status: 'template' },
    { id: 'roll-bones', name: 'Roll the Bones', category: 'dice', status: 'template' },
    { id: 'lightning-dice', name: 'Lightning Dice', category: 'dice', status: 'template' },

    // WHEEL GAMES (Templates)
    { id: 'wheel-fortune', name: 'Wheel of Fortune', category: 'wheel', status: 'template' },
    { id: 'dream-catcher', name: 'Dream Catcher', category: 'wheel', status: 'template' },
    { id: 'spin-a-win', name: 'Spin a Win', category: 'wheel', status: 'template' },
    { id: 'monopoly-live', name: 'Monopoly Live', category: 'wheel', status: 'template' },
    { id: 'crazy-time', name: 'Crazy Time', category: 'wheel', status: 'template' },
    { id: 'lightning-wheel', name: 'Lightning Wheel', category: 'wheel', status: 'template' },

    // INSTANT WIN (Templates)
    { id: 'scratch-cards', name: 'Scratch Cards', category: 'instant', status: 'template' },
    { id: 'instant-keno', name: 'Instant Keno', category: 'lottery', status: 'template' },
    { id: 'pick-em', name: "Pick'em", category: 'instant', status: 'template' },
    { id: 'diamond-rush', name: 'Diamond Rush', category: 'instant', status: 'template' },
    { id: 'cash-eruption', name: 'Cash Eruption', category: 'instant', status: 'template' },
    { id: 'gold-rush', name: 'Gold Rush', category: 'instant', status: 'template' },
    { id: 'penalty-shootout', name: 'Penalty Shootout', category: 'sports', status: 'template' },
    { id: 'darts', name: 'Darts', category: 'sports', status: 'template' },

    // SLOTS (Templates)
    { id: 'classic-slots', name: 'Classic Slots', category: 'slots', status: 'template' },
    { id: 'video-slots', name: 'Video Slots', category: 'slots', status: 'template' },
    { id: 'megaways', name: 'Megaways Slots', category: 'slots', status: 'template' },
    { id: 'fruit-machine', name: 'Fruit Machine', category: 'slots', status: 'template' },
    { id: 'cluster-pays', name: 'Cluster Pays', category: 'slots', status: 'template' },
    { id: 'infinity-reels', name: 'Infinity Reels', category: 'slots', status: 'template' },
    { id: 'bonus-buy', name: 'Bonus Buy Slots', category: 'slots', status: 'template' },
    { id: 'progressive', name: 'Progressive Jackpot', category: 'slots', status: 'template' }
];

export default {
    cardGameTemplates,
    diceGameTemplates,
    wheelGameTemplates,
    instantWinTemplates,
    slotGameTemplates,
    implementGame,
    COMPLETE_GAME_LIST
};

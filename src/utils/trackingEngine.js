// Umami Analytics Tracking Engine
// Provides convenient methods to track user interactions and statistics

const trackingEngine = {
    // Check if Umami is available
    isAvailable: () => {
        return typeof window !== 'undefined' && window.umami;
    },

    // Track a generic event
    track: (eventName, data = {}) => {
        if (trackingEngine.isAvailable()) {
            try {
                window.umami.track(eventName, data);
            } catch (error) {
                console.warn('Umami tracking error:', error);
            }
        }
    },

    // Game Events
    trackGameStart: (gameName, betAmount) => {
        trackingEngine.track('game_start', {
            game: gameName,
            bet: betAmount
        });
    },

    trackGameEnd: (gameName, betAmount, winAmount, profit) => {
        trackingEngine.track('game_end', {
            game: gameName,
            bet: betAmount,
            win: winAmount,
            profit: profit,
            result: profit > 0 ? 'win' : profit < 0 ? 'loss' : 'draw'
        });
    },

    trackBetPlaced: (gameName, betAmount) => {
        trackingEngine.track('bet_placed', {
            game: gameName,
            amount: betAmount
        });
    },

    trackWin: (gameName, amount, multiplier) => {
        trackingEngine.track('game_win', {
            game: gameName,
            amount: amount,
            multiplier: multiplier
        });
    },

    trackLoss: (gameName, amount) => {
        trackingEngine.track('game_loss', {
            game: gameName,
            amount: amount
        });
    },

    // Navigation Events
    trackGameChange: (fromGame, toGame) => {
        trackingEngine.track('game_change', {
            from: fromGame,
            to: toGame
        });
    },

    trackOpenModal: (modalType) => {
        trackingEngine.track('modal_open', {
            type: modalType
        });
    },

    trackCloseModal: (modalType) => {
        trackingEngine.track('modal_close', {
            type: modalType
        });
    },

    // Settings & Configuration Events
    trackSettingChange: (settingName, oldValue, newValue) => {
        trackingEngine.track('setting_changed', {
            setting: settingName,
            oldValue: oldValue,
            newValue: newValue
        });
    },

    trackToggleSetting: (settingName, enabled) => {
        trackingEngine.track('setting_toggled', {
            setting: settingName,
            enabled: enabled
        });
    },

    // Credit Events
    trackAddFreeCredits: (amount, currentCreditsUsed) => {
        trackingEngine.track('free_credits_added', {
            amount: amount,
            creditsUsed: currentCreditsUsed
        });
    },

    trackBalanceUpdate: (previousBalance, newBalance, reason) => {
        trackingEngine.track('balance_updated', {
            previous: previousBalance,
            new: newBalance,
            change: newBalance - previousBalance,
            reason: reason
        });
    },

    // Stock Exchange Events
    trackStockBuy: (symbol, shares, price, total) => {
        trackingEngine.track('stock_buy', {
            symbol: symbol,
            shares: shares,
            price: price,
            total: total
        });
    },

    trackStockSell: (symbol, shares, price, total, profit) => {
        trackingEngine.track('stock_sell', {
            symbol: symbol,
            shares: shares,
            price: price,
            total: total,
            profit: profit
        });
    },

    // Session/Progress Events
    trackSessionStart: (balance) => {
        trackingEngine.track('session_start', {
            startingBalance: balance
        });
    },

    trackSessionEnd: (startBalance, endBalance, gamesPlayed, totalProfit) => {
        trackingEngine.track('session_end', {
            startBalance: startBalance,
            endBalance: endBalance,
            gamesPlayed: gamesPlayed,
            totalProfit: totalProfit
        });
    },

    trackExportProgress: () => {
        trackingEngine.track('progress_exported');
    },

    trackImportProgress: (success) => {
        trackingEngine.track('progress_imported', {
            success: success
        });
    },

    // Statistics Events
    trackStreakMilestone: (streakCount) => {
        trackingEngine.track('streak_milestone', {
            streakLength: streakCount
        });
    },

    trackBiggestWin: (amount, gameName) => {
        trackingEngine.track('biggest_win', {
            amount: amount,
            game: gameName
        });
    },

    trackLargeBet: (betAmount, percentageOfBalance) => {
        trackingEngine.track('large_bet_placed', {
            amount: betAmount,
            percentageOfBalance: percentageOfBalance
        });
    },

    // Error Tracking
    trackError: (errorType, errorMessage, context) => {
        trackingEngine.track('error_occurred', {
            type: errorType,
            message: errorMessage,
            context: context
        });
    },

    // Admin Features
    trackAdminAction: (actionName, details) => {
        trackingEngine.track('admin_action', {
            action: actionName,
            details: details
        });
    }
};

export default trackingEngine;

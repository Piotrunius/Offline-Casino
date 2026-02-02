/**
 * Audio Engine - Web Audio API Sound Generator
 * Generates all game sounds procedurally using the Web Audio API
 */

class AudioEngine {
    constructor() {
        this.context = null;
        this.enabled = true;
        this.musicEnabled = true;
        this.soundVolume = 0.7;
        this.musicVolume = 0.3;
        this.initialized = false;
        this.masterGain = null;
        this.lastPlayedTimes = {}; // Track when sounds were last played
        this.minInterval = 50; // Minimum ms between same sound
    }

    init() {
        if (this.initialized) return;

        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                console.warn('Web Audio API not supported');
                this.enabled = false;
                return;
            }
            this.context = new AudioContextClass();
            this.masterGain = this.context.createGain();
            this.masterGain.connect(this.context.destination);
            this.masterGain.gain.value = this.soundVolume;
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
            this.enabled = false;
        }
    }

    // Resume audio context (required after user interaction)
    resume() {
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
    }

    // Create an oscillator with envelope
    createTone(frequency, duration, type = 'sine', attack = 0.01, decay = 0.1, sustain = 0.5, release = 0.1) {
        if (!this.enabled || !this.context) return;

        this.resume();

        // Wait for context to be running before scheduling
        if (this.context.state !== 'running') return;

        const now = this.context.currentTime;
        if (now < 0) return; // Safety check

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, now);

        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.linearRampToValueAtTime(this.soundVolume * 0.5, now + attack);
        gainNode.gain.linearRampToValueAtTime(this.soundVolume * 0.5 * sustain, now + attack + decay);
        gainNode.gain.setValueAtTime(this.soundVolume * 0.5 * sustain, now + duration - release);
        gainNode.gain.linearRampToValueAtTime(0.0001, now + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.start(now);
        oscillator.stop(now + duration);

        return oscillator;
    }

    // Create noise (for explosions, static, etc.)
    createNoise(duration, volume = 0.3) {
        if (!this.enabled || !this.context) return;

        this.resume();

        const now = Math.max(this.context.currentTime, 0);
        const bufferSize = this.context.sampleRate * duration;
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const output = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const source = this.context.createBufferSource();
        source.buffer = buffer;

        const gainNode = this.context.createGain();
        gainNode.gain.setValueAtTime(this.soundVolume * volume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

        source.connect(gainNode);
        gainNode.connect(this.masterGain);

        source.start(now);
        return source;
    }

    // Play a sequence of tones
    playSequence(notes, baseTime = 0.1) {
        notes.forEach((note, index) => {
            setTimeout(() => {
                this.createTone(note.freq, note.duration || 0.1, note.type || 'sine');
            }, index * baseTime * 1000);
        });
    }

    // Sound definitions
    play(soundName) {
        if (!this.enabled || !this.context) return;

        // Debounce: prevent same sound from playing too rapidly
        const now = Date.now();
        const lastPlayed = this.lastPlayedTimes[soundName] || 0;
        if (now - lastPlayed < this.minInterval) {
            return; // Skip if played too recently
        }
        this.lastPlayedTimes[soundName] = now;

        this.resume();

        switch (soundName) {
            // UI Sounds
            case 'click':
                this.createTone(800, 0.05, 'square', 0.001, 0.02, 0.3, 0.02);
                break;
            case 'hover':
                this.createTone(600, 0.03, 'sine', 0.001, 0.01, 0.2, 0.01);
                break;
            case 'toggle':
                this.createTone(500, 0.08, 'sine', 0.005, 0.02, 0.4, 0.03);
                setTimeout(() => this.createTone(700, 0.08, 'sine', 0.005, 0.02, 0.3, 0.03), 80);
                break;

            // Betting Sounds
            case 'betPlace':
                this.playSequence([
                    { freq: 400, duration: 0.05 },
                    { freq: 600, duration: 0.05 }
                ], 0.05);
                break;
            case 'betWin':
                this.playSequence([
                    { freq: 523, duration: 0.1 },
                    { freq: 659, duration: 0.1 },
                    { freq: 784, duration: 0.15 }
                ], 0.1);
                break;
            case 'betLose':
                this.playSequence([
                    { freq: 400, duration: 0.15, type: 'sawtooth' },
                    { freq: 300, duration: 0.2, type: 'sawtooth' }
                ], 0.15);
                break;
            case 'bigWin':
                this.playSequence([
                    { freq: 523, duration: 0.1 },
                    { freq: 659, duration: 0.1 },
                    { freq: 784, duration: 0.1 },
                    { freq: 1047, duration: 0.3 }
                ], 0.08);
                setTimeout(() => {
                    this.playSequence([
                        { freq: 784, duration: 0.1 },
                        { freq: 1047, duration: 0.2 }
                    ], 0.1);
                }, 400);
                break;
            case 'jackpot':
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        this.playSequence([
                            { freq: 523 * (1 + i * 0.2), duration: 0.15 },
                            { freq: 659 * (1 + i * 0.2), duration: 0.15 },
                            { freq: 784 * (1 + i * 0.2), duration: 0.2 }
                        ], 0.1);
                    }, i * 300);
                }
                break;

            // Crash Game
            case 'rocketLaunch':
                this.createNoise(0.3);
                this.createTone(150, 0.5, 'sawtooth', 0.1, 0.2, 0.6, 0.2);
                break;
            case 'rocketEngine':
                // Continuous rumble
                this.createTone(80, 0.3, 'sawtooth', 0.05, 0.1, 0.4, 0.1);
                this.createNoise(0.3, 0.1);
                break;
            case 'crash':
                this.createNoise(0.5);
                this.createTone(200, 0.3, 'sawtooth', 0.01, 0.1, 0.8, 0.15);
                this.createTone(100, 0.4, 'sawtooth', 0.05, 0.15, 0.6, 0.2);
                break;
            case 'cashout':
                this.playSequence([
                    { freq: 800, duration: 0.08 },
                    { freq: 1000, duration: 0.08 },
                    { freq: 1200, duration: 0.15 }
                ], 0.07);
                break;

            // Mines Game
            case 'tileClick':
                this.createTone(600, 0.05, 'square', 0.001, 0.02, 0.5, 0.02);
                break;
            case 'diamond':
                this.playSequence([
                    { freq: 880, duration: 0.08 },
                    { freq: 1100, duration: 0.1 }
                ], 0.06);
                break;
            case 'mineExplosion':
                this.createNoise(0.4);
                this.createTone(150, 0.3, 'sawtooth', 0.01, 0.1, 0.8, 0.15);
                break;

            // Dice Game
            case 'diceRoll':
                for (let i = 0; i < 6; i++) {
                    setTimeout(() => {
                        this.createTone(300 + Math.random() * 200, 0.03, 'square');
                    }, i * 40);
                }
                break;

            // Roulette
            case 'wheelSpin':
                this.createTone(200, 0.3, 'triangle', 0.1, 0.1, 0.5, 0.1);
                break;
            case 'ballBounce':
                this.createTone(800 + Math.random() * 400, 0.03, 'sine', 0.001, 0.01, 0.5, 0.01);
                break;
            case 'ballLand':
                this.createTone(500, 0.1, 'sine', 0.01, 0.03, 0.6, 0.05);
                this.createTone(700, 0.15, 'sine', 0.02, 0.05, 0.4, 0.08);
                break;
            case 'chipPlace':
                this.createTone(400, 0.04, 'square', 0.001, 0.01, 0.4, 0.02);
                setTimeout(() => this.createTone(600, 0.03, 'square', 0.001, 0.01, 0.3, 0.01), 30);
                break;

            // Plinko
            case 'plinkoStart':
                this.createTone(600, 0.08, 'sine', 0.01, 0.02, 0.5, 0.04);
                break;
            case 'plinkoBounce':
                const pitch = 400 + Math.random() * 800;
                this.createTone(pitch, 0.02, 'sine', 0.001, 0.005, 0.4, 0.01);
                break;
            case 'plinkoLand':
                this.playSequence([
                    { freq: 600, duration: 0.06 },
                    { freq: 800, duration: 0.08 }
                ], 0.05);
                break;

            // Blackjack
            case 'cardDeal':
                this.createNoise(0.05, 0.2);
                this.createTone(300, 0.03, 'square', 0.001, 0.01, 0.3, 0.01);
                break;
            case 'cardFlip':
                this.createNoise(0.04, 0.15);
                this.createTone(400, 0.04, 'square', 0.001, 0.015, 0.3, 0.015);
                break;
            case 'blackjack':
                this.playSequence([
                    { freq: 523, duration: 0.12 },
                    { freq: 659, duration: 0.12 },
                    { freq: 784, duration: 0.12 },
                    { freq: 1047, duration: 0.25 }
                ], 0.1);
                break;
            case 'bust':
                this.createTone(300, 0.2, 'sawtooth', 0.01, 0.05, 0.6, 0.1);
                this.createTone(200, 0.25, 'sawtooth', 0.05, 0.08, 0.5, 0.12);
                break;

            // Coin Flip
            case 'coinFlip':
                for (let i = 0; i < 10; i++) {
                    setTimeout(() => {
                        this.createTone(600 + i * 50, 0.04, 'triangle', 0.001, 0.01, 0.4, 0.02);
                    }, i * 80);
                }
                break;
            case 'coinLand':
                this.createTone(500, 0.08, 'triangle', 0.01, 0.02, 0.5, 0.04);
                this.createTone(800, 0.1, 'triangle', 0.02, 0.03, 0.4, 0.05);
                break;

            // Slots
            case 'slotSpin':
                this.createTone(200, 0.1, 'square', 0.01, 0.02, 0.3, 0.05);
                break;
            case 'slotStop':
                this.createTone(400, 0.08, 'square', 0.005, 0.02, 0.5, 0.03);
                this.createTone(300, 0.1, 'square', 0.01, 0.03, 0.4, 0.05);
                break;

            // Keno
            case 'kenoSelect':
                this.createTone(500, 0.04, 'sine', 0.001, 0.01, 0.4, 0.02);
                break;
            case 'kenoDraw':
                this.createTone(700, 0.06, 'sine', 0.005, 0.015, 0.5, 0.03);
                break;
            case 'kenoMatch':
                this.createTone(880, 0.1, 'sine', 0.01, 0.02, 0.6, 0.05);
                setTimeout(() => this.createTone(1100, 0.12, 'sine', 0.02, 0.03, 0.5, 0.06), 80);
                break;

            // Tower
            case 'towerClimb':
                this.playSequence([
                    { freq: 400, duration: 0.05 },
                    { freq: 500, duration: 0.05 },
                    { freq: 600, duration: 0.08 }
                ], 0.04);
                break;
            case 'towerFall':
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        this.createTone(600 - i * 80, 0.08, 'sawtooth', 0.01, 0.02, 0.5, 0.04);
                    }, i * 60);
                }
                break;

            // Limbo
            case 'limboTick':
                this.createTone(600, 0.02, 'square', 0.001, 0.005, 0.3, 0.01);
                break;
            case 'limboResult':
                this.createTone(800, 0.08, 'sine', 0.01, 0.02, 0.5, 0.04);
                break;

            // Notifications
            case 'notification':
                this.playSequence([
                    { freq: 800, duration: 0.08 },
                    { freq: 1000, duration: 0.12 }
                ], 0.08);
                break;
            case 'error':
                this.createTone(300, 0.15, 'sawtooth', 0.01, 0.03, 0.5, 0.08);
                break;

            default:
                // Generic click sound for unknown sounds
                this.createTone(600, 0.04, 'sine', 0.001, 0.01, 0.4, 0.02);
        }
    }

    // Stop all sounds (Web Audio handles this automatically)
    stop() {
        // No-op for Web Audio
    }

    stopAll() {
        // No-op for Web Audio
    }

    // Music methods (stubbed out for now)
    playMusic() {
        // Could implement with oscillators for ambient sounds
    }

    stopMusic() {
        // No-op
    }

    // Set volume
    setVolume(volume) {
        this.soundVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.soundVolume;
        }
    }

    setSoundVolume(volume) {
        this.setVolume(volume);
    }

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
    }

    // Toggle sounds
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    setSoundEnabled(enabled) {
        this.enabled = enabled;
    }

    setMusicEnabled(enabled) {
        this.musicEnabled = enabled;
    }

    setSoundVolume(volume) {
        this.soundVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain && this.context) {
            this.masterGain.gain.value = this.soundVolume;
        }
    }

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
    }

    getMuted() {
        return !this.enabled;
    }

    setMuted(muted) {
        this.enabled = !muted;
    }

    // Cleanup
    destroy() {
        if (this.context) {
            this.context.close();
            this.context = null;
        }
        this.initialized = false;
    }
}

// Export singleton instance
const audioEngine = new AudioEngine();
export default audioEngine;

// Named exports for convenience
export const playSound = (name) => audioEngine.play(name);
export const stopSound = () => audioEngine.stop();
export const playMusic = () => audioEngine.playMusic();
export const stopMusic = () => audioEngine.stopMusic();

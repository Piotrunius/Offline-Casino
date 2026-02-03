// Audio Engine - Web Audio API based sound system with anti-distortion measures
class AudioEngine {
    constructor() {
        this.context = null;
        this.masterVolume = 0.3; // Reduced default volume
        this.enabled = true;
        this.compressor = null;
        this.masterGain = null;
    }

    init() {
        if (this.context) return;
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();

            // Create master gain node
            this.masterGain = this.context.createGain();
            this.masterGain.gain.value = this.masterVolume;

            // Create compressor to prevent distortion/clipping
            this.compressor = this.context.createDynamicsCompressor();
            this.compressor.threshold.value = -24;
            this.compressor.knee.value = 30;
            this.compressor.ratio.value = 12;
            this.compressor.attack.value = 0.003;
            this.compressor.release.value = 0.25;

            // Connect: masterGain -> compressor -> destination
            this.masterGain.connect(this.compressor);
            this.compressor.connect(this.context.destination);
        } catch (e) {
            console.warn('Audio not supported:', e);
            this.enabled = false;
        }
    }

    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.masterVolume;
        }
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }

    // Generate oscillator-based sounds with soft envelope
    playTone(frequency, duration, type = 'sine', volume = 1) {
        if (!this.enabled) return;
        this.init();
        if (!this.context || !this.masterGain) return;

        try {
            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);

            oscillator.frequency.value = frequency;
            oscillator.type = type === 'noise' ? 'sine' : type; // 'noise' not supported, fallback

            const now = this.context.currentTime;
            // Lower volumes to prevent clipping
            const vol = Math.min(volume * 0.4, 0.3);

            // Soft attack to prevent clicks
            gainNode.gain.setValueAtTime(0.001, now);
            gainNode.gain.exponentialRampToValueAtTime(vol, now + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

            oscillator.start(now);
            oscillator.stop(now + duration + 0.01);
        } catch (e) {
            // Silently fail
        }
    }

    // Sound effects with reduced volumes
    playClick() {
        this.playTone(800, 0.04, 'sine', 0.2);
    }

    playBet() {
        this.playTone(400, 0.08, 'sine', 0.25);
        setTimeout(() => this.playTone(500, 0.08, 'sine', 0.2), 50);
    }

    playWin() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.15, 'sine', 0.3), i * 100);
        });
    }

    playBigWin() {
        const notes = [523, 659, 784, 880, 1047, 1175, 1319, 1568];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.35), i * 80);
        });
    }

    playLose() {
        this.playTone(200, 0.25, 'sine', 0.2);
        setTimeout(() => this.playTone(150, 0.3, 'sine', 0.15), 150);
    }

    playTick() {
        this.playTone(1000, 0.02, 'sine', 0.1);
    }

    playCrashTick() {
        this.playTone(600 + Math.random() * 100, 0.02, 'sine', 0.1);
    }

    playCrash() {
        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                this.playTone(100 + Math.random() * 30, 0.15, 'sine', 0.2 - i * 0.04);
            }, i * 50);
        }
    }

    playBounce() {
        this.playTone(300 + Math.random() * 100, 0.04, 'sine', 0.15);
    }

    playFlip() {
        for (let i = 0; i < 6; i++) {
            setTimeout(() => this.playTone(400 + i * 40, 0.02, 'sine', 0.1), i * 30);
        }
    }

    playWheelTick() {
        this.playTone(800 + Math.random() * 200, 0.015, 'sine', 0.1);
    }

    playWheelStop() {
        this.playTone(600, 0.08, 'sine', 0.25);
        setTimeout(() => this.playTone(800, 0.1, 'sine', 0.3), 100);
    }

    playCardDeal() {
        this.playTone(300, 0.04, 'sine', 0.15);
        this.playTone(1500, 0.02, 'sine', 0.08);
    }

    playCardFlip() {
        this.playTone(600, 0.04, 'sine', 0.15);
        setTimeout(() => this.playTone(900, 0.04, 'sine', 0.2), 30);
    }

    playSlotSpin() {
        this.playTone(200, 0.08, 'sine', 0.15);
    }

    playSlotStop() {
        this.playTone(400, 0.06, 'sine', 0.2);
    }

    playSelect() {
        this.playTone(600, 0.04, 'sine', 0.2);
    }

    playDeselect() {
        this.playTone(400, 0.04, 'sine', 0.15);
    }

    playReveal() {
        this.playTone(800, 0.08, 'sine', 0.2);
        setTimeout(() => this.playTone(1200, 0.08, 'sine', 0.18), 50);
    }

    playExplosion() {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.playTone(80 + Math.random() * 40, 0.12, 'sine', 0.25 - i * 0.04);
            }, i * 40);
        }
    }

    playRouletteBall() {
        this.playTone(1200, 0.015, 'sine', 0.12);
    }

    playRouletteDrop() {
        this.playTone(300, 0.1, 'sine', 0.25);
        setTimeout(() => this.playTone(250, 0.15, 'sine', 0.2), 100);
    }

    playCashout() {
        const notes = [400, 500, 600, 800, 1000];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.1, 'sine', 0.25), i * 60);
        });
    }

    playCard() {
        this.playTone(600, 0.03, 'sine', 0.15);
        setTimeout(() => this.playTone(800, 0.025, 'sine', 0.12), 20);
    }

    playDiceRoll() {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.playTone(200 + Math.random() * 200, 0.03, 'sine', 0.12);
            }, i * 50);
        }
    }

    playMineReveal() {
        this.playTone(700, 0.06, 'sine', 0.2);
        setTimeout(() => this.playTone(900, 0.06, 'sine', 0.18), 40);
    }

    playMineExplode() {
        for (let i = 0; i < 6; i++) {
            setTimeout(() => {
                this.playTone(60 + Math.random() * 50, 0.1, 'sine', 0.3 - i * 0.04);
            }, i * 30);
        }
    }

    playTowerClimb() {
        this.playTone(500, 0.08, 'sine', 0.2);
        setTimeout(() => this.playTone(700, 0.08, 'sine', 0.22), 80);
    }

    playKenoHit() {
        this.playTone(800, 0.06, 'sine', 0.22);
        setTimeout(() => this.playTone(1000, 0.06, 'sine', 0.2), 50);
    }
}

export const audio = new AudioEngine();
export default audio;

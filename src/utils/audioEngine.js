// Audio Engine - Web Audio API based sound system
class AudioEngine {
    constructor() {
        this.context = null;
        this.masterVolume = 0.5;
        this.enabled = true;
        this.sounds = {};
    }

    init() {
        if (this.context) return;
        this.context = new (window.AudioContext || window.webkitAudioContext)();
    }

    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }

    // Generate oscillator-based sounds
    playTone(frequency, duration, type = 'sine', volume = 1) {
        if (!this.enabled) return;
        this.init();

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        const now = this.context.currentTime;
        const vol = volume * this.masterVolume;

        gainNode.gain.setValueAtTime(vol, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

        oscillator.start(now);
        oscillator.stop(now + duration);
    }

    // Sound effects
    playClick() {
        this.playTone(800, 0.05, 'square', 0.3);
    }

    playBet() {
        this.playTone(400, 0.1, 'sine', 0.4);
        setTimeout(() => this.playTone(500, 0.1, 'sine', 0.3), 50);
    }

    playWin() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.5), i * 100);
        });
    }

    playBigWin() {
        const notes = [523, 659, 784, 880, 1047, 1175, 1319, 1568];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.3, 'sine', 0.6), i * 80);
        });
    }

    playLose() {
        this.playTone(200, 0.3, 'sawtooth', 0.3);
        setTimeout(() => this.playTone(150, 0.4, 'sawtooth', 0.2), 150);
    }

    playTick() {
        this.playTone(1000, 0.02, 'square', 0.2);
    }

    playCrashTick() {
        this.playTone(600 + Math.random() * 200, 0.03, 'sine', 0.15);
    }

    playCrash() {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.playTone(100 + Math.random() * 50, 0.2, 'sawtooth', 0.4 - i * 0.07);
            }, i * 40);
        }
    }

    playBounce() {
        this.playTone(300 + Math.random() * 200, 0.05, 'sine', 0.3);
    }

    playFlip() {
        for (let i = 0; i < 10; i++) {
            setTimeout(() => this.playTone(400 + i * 50, 0.03, 'sine', 0.2), i * 30);
        }
    }

    playWheelTick() {
        this.playTone(800 + Math.random() * 400, 0.02, 'square', 0.15);
    }

    playWheelStop() {
        this.playTone(600, 0.1, 'sine', 0.4);
        setTimeout(() => this.playTone(800, 0.15, 'sine', 0.5), 100);
    }

    playCardDeal() {
        this.playTone(200, 0.05, 'noise', 0.3);
        this.playTone(2000, 0.03, 'square', 0.1);
    }

    playCardFlip() {
        this.playTone(600, 0.05, 'sine', 0.2);
        setTimeout(() => this.playTone(900, 0.05, 'sine', 0.25), 30);
    }

    playSlotSpin() {
        this.playTone(150, 0.1, 'square', 0.2);
    }

    playSlotStop() {
        this.playTone(400, 0.08, 'square', 0.3);
    }

    playSelect() {
        this.playTone(600, 0.05, 'sine', 0.25);
    }

    playDeselect() {
        this.playTone(400, 0.05, 'sine', 0.2);
    }

    playReveal() {
        this.playTone(800, 0.1, 'sine', 0.3);
        setTimeout(() => this.playTone(1200, 0.1, 'sine', 0.25), 50);
    }

    playExplosion() {
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                this.playTone(80 + Math.random() * 60, 0.15, 'sawtooth', 0.5 - i * 0.05);
            }, i * 30);
        }
    }

    playRouletteBall() {
        this.playTone(1200, 0.02, 'sine', 0.2);
    }

    playRouletteDrop() {
        this.playTone(300, 0.15, 'sine', 0.4);
        setTimeout(() => this.playTone(250, 0.2, 'sine', 0.3), 100);
    }

    playCashout() {
        const notes = [400, 500, 600, 800, 1000];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.15, 'sine', 0.4), i * 60);
        });
    }

    playCard() {
        this.playTone(600, 0.04, 'sine', 0.25);
        setTimeout(() => this.playTone(800, 0.03, 'sine', 0.2), 20);
    }

    playDiceRoll() {
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                this.playTone(200 + Math.random() * 300, 0.04, 'square', 0.2);
            }, i * 40);
        }
    }

    playMineReveal() {
        this.playTone(700, 0.08, 'sine', 0.3);
        setTimeout(() => this.playTone(900, 0.08, 'sine', 0.25), 40);
    }

    playMineExplode() {
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                this.playTone(60 + Math.random() * 80, 0.12, 'sawtooth', 0.6 - i * 0.05);
            }, i * 25);
        }
    }

    playTowerClimb() {
        this.playTone(500, 0.1, 'sine', 0.3);
        setTimeout(() => this.playTone(700, 0.1, 'sine', 0.35), 80);
    }

    playKenoHit() {
        this.playTone(800, 0.08, 'sine', 0.35);
        setTimeout(() => this.playTone(1000, 0.08, 'sine', 0.3), 50);
    }
}

export const audio = new AudioEngine();
export default audio;

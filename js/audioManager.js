class AudioManager {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.bgmOsc = null;
        this.bgmGain = null;
        this.bgmStarted = false;
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.bgmGain) {
            this.bgmGain.gain.value = this.isMuted ? 0 : 0.05;
        }
        return this.isMuted;
    }

    playSound(freq, type, duration, volume = 0.1) {
        if (!this.ctx || this.isMuted) return;

        // Resume context if suspended (common in browsers)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playCoin() {
        this.playSound(880, 'triangle', 0.1, 0.1);
    }

    playPurchase() {
        this.playSound(523.25, 'sine', 0.2, 0.1); // C5
        setTimeout(() => this.playSound(659.25, 'sine', 0.2, 0.1), 50); // E5
        setTimeout(() => this.playSound(783.99, 'sine', 0.3, 0.1), 100); // G5
    }

    playNoMoney() {
        this.playSound(220, 'sawtooth', 0.2, 0.1);
        setTimeout(() => this.playSound(110, 'sawtooth', 0.3, 0.1), 100);
    }

    playDeath() {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.5);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(now + 0.5);
    }

    playRevive() {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.playSound(440 + i * 220, 'sine', 0.2, 0.05);
            }, i * 50);
        }
    }

    playActivation() {
        this.playSound(1000, 'square', 0.1, 0.05);
    }

    startBGM() {
        if (this.bgmStarted || !this.ctx) return;
        this.bgmStarted = true;

        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.value = this.isMuted ? 0 : 0.05;
        this.bgmGain.connect(this.ctx.destination);

        const playBeat = () => {
            if (!this.bgmStarted) return;

            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(60, now);
            osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.1);

            g.gain.setValueAtTime(0.2, now);
            g.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

            osc.connect(g);
            g.connect(this.bgmGain);

            osc.start();
            osc.stop(now + 0.1);

            setTimeout(playBeat, 500); // 120 BPM pulsing bass
        };

        playBeat();
    }

    stopBGM() {
        this.bgmStarted = false;
    }
}

window.AudioManager = AudioManager;

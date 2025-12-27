class JazzDancer {
    constructor() {
        this.showBtn = document.getElementById('showBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.container = document.querySelector('.dancer-container');
        this.musicBricks = document.getElementById('musicBricks');
        this.langSwitch = document.getElementById('langSwitch');
        this.currentLang = 'en';
        this.prefersReducedMotion = window.matchMedia
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.wasMusicPlayingBeforeHidden = false;
        this.wasDancingBeforeHidden = false;
        
        // ASCII dancer elements
        this.asciiDisplay = document.getElementById('asciiDisplay');
        this.asciiFrames = [];
        this.asciiCurrentFrame = 0;
        this.asciiAnimationId = null;
        this.isAsciiDancing = false;
        this.asciiFrameDelay = 33;
        this.asciiLastFrameTime = 0;
        this.asciiTotalFrames = 601;
        this.asciiIdleLoadId = null;
        
        // Vinyl player elements
        this.vinylPlayer = document.getElementById('vinylPlayer');
        this.vinylRecord = document.getElementById('vinylRecord');
        this.tonearm = document.getElementById('tonearm');
        this.playerPlayBtn = document.getElementById('playerPlayBtn');
        this.progressBar = document.getElementById('progressBar');
        this.progressFill = document.getElementById('progressFill');
        this.currentTimeEl = document.getElementById('currentTime');
        this.totalTimeEl = document.getElementById('totalTime');
        this.progressHandle = this.progressBar.querySelector('.progress-handle');
        this.statusEl = document.getElementById('statusMessage');
        this.startOverlay = document.getElementById('startOverlay');
        
        // Initialize audio element with Web Audio API for visualization
        this.audio = new Audio('assets/music/Nick Cave & The Bad Seeds - O Children (Official Audio).mp3');
        this.audio.loop = true;
        this.audio.volume = 0.7;
        this.audio.crossOrigin = "anonymous";
        this.audio.preload = 'metadata';
        
        // Web Audio API setup for real-time analysis
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.source = null;
        this.translations = {
            en: {
                title: 'Jazz Dancer',
                subtitle: 'Alive in Motion',
                play: 'Play Music',
                pause: 'Pause Music',
                start: 'Start Dance',
                stop: 'Stop Dancing',
                reset: 'Reset',
                quote: '"Dance is the hidden language of the soul."',
                author: '- Martha Graham',
                footer: 'Created with love for the dancer who feels alive in motion',
                langBtn: '中文',
                musicMsg: '🎵 Music is playing... Feel the rhythm!',
                musicPaused: 'Music paused',
                danceMsg: '💃 Let the music move you!',
                danceStopped: 'Dance stopped',
                resetMsg: 'Reset complete',
                specialMove: '✨ Special move! ✨',
                quotes: [
                    'Dance is the hidden language of the soul.',
                    'To dance is to be out of yourself. Larger, more beautiful, more powerful.',
                    'Dance is the only art of which we ourselves are the stuff of which it is made.',
                    'Life is the dancer and you are the dance.',
                    'Dance first. Think later. It\'s the natural order.'
                ],
                authors: [
                    '- Martha Graham',
                    '- Agnes de Mille',
                    '- Ted Shawn',
                    '- Eckhart Tolle',
                    '- Samuel Beckett'
                ]
            },
            cn: {
                title: '爵士舞者',
                subtitle: '舞动中绽放生命',
                play: '播放音乐',
                pause: '暂停音乐',
                start: '开始舞蹈',
                stop: '停止舞蹈',
                reset: '重置',
                quote: '“舞蹈是灵魂的隐秘语言。”',
                author: '- 玛莎·格雷厄姆',
                footer: '为那个因舞蹈而感到活着的你倾情制作',
                langBtn: 'EN',
                musicMsg: '🎵 音乐响起... 感受节奏！',
                musicPaused: '音乐已暂停',
                danceMsg: '💃 让音乐带动你！',
                danceStopped: '舞蹈已停止',
                resetMsg: '已重置',
                specialMove: '✨ 特别动作！✨',
                quotes: [
                    '舞蹈是灵魂的隐秘语言。',
                    '跳舞就是超越自我，变得更美、更强大。',
                    '舞蹈是唯一我们自身就是其素材的艺术。',
                    '生命是舞者，你是舞蹈。',
                    '先跳舞，后思考。这是自然的秩序。'
                ],
                authors: [
                    '- 玛莎·格雷厄姆',
                    '- 阿格妮丝·德·米尔',
                    '- 泰德·肖恩',
                    '- 埃克哈特·托利',
                    '- 塞缪尔·贝克特'
                ]
            }
        };
        this.quoteIndex = 0;
        
        this.isDancing = false;
        this.isMusicPlaying = false;
        this.particleInterval = null;
        this.isSeeking = false;
        this.seekPointerId = null;
        this.pendingSeekRatio = null;
        this.handleSeekMove = (event) => this.onSeekMove(event);
        this.handleSeekEnd = (event) => this.stopSeek(event);
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.observeVisibility();
        this.createParticles();
        this.initBricks();
        this.initLangSwitch();
        this.cycleQuotes();
        this.setupAudioAnalysis();
        this.initVinylPlayer();
        this.loadAsciiFrames();
    }
    
    setupAudioAnalysis() {
        // Initialize Web Audio API when user first interacts
        document.addEventListener('click', () => {
            this.ensureAudioContext();
            this.resumeAudioContext();
        }, { once: true });
    }

    ensureAudioContext() {
        if (this.audioContext) return;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 64; // Small FFT size for 32 frequency bins
        this.analyser.smoothingTimeConstant = 0.8;

        this.source = this.audioContext.createMediaElementSource(this.audio);
        this.source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);

        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    }

    resumeAudioContext() {
        if (!this.audioContext || this.audioContext.state !== 'suspended') return;
        this.audioContext.resume().catch(() => {});
    }

    observeVisibility() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.wasMusicPlayingBeforeHidden = this.isMusicPlaying;
                this.wasDancingBeforeHidden = this.isDancing;
                if (this.isMusicPlaying) this.stopMusic({ silent: true });
                if (this.isDancing) this.stopDance({ silent: true });
                return;
            }

            if (this.wasMusicPlayingBeforeHidden) this.startMusic({ silent: true });
            if (this.wasDancingBeforeHidden) this.startDance({ silent: true });
        });
    }
    
    bindEvents() {
        this.showBtn.addEventListener('click', () => this.toggleShow());
        this.resetBtn.addEventListener('click', () => this.reset());
        
        // Vinyl player events
        this.playerPlayBtn.addEventListener('click', () => this.toggleMusic());
        this.progressBar.addEventListener('click', (e) => this.seekAudio(e));
        this.progressBar.addEventListener('keydown', (e) => this.handleProgressKey(e));
        this.progressBar.addEventListener('pointerdown', (e) => this.startSeek(e));
        this.progressBar.addEventListener('mousedown', (e) => this.startSeek(e));
        this.progressBar.addEventListener('touchstart', (e) => this.startSeek(e), { passive: false });
        
        // Audio events for progress tracking
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        
        // Add keyboard controls
        document.addEventListener('keydown', (e) => {
            const target = e.target;
            const isEditable = target && target.isContentEditable;
            const isInteractive = target && target.closest
                ? target.closest('button, input, textarea, select, [role="slider"]')
                : false;
            if (isEditable || isInteractive) return;

            switch(e.key) {
                case ' ':
                    e.preventDefault();
                    this.toggleShow();
                    break;
                case 'm':
                    this.toggleMusic();
                    break;
                case 'r':
                    this.reset();
                    break;
            }
        });
        
        // Add mouse interaction for ASCII dancer
        this.asciiDisplay.addEventListener('click', () => {
            this.performSpecialMove();
        });
    }

    toggleMusic() {
        if (this.isMusicPlaying) {
            this.stopMusic();
            return;
        }
        this.startMusic();
    }

    startMusic({ silent = false } = {}) {
        this.isMusicPlaying = true;
        const t = this.translations[this.currentLang];
        this.playerPlayBtn.textContent = '⏸';
        this.playerPlayBtn.setAttribute('aria-pressed', 'true');
        if (!this.prefersReducedMotion) {
            this.startBrickEffect();
            this.startVinylAnimation();
        }
        this.showVinylPlayer();
        this.showMusicVisualization();
        if (!silent) this.showMessage(t.musicMsg);
        this.ensureAudioContext();
        this.resumeAudioContext();
        // Play the audio
        this.audio.play().catch(e => {
            console.log('Audio play failed:', e);
            if (!silent) this.showMessage('Click to enable audio');
        });
        this.updateStartOverlay();
    }

    stopMusic({ silent = false } = {}) {
        this.isMusicPlaying = false;
        const t = this.translations[this.currentLang];
        this.playerPlayBtn.textContent = '▶';
        this.playerPlayBtn.setAttribute('aria-pressed', 'false');
        this.stopBrickEffect();
        this.stopVinylAnimation();
        this.hideMusicVisualization();
        if (!silent) this.showMessage(t.musicPaused);
        // Pause the audio
        this.audio.pause();
        this.updateStartOverlay();
    }

    toggleShow() {
        // Merged control: start/stop dancing and music together.
        // Rule: when dance is off, clicking starts dance and ensures music is playing.
        // When dance is on, clicking stops dance and pauses music.
        if (this.isDancing) {
            this.stopDance();
            if (this.isMusicPlaying) this.stopMusic();
            return;
        }

        if (!this.isMusicPlaying) this.startMusic();
        this.startDance();
    }
    
    toggleDance() {
        if (this.isDancing) {
            this.stopDance();
            return;
        }
        this.startDance();
    }

    startDance({ silent = false } = {}) {
        this.isDancing = true;
        const t = this.translations[this.currentLang];
        this.showBtn.textContent = t.stop;
        this.showBtn.classList.add('active');
        this.showBtn.setAttribute('aria-pressed', 'true');
        if (!silent) this.showMessage(t.danceMsg);
        this.startAsciiDance();
        this.updateStartOverlay();
    }

    stopDance({ silent = false } = {}) {
        this.isDancing = false;
        const t = this.translations[this.currentLang];
        this.showBtn.textContent = t.start;
        this.showBtn.classList.remove('active');
        this.showBtn.setAttribute('aria-pressed', 'false');
        if (!silent) this.showMessage(t.danceStopped);
        this.stopAsciiDance();
        this.updateStartOverlay();
    }
    
    performSpecialMove() {
        const t = this.translations[this.currentLang];
        if (this.isDancing) {
            if (this.prefersReducedMotion) {
                this.showMessage(t.specialMove);
                return;
            }
            // Create special effect for ASCII dancer
            this.asciiDisplay.style.animation = 'ascii-special-glow 0.8s ease-in-out';
            setTimeout(() => {
                this.asciiDisplay.style.animation = '';
            }, 800);
            
            this.createSpecialParticles();
            this.showMessage(t.specialMove);
        }
    }
    
    reset() {
        const t = this.translations[this.currentLang];
        this.stopDance({ silent: true });
        this.stopMusic({ silent: true });
        this.playerPlayBtn.textContent = '▶';
        this.playerPlayBtn.setAttribute('aria-pressed', 'false');
        this.hideVinylPlayer();
        this.hideMusicVisualization();
        this.showMessage(t.resetMsg);
        // Stop and reset audio
        this.audio.pause();
        this.audio.currentTime = 0;
        this.setProgressRatio(0);
        this.currentTimeEl.textContent = '0:00';
        this.progressBar.setAttribute('aria-valuenow', '0');
        this.progressBar.setAttribute('aria-valuetext', '0:00 of 0:00');
        this.updateStartOverlay();
    }

    createParticles() {
        // Create initial ambient particles
        if (this.prefersReducedMotion || this.particleInterval) return;
        this.particleInterval = setInterval(() => {
            if (this.isMusicPlaying) {
                this.createParticle();
            }
        }, 2000);
    }
    
    createParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const x = Math.random() * this.container.offsetWidth;
        
        particle.style.left = x + 'px';
        particle.style.bottom = '0px';
        
        this.container.appendChild(particle);
        
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 3000);
    }
    
    createSpecialParticles() {
        if (this.prefersReducedMotion) return;
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                this.createParticle();
            }, i * 100);
        }
    }
    
    startBrickEffect() {
        if (this.prefersReducedMotion) return;
        if (this.brickRAF) return;

        const animate = () => {
            if (!this.isMusicPlaying) return;

            const center = Math.floor(this.brickCount / 2);
            if (this.analyser && this.dataArray) {
                this.analyser.getByteFrequencyData(this.dataArray);

                // 以中间为中心，左右对称分配频率数据
                for (let i = 0; i < this.brickCount; i++) {
                    // 计算距离中心的偏移
                    const offset = Math.abs(i - center);
                    // 频率数据分配：中心块用中间频率，两侧用更低/高频
                    let dataIndex;
                    if (i < center) {
                        // 左侧：低频
                        dataIndex = Math.floor((offset / center) * (this.dataArray.length / 2));
                    } else if (i > center) {
                        // 右侧：高频
                        dataIndex = Math.floor((offset / center) * (this.dataArray.length / 2)) + (this.dataArray.length / 2);
                    } else {
                        // 中间块：中频
                        dataIndex = Math.floor(this.dataArray.length / 2);
                    }
                    dataIndex = Math.min(Math.floor(dataIndex), this.dataArray.length - 1);
                    const amplitude = this.dataArray[dataIndex];

                    // 高度和样式
                    const height = 16 + (amplitude / 255) * 32;
                    this.bricks[i].style.height = height + 'px';

                    if (amplitude > 100) {
                        this.bricks[i].classList.add('active');
                        if (amplitude > 180) {
                            this.bricks[i].style.boxShadow = '0 0 8px #ff4081';
                        } else {
                            this.bricks[i].style.boxShadow = 'none';
                        }
                    } else {
                        this.bricks[i].classList.remove('active');
                        this.bricks[i].style.boxShadow = 'none';
                    }
                }
            } else {
                // Fallback: 中间为主轴的对称动画
                const t = performance.now() / 500;
                for (let i = 0; i < this.brickCount; i++) {
                    const center = Math.floor(this.brickCount / 2);
                    const offset = Math.abs(i - center);
                    const phase = (offset / center) * Math.PI + t;
                    const height = 16 + Math.abs(Math.sin(phase)) * 32;
                    this.bricks[i].style.height = height + 'px';
                    if (height > 35) {
                        this.bricks[i].classList.add('active');
                    } else {
                        this.bricks[i].classList.remove('active');
                    }
                }
            }

            this.brickRAF = requestAnimationFrame(animate);
        };

        this.brickRAF = requestAnimationFrame(animate);
    }
    
    stopBrickEffect() {
        if (this.brickRAF) {
            cancelAnimationFrame(this.brickRAF);
            this.brickRAF = null;
        }
        this.bricks.forEach(brick => {
            brick.classList.remove('active');
            brick.style.height = '16px';
            brick.style.boxShadow = 'none';
        });
    }
    
    initBricks() {
        this.brickCount = 12;
        this.musicBricks.innerHTML = '';
        this.bricks = [];
        for (let i = 0; i < this.brickCount; i++) {
            const brick = document.createElement('div');
            brick.className = 'brick';
            this.musicBricks.appendChild(brick);
            this.bricks.push(brick);
        }
    }
    
    initLangSwitch() {
        this.langSwitch.addEventListener('click', () => {
            this.currentLang = this.currentLang === 'en' ? 'cn' : 'en';
            this.applyLanguage();
        });
        this.applyLanguage();
    }
    
    applyLanguage() {
        const t = this.translations[this.currentLang];
        const nextLangLabel = this.currentLang === 'en' ? 'Switch to Chinese' : 'Switch to English';
        
        // Reset quote index when language changes to avoid array bounds issues
        this.quoteIndex = 0;
        
        document.documentElement.lang = this.currentLang === 'en' ? 'en' : 'zh-Hans';
        document.querySelector('#mainTitle .title-text').textContent = t.title;
        document.getElementById('mainSubtitle').textContent = t.subtitle;
        this.showBtn.textContent = this.isDancing ? t.stop : t.start;
        this.resetBtn.textContent = t.reset;
        this.langSwitch.textContent = t.langBtn;
        this.langSwitch.setAttribute('aria-label', nextLangLabel);
        this.langSwitch.setAttribute(
            'aria-pressed',
            this.currentLang === 'cn' ? 'true' : 'false'
        );
        document.querySelector('.quote').textContent = t.quotes[this.quoteIndex];
        document.querySelector('.quote-author').textContent = t.authors[this.quoteIndex];
        document.querySelector('.footer p').textContent = t.footer;
    }
    
    cycleQuotes() {
        setInterval(() => {
            this.quoteIndex = (this.quoteIndex + 1) % this.translations[this.currentLang].quotes.length;
            document.querySelector('.quote').style.opacity = '0';
            setTimeout(() => {
                document.querySelector('.quote').textContent = this.translations[this.currentLang].quotes[this.quoteIndex];
                document.querySelector('.quote-author').textContent = this.translations[this.currentLang].authors[this.quoteIndex];
                document.querySelector('.quote').style.opacity = '1';
            }, 500);
        }, 8000);
    }
    
    showMessage(text) {
        if (this.statusEl) {
            this.statusEl.textContent = text;
        }
        // Create a temporary message element
        const message = document.createElement('div');
        message.className = 'toast-message';
        message.textContent = text;
        
        document.body.appendChild(message);
        
        // Fade in
        setTimeout(() => {
            message.style.opacity = '1';
        }, 10);
        
        // Fade out and remove
        setTimeout(() => {
            message.style.opacity = '0';
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            }, 300);
        }, 2000);
    }

    updateStartOverlay() {
        if (!this.startOverlay) return;
        const shouldShow = !this.isDancing && !this.isMusicPlaying;
        this.startOverlay.classList.toggle('visible', shouldShow);
        this.startOverlay.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
    }
    
    // Vinyl Player Methods
    initVinylPlayer() {
        this.vinylPlayer.style.display = 'block';
        this.vinylPlayer.setAttribute('aria-hidden', 'true');
    }
    
    showVinylPlayer() {
        this.vinylPlayer.classList.add('active');
        this.vinylPlayer.setAttribute('aria-hidden', 'false');
    }
    
    hideVinylPlayer() {
        this.vinylPlayer.classList.remove('active');
        this.vinylPlayer.setAttribute('aria-hidden', 'true');
    }
    
    showMusicVisualization() {
        const musicVisualization = document.querySelector('.music-visualization');
        if (musicVisualization) {
            musicVisualization.classList.add('active');
        }
    }
    
    hideMusicVisualization() {
        const musicVisualization = document.querySelector('.music-visualization');
        if (musicVisualization) {
            musicVisualization.classList.remove('active');
        }
    }
    
    startVinylAnimation() {
        this.vinylRecord.classList.add('spinning');
        this.tonearm.classList.add('playing');
    }
    
    stopVinylAnimation() {
        this.vinylRecord.classList.remove('spinning');
        this.tonearm.classList.remove('playing');
    }
    
    updateProgress() {
        if (!this.canSeek()) return;
        const ratio = this.audio.currentTime / this.audio.duration;
        this.setProgressRatio(ratio);
        this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
        this.progressBar.setAttribute('aria-valuenow', Math.floor(this.audio.currentTime));
        this.progressBar.setAttribute(
            'aria-valuetext',
            `${this.formatTime(this.audio.currentTime)} of ${this.formatTime(this.audio.duration)}`
        );
    }
    
    updateDuration() {
        if (!this.canSeek()) return;
        this.totalTimeEl.textContent = this.formatTime(this.audio.duration);
        this.progressBar.setAttribute('aria-valuemax', Math.floor(this.audio.duration));
        this.progressBar.setAttribute(
            'aria-valuetext',
            `${this.formatTime(this.audio.currentTime)} of ${this.formatTime(this.audio.duration)}`
        );
        if (this.pendingSeekRatio !== null) {
            this.audio.currentTime = this.pendingSeekRatio * this.audio.duration;
            this.pendingSeekRatio = null;
            this.updateProgress();
        }
    }
    
    seekAudio(e) {
        if (!this.canSeek()) return;
        this.updateSeekFromPointer(e);
    }

    handleProgressKey(e) {
        if (!this.canSeek()) return;
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            this.seekBy(-5);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            this.seekBy(5);
        } else if (e.key === 'Home') {
            e.preventDefault();
            this.audio.currentTime = 0;
            this.updateProgress();
        } else if (e.key === 'End') {
            e.preventDefault();
            this.audio.currentTime = this.audio.duration;
            this.updateProgress();
        }
    }

    seekBy(deltaSeconds) {
        const nextTime = Math.min(
            Math.max(this.audio.currentTime + deltaSeconds, 0),
            this.audio.duration
        );
        this.audio.currentTime = nextTime;
        this.updateProgress();
    }

    startSeek(e) {
        if (!this.canSeek()) return;
        if (this.isSeeking) return;
        if (e.type === 'pointerdown' && e.button && e.button !== 0) return;
        if (e.type === 'mousedown' && e.button !== 0) return;
        e.preventDefault();
        this.isSeeking = true;
        this.progressBar.classList.add('dragging');

        if (e.type === 'pointerdown') {
            this.seekPointerId = e.pointerId;
            if (this.progressBar.setPointerCapture) {
                this.progressBar.setPointerCapture(e.pointerId);
            }
            window.addEventListener('pointermove', this.handleSeekMove);
            window.addEventListener('pointerup', this.handleSeekEnd);
            window.addEventListener('pointercancel', this.handleSeekEnd);
        } else if (e.type === 'mousedown') {
            window.addEventListener('mousemove', this.handleSeekMove);
            window.addEventListener('mouseup', this.handleSeekEnd);
        } else if (e.type === 'touchstart') {
            window.addEventListener('touchmove', this.handleSeekMove, { passive: false });
            window.addEventListener('touchend', this.handleSeekEnd);
            window.addEventListener('touchcancel', this.handleSeekEnd);
        }

        this.updateSeekFromPointer(e);
    }

    onSeekMove(e) {
        if (!this.isSeeking) return;
        if (e.type.startsWith('pointer')) {
            if (this.seekPointerId !== null && e.pointerId !== this.seekPointerId) return;
        }
        if (e.type.startsWith('touch')) e.preventDefault();
        this.updateSeekFromPointer(e);
    }

    stopSeek(e) {
        if (!this.isSeeking) return;
        if (e.type && e.type.startsWith('pointer')) {
            if (this.seekPointerId !== null && e.pointerId !== this.seekPointerId) return;
        }
        this.isSeeking = false;
        this.progressBar.classList.remove('dragging');
        if (this.progressBar.releasePointerCapture) {
            try {
                this.progressBar.releasePointerCapture(this.seekPointerId);
            } catch (error) {}
        }
        this.seekPointerId = null;
        window.removeEventListener('pointermove', this.handleSeekMove);
        window.removeEventListener('pointerup', this.handleSeekEnd);
        window.removeEventListener('pointercancel', this.handleSeekEnd);
        window.removeEventListener('mousemove', this.handleSeekMove);
        window.removeEventListener('mouseup', this.handleSeekEnd);
        window.removeEventListener('touchmove', this.handleSeekMove);
        window.removeEventListener('touchend', this.handleSeekEnd);
        window.removeEventListener('touchcancel', this.handleSeekEnd);
    }

    updateSeekFromPointer(e) {
        if (!this.canSeek()) return;
        const rect = this.progressBar.getBoundingClientRect();
        const clientX = this.getEventClientX(e);
        if (!Number.isFinite(clientX)) return;
        const clampedX = Math.min(Math.max(clientX - rect.left, 0), rect.width);
        const ratio = rect.width ? clampedX / rect.width : 0;
        if (!this.canSeek()) {
            this.pendingSeekRatio = ratio;
            this.setProgressRatio(ratio);
            return;
        }
        this.audio.currentTime = ratio * this.audio.duration;
        this.updateProgress();
    }

    getEventClientX(e) {
        if (e.touches && e.touches.length) return e.touches[0].clientX;
        if (e.changedTouches && e.changedTouches.length) return e.changedTouches[0].clientX;
        return e.clientX;
    }

    setProgressRatio(ratio) {
        const clamped = Math.min(Math.max(ratio, 0), 1);
        const percent = clamped * 100;
        this.progressFill.style.width = `${percent}%`;
        this.progressBar.style.setProperty('--progress', `${percent}%`);
    }

    canSeek() {
        return Number.isFinite(this.audio.duration) && this.audio.duration > 0;
    }
    
    formatTime(seconds) {
        if (!Number.isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    // ASCII Dance Methods
    async loadAsciiFrames() {
        // Load ASCII frames from the dancing_ascii directory
        this.asciiFrames = [];

        // Show large, visible loading message
        this.showLoadingMessage('Loading ASCII dancer...');

        // Add immediate fallback frames for mobile devices
        const fallbackFrames = this.getFallbackFrames();

        try {
            const packedFrames = await this.loadPackedFrames();
            if (packedFrames && packedFrames.length) {
                console.log(`Loaded ${packedFrames.length} packed ASCII frames`);
                this.asciiFrames = packedFrames;
                this.finishAsciiLoad();
                return;
            }

            const initialBatch = 30;
            const batchSize = 60;
            console.log(`Loading ${this.asciiTotalFrames} frames (initial ${initialBatch})`);

            const firstFrames = await this.loadFrameBatch(1, initialBatch);
            if (firstFrames.length < 5) {
                console.warn('Too few frames loaded, using fallback animation');
                this.asciiFrames = fallbackFrames;
                this.finishAsciiLoad();
                return;
            }

            this.asciiFrames = firstFrames;
            this.finishAsciiLoad();
            this.scheduleIdleFrameLoad(initialBatch + 1, batchSize);
        } catch (error) {
            console.error('Error loading ASCII frames:', error);
            this.asciiFrames = fallbackFrames;
            this.finishAsciiLoad();
        }
    }

    async loadPackedFrames() {
        try {
            const response = await fetch('assets/img/dancing/dancing_ascii/frames.json', {
                cache: 'force-cache'
            });
            if (!response.ok) return null;
            const data = await response.json();
            if (Array.isArray(data)) return data;
            if (data && Array.isArray(data.frames)) return data.frames;
        } catch (error) {
            console.warn('Packed frames unavailable:', error.message);
        }
        return null;
    }

    async loadFrameBatch(start, end) {
        const promises = [];
        for (let i = start; i <= end; i++) {
            const frameNumber = i.toString().padStart(4, '0');
            promises.push(
                fetch(`assets/img/dancing/dancing_ascii/dancing_${frameNumber}.txt`, {
                    cache: 'force-cache'
                })
                    .then(response => (response.ok ? response.text() : null))
                    .then(content => (content ? { index: i - 1, content } : null))
                    .catch(() => null)
            );
        }

        const results = await Promise.all(promises);
        return results
            .filter(Boolean)
            .map(result => result.content);
    }

    scheduleIdleFrameLoad(startFrame, batchSize) {
        const loadNext = async (start) => {
            if (start > this.asciiTotalFrames) return;
            const end = Math.min(start + batchSize - 1, this.asciiTotalFrames);
            const frames = await this.loadFrameBatch(start, end);
            if (frames.length) {
                this.asciiFrames.push(...frames);
            }
            const nextStart = end + 1;
            if (nextStart <= this.asciiTotalFrames) {
                this.asciiIdleLoadId = this.requestIdleCallback(() => loadNext(nextStart));
            }
        };

        this.asciiIdleLoadId = this.requestIdleCallback(() => loadNext(startFrame));
    }

    requestIdleCallback(callback) {
        if (typeof window.requestIdleCallback === 'function') {
            return window.requestIdleCallback(callback, { timeout: 1000 });
        }
        return window.setTimeout(callback, 50);
    }

    finishAsciiLoad() {
        if (this.asciiFrames.length === 0) return;
        this.clearLoadingMessage();
        this.asciiCurrentFrame = 0;
        this.asciiDisplay.textContent = this.asciiFrames[0];
        this.updateStartOverlay();
    }
    
    showLoadingMessage(text) {
        // Clear any existing content
        this.asciiDisplay.textContent = '';
        
        // Use CSS class for loading message styling
        this.asciiDisplay.classList.add('loading-message');
        this.asciiDisplay.textContent = text;
    }
    
    clearLoadingMessage() {
        // Remove loading message class to return to normal ASCII display styles
        this.asciiDisplay.classList.remove('loading-message');
    }

    getFallbackFrames() {
        // Embedded ASCII frames that work immediately without network requests
        return [
            this.getStaticDancer(),
            `
    ✨ JAZZ DANCER ✨
    
        👤
       /|\\    🎵
       / \\
    
    ~ Step Right ~
            `,
            `
    ✨ JAZZ DANCER ✨
    
        👤
       \\|/    🎶
        |
       / \\
    
    ~ Arms Up ~
            `,
            `
    ✨ JAZZ DANCER ✨
    
        👤
        |\\    🎵
        |
        >\\
    
    ~ Kick Left ~
            `,
            `
    ✨ JAZZ DANCER ✨
    
        👤
       /|     🎶
        |
       /<
    
    ~ Kick Right ~
            `,
            `
    ✨ JAZZ DANCER ✨
    
        👤
       /|\\    🎵
       / \\
    
    ~ Jazz Hands ~
            `,
            `
    ✨ JAZZ DANCER ✨
    
        👤
        |⚡   🎶
        |
       / \\
    
    ~ Spin Move ~
            `,
            `
    ✨ JAZZ DANCER ✨
    
       \\👤/   
        |     🎵
       / \\
    
    ~ Big Finish ~
            `
        ];
    }
    
    getStaticDancer() {
        return `
    ✨ JAZZ DANCER ✨
    
        👤
       /|\\    🎵
       / \\
    
    Ready to Dance!
    
    🎶 Click 'Start Dancing' 🎶
        `;
    }
    
    startAsciiDance() {
        if (this.asciiFrames.length === 0) {
            console.warn('No ASCII frames loaded, using fallback');
            this.asciiFrames = this.getFallbackFrames();
            this.asciiDisplay.textContent = this.asciiFrames[0];
        }
        
        // Clear any loading message and reset to normal display
        this.clearLoadingMessage();
        
        this.isAsciiDancing = true;
        if (!this.prefersReducedMotion) this.asciiDisplay.classList.add('dancing');

        this.asciiFrameDelay = this.prefersReducedMotion ? 120 : 33;
        this.asciiLastFrameTime = performance.now();

        console.log(`Starting ASCII dance with ${this.asciiFrames.length} frames, delay: ${this.asciiFrameDelay}ms`);

        const animate = (now) => {
            if (!this.isAsciiDancing) return;
            if (now - this.asciiLastFrameTime >= this.asciiFrameDelay) {
                this.asciiDisplay.textContent = this.asciiFrames[this.asciiCurrentFrame];
                this.asciiCurrentFrame = (this.asciiCurrentFrame + 1) % this.asciiFrames.length;
                this.asciiLastFrameTime = now;
            }
            this.asciiAnimationId = requestAnimationFrame(animate);
        };

        this.asciiAnimationId = requestAnimationFrame(animate);
    }
    
    stopAsciiDance() {
        this.isAsciiDancing = false;
        this.asciiDisplay.classList.remove('dancing');
        
        if (this.asciiAnimationId) {
            cancelAnimationFrame(this.asciiAnimationId);
            this.asciiAnimationId = null;
        }
        
        // Reset to first frame
        this.asciiCurrentFrame = 0;
        if (this.asciiFrames.length > 0) {
            this.asciiDisplay.textContent = this.asciiFrames[0];
        }
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new JazzDancer();
    
    // Add some initial charm with entrance animation for ASCII display
    setTimeout(() => {
        const asciiDisplay = document.getElementById('asciiDisplay');
        if (asciiDisplay) {
            asciiDisplay.style.animation = 'ascii-entrance 2s ease-in-out';
            setTimeout(() => {
                asciiDisplay.style.animation = '';
            }, 2000);
        }
    }, 1000);
});

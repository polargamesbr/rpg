/**
 * Visual Novel Dialogue System - Liquid Glass Edition
 * Handles portraits, dynamic name tag positioning, and procedural audio.
 */
(function () {
    'use strict';

    let dialogueData = [];
    let currentIndex = 0;
    let isTyping = false;
    let typeTimeout = null;
    let activeScenarioId = null;
    const dialogueCache = new Map();
    const preloadCache = new Set();
    const imageCache = new Map();
    const audioCache = new Map();
    let currentAudio = null;
    let audioPlayToken = 0;

    // Audio Context for procedural bleeps
    let audioCtx = null;

    const scenarioBaseUrl = '/game/dialogues/';

    /**
     * Procedural bleep sound
     */
    function ensureAudioContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playTypeSound() {
        try {
            ensureAudioContext();

            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(350 + (Math.random() * 150), audioCtx.currentTime);

            gain.gain.setValueAtTime(0.09, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.05);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start();
            osc.stop(audioCtx.currentTime + 0.04);
        } catch (e) {
            // Silently fail
        }
    }

    function initLayout() {
        if (document.getElementById('dialogue-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'dialogue-overlay';
        overlay.className = 'dialogue-overlay';
        overlay.innerHTML = `
            <div class="portrait-container">
                <img id="portrait-left" class="portrait side-left" src="" alt="">
                <img id="portrait-right" class="portrait side-right" src="" alt="">
            </div>
            <div class="dialogue-loading" id="dialogue-loading">
                <div class="dialogue-loading-card">
                    <div class="dialogue-loading-spinner"></div>
                    <div class="dialogue-loading-text">Carregando narrativa...</div>
                </div>
            </div>
            <div class="dialogue-box" id="dialogue-box">
                <div class="corner-accent corner-tl"></div>
                <div class="corner-accent corner-tr"></div>
                <div class="corner-accent corner-bl"></div>
                <div class="corner-accent corner-br"></div>
                <div class="dialogue-name-tag" id="dialogue-name"></div>
                <div class="dialogue-content" id="dialogue-content"></div>
                <div class="dialogue-next-indicator">
                    <div class="dialogue-next-icon">▼</div>
                    <div class="dialogue-next-text">Clique para continuar</div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.addEventListener('click', () => {
            ensureAudioContext();
            advance();
        });
        window.addEventListener('keydown', (e) => {
            if (overlay.classList.contains('visible') && (e.key === ' ' || e.key === 'Enter')) {
                ensureAudioContext();
                advance();
            }
        });

        window.addEventListener('resize', () => {
            requestAnimationFrame(updatePortraitBase);
        });
    }

    async function initDialog(scenarioId) {
        initLayout();
        const id = String(scenarioId);
        activeScenarioId = id;

        const overlay = document.getElementById('dialogue-overlay');
        overlay.classList.add('visible');
        const loading = document.getElementById('dialogue-loading');
        if (loading) loading.classList.add('visible');

        try {
            const payload = await loadDialogue(id);
            const assets = collectAssets(payload);
            await Promise.all([
                preloadImages(assets.images),
                preloadAudios(assets.audios)
            ]);
            dialogueData = payload.steps || [];
            currentIndex = 0;
            if (dialogueData.length === 0) {
                console.error(`Scenario "${id}" not found.`);
                finish(false);
                return;
            }
        } catch (e) {
            console.error('Failed to load dialogue', e);
            finish(false);
            return;
        }
        if (loading) {
            loading.classList.add('is-fading');
        }
        requestAnimationFrame(() => {
            if (loading) loading.classList.remove('visible');
            if (loading) loading.classList.remove('is-fading');
            renderStep();
        });
    }

    function renderStep() {
        const step = dialogueData[currentIndex];
        const nameEl = document.getElementById('dialogue-name');
        const contentEl = document.getElementById('dialogue-content');
        const portraitLeft = document.getElementById('portrait-left');
        const portraitRight = document.getElementById('portrait-right');
        const nextIndicator = document.querySelector('.dialogue-next-indicator');
        const dialogueBox = document.getElementById('dialogue-box');
        const overlay = document.getElementById('dialogue-overlay');

        const stepName = applyContext(step.name || '');
        const stepText = applyContext(step.text || '');

        nameEl.textContent = stepName;
        nameEl.classList.remove('at-left', 'at-right', 'at-center');

        if (step.side === 'center') {
            nameEl.classList.add('at-center');
            portraitLeft.classList.remove('visible', 'active', 'muted');
            portraitRight.classList.remove('visible', 'active', 'muted');
        } else if (step.side === 'left') {
            nameEl.classList.add('at-left');
            if (step.image) {
                setPortraitSrc(portraitLeft, step.image);
                portraitLeft.classList.add('visible', 'active');
                portraitLeft.classList.remove('muted');
            } else {
                portraitLeft.classList.remove('visible', 'active', 'muted');
            }
            if (portraitRight.src && portraitRight.src !== '') {
                portraitRight.classList.add('visible', 'muted');
                portraitRight.classList.remove('active');
            } else {
                portraitRight.classList.remove('visible', 'active', 'muted');
            }
        } else {
            nameEl.classList.add('at-right');
            if (step.image) {
                setPortraitSrc(portraitRight, step.image);
                portraitRight.classList.add('visible', 'active');
                portraitRight.classList.remove('muted');
            } else {
                portraitRight.classList.remove('visible', 'active', 'muted');
            }
            if (portraitLeft.src && portraitLeft.src !== '') {
                portraitLeft.classList.add('visible', 'muted');
                portraitLeft.classList.remove('active');
            } else {
                portraitLeft.classList.remove('visible', 'active', 'muted');
            }
        }

        if (dialogueBox) {
            dialogueBox.classList.toggle('choice-mode', step.type === 'choice');
            dialogueBox.classList.toggle('has-next', step.type !== 'choice');
        }
        if (overlay) {
            overlay.classList.toggle('center-mode', step.side === 'center' || step.type === 'choice');
        }
        if (contentEl) {
            contentEl.classList.toggle('choice-scroll', step.type === 'choice');
        }

        if (step.type === 'choice') {
            isTyping = false;
            stopCurrentAudio();
            if (nextIndicator) nextIndicator.style.display = 'none';
            const options = Array.isArray(step.options) ? step.options : [];
            contentEl.innerHTML = `
                <div class="dialogue-choice-list">
                    ${options.map((opt, index) => `<button class="dialogue-choice" data-index="${index}">${opt.text}</button>`).join('')}
                </div>
            `;
            contentEl.querySelectorAll('.dialogue-choice').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const idx = parseInt(btn.getAttribute('data-index'), 10);
                    const option = options[idx];
                    if (!option || typeof option.next !== 'number') return;
                    currentIndex = option.next;
                    renderStep();
                });
            });
            requestAnimationFrame(updatePortraitBase);
            return;
        }

        if (nextIndicator) nextIndicator.style.display = 'flex';
        
        // Stop any playing audio
        stopCurrentAudio();
        
        // Always use typewriter with MIDI bleeps
        typeWriter(stepText, contentEl);
        
        requestAnimationFrame(updatePortraitBase);
    }

    function showTextWithTransition(text, element) {
        // Add skeleton shimmer effect
        element.classList.add('dialogue-skeleton');
        element.innerHTML = `
            <div class="skeleton-line" style="width: 90%"></div>
            <div class="skeleton-line" style="width: 85%"></div>
            <div class="skeleton-line" style="width: 70%"></div>
        `;
        
        // After short delay, fade in real text
        setTimeout(() => {
            element.classList.remove('dialogue-skeleton');
            element.classList.add('dialogue-fade-in');
            element.textContent = text;
            
            // Remove fade class after animation
            setTimeout(() => {
                element.classList.remove('dialogue-fade-in');
            }, 400);
        }, 300);
    }

    function typeWriter(text, element) {
        isTyping = true;
        element.textContent = '';
        let charIndex = 0;

        if (typeTimeout) clearTimeout(typeTimeout);

        const charDelay = 30; // Fixed speed with MIDI bleeps

        function type() {
            if (charIndex < text.length) {
                const char = text.charAt(charIndex);
                element.textContent += char;
                if (char !== ' ') playTypeSound(); // MIDI bleep sound
                charIndex++;
                typeTimeout = setTimeout(type, charDelay);
            } else {
                isTyping = false;
            }
        }
        type();
    }

    function advance() {
        const step = dialogueData[currentIndex];
        if (!step) return;

        if (step.type === 'choice') {
            return;
        }

        const contentEl = document.getElementById('dialogue-content');

        if (isTyping) {
            clearTimeout(typeTimeout);
            contentEl.textContent = applyContext(step.text || '');
            isTyping = false;
            return;
        }

        // Stop any playing audio before moving to next step
        stopCurrentAudio();

        if (typeof step.next === 'number') {
            currentIndex = step.next;
        } else {
            currentIndex++;
        }
        if (currentIndex < dialogueData.length) {
            renderStep();
        } else {
            finish(true);
        }
    }

    function finish(completed = true) {
        stopCurrentAudio();
        const overlay = document.getElementById('dialogue-overlay');
        const portraits = document.querySelectorAll('.portrait');
        overlay.classList.remove('visible');
        portraits.forEach(p => p.classList.remove('visible', 'active'));
        const loading = document.getElementById('dialogue-loading');
        if (loading) loading.classList.remove('visible');

        if (typeof window.onDialogueFinish === 'function') {
            window.onDialogueFinish(activeScenarioId, completed);
        }
        activeScenarioId = null;
    }

    function stopCurrentAudio() {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
        }
        audioPlayToken += 1;
    }

    function getAudioDuration(audioSrc) {
        if (!audioSrc || !audioCache.has(audioSrc)) {
            return 0;
        }
        const audio = audioCache.get(audioSrc);
        return audio.duration || 0;
    }

    function playStepAudio(audioSrc) {
        if (!audioSrc) return;

        if (!audioCache.has(audioSrc)) {
            console.warn(`Audio not preloaded: ${audioSrc}`);
            return;
        }

        const audio = audioCache.get(audioSrc);
        if (!audio.duration || audio.duration === 0) {
            console.warn(`Skipping invalid audio file: ${audioSrc}`);
            return;
        }

        // Stop any existing audio and invalidate prior play calls
        stopCurrentAudio();

        // Token ensures only latest play stays active
        const token = ++audioPlayToken;
        currentAudio = audio;
        audio.pause();
        audio.currentTime = 0;

        audio.onended = () => {
            if (audioPlayToken === token) {
                currentAudio = null;
            }
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                if (audioPlayToken !== token) {
                    audio.pause();
                    return;
                }
                console.log(`Playing audio: ${audioSrc} (duration: ${audio.duration}s)`);
            }).catch(err => {
                if (err && err.name === 'AbortError') {
                    return;
                }
                console.warn('Failed to play audio:', audioSrc, err);
                if (audioPlayToken === token) {
                    currentAudio = null;
                }
            });
        }
    }

    window.initDialog = initDialog;

    function updatePortraitBase() {
        const overlay = document.getElementById('dialogue-overlay');
        const dialogueBox = document.getElementById('dialogue-box');
        if (!overlay || !dialogueBox) return;
        const rect = dialogueBox.getBoundingClientRect();
        const base = Math.max(16, window.innerHeight - rect.bottom);
        overlay.style.setProperty('--dialogue-portrait-base', `${base}px`);
    }

    function applyContext(text) {
        if (!text) return '';
        const ctx = window.dialogueContext || {};
        return text.replace(/\{(\w+)\}/g, (match, key) => {
            if (ctx[key] === undefined || ctx[key] === null) {
                return match;
            }
            return String(ctx[key]);
        });
    }

    async function loadDialogue(id) {
        if (dialogueCache.has(id)) {
            return dialogueCache.get(id);
        }
        const res = await fetch(`${scenarioBaseUrl}${encodeURIComponent(id)}`, {
            headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) {
            throw new Error(`Dialogue fetch failed: ${res.status}`);
        }
        const data = await res.json();
        dialogueCache.set(id, data);
        return data;
    }

    function collectAssets(payload) {
        const images = new Set();
        const audios = new Set();
        
        // Collect from assets array
        (payload.assets || []).forEach(asset => {
            if (asset.endsWith('.mp3') || asset.endsWith('.wav') || asset.endsWith('.ogg')) {
                audios.add(asset);
            } else {
                images.add(asset);
            }
        });
        
        // Collect from steps
        (payload.steps || []).forEach(step => {
            if (step && step.image) images.add(step.image);
            if (step && step.audio) audios.add(step.audio);
        });
        
        return {
            images: Array.from(images),
            audios: Array.from(audios)
        };
    }

    function preloadImages(images) {
        const tasks = images.map((src) => {
            if (!src) {
                return Promise.resolve();
            }
            if (preloadCache.has(src)) {
                return Promise.resolve();
            }
            return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    imageCache.set(src, img);
                    preloadCache.add(src);
                    resolve();
                };
                img.onerror = () => {
                    preloadCache.add(src);
                    resolve();
                };
                img.src = src;
            });
        });
        return Promise.all(tasks);
    }

    function preloadAudios(audios) {
        const tasks = audios.map((src) => {
            if (!src) {
                return Promise.resolve();
            }
            if (audioCache.has(src)) {
                return Promise.resolve();
            }
            return new Promise((resolve) => {
                const audio = new Audio();
                audio.preload = 'metadata';
                audio.volume = 0.8;
                
                let resolved = false;
                const resolveOnce = () => {
                    if (!resolved) {
                        resolved = true;
                        resolve();
                    }
                };
                
                // Wait for metadata to get duration
                audio.onloadedmetadata = () => {
                    if (audio.duration > 0) {
                        console.log(`Preloaded audio: ${src} (duration: ${audio.duration}s)`);
                        audioCache.set(src, audio);
                        preloadCache.add(src);
                    } else {
                        console.warn(`Invalid audio file (0 duration): ${src}`);
                        preloadCache.add(src);
                    }
                    resolveOnce();
                };
                
                audio.oncanplaythrough = () => {
                    if (audio.duration > 0) {
                        audioCache.set(src, audio);
                    }
                    preloadCache.add(src);
                    resolveOnce();
                };
                
                audio.onerror = (e) => {
                    console.warn(`Failed to preload audio: ${src}`, e);
                    preloadCache.add(src);
                    resolveOnce();
                };
                
                // Timeout fallback
                setTimeout(() => {
                    resolveOnce();
                }, 5000);
                
                audio.src = src;
                audio.load();
            });
        });
        return Promise.all(tasks);
    }

    function setPortraitSrc(imgElement, src) {
        if (!imgElement || !src) return;
        const currentSrc = imgElement.src || '';
        const normalizedSrc = src.startsWith('/') ? src : '/' + src;
        if (currentSrc === normalizedSrc || currentSrc.endsWith(normalizedSrc)) {
            return;
        }
        if (imageCache.has(src)) {
            const cachedImg = imageCache.get(src);
            if (cachedImg.complete && cachedImg.naturalHeight > 0) {
                imgElement.src = cachedImg.src;
                return;
            }
        }
        imgElement.src = src;
    }

})();

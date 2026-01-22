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

    // Audio Context for procedural bleeps
    let audioCtx = null;

    // SCENARIOS MOCK
    const SCENARIOS = {
        'intro_laharl': [
            {
                name: "Laharl",
                text: "What?! Who do you think you're talking to? I am the Overlord!",
                side: "left",
                image: "/public/assets/entities/swordsman/animations/idle/1.webp"
            },
            {
                name: "Flonne",
                text: "Kindness is love. The day is near when you will awaken to love❤ *giggle*",
                side: "right",
                image: "/public/assets/entities/acolyte/animations/idle/1.webp"
            },
            {
                name: "Etna",
                text: "Prince, calm down. You're scaring the penguins.",
                side: "left",
                image: "/public/assets/entities/vampire_girl/animations/idle/1.webp"
            }
        ],
        'tavern_greeting': [
            {
                name: "Bartender",
                text: "Welcome back, Traveler. The usual? Or is there something special on your mind today?",
                side: "left",
                image: "/public/assets/entities/merchant/animations/idle/1.webp"
            }
        ]
    };

    /**
     * Procedural bleep sound
     */
    function playTypeSound() {
        try {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }

            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(350 + (Math.random() * 150), audioCtx.currentTime);

            gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.04);

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
            <div class="dialogue-box" id="dialogue-box">
                <div class="corner-accent corner-tl"></div>
                <div class="corner-accent corner-tr"></div>
                <div class="corner-accent corner-bl"></div>
                <div class="corner-accent corner-br"></div>
                <div class="dialogue-name-tag" id="dialogue-name"></div>
                <div class="dialogue-content" id="dialogue-content"></div>
                <div class="dialogue-next-icon">▼</div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.addEventListener('click', advance);
        window.addEventListener('keydown', (e) => {
            if (overlay.classList.contains('visible') && (e.key === ' ' || e.key === 'Enter')) {
                advance();
            }
        });
    }

    function initDialog(scenarioId) {
        initLayout();
        const id = String(scenarioId);
        dialogueData = SCENARIOS[id] || [];
        currentIndex = 0;

        if (dialogueData.length === 0) {
            console.error(`Scenario "${id}" not found.`);
            return;
        }

        const overlay = document.getElementById('dialogue-overlay');
        overlay.classList.add('visible');

        renderStep();
    }

    function renderStep() {
        const step = dialogueData[currentIndex];
        const nameEl = document.getElementById('dialogue-name');
        const contentEl = document.getElementById('dialogue-content');
        const portraitLeft = document.getElementById('portrait-left');
        const portraitRight = document.getElementById('portrait-right');

        nameEl.textContent = step.name;

        // Dynamic Tag Positioning
        if (step.side === 'left') {
            nameEl.classList.remove('at-right');
            nameEl.classList.add('at-left');

            portraitLeft.src = step.image;
            portraitLeft.classList.add('visible', 'active');
            portraitRight.classList.remove('active');
        } else {
            nameEl.classList.remove('at-left');
            nameEl.classList.add('at-right');

            portraitRight.src = step.image;
            portraitRight.classList.add('visible', 'active');
            portraitLeft.classList.remove('active');
        }

        typeWriter(step.text, contentEl);
    }

    function typeWriter(text, element) {
        isTyping = true;
        element.textContent = '';
        let charIndex = 0;

        if (typeTimeout) clearTimeout(typeTimeout);

        function type() {
            if (charIndex < text.length) {
                const char = text.charAt(charIndex);
                element.textContent += char;
                if (char !== ' ') playTypeSound();
                charIndex++;
                typeTimeout = setTimeout(type, 30);
            } else {
                isTyping = false;
            }
        }
        type();
    }

    function advance() {
        const step = dialogueData[currentIndex];
        if (!step) return;

        const contentEl = document.getElementById('dialogue-content');

        if (isTyping) {
            clearTimeout(typeTimeout);
            contentEl.textContent = step.text;
            isTyping = false;
            return;
        }

        currentIndex++;
        if (currentIndex < dialogueData.length) {
            renderStep();
        } else {
            finish();
        }
    }

    function finish() {
        const overlay = document.getElementById('dialogue-overlay');
        const portraits = document.querySelectorAll('.portrait');
        overlay.classList.remove('visible');
        portraits.forEach(p => p.classList.remove('visible', 'active'));
    }

    window.initDialog = initDialog;

})();

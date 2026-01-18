# 🎮 RPG Game - Premium UI Design System

> **Version**: 1.0  
> **Updated**: January 2026  
> **Framework**: Vanilla CSS + Tailwind CDN  
> **Fonts**: Cinzel (headings), Inter (body)

---

## 🎨 Color Palette

### Primary Colors
| Color         | Hex       | Usage                                    |
|---------------|-----------|------------------------------------------|
| Gold Primary  | `#d4af37` | Primary accents, buttons, glows          |
| Gold Light    | `#f2d16b` | Highlights, hover states                 |
| Gold Dark     | `#8a6d3b` | Borders, subtle accents                  |
| Cyan Primary  | `#06b6d4` | Secondary accents, ambient glows         |
| Dark BG       | `#050508` | Main background                          |
| Card BG       | `rgba(8, 8, 12, 0.88)` | Glassmorphism panels      |

### Semantic Colors
| Color         | Hex       | Usage                                    |
|---------------|-----------|------------------------------------------|
| Success       | `#22c55e` | Positive feedback, active states         |
| Error         | `#ef4444` | Errors, delete buttons                   |
| Warning       | `#eab308` | Warnings, attention                      |

---

## 🔤 Typography

### Font Stack
```css
/* Headings - Epic Fantasy Feel */
font-family: 'Cinzel', serif;

/* Body - Modern Readability */
font-family: 'Inter', sans-serif;
```

### Text Styles
```css
/* Epic Title */
.title-epic {
    font-family: 'Cinzel', serif;
    font-size: 1.75rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: #fff;
}

/* Section Label */
.label-section {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: rgba(255, 255, 255, 0.4);
}

/* Body Text */
.text-body {
    font-size: 0.9rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.7);
}
```

---

## 🪟 Glassmorphism

### Premium Glass Card
```css
.glass-card {
    background: rgba(8, 8, 12, 0.88);
    backdrop-filter: blur(40px) saturate(180%);
    -webkit-backdrop-filter: blur(40px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 2rem;
    box-shadow: 
        0 40px 100px rgba(0, 0, 0, 0.8),
        0 0 0 1px rgba(255, 255, 255, 0.03) inset;
}
```

### Lighter Glass (for nested elements)
```css
.glass-light {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 0.875rem;
}
```

---

## ✨ Animations

### Entrance Animation
```css
@keyframes cardEntrance {
    from {
        opacity: 0;
        transform: translateY(30px) scale(0.96);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.animate-entrance {
    animation: cardEntrance 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
```

### Shimmer Effect (for buttons)
```css
@keyframes shimmer {
    0% { left: -100%; }
    50%, 100% { left: 150%; }
}

.shimmer::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 50%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    animation: shimmer 3s infinite;
}
```

### Float Animation (for icons/badges)
```css
@keyframes iconFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
}

.animate-float {
    animation: iconFloat 4s ease-in-out infinite;
}
```

### Glow Pulse (for ambient backgrounds)
```css
@keyframes glowPulse {
    0%, 100% { opacity: 0.6; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.1); }
}
```

---

## 🌌 Background System

### Layered Background Structure
```html
<!-- 1. Base Image (low opacity) -->
<div class="auth-bg-image"></div>

<!-- 2. Ambient Glows (animated) -->
<div class="auth-glow-cyan"></div>
<div class="auth-glow-gold"></div>

<!-- 3. Texture Overlay -->
<div class="auth-texture"></div>

<!-- 4. Floating Particles -->
<div class="particles-container" id="particles"></div>
```

### Ambient Glow CSS
```css
.glow-cyan {
    position: absolute;
    top: -20%;
    right: -10%;
    width: 800px;
    height: 800px;
    background: radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 60%);
    border-radius: 50%;
    animation: glowPulse 8s ease-in-out infinite;
}

.glow-gold {
    position: absolute;
    bottom: -30%;
    left: -15%;
    width: 900px;
    height: 900px;
    background: radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 50%);
    border-radius: 50%;
    animation: glowPulse 10s ease-in-out infinite reverse;
}
```

---

## 🔘 Button Styles

### Primary Button (Gold)
```css
.btn-primary {
    position: relative;
    padding: 1rem 1.5rem;
    background: linear-gradient(135deg, #d4af37, #8a6d3b);
    border: none;
    border-radius: 0.875rem;
    color: #000;
    font-family: 'Cinzel', serif;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    overflow: hidden;
    transition: all 0.3s ease;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(212, 175, 55, 0.4);
}
```

### Secondary Button (Ghost)
```css
.btn-secondary {
    padding: 0.75rem 1.25rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
    transition: all 0.3s ease;
}

.btn-secondary:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(212, 175, 55, 0.3);
    color: #d4af37;
}
```

### Danger Button
```css
.btn-danger {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.25);
    color: #fca5a5;
}

.btn-danger:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.5);
}
```

---

## 📝 Input Fields

### Premium Input
```css
.input-premium {
    width: 100%;
    padding: 1rem 1rem 1rem 3rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 0.875rem;
    color: #fff;
    font-size: 0.9rem;
    transition: all 0.3s ease;
}

.input-premium:focus {
    border-color: #d4af37;
    background: rgba(212, 175, 55, 0.05);
    box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.1);
    outline: none;
}

.input-premium::placeholder {
    color: rgba(255, 255, 255, 0.25);
}
```

---

## 🃏 Card Styles

### Character/Item Card
```css
.card-premium {
    position: relative;
    border-radius: 1.25rem;
    overflow: hidden;
    background: rgba(8, 8, 12, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.06);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-premium:hover {
    transform: translateY(-8px) scale(1.02);
    border-color: rgba(212, 175, 55, 0.3);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
}
```

---

## 🎭 Decorative Elements

### Ornamental Divider
```html
<div class="ornament-divider">
    <div class="ornament-line"></div>
    <div class="ornament-gem"></div>
    <div class="ornament-line"></div>
</div>
```

```css
.ornament-divider {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
}

.ornament-line {
    width: 60px;
    height: 1px;
    background: linear-gradient(90deg, transparent, #8a6d3b, transparent);
}

.ornament-gem {
    width: 8px;
    height: 8px;
    background: #d4af37;
    transform: rotate(45deg);
    box-shadow: 0 0 10px #d4af37;
}
```

---

## 💫 Particle System (JavaScript)

```javascript
function createParticles(containerId = 'particles', count = 20) {
    const container = document.getElementById(containerId);
    const colors = ['particle-gold', 'particle-cyan', 'particle-white'];

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = `particle ${colors[Math.floor(Math.random() * colors.length)]}`;
        
        const size = Math.random() * 4 + 2;
        particle.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${Math.random() * 100}%;
            animation-duration: ${Math.random() * 15 + 10}s;
            animation-delay: ${Math.random() * 10}s;
        `;
        
        container.appendChild(particle);
    }
}
```

---

## 📐 Responsive Breakpoints

| Breakpoint | Width     | Description          |
|------------|-----------|----------------------|
| Mobile     | < 640px   | Single column        |
| Tablet     | 640-1024px| Two columns          |
| Desktop    | > 1024px  | Full layout          |

---

## ✅ Design Checklist

When creating new UI components, ensure:

- [ ] Uses `Cinzel` for headings, `Inter` for body
- [ ] Has glass background with blur (40px+)
- [ ] Gold accents for primary actions
- [ ] Entrance animation on page load
- [ ] Shimmer effect on primary buttons
- [ ] Ambient glows in background
- [ ] Hover states with subtle transforms
- [ ] Focus states with gold glow
- [ ] Consistent border-radius (0.875rem - 2rem)
- [ ] Shadow depth (40px+ spread for cards)

---

> 💡 **Remember**: Every screen should feel premium or immersive. If it looks basic, add more depth, glow, and animation!

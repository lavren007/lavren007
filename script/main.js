(function () {
    // ========== ПЕРЕВОДЫ ==========
    let currentTranslations = {};
    let currentLang = localStorage.getItem('lang') || 'ru';

    function applyTranslations() {
        if (!currentTranslations) return;
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (currentTranslations[key]) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = currentTranslations[key];
                } else {
                    el.innerText = currentTranslations[key];
                }
            }
        });
        if (currentTranslations.title) document.title = currentTranslations.title;
    }

    async function loadTranslations(lang) {
        const url = `lang/${lang}.json`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            currentTranslations = await response.json();
            applyTranslations();
            document.querySelectorAll('.lang-btn').forEach(btn => {
                if (btn.getAttribute('data-lang') === lang) btn.classList.add('active');
                else btn.classList.remove('active');
            });
            localStorage.setItem('lang', lang);
            currentLang = lang;
        } catch (err) {
            console.error(`Ошибка загрузки ${url}:`, err);
        }
    }

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            if (lang === currentLang) return;
            loadTranslations(lang);
        });
    });
    loadTranslations(currentLang);

    // ========== АНИМАЦИЯ ЗВЁЗД (полный код) ==========
    const spaceCanvas = document.getElementById('spaceCanvas');
    const ctxSpace = spaceCanvas.getContext('2d');
    const bgCanvas = document.getElementById('bgStarsCanvas');
    const ctxBg = bgCanvas.getContext('2d');
    const heroTextOverlay = document.getElementById('heroTextOverlay');
    const revealSections = document.querySelectorAll('[data-reveal]');

    let width, height;
    const TRANSITION_DISTANCE_RATIO = 0.63;
    function resizeCanvases() {
        width = window.innerWidth;
        height = window.innerHeight;
        spaceCanvas.width = width;
        spaceCanvas.height = height;
        bgCanvas.width = width;
        bgCanvas.height = height;
    }
    resizeCanvases();
    window.addEventListener('resize', () => {
        resizeCanvases();
        spaceObjects.forEach(obj => {
            obj.originX = Math.random() * width;
            obj.originY = Math.random() * height;
            obj.x = obj.originX;
            obj.y = obj.originY;
            const cx = width / 2, cy = height / 2;
            const dx = obj.originX - cx, dy = obj.originY - cy;
            const dist = Math.hypot(dx, dy) || 1;
            obj.dirX = dx / dist;
            obj.dirY = dy / dist;
        });
        createBackgroundStars();
    });

    class Star {
        constructor() {
            this.originX = Math.random() * width;
            this.originY = Math.random() * height;
            this.x = this.originX; this.y = this.originY;
            this.baseSize = Math.random() * 2.2 + 0.8;
            this.size = this.baseSize;
            const cx = width / 2, cy = height / 2;
            const dx = this.originX - cx, dy = this.originY - cy;
            const dist = Math.hypot(dx, dy) || 1;
            this.dirX = dx / dist; this.dirY = dy / dist;
            const maxDim = Math.max(width, height);
            this.maxOffset = maxDim * (1.2 + Math.random() * 1.5);
            this.twinkleSpeed = Math.random() * 0.02 + 0.005;
            this.twinkleOffset = Math.random() * Math.PI * 2;
            this.colorBase = Math.random() < 0.7 ? '#ffffff' : '#c9b8ff';
        }
        update(progress, time) {
            const offset = progress * this.maxOffset;
            this.x = this.originX + this.dirX * offset;
            this.y = this.originY + this.dirY * offset;
            this.size = this.baseSize * (1 + progress * 2.5);
            const twinkle = 0.7 + 0.3 * Math.sin(time * this.twinkleSpeed + this.twinkleOffset);
            this.alpha = twinkle;
        }
        draw(ctx) {
            const glowRadius = this.size * 2.2;
            const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowRadius);
            grad.addColorStop(0, `rgba(200,170,255,${0.4 * this.alpha})`);
            grad.addColorStop(1, 'rgba(200,170,255,0)');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = this.colorBase;
            ctx.globalAlpha = this.alpha;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.size * 0.6, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
        }
        isOnScreen() {
            const margin = 50;
            return this.x > -margin && this.x < width + margin && this.y > -margin && this.y < height + margin;
        }
    }

    class Planet {
        constructor() {
            this.originX = Math.random() * width;
            this.originY = Math.random() * height;
            this.x = this.originX; this.y = this.originY;
            this.baseRadius = Math.random() * 20 + 12;
            this.radius = this.baseRadius;
            const cx = width / 2, cy = height / 2;
            const dx = this.originX - cx, dy = this.originY - cy;
            const dist = Math.hypot(dx, dy) || 1;
            this.dirX = dx / dist; this.dirY = dy / dist;
            const maxDim = Math.max(width, height);
            this.maxOffset = maxDim * (1.1 + Math.random() * 1.3);
            this.type = Math.floor(Math.random() * 3);
            const colors = ['#b06ab3', '#4a2c6e', '#7b3f9e', '#c47ac0', '#5d3a7a', '#9163b6', '#3e2a5c', '#a05bb5'];
            this.color1 = colors[Math.floor(Math.random() * colors.length)];
            this.color2 = colors[Math.floor(Math.random() * colors.length)];
            this.hasRing = this.type === 2;
            this.ringAngle = Math.random() * Math.PI;
        }
        update(progress, time) {
            const offset = progress * this.maxOffset;
            this.x = this.originX + this.dirX * offset;
            this.y = this.originY + this.dirY * offset;
            this.radius = this.baseRadius * (1 + progress * 2.2);
        }
        draw(ctx) {
            const grad = ctx.createRadialGradient(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.1, this.x, this.y, this.radius);
            grad.addColorStop(0, this.color1);
            grad.addColorStop(0.7, this.color2);
            grad.addColorStop(1, '#1a1030');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
            if (this.hasRing) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.ringAngle);
                ctx.scale(1, 0.35);
                ctx.beginPath(); ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(200,180,220,0.4)';
                ctx.lineWidth = this.radius * 0.25;
                ctx.stroke();
                ctx.restore();
            }
            const glow = ctx.createRadialGradient(this.x, this.y, this.radius * 0.9, this.x, this.y, this.radius * 1.6);
            glow.addColorStop(0, 'rgba(180,140,220,0.15)');
            glow.addColorStop(1, 'rgba(180,140,220,0)');
            ctx.fillStyle = glow;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 1.6, 0, Math.PI * 2); ctx.fill();
        }
        isOnScreen() {
            const margin = 100;
            return this.x > -margin && this.x < width + margin && this.y > -margin && this.y < height + margin;
        }
    }

    const spaceObjects = [];
    const STAR_COUNT = 400, PLANET_COUNT = 8;
    function initSpaceObjects() {
        spaceObjects.length = 0;
        for (let i = 0; i < STAR_COUNT; i++) spaceObjects.push(new Star());
        for (let i = 0; i < PLANET_COUNT; i++) spaceObjects.push(new Planet());
    }
    initSpaceObjects();

    const bgStars = [];
    const BG_STAR_COUNT = 180;
    class BackgroundStar {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.radius = Math.random() * 1.5 + 0.4;
            this.baseAlpha = Math.random() * 0.6 + 0.3;
            this.twinkleSpeed = Math.random() * 0.015 + 0.005;
            this.twinkleOffset = Math.random() * Math.PI * 2;
            this.hue = Math.random() < 0.7 ? 0 : 270;
        }
        update(time) {
            this.alpha = this.baseAlpha * (0.5 + 0.5 * Math.sin(time * this.twinkleSpeed + this.twinkleOffset));
        }
        draw(ctx) {
            ctx.fillStyle = this.hue === 0 ? `rgba(255,255,255,${this.alpha})` : `rgba(200,170,255,${this.alpha})`;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
            if (this.radius > 0.8) {
                const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2.5);
                glow.addColorStop(0, `rgba(200,180,255,${this.alpha * 0.5})`);
                glow.addColorStop(1, 'rgba(200,180,255,0)');
                ctx.fillStyle = glow;
                ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 2.5, 0, Math.PI * 2); ctx.fill();
            }
        }
    }
    function createBackgroundStars() {
        bgStars.length = 0;
        for (let i = 0; i < BG_STAR_COUNT; i++) bgStars.push(new BackgroundStar());
    }
    createBackgroundStars();

    let currentProgress = 0, targetProgress = 0;
    let scrollY = 0;
    let transitionDistance = height * TRANSITION_DISTANCE_RATIO;
    function updateTransitionDistance() { transitionDistance = height * TRANSITION_DISTANCE_RATIO; }
    window.addEventListener('resize', updateTransitionDistance);
    function getProgressFromScroll() { return transitionDistance <= 0 ? 1 : Math.min(1, scrollY / transitionDistance); }
    window.addEventListener('scroll', () => { scrollY = window.scrollY; targetProgress = getProgressFromScroll(); }, { passive: true });
    window.addEventListener('touchmove', () => { scrollY = window.scrollY; targetProgress = getProgressFromScroll(); }, { passive: true });

    function checkRevealSections() {
        const triggerBottom = window.innerHeight * 0.85;
        revealSections.forEach(section => {
            if (section.getBoundingClientRect().top < triggerBottom) section.classList.add('visible');
        });
    }
    window.addEventListener('scroll', checkRevealSections);
    setTimeout(checkRevealSections, 300);

    let time = 0, dispersedFrames = 0;
    function animate(t) {
        time = t;
        const smoothing = 0.08;
        currentProgress += (targetProgress - currentProgress) * smoothing;
        updateTransitionDistance();
        targetProgress = getProgressFromScroll();

        ctxBg.clearRect(0, 0, width, height);
        bgStars.forEach(star => { star.update(time); star.draw(ctxBg); });

        ctxSpace.clearRect(0, 0, width, height);
        let onScreenCount = 0;
        spaceObjects.forEach(obj => {
            obj.update(currentProgress, time);
            if (obj.isOnScreen()) { obj.draw(ctxSpace); onScreenCount++; }
        });
        if (onScreenCount === 0 && currentProgress > 0.9) { dispersedFrames++; if (dispersedFrames > 30) spaceCanvas.classList.add('dispersed'); }
        else { dispersedFrames = Math.max(0, dispersedFrames - 2); if (currentProgress < 0.85) spaceCanvas.classList.remove('dispersed'); }

        const textScale = 1 + currentProgress * 3.5;
        const textOpacity = currentProgress < 0.7 ? 1 : 1 - ((currentProgress - 0.7) / 0.3);
        heroTextOverlay.style.transform = `translate(-50%, -50%) scale(${textScale})`;
        heroTextOverlay.style.opacity = Math.max(0, Math.min(1, textOpacity));
        if (textOpacity < 0.05) heroTextOverlay.classList.add('faded');
        else heroTextOverlay.classList.remove('faded');
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
    window.addEventListener('load', () => { scrollY = window.scrollY; targetProgress = getProgressFromScroll(); checkRevealSections(); });

    // ========== ГАЛЕРЕЯ ==========
    const galleryGrid = document.getElementById('galleryGrid');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const closeLightbox = document.getElementById('closeLightboxBtn');

    function loadGallery() {
        fetch('photos.json')
            .then(res => res.json())
            .then(files => {
                galleryGrid.innerHTML = '';
                if (!files.length) {
                    galleryGrid.innerHTML = '<div class="card" style="grid-column:1/-1; text-align:center;">📸 Пока нет фото. Добавьте изображения в папку <strong>/photo</strong> и запустите GitHub Action для генерации photos.json</div>';
                    return;
                }
                files.forEach(file => {
                    const item = document.createElement('div');
                    item.className = 'gallery-item';
                    const img = document.createElement('img');
                    img.src = `photo/${file}`;
                    img.alt = file;
                    img.loading = 'lazy';
                    item.appendChild(img);
                    item.addEventListener('click', () => {
                        lightboxImg.src = `photo/${file}`;
                        lightbox.classList.add('active');
                    });
                    galleryGrid.appendChild(item);
                });
            })
            .catch(err => {
                console.error('Ошибка загрузки галереи:', err);
                galleryGrid.innerHTML = '<div class="card" style="grid-column:1/-1; text-align:center;">⚠️ Не удалось загрузить список фото. Убедитесь, что файл <strong>photos.json</strong> существует.</div>';
            });
    }

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) lightbox.classList.remove('active');
    });
    closeLightbox.addEventListener('click', () => lightbox.classList.remove('active'));
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) lightbox.classList.remove('active');
    });

    loadGallery();

    // ========== ФОРМА ОБРАТНОЙ СВЯЗИ (С ПОЛЕМ ИМЕНИ) ==========
    const modal = document.getElementById('contactModal');
    const openFormBtn = document.getElementById('openFormBtn');
    const closeModalSpan = document.querySelector('.close-modal');
    const contactForm = document.getElementById('contactForm');
    const notificationDiv = document.getElementById('notification');

    function showNotification(message, isError = false) {
        notificationDiv.textContent = message;
        notificationDiv.style.backgroundColor = isError ? '#b00020' : '#7b3fb0';
        notificationDiv.classList.add('show');
        setTimeout(() => {
            notificationDiv.classList.remove('show');
        }, 4000);
    }

    if (openFormBtn) {
        openFormBtn.addEventListener('click', () => {
            modal.style.display = 'flex';
        });
    }

    if (closeModalSpan) {
        closeModalSpan.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const email = document.getElementById('email').value.trim();
            const task = document.getElementById('task').value.trim();

            if (!name || !phone || !email || !task) {
                showNotification('Пожалуйста, заполните все поля', true);
                return;
            }

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            submitBtn.disabled = true;
            submitBtn.innerText = 'Отправка...';

            try {
                const formData = new FormData();
                formData.append('access_key', '9159b526-0fe1-4739-9c67-20d482c2198c');
                formData.append('name', name);
                formData.append('phone', phone);
                formData.append('email', email);
                formData.append('message', task);  // 👈 Web3Forms ожидает поле "message", а не "task"
                formData.append('subject', `Новое сообщение от ${name}`); // опционально

                const response = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json(); // парсим JSON-ответ

                if (result.success) {
                    // Успешная отправка
                    showNotification(currentTranslations.notification_success || '✅ Ожидайте! В ближайшее время я с вами свяжусь.');
                    contactForm.reset();
                    modal.style.display = 'none';
                } else {
                    // Сервер вернул ошибку (например, неверный ключ)
                    throw new Error(result.message || 'Ошибка отправки');
                }
            } catch (err) {
                console.error(err);
                showNotification(currentTranslations.notification_error || '❌ Ошибка отправки. Попробуйте позже.', true);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = originalText;
            }
        });
    }

    // ========== УСКОРЕНИЕ ПЕРЕХОДОВ ==========
    if (spaceCanvas) {
        spaceCanvas.style.transition = 'opacity 0.1s ease';
        const allExternalLinks = document.querySelectorAll('a[href^="http"], a[href^="mailto:"]');
        allExternalLinks.forEach(link => {
            link.addEventListener('click', () => {
                spaceCanvas.style.opacity = '0';
                setTimeout(() => {
                    spaceCanvas.style.opacity = '';
                }, 200);
            });
        });
    }
})();
// ---------------------------------------------------------------- board headings in the block font
(function blockDays() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    function render(el) {
        if (el.dataset.blocked) return;
        const text = el.textContent.trim().replace(/&/g, '+');
        if (!text) return;
        const H = 26, ch = H / BLOCKFONT.ROWS;                 // css px
        const w = BLOCKFONT.width(text, ch) + ch * 3, h = H + 6;
        const cv = document.createElement('canvas');
        cv.width = Math.ceil(w * dpr); cv.height = Math.ceil(h * dpr);
        cv.style.width = w + 'px'; cv.style.height = h + 'px';
        const g = cv.getContext('2d');
        g.scale(dpr, dpr);
        g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
        BLOCKFONT.draw(g, text, ch * 1.2, 3, ch, { color: '#000', cutColor: '#fff', outline: 0, skew: 0.14 });
        el.setAttribute('aria-label', text);
        el.dataset.blocked = '1';
        el.replaceChildren(cv);
    }
    document.querySelectorAll('.day').forEach(render);
    window.blockifyDay = render;
})();

// ---------------------------------------------------------------- HUD: which signal is on screen
(function sectionHud() {
    const el = document.getElementById('sig');
    if (!el) return;
    const sections = [...document.querySelectorAll('.s[data-label]')];
    function update() {
        let label = 'SIG 00';
        for (const s of sections) if (s.offsetTop - innerHeight * 0.5 <= scrollY) label = s.dataset.label;
        el.textContent = label;
    }
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();
})();

// ---------------------------------------------------------------- decode effect: text resolves out of static when it scrolls in
(function decode() {
    const GLYPHS = '█▓▒░#/\\<>01|=+*';
    const targets = document.querySelectorAll('[data-decode]');
    if (!targets.length || !('IntersectionObserver' in window)) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    function run(el) {
        if (el.children.length) return;
        const final = el.textContent;
        const start = performance.now(), dur = 450 + Math.min(600, final.length * 12);
        function tick(now) {
            const p = Math.min(1, (now - start) / dur);
            const solved = Math.floor(p * final.length);
            let out = final.slice(0, solved);
            for (let i = solved; i < final.length; i++) {
                out += final[i] === ' ' ? ' ' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            }
            el.textContent = out;
            if (p < 1) requestAnimationFrame(tick); else el.textContent = final;
        }
        requestAnimationFrame(tick);
    }

    const io = new IntersectionObserver(entries => {
        for (const e of entries) if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
    }, { threshold: 0.6 });
    targets.forEach(el => io.observe(el));
    window.decodeElement = run;
})();

// ---------------------------------------------------------------- DJ names under the silent disco rows
(function populateDjs() {
    const targets = document.querySelectorAll('[data-djs-day]');
    if (!targets.length) return;
    fetchScheduleDays().then(days => {
        for (const row of targets) {
            const day = days.find(d => d.date === row.dataset.djsDay);
            if (!day) continue;
            const n = row.querySelector('.n');
            for (const s of day.sessions) {
                const name = speakersText(s) || s.title;
                if (!name) continue;
                const span = document.createElement('span');
                span.className = 'dj';
                span.textContent = name;
                n.appendChild(span);
            }
        }
    }).catch(() => {});
})();

// ---------------------------------------------------------------- live schedule from pretalx as a departure board
(function renderSchedule() {
    const container = document.getElementById('schedule');
    if (!container) return;
    const fallbackPage = container.dataset.schedulePage;

    fetchScheduleDays()
        .then(days => {
            const rows = [];
            for (const day of days) {
                if (!day.sessions.length) continue;
                const d = document.createElement('div');
                d.className = 'day';
                d.textContent = formatDayLabel(day.date).toUpperCase();
                rows.push(d);
                for (const s of day.sessions) rows.push(buildRow(s));
            }
            if (!rows.length) { renderFallback(container, fallbackPage); return; }
            container.replaceChildren(...rows);
            container.querySelectorAll('.day').forEach(el => window.blockifyDay && window.blockifyDay(el));
            if (window.decodeElement) container.querySelectorAll('.n').forEach(el => window.decodeElement(el));
        })
        .catch(() => renderFallback(container, fallbackPage));

    function buildRow(s) {
        const row = document.createElement('div');
        row.className = 'row';

        const t = document.createElement('span');
        t.className = 't';
        t.textContent = s.start || '';
        row.appendChild(t);

        const lead = document.createElement('span');
        lead.className = 'lead';
        row.appendChild(lead);

        const n = document.createElement('span');
        n.className = 'n';
        if (s.url) {
            const a = document.createElement('a');
            a.href = s.url; a.target = '_blank'; a.rel = 'noopener';
            a.textContent = s.title || 'Untitled';
            n.appendChild(a);
        } else {
            n.appendChild(document.createTextNode(s.title || 'Untitled'));
        }
        const bits = [speakersText(s), formatDuration(s.duration), s.room].filter(Boolean);
        if (bits.length) {
            const small = document.createElement('small');
            small.textContent = bits.join(' / ');
            n.appendChild(small);
        }
        row.appendChild(n);
        return row;
    }

    function renderFallback(el, page) {
        const day = document.createElement('div');
        day.className = 'day';
        day.textContent = 'TALKS & WORKSHOPS';
        const row = document.createElement('div');
        row.className = 'row status';
        const n = document.createElement('span');
        n.className = 'n';
        n.textContent = 'SCHEDULE NOT PUBLISHED YET. ';
        if (page) {
            const a = document.createElement('a');
            a.href = page; a.target = '_blank'; a.rel = 'noopener';
            a.textContent = 'CHECK THE CFP SITE';
            n.appendChild(a);
        }
        row.appendChild(n);
        el.replaceChildren(day, row);
        if (window.blockifyDay) window.blockifyDay(day);
    }
})();

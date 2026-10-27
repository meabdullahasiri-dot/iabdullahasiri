// Interactions: custom cursor, magnetic buttons, tilt cards, hero spotlight/parallax,
// scroll reveals, sliding nav indicator, timeline progress, ribbons that turn on scroll.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const lerp = (a, b, t) => a + (b - a) * t;
  $('#y').textContent = new Date().getFullYear();

  // split headings into words: big ones slide up, the hero title reacts per word on hover
  $$('.big, .hero h1').forEach(h => {
    const inner = h.classList.contains('big') ? w => `<span>${w}</span>` : w => w;
    h.innerHTML = h.textContent.trim().split(/\s+/)
      .map((w, i) => `<span class="w" style="--i:${i}">${inner(w)}</span>`).join(' ');
    $$('.w>span', h).forEach((s, i) => s.style.transitionDelay = `${i * 90}ms`);
  });
  $$('.stagger').forEach(g => [...g.children].forEach((c, i) => c.style.setProperty('--i', i)));

  // reveal on scroll
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    if (e.target.matches('.impact')) countUp(e.target);
    io.unobserve(e.target);
  }), { threshold: 0.15 });
  $$('.big, .reveal').forEach(el => io.observe(el));

  function countUp(root) {
    $$('[data-count]', root).forEach(el => {
      const end = +el.dataset.count, pre = el.dataset.pre || '', dec = +(el.dataset.dec || 0);
      const t0 = performance.now();
      const step = t => {
        const k = Math.min(1, (t - t0) / 1400);
        el.textContent = pre + (end * (1 - Math.pow(1 - k, 3))).toFixed(dec);
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  // nav: sliding pill follows the hovered link, rests on the section in view
  const nav = $('.nav'), bg = $('.nav .pill-bg'), links = $$('.nav a');
  let current = null;
  const moveBg = a => {
    if (!a) { bg.style.opacity = 0; links.forEach(l => l.classList.remove('on')); return; }
    const n = nav.getBoundingClientRect(), r = a.getBoundingClientRect();
    bg.style.width = r.width + 'px';
    bg.style.transform = `translateX(${r.left - n.left}px)`;
    bg.style.opacity = 1;
    links.forEach(l => l.classList.toggle('on', l === a));
  };
  links.forEach(a => a.addEventListener('mouseenter', () => moveBg(a)));
  nav && nav.addEventListener('mouseleave', () => moveBg(current));
  const spy = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    current = links.find(a => a.hash === '#' + e.target.id) || null;
    moveBg(current);
  }), { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(a => { const s = $(a.hash); if (s) spy.observe(s); });
  spy.observe($('.hero'));

  if (reduce) return;

  // ---------- scroll-driven ----------
  const bar = $('.progress'), topbar = $('.topbar'), ghost = $('.ghost');
  const turning = $$('[data-rot]');
  const rail = $('.timeline .rail i'), timeline = $('.timeline');
  let lastY = scrollY, ticking = false;
  function onScroll() {
    const vh = innerHeight, y = scrollY;
    bar.style.transform = `scaleX(${y / (document.documentElement.scrollHeight - vh)})`;
    topbar.classList.toggle('hide', y > lastY && y > 400);
    lastY = y;
    if (ghost) ghost.style.transform = `translateY(${y * 0.25}px)`;
    turning.forEach(el => {
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
      el.style.transform = `rotate(${+el.dataset.rot + (+el.dataset.to - +el.dataset.rot) * p}deg)`;
    });
    if (timeline) {
      const r = timeline.getBoundingClientRect();
      rail.style.height = Math.min(100, Math.max(0, (vh * 0.6 - r.top) / r.height * 100)) + '%';
    }
    ticking = false;
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  if (!fine) return;

  // ---------- cursor ----------
  const ring = $('.cursor'), dot = $('.cursor-dot'), label = $('.cursor span');
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
  addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate3d(${mx}px,${my}px,0)`;
    document.body.classList.add('cursor-on');
    if (!ringRaf) ringRaf = requestAnimationFrame(loop);
  });
  document.addEventListener('mouseleave', () => document.body.classList.remove('cursor-on'));
  addEventListener('mousedown', () => document.body.classList.add('cursor-down'));
  addEventListener('mouseup', () => document.body.classList.remove('cursor-down'));
  // rAF only while the ring is catching up, so an idle page costs nothing
  let ringRaf = 0;
  function loop() {
    rx = lerp(rx, mx, 0.2); ry = lerp(ry, my, 0.2);
    ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
    ringRaf = Math.abs(mx - rx) + Math.abs(my - ry) > 0.3 ? requestAnimationFrame(loop) : 0;
  }
  $$('a, button, [data-cursor]').forEach(el => {
    el.addEventListener('mouseenter', () => {
      const t = el.dataset.cursor;
      document.body.classList.add(t ? 'cursor-label' : 'cursor-hover');
      if (t) label.textContent = t;
    });
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover', 'cursor-label'));
  });

  // ---------- magnetic ----------
  $$('[data-magnetic]').forEach(el => {
    const k = +(el.dataset.magnetic || 0.35);
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * k}px,${(e.clientY - r.top - r.height / 2) * k}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });

  // ---------- tilt + glare ----------
  $$('[data-tilt]').forEach(el => {
    const max = +(el.dataset.tilt || 6);
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--mx', px * 100 + '%');
      el.style.setProperty('--my', py * 100 + '%');
      el.style.transition = 'transform .1s linear, box-shadow .4s, border-color .4s, opacity .9s, translate .9s';
      el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * max}deg) rotateY(${(px - 0.5) * max}deg) translateZ(0)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transition = 'transform .7s cubic-bezier(.2,.8,.2,1), box-shadow .4s, border-color .4s, opacity .9s, translate .9s';
      el.style.transform = '';
    });
  });

  // ---------- spotlight + parallax ----------
  // spotlight: move a pre-painted gradient layer instead of repainting the background
  $$('.hero, .cta .panel').forEach(area => {
    const spot = $('.spot', area);
    area.addEventListener('mousemove', e => {
      const r = area.getBoundingClientRect();
      spot.style.transform = `translate3d(${e.clientX - r.left}px,${e.clientY - r.top}px,0)`;
    });
  });
  const hero = $('.hero'), layers = $$('[data-depth]', hero);
  let tx = 0, ty = 0, cx = 0, cy = 0;
  let paraRaf = 0;
  function para() {
    cx = lerp(cx, tx, 0.1); cy = lerp(cy, ty, 0.1);
    layers.forEach(l => {
      const d = +l.dataset.depth;
      l.style.translate = `${(cx * d).toFixed(2)}px ${(cy * d).toFixed(2)}px`;
    });
    paraRaf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.001 ? requestAnimationFrame(para) : 0;
  }
  const kick = () => { if (!paraRaf) paraRaf = requestAnimationFrame(para); };
  hero.addEventListener('mousemove', e => {
    tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; kick();
  });
  hero.addEventListener('mouseleave', () => { tx = ty = 0; kick(); });
})();

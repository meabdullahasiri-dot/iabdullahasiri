// Scroll-driven effects: word reveal for big headings, fade-up blocks,
// ribbons/bands that rotate as they cross the viewport, ghost-name parallax.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById('y').textContent = new Date().getFullYear();

  // split big headings into words so each one slides up
  document.querySelectorAll('.big').forEach(h => {
    h.innerHTML = h.textContent.trim().split(/\s+/)
      .map((w, i) => `<span class="w"><span style="transition-delay:${i * 90}ms">${w}</span></span>`)
      .join(' ');
  });

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      if (e.target.classList.contains('impact')) countUp(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.big, .reveal').forEach(el => io.observe(el));

  function countUp(root) {
    root.querySelectorAll('[data-count]').forEach(el => {
      const end = +el.dataset.count, plus = el.textContent.startsWith('+');
      const t0 = performance.now();
      const step = t => {
        const k = Math.min(1, (t - t0) / 1200);
        el.textContent = (plus ? '+' : '') + Math.round(end * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  // highlight the nav link of the section in view
  const links = [...document.querySelectorAll('.nav a')];
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) links.forEach(a => a.classList.toggle('active', a.hash === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(a => { const s = document.querySelector(a.hash); if (s) spy.observe(s); });

  if (reduce) return;
  const tilted = [...document.querySelectorAll('[data-rot]')];
  const ghost = document.querySelector('.ghost');
  let ticking = false;
  function frame() {
    const vh = innerHeight;
    tilted.forEach(el => {
      const r = el.getBoundingClientRect();
      // progress 0 when the element enters at the bottom, 1 when it reaches the top
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
      const from = +el.dataset.rot, to = +el.dataset.to;
      const x = el.classList.contains('ribbon') ? (p - 0.5) * 120 * Math.sign(from) : 0;
      el.style.transform = `translateX(${x}px) rotate(${from + (to - from) * p}deg)`;
    });
    if (ghost) ghost.style.transform = `translateY(${scrollY * 0.25}px)`;
    ticking = false;
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  addEventListener('resize', frame);
  frame();
})();

// Calm interactions: theme toggle, fade-in on scroll, active nav link,
// count-up stats, and cursor-follow glow on cards and the hero background.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  $('#y').textContent = new Date().getFullYear();

  // theme: light by default, remembered per visitor
  $('.theme-btn').addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // fade-in, with a small stagger for siblings that appear together
  const io = new IntersectionObserver(entries => {
    entries.filter(e => e.isIntersecting).forEach((e, i) => {
      e.target.style.transitionDelay = `${i * 80}ms`;
      e.target.classList.add('in');
      if (!reduce) $$('[data-count]', e.target).forEach(countUp);
      io.unobserve(e.target);
    });
  }, { threshold: 0.12 });
  $$('.reveal').forEach(el => io.observe(el));

  function countUp(el) {
    const end = +el.dataset.count, pre = el.dataset.pre || '', t0 = performance.now();
    const step = t => {
      const k = Math.min(1, (t - t0) / 1200);
      el.textContent = pre + Math.round(end * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // underline the nav link of the section in view
  const links = $$('.nav a');
  const spy = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.hash === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(a => { const s = $(a.hash); if (s) spy.observe(s); });

  if (reduce || !matchMedia('(pointer: fine)').matches) return;

  // card glow follows the cursor (only the hovered card updates)
  $$('.card').forEach(card => card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', e.clientX - r.left + 'px');
    card.style.setProperty('--my', e.clientY - r.top + 'px');
  }));

  // hero glow drifts gently toward the cursor
  const hero = $('.hero'), g1 = $('.g1');
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
  const drift = () => {
    cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
    g1.style.transform = `translate3d(${cx}px,${cy}px,0)`;
    raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.5 ? requestAnimationFrame(drift) : 0;
  };
  hero.addEventListener('mousemove', e => {
    const r = hero.getBoundingClientRect();
    tx = (e.clientX - r.right + r.width * 0.2) * 0.25;
    ty = (e.clientY - r.top - r.height * 0.2) * 0.25;
    if (!raf) raf = requestAnimationFrame(drift);
  });
})();

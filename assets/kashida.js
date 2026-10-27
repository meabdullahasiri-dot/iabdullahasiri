// Arabic kashida justification. Browsers justify Arabic by widening spaces only,
// so this stretches words with tatweel (ـ) until every line but the last fills its box.
(() => {
  const TATWEEL = 'ـ';
  const JOINS_NEXT = new Set('بتثجحخسشصضطظعغفقكلمنهيئـ');   // letters that connect to the following letter
  const LETTER = /[ء-ي]/;
  const MARK = /[ً-ْٰ]/;                         // harakat, shadda, superscript alef
  const LAM_ALEF = new Set('اأإآ');
  const targets = () => document.querySelectorAll('.hero .lead, .statement, .job li');
  const originals = new Map();

  // positions inside a word where a tatweel may go, best (closest to the word's end) first
  function slots(word) {
    const out = [];
    for (let i = 0; i < word.length - 1; i++) {
      const c = word[i];
      if (!JOINS_NEXT.has(c)) continue;
      let j = i + 1;
      while (j < word.length && MARK.test(word[j])) j++;
      const next = word[j];
      if (!next || !LETTER.test(next)) continue;
      if (c === 'ل' && LAM_ALEF.has(next)) continue;
      out.push(j);
    }
    return out.reverse();
  }

  function wrapWords(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.append(part); return; }
        const s = document.createElement('span');
        s.className = 'kw';
        s.textContent = part;
        frag.append(s);
      });
      node.replaceWith(frag);
    });
    return [...el.querySelectorAll('.kw')];
  }

  function justify(el) {
    if (!originals.has(el)) originals.set(el, el.innerHTML);
    el.innerHTML = originals.get(el);
    const words = wrapWords(el);
    if (words.length < 3) return;
    // measure with natural spacing; CSS justify would already have filled every line
    el.style.textAlign = 'start';
    const box = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    const inner = box.width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);

    // group words into rendered lines
    const lines = [];
    words.forEach(w => {
      const top = Math.round(w.getBoundingClientRect().top);
      const line = lines.find(l => Math.abs(l.top - top) < 4);
      line ? line.words.push(w) : lines.push({ top, words: [w] });
    });

    const span = ws => {
      const r = ws.map(w => w.getBoundingClientRect());
      return { width: Math.max(...r.map(x => x.right)) - Math.min(...r.map(x => x.left)),
               rows: Math.max(...r.map(x => x.top)) - Math.min(...r.map(x => x.top)) };
    };
    lines.slice(0, -1).forEach(line => {
      const cands = line.words
        .filter(w => !/[A-Za-z0-9]/.test(w.textContent) && w.textContent.replace(/[^\u0621-\u064A]/g, '').length >= 4)   // stretch longer words only
        .map(w => ({ w, base: w.textContent, s: slots(w.textContent), k: 0 }))
        .filter(c => c.s.length)
        .sort((a, b) => b.base.length - a.base.length);
      if (!cands.length || inner - span(line.words).width < 3) return;
      // add one tatweel at a time, round-robin over words, until the next one would overflow
      const render = c => {
        const per = new Array(c.s.length).fill(0);
        for (let i = 0; i < c.k; i++) per[i % c.s.length]++;
        let out = c.base;
        c.s.map((pos, i) => [pos, per[i]]).sort((a, b) => b[0] - a[0])
          .forEach(([pos, m]) => { if (m) out = out.slice(0, pos) + TATWEEL.repeat(m) + out.slice(pos); });
        c.w.textContent = out;
      };
      let i = 0, misses = 0;
      while (misses < cands.length) {
        const c = cands[i++ % cands.length];
        if (c.k >= 3 * c.s.length) { misses++; continue; }
        c.k++; render(c);
        const now = span(line.words);
        if (now.rows > 4 || now.width > inner - 1) { c.k--; render(c); misses++; c.s = c.s.slice(0, 0); continue; }
        misses = 0;
      }
    });
    el.style.textAlign = '';
  }

  const run = () => targets().forEach(justify);
  let timer;
  addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(run, 150); });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(run);
})();

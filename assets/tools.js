// Job-ad matching against the CV, cover-letter draft, AI prompt, and matched-jobs list.
// `has` marks skills stated in the CV; the rest are surfaced as gaps, never claimed.
const SKILLS = [
  { k: 'إدارة الموارد البشرية', has: true, syn: ['الموارد البشرية', 'موارد بشرية', 'human resources', 'hr manager', 'hr'] },
  { k: 'السياسات واللوائح والإجراءات', has: true, syn: ['سياسات', 'لوائح', 'اللائحة', 'إجراءات', 'policies', 'procedures'] },
  { k: 'نظام العمل السعودي', has: true, syn: ['نظام العمل', 'قانون العمل', 'labor law', 'labour law', 'saudi labor'] },
  { k: 'التخطيط الاستراتيجي', has: true, syn: ['استراتيجي', 'استراتيجية', 'strategic', 'strategy'] },
  { k: 'التخطيط التشغيلي', has: true, syn: ['تشغيلي', 'تشغيلية', 'operational'] },
  { k: 'إدارة المشاريع PMP', has: true, syn: ['pmp', 'إدارة المشاريع', 'مدير مشاريع', 'مدير مشروع', 'project manag'] },
  { k: 'التطوير المؤسسي', has: true, syn: ['التطوير المؤسسي', 'التطوير التنظيمي', 'organizational development', 'organisational development', 'التميز المؤسسي'] },
  { k: 'أتمتة العمليات', has: true, syn: ['أتمتة', 'التحول الرقمي', 'automation', 'digital transformation'] },
  { k: 'تحليل البيانات Power BI', has: true, syn: ['power bi', 'powerbi', 'باور بي'] },
  { k: 'Excel', has: true, syn: ['excel', 'إكسل', 'اكسل', 'microsoft office', 'ms office'] },
  { k: 'إعداد التقارير', has: true, syn: ['تقارير', 'التقارير', 'reporting', 'reports'] },
  { k: 'قيادة الفرق', has: true, syn: ['قيادة', 'إدارة فريق', 'إدارة الفريق', 'leadership', 'team management', 'lead a team'] },
  { k: 'التواصل وبناء العلاقات', has: true, syn: ['تواصل', 'التواصل', 'علاقات', 'communication', 'stakeholder'] },
  { k: 'بيئة العمل', has: true, syn: ['بيئة العمل', 'رضا الموظفين', 'employee engagement', 'work environment'] },
  { k: 'شؤون الموظفين', has: true, syn: ['شؤون الموظفين', 'علاقات الموظفين', 'employee relations', 'personnel'] },
  { k: 'التوظيف والاستقطاب', has: true, syn: ['توظيف', 'التوظيف', 'استقطاب', 'recruit', 'talent acquisition', 'hiring'] },
  { k: 'الجودة', has: true, syn: ['الجودة', 'quality', 'iso'] },
  { k: 'ماجستير إدارة الأعمال', has: true, syn: ['ماجستير', 'mba', 'master'] },
  { k: 'بكالوريوس إدارة الأعمال', has: true, syn: ['بكالوريوس', 'bachelor', 'إدارة أعمال', 'business administration'] },
  { k: 'القطاع غير الربحي', has: true, syn: ['غير ربحي', 'جمعية', 'non-profit', 'nonprofit', 'ngo'] },
  { k: 'القطاع الحكومي', has: true, syn: ['حكومي', 'حكومية', 'government', 'public sector'] },
  { k: 'الإنجليزية', has: true, syn: ['الإنجليزية', 'الانجليزية', 'english'] },
  { k: 'تقييم الأداء', has: false, syn: ['تقييم الأداء', 'إدارة الأداء', 'مؤشرات الأداء', 'performance', 'kpi'] },
  { k: 'الرواتب والأجور', has: false, syn: ['رواتب', 'الرواتب', 'الأجور', 'مسير', 'payroll', 'compensation'] },
  { k: 'التدريب والتطوير', has: false, syn: ['التدريب والتطوير', 'تطوير الموظفين', 'training', 'learning and development', 'l&d'] },
  { k: 'منصة قوى', has: false, syn: ['منصة قوى', 'نظام قوى', 'qiwa'] },
  { k: 'منصة مدد', has: false, syn: ['منصة مدد', 'نظام مدد', 'mudad'] },
  { k: 'التأمينات الاجتماعية', has: false, syn: ['التأمينات', 'gosi'] },
  { k: 'منصة مساند', has: false, syn: ['مساند', 'musaned'] },
  { k: 'السعودة / نطاقات', has: false, syn: ['سعودة', 'نطاقات', 'saudization', 'nitaqat'] },
  { k: 'أنظمة HRIS', has: false, syn: ['hris', 'sap', 'oracle', 'successfactors', 'workday', 'odoo', 'نظام موارد بشرية'] },
  { k: 'شهادة SHRM / CIPD', has: false, syn: ['shrm', 'cipd', 'phr', 'sphr'] },
  { k: 'إدارة التغيير', has: false, syn: ['إدارة التغيير', 'change management'] },
  { k: 'الهيكل التنظيمي والوصف الوظيفي', has: false, syn: ['الهيكل التنظيمي', 'هيكلة', 'الوصف الوظيفي', 'أوصاف وظيفية', 'job description', 'organizational structure'] },
];
const YEARS = 12;

const norm = s => ' ' + s.toLowerCase()
  .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
  .replace(/[ً-ْـ]/g, '').replace(/\s+/g, ' ') + ' ';

function analyse(text) {
  const t = norm(text);
  const found = SKILLS.filter(s => s.syn.some(w => {
    const n = norm(w).trim();
    // Latin terms need word boundaries ("hr" must not match "three"); Arabic ones take prefixes like "وال".
    return /^[\x00-\x7f]+$/.test(n) ? new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(t) : t.includes(n);
  }));
  const ok = found.filter(s => s.has), miss = found.filter(s => !s.has);
  // years of experience asked for: "5 سنوات", "8+ years", "خبرة لا تقل عن 7"
  const nums = [...text.matchAll(/(\d{1,2})\s*\+?\s*(?:-\s*\d{1,2}\s*)?(?:سنوات|سنة|عام|أعوام|years?|yrs)/gi)].map(m => +m[1]).filter(n => n > 0 && n < 31);
  const asked = nums.length ? Math.max(...nums) : null;
  let pct = found.length ? Math.round(ok.length / found.length * 100) : 0;
  if (asked && asked > YEARS) pct = Math.round(pct * 0.8);
  return { ok, miss, asked, pct };
}

// ---------- form ----------
const $ = id => document.getElementById(id);
let cvText = '';
fetch('cv.html').then(r => r.text()).then(h => {
  const d = new DOMParser().parseFromString(h, 'text/html');
  cvText = d.querySelector('main').innerText.replace(/\n{3,}/g, '\n\n').trim();
}).catch(() => {});

$('form').addEventListener('submit', e => {
  e.preventDefault();
  const ad = $('ad').value.trim();
  if (!ad) return;
  const title = $('title').value.trim() || 'الوظيفة المعلنة';
  const company = $('company').value.trim() || 'جهتكم الموقرة';
  const r = analyse(ad);

  $('ring').style.setProperty('--v', r.pct);
  $('ring').style.setProperty('--c', r.pct >= 70 ? 'var(--green)' : r.pct >= 45 ? 'var(--purple)' : 'var(--gray)');
  $('pct').textContent = r.pct + '%';
  $('verdict').textContent = r.pct >= 70 ? 'توافق عالٍ، قدّم بثقة' : r.pct >= 45 ? 'توافق متوسط، خصّص سيرتك قبل التقديم' : 'توافق منخفض، راجع المتطلبات جيداً';
  $('years').textContent = r.asked ? `الخبرة المطلوبة: ${r.asked} سنوات، وخبرتك أكثر من ${YEARS} عاماً ${r.asked <= YEARS ? '✅' : '⚠️'}` : 'لم يُذكر عدد سنوات الخبرة في الإعلان';
  $('ok').innerHTML = r.ok.map(s => `<span class="tag ok">${s.k}</span>`).join('') || '<span class="hint">لا يوجد</span>';
  $('miss').innerHTML = r.miss.map(s => `<span class="tag miss">${s.k}</span>`).join('') || '<span class="hint">لا يوجد، ممتاز</span>';

  const strengths = r.ok.slice(0, 4).map(s => s.k).join('، ') || 'إدارة الموارد البشرية والتطوير المؤسسي';
  $('letter').value =
`سعادة مسؤول التوظيف في ${company} المحترم،
السلام عليكم ورحمة الله وبركاته،

يسعدني التقدم لشغل وظيفة «${title}» لديكم. أمتلك خبرة تزيد على ${YEARS} عاماً في الموارد البشرية في القطاعات الحكومية وغير الربحية والخاصة، أدرت خلالها دورة الموارد البشرية كاملة، من إعداد السياسات واللوائح والإجراءات حتى انتهاء العلاقة التعاقدية.

وتتوافق خبرتي مع متطلبات الوظيفة، خاصة في: ${strengths}. كما أحمل ماجستير إدارة الأعمال التنفيذي من جامعة نجران، وشهادة مدير مشاريع معتمد (PMP)، وأهتم بأتمتة العمليات وتحليل البيانات باستخدام Power BI وExcel بما يرفع كفاءة إدارة الموارد البشرية.

أتطلع إلى الإسهام في تحقيق أهداف ${company} ومستهدفات رؤية المملكة 2030، ويسعدني ترتيب مقابلة في الوقت الذي يناسبكم. مرفق لكم سيرتي الذاتية.

وتقبلوا خالص التحية والتقدير،
عبدالله أحمد عسيري
0568666836 | me.abdullahasiri@gmail.com`;

  $('prompt').value =
`أنت خبير توظيف في السوق السعودي ومتخصص في أنظمة ATS.
هذه سيرتي الذاتية وإعلان وظيفة أريد التقدم لها. المطلوب:
1) خطاب تقديم رسمي بالعربية (250 كلمة كحد أقصى) موجّه إلى ${company} لوظيفة «${title}».
2) قائمة بالكلمات المفتاحية في الإعلان غير الموجودة في سيرتي.
3) اقتراحات محددة لإعادة صياغة الملخص والنقاط في سيرتي لتطابق الإعلان.
شرط مهم: لا تختلق أي خبرة أو رقم أو شهادة غير موجودة في سيرتي.

=== سيرتي الذاتية ===
${cvText || '(افتح الصفحة من الموقع المنشور ليُضاف نص السيرة تلقائياً)'}

=== إعلان الوظيفة ===
${ad}`;

  const link = $('applyNow'), u = $('jobUrl').value;
  link.hidden = !u; if (u) link.href = u;
  $('result').classList.add('show');
  $('result').scrollIntoView({ behavior: 'smooth' });
});

document.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => {
  const el = $(b.dataset.copy);
  try { await navigator.clipboard.writeText(el.value); } catch { el.select(); document.execCommand('copy'); }
  const t = b.textContent; b.textContent = 'تم النسخ ✓'; setTimeout(() => b.textContent = t, 1500);
}));

// ---------- theme ----------
document.querySelector('.theme-btn').addEventListener('click', () => {
  const root = document.documentElement, next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch (e) {}
});

// ---------- job feed ----------
// Jobs come from the Google Apps Script web app (apps-script/Code.gs) when its URL is
// saved below, otherwise from jobs.json. "Applied" marks are kept in this browser only.
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};
const esc = s => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// title words that mark a role as relevant even when the alert carries no description
const RELEVANT = /موارد بشري|الموارد البشري|شؤون الموظفين|الأفراد|التوظيف|استقطاب|مشاريع|مشروع|تطوير مؤسسي|التطوير المؤسسي|تميز مؤسسي|التميز المؤسسي|إدار|سياسات|إجراءات|حوكمة|جودة|عمليات|مكتب|human resources|\bhr\b|people|talent|recruit|personnel|employee relations|project|pmo|admin|office manager|organizational|institutional|excellence|governance|quality|polic|process|operations/i;
// alert-email note lines that are not job details (also filtered in apps-script/Code.gs)
const NOISE = /تقديم الطلب|تقوم بالتوظيف|توظف بنشاط|خريج|زملاء|مروّج|Easy Apply|actively (hiring|recruiting)|alumni|connection|Promoted/i;
let jobs = [], filter = 'open';
const applied = new Set(store.get('applied', []));

function score(j) {
  const r = analyse(`${j.title} ${j.text || ''}`);
  return Math.min(100, (RELEVANT.test(j.title) ? 55 : 15) + Math.round(r.pct * 0.45));
}

function render() {
  const list = $('jobList');
  const shown = jobs.filter(j => filter === 'all' || (filter === 'applied') === applied.has(j.id));
  if (!jobs.length) {
    list.innerHTML = `<div class="card empty">لا توجد وظائف بعد.<br>بعد إعداد مصدر الوظائف (الخطوات في رسالة Claude)، ستظهر هنا تلقائياً من تنبيهات لينكدإن وجدارات.<br>وحتى ذلك الحين، الصق أي إعلان في قسم <a href="#apply"><b>تجهيز الطلب</b></a>.</div>`;
    return;
  }
  if (!shown.length) { list.innerHTML = '<div class="card empty">لا توجد وظائف في هذا التصنيف.</div>'; return; }
  list.innerHTML = shown.map(j => {
    const cls = j.pct >= 70 ? 'hi' : j.pct >= 45 ? '' : 'lo';
    const meta = [j.company, j.location, j.source, j.date].filter(Boolean).map(esc).join(' · ');
    return `<article class="card jobcard${applied.has(j.id) ? ' applied' : ''}" data-id="${esc(j.id)}">
      <span class="match ${cls}">${j.pct}%</span>
      <div><h3>${esc(j.title)}</h3><p>${meta}</p></div>
      <div class="acts">
        <button class="btn solid" data-act="prep" type="button">جهّز الطلب</button>
        <a class="btn ghost" data-act="go" href="${esc(j.url)}" target="_blank" rel="noopener">قدّم الآن</a>
        <label class="done"><input type="checkbox" data-act="done"${applied.has(j.id) ? ' checked' : ''}>قدّمت</label>
      </div></article>`;
  }).join('');
}

$('jobList').addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const card = el.closest('.jobcard'), job = jobs.find(j => j.id === card.dataset.id);
  if (el.dataset.act === 'prep') {
    $('title').value = job.title; $('company').value = job.company || '';
    $('jobUrl').value = job.url || '';
    $('ad').value = `${job.title}\n${job.company || ''} · ${job.location || ''}\n\n(افتح الإعلان من زر "قدّم الآن"، وانسخ وصف الوظيفة كاملاً والصقه هنا بدلاً من هذا السطر للحصول على نتيجة أدق.)`;
    $('apply').scrollIntoView({ behavior: 'smooth' });
    $('form').requestSubmit();
  }
});
$('jobList').addEventListener('change', e => {
  if (e.target.dataset.act !== 'done') return;
  const id = e.target.closest('.jobcard').dataset.id;
  e.target.checked ? applied.add(id) : applied.delete(id);
  store.set('applied', [...applied]);
  render();
});
document.querySelectorAll('.chip-btn').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.chip-btn').forEach(x => x.classList.toggle('on', x === b));
  filter = b.dataset.filter; render();
}));

$('feedUrl').value = store.get('feedUrl', '');
$('saveFeed').addEventListener('click', () => {
  store.set('feedUrl', $('feedUrl').value.trim());
  load();
});
if (!store.get('feedUrl', '')) $('settings').open = true;

function load() {
  const url = store.get('feedUrl', '') || 'jobs.json';
  $('jobList').innerHTML = '<div class="card empty">جارٍ التحميل...</div>';
  fetch(url, { cache: 'no-store' }).then(r => r.ok ? r.json() : []).catch(() => []).then(data => {
    jobs = (Array.isArray(data) ? data : []).filter(j => j && j.title && !NOISE.test(j.title))
      .map(j => ({ ...j, location: NOISE.test(j.location || '') ? '' : j.location }))
      .map(j => ({ ...j, id: String(j.id || j.url || j.title), pct: score(j) }))
      .sort((a, b) => b.pct - a.pct || String(b.date).localeCompare(String(a.date)));
    render();
  });
}
load();

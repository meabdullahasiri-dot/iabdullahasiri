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

  $('result').classList.add('show');
  $('result').scrollIntoView({ behavior: 'smooth' });
});

document.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => {
  const el = $(b.dataset.copy);
  try { await navigator.clipboard.writeText(el.value); } catch { el.select(); document.execCommand('copy'); }
  const t = b.textContent; b.textContent = 'تم النسخ ✓'; setTimeout(() => b.textContent = t, 1500);
}));

// ---------- matched jobs (jobs.json is written by the Google Apps Script in the next phase) ----------
const esc = s => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
fetch('jobs.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : []).catch(() => []).then(jobs => {
  const list = $('jobList');
  if (!jobs.length) {
    list.innerHTML = '<div class="card empty">لا توجد وظائف بعد. ستظهر هنا تلقائياً بعد ربط تنبيهات لينكدإن وجدارات (المرحلة القادمة).</div>';
    return;
  }
  list.innerHTML = jobs
    .map(j => ({ ...j, pct: analyse(`${j.title} ${j.text || ''}`).pct }))
    .sort((a, b) => b.pct - a.pct)
    .map(j => `<div class="card jobcard"><div><h3>${esc(j.title)}</h3><p>${esc(j.company)} · ${esc(j.source)} · ${esc(j.date)}</p></div>
      <div style="display:flex;gap:12px;align-items:center"><span class="pct">${j.pct}%</span>
      <a class="btn" href="${esc(j.url)}" target="_blank" rel="noopener">الإعلان</a></div></div>`).join('');
});

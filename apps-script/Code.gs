/**
 * Job feed for the CV site's application page (tools.html).
 *
 * Reads LinkedIn / Jadarat job-alert emails from your own Gmail, keeps a list
 * of jobs in a Google Sheet, and serves it as JSON to the site.
 * Only job titles, companies, locations and links leave your mailbox.
 *
 * Setup (once): run `setup`, then Deploy > New deployment > Web app
 * (Execute as: Me, Who has access: Anyone) and paste the URL into the site.
 */

const SEARCHES = [
  { source: 'LinkedIn', query: 'from:(jobalerts-noreply@linkedin.com OR jobs-noreply@linkedin.com) newer_than:21d' },
  { source: 'جدارات', query: 'from:(jadarat) newer_than:21d' },
];
const MAX_JOBS = 300;

function setup() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('SHEET_ID')) {
    const ss = SpreadsheetApp.create('وظائف - موقع السيرة الذاتية');
    ss.getSheets()[0].setName('jobs').appendRow(['id', 'title', 'company', 'location', 'source', 'url', 'date']);
    props.setProperty('SHEET_ID', ss.getId());
  }
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('collectJobs').timeBased().everyHours(1).create();
  collectJobs();
}

function sheet_() {
  return SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SHEET_ID')).getSheetByName('jobs');
}

function collectJobs() {
  const sh = sheet_();
  const known = new Set(sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), 1).getValues().flat().filter(String));
  const rows = [];
  SEARCHES.forEach(({ source, query }) => {
    GmailApp.search(query, 0, 50).forEach(thread => thread.getMessages().forEach(msg => {
      parse_(msg.getPlainBody(), source).forEach(job => {
        if (known.has(job.id)) return;
        known.add(job.id);
        rows.push([job.id, job.title, job.company, job.location, source, job.url, msg.getDate().toISOString().slice(0, 10)]);
      });
    }));
  });
  if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, 7).setValues(rows);
  // keep the newest MAX_JOBS rows
  const extra = sh.getLastRow() - 1 - MAX_JOBS;
  if (extra > 0) { sh.getRange(2, 1, sh.getLastRow() - 1, 7).sort({ column: 7, ascending: false }); sh.deleteRows(MAX_JOBS + 2, extra); }
}

/**
 * Alert emails list each job as a few short lines (title, company, location),
 * sometimes followed by notes such as "Easy Apply" or "actively hiring", then its link.
 * We take the link, drop those note lines, and read the three lines just above it.
 */
const NOISE = /تقديم الطلب|تقدّم بسهولة|التقديم السهل|تقوم بالتوظيف|توظف بنشاط|خريج|خريجي|زميل|زملاء|علاقات|جهة اتصال|مروّج|مُروَّج|ممول|Easy Apply|Apply with|actively (hiring|recruiting)|alumni|connection|Promoted|Be an early applicant|applicants?\b|عرض الوظيفة|View job|See all jobs|^\d+\s*(ر\.س|SAR|\$)/i;

function parse_(body, source) {
  const lines = body.split(/\r?\n/).map(l => l.trim());
  const jobs = [];
  lines.forEach((line, i) => {
    const m = line.match(/(https?:\/\/\S*(?:jobs\/view\/(\d+)|jadarat\S*))/i);
    if (!m) return;
    const url = m[1].replace(/[)>\]]+$/, '');
    const id = m[2] ? 'li-' + m[2] : 'jd-' + url.replace(/[?#].*$/, '');
    const above = [];
    for (let j = i - 1; j >= 0 && above.length < 3 && i - j <= 10; j--) {
      const t = lines[j].replace(/^(View job|عرض الوظيفة):?\s*/i, '').trim();
      if (/^https?:/i.test(t) || /^-{3,}$/.test(t)) { if (above.length) break; continue; }
      if (!t || NOISE.test(t)) continue;
      above.unshift(t);
    }
    if (!above.length) return;
    const clean = url.replace(/\/comm\//, '/').replace(/\?.*$/, '');
    jobs.push({ id, title: above[0], company: above[1] || '', location: above[2] || '', url: m[2] ? clean : url });
  });
  return jobs;
}

/** Clears the sheet and re-reads the alert emails (run after changing the parser). */
function rebuild() {
  const sh = sheet_();
  if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);
  collectJobs();
}

function doGet() {
  const sh = sheet_();
  const values = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 7).getValues() : [];
  const jobs = values.map(([id, title, company, location, source, url, date]) => ({ id, title, company, location, source, url,
      date: date instanceof Date ? Utilities.formatDate(date, 'Asia/Riyadh', 'yyyy-MM-dd') : String(date).slice(0, 10) }))
    .sort((a, b) => b.date.localeCompare(a.date));
  return ContentService.createTextOutput(JSON.stringify(jobs)).setMimeType(ContentService.MimeType.JSON);
}

# Builds the ATS-friendly CV: a single-column RTL DOCX with real heading styles,
# exported to PDF by LibreOffice (which keeps Arabic text extractable in logical order).
import sys, subprocess, pathlib
from docx import Document
from docx.shared import Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

FONT = 'thmanyah sans'
ACCENT = RGBColor(0x5b, 0x21, 0xb6)
out = pathlib.Path(sys.argv[1])

CV = {
  'name': 'عبدالله أحمد عبدالله عسيري',
  'title': 'مدير موارد بشرية | مدير مشاريع معتمد PMP',
  'contact': 'أبها، المملكة العربية السعودية | 0568666836 | me.abdullahasiri@gmail.com | linkedin.com/in/iabdullah36',
  'summary': 'مدير موارد بشرية بخبرة تزيد على 12 عاماً في القطاعات الحكومية وغير الربحية والخاصة، بدوام كامل وجزئي وبصفة مستشار. أدرت دورة الموارد البشرية كاملة، من التخطيط وإعداد السياسات واللوائح والإجراءات حتى انتهاء العلاقة التعاقدية. حاصل على ماجستير إدارة الأعمال التنفيذي وشهادة مدير مشاريع معتمد (PMP). ملمّ بنظام العمل السعودي والأنظمة الحكومية ذات العلاقة، ومتخصص في أتمتة العمليات والتطوير المؤسسي وتحليل البيانات باستخدام Excel وPower BI، بما يدعم مستهدفات رؤية المملكة 2030.',
  'jobs': [
    ('مستشار موارد بشرية (عن بُعد)', 'شركة الامتيازات العربية المحدودة، جدة', '09/2019 - حتى الآن', [
      'إدارة وتنفيذ العمليات التشغيلية للموارد البشرية بالكامل عن بُعد.',
      'تقديم الاستشارات الإدارية لتطوير سياسات ولوائح الموارد البشرية بما يتوافق مع نظام العمل السعودي.',
      'أتمتة إجراءات الموارد البشرية لرفع الكفاءة وتقليل الأعمال اليدوية.',
      'تنفيذ إجراءات الموظفين عبر المنصات الحكومية (قوى، ومُدد، والتأمينات الاجتماعية، ومقيم، وأبشر أعمال)، ومنها توثيق العقود، وحماية الأجور، والتسجيل في التأمينات، وإصدار الإقامات وتجديدها، واستخراج التأشيرات ونقل الخدمات.']),
    ('مسؤول الموارد البشرية (دوام جزئي)', 'جمعية الكوثر الصحية، أبها', '02/2014 - حتى الآن', [
      'تطوير وتنفيذ سياسات وإجراءات ونماذج الموارد البشرية للجمعية.',
      'تنفيذ إجراءات الموظفين عبر المنصات الحكومية (قوى، ومُدد، والتأمينات الاجتماعية، ومقيم، وأبشر أعمال)، ومنها توثيق العقود، وحماية الأجور، والتسجيل في التأمينات، وإصدار الإقامات وتجديدها، واستخراج التأشيرات ونقل الخدمات.',
      'إدارة العمليات التشغيلية للموارد البشرية، من التوظيف وشؤون الموظفين حتى إنهاء الخدمة.',
      'العمل على تحسين بيئة العمل.',
      'تحقيق تقييم مرتفع في معيار الموارد البشرية ضمن جائزة السبيعي للتميز المؤسسي.']),
    ('محاسب ممارس (دوام كامل)', 'وزارة العدل، أبها', '2014 - حتى الآن', [
      'الإشراف على العمليات الإدارية للدائرة القضائية.',
      'شغل مناصب متعددة: كاتب ضبط، ومأمور تنفيذ، ومأمور صرف، وأمين صندوق.',
      'دراسة الطلبات المالية والتحقق من استيفائها وتجهيزها للصرف.']),
  ],
  'achievements': ['بناء منظومة سياسات وإجراءات ونماذج الموارد البشرية في القطاعين غير الربحي والخاص.', 'الإسهام في تحقيق تقييم مرتفع في معيار الموارد البشرية ضمن جائزة السبيعي للتميز المؤسسي.'],
  'education': [
    ('ماجستير إدارة الأعمال التنفيذي (EMBA)', 'جامعة نجران، المعدل 4.37 من 5', '2024'),
    ('بكالوريوس إدارة الأعمال', 'جامعة الملك خالد، المعدل 3.54 من 5', '2014'),
  ],
  'certs': [('مدير مشاريع معتمد (PMP)، معهد إدارة المشاريع PMI', '2025')],
  'courses': [('التخطيط الاستراتيجي في إدارة الموارد البشرية', '2024'), ('تحليل البيانات باستخدام Power BI', '2024'),
              ('مهارات تحليل البيانات باستخدام Excel', '2024'), ('خبير التطوير المؤسسي', '2021')],
  'skills': ['إدارة الموارد البشرية', 'إعداد السياسات واللوائح والإجراءات',
             'نظام العمل السعودي والأنظمة الحكومية', 'إجراءات الموظفين على المنصات الحكومية: قوى، ومُدد، والتأمينات الاجتماعية، ومقيم، وأبشر أعمال', 'إدارة المشاريع (PMP)', 'التطوير المؤسسي', 'أتمتة العمليات',
             'التخطيط التشغيلي', 'تحليل البيانات: Excel وPower BI', 'إعداد التقارير', 'قيادة الفرق', 'التواصل وبناء العلاقات المهنية'],
  'languages': 'العربية: اللغة الأم | الإنجليزية: مستوى جيد',
}

doc = Document()
sec = doc.sections[0]
sec.page_width, sec.page_height = Cm(21), Cm(29.7)
sec.left_margin = sec.right_margin = Cm(1.6); sec.top_margin = sec.bottom_margin = Cm(1.1)
TEXT_W = Cm(21 - 3.2)
sec._sectPr.append(OxmlElement('w:bidi'))
cp = doc.core_properties
cp.title, cp.author = 'السيرة الذاتية - عبدالله أحمد عسيري', 'عبدالله أحمد عسيري'
cp.subject = 'مدير موارد بشرية'
cp.keywords = 'الموارد البشرية, مدير موارد بشرية, HR Manager, PMP, نظام العمل السعودي, التطوير المؤسسي, أتمتة العمليات'

def fmt(run, size, bold=False, color=None):
    run.font.name = FONT; run.font.size = Pt(size); run.bold = bold
    rpr = run._r.get_or_add_rPr()
    f = rpr.find(qn('w:rFonts'))
    for a in ('w:ascii', 'w:hAnsi', 'w:cs'): f.set(qn(a), FONT)
    rpr.append(OxmlElement('w:rtl'))
    sz = OxmlElement('w:szCs'); sz.set(qn('w:val'), str(int(size * 2))); rpr.append(sz)
    if bold: rpr.append(OxmlElement('w:bCs'))
    if color: run.font.color.rgb = color

def para(text='', size=10.5, bold=False, color=None, style=None, align=WD_ALIGN_PARAGRAPH.RIGHT, after=2, before=0):
    p = doc.add_paragraph(style=style)
    p._p.get_or_add_pPr().append(OxmlElement('w:bidi'))
    p.alignment = align
    pf = p.paragraph_format; pf.space_after = Pt(after); pf.space_before = Pt(before); pf.line_spacing = 1.05
    if text: fmt(p.add_run(text), size, bold, color)
    return p

def heading(text):
    p = para(style='Heading 1', after=2, before=6)
    fmt(p.add_run(text), 11.5, True, ACCENT)
    # thin rule under each section heading
    b = OxmlElement('w:pBdr'); bt = OxmlElement('w:bottom')
    for k, v in (('val', 'single'), ('sz', '6'), ('space', '1'), ('color', 'D9D9E3')): bt.set(qn('w:' + k), v)
    b.append(bt); p._p.get_or_add_pPr().append(b)

def line(left, right, bold=True, size=10.5):
    # "title .... date" on one line: a tab stop at the far (left) edge, no tables (ATS-safe)
    p = para(after=0)
    p.paragraph_format.tab_stops.add_tab_stop(TEXT_W, alignment=WD_TAB_ALIGNMENT.RIGHT)
    fmt(p.add_run(left), size, bold); fmt(p.add_run('\t' + right), size - 0.5, False, RGBColor(0x55, 0x55, 0x60))
    return p

def bullet(text):
    # plain-text bullet with a hanging indent; list numbering would render on the wrong side in RTL
    p = para('• ' + text, 9.5, after=0)
    p.paragraph_format.right_indent = Cm(0.5)
    p.paragraph_format.first_line_indent = Cm(-0.35)

para(CV['name'], 20, True, align=WD_ALIGN_PARAGRAPH.CENTER, after=0)
para(CV['title'], 12.5, True, ACCENT, align=WD_ALIGN_PARAGRAPH.CENTER, after=2)
para(CV['contact'], 9.5, align=WD_ALIGN_PARAGRAPH.CENTER, after=6)
heading('الملخص المهني'); para(CV['summary'], 10, align=WD_ALIGN_PARAGRAPH.RIGHT)
heading('أبرز الإنجازات')
for a in CV['achievements']: bullet(a)
heading('الخبرات العملية')
for i, (t, org, d, items) in enumerate(CV['jobs']):
    p = line(t, d); p.paragraph_format.space_before = Pt(4 if i else 1)
    para(org, 10, color=RGBColor(0x55, 0x55, 0x60), after=2)
    for it in items: bullet(it)
heading('التعليم')
for t, sub, d in CV['education']:
    line(t, d); para(sub, 10, color=RGBColor(0x55, 0x55, 0x60), after=2)
heading('الشهادات المهنية')
for t, d in CV['certs']: line(t, d)
heading('الدورات التدريبية')
for t, d in CV['courses']: line(t, d, bold=False, size=10)
heading('المهارات')
para(' • '.join(CV['skills']), 10, align=WD_ALIGN_PARAGRAPH.RIGHT)
heading('اللغات'); para(CV['languages'])

docx_path = out / 'cv-ats.docx'
doc.save(docx_path)
subprocess.run(['soffice', '--headless', '--convert-to', 'pdf', '--outdir', str(out), str(docx_path)], check=True, capture_output=True, timeout=180)
print('ok', out / 'cv-ats.pdf')

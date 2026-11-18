// TrueUp demo: data model, audit rules, forecast math and Excel export.
// Everything here is fictional ("Nimbus Media") and written fresh for this demo.
(function (root) {
  'use strict';

  // ---------- deterministic sample data ----------
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const R = rng(20271);
  const pick = a => a[Math.floor(R() * a.length)];
  const round = (n, to) => Math.round(n / to) * to;

  const MONTHS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  const CLOSED_THROUGH = 3;            // Oct–Jan have actuals (index 0..3)
  const CUR_Q = { name: 'Q2', months: [3, 4, 5] };

  const LOBS = [
    { id: 'FILM', name: 'Original Film',     org: 'Content' },
    { id: 'SER',  name: 'Series',            org: 'Content' },
    { id: 'LIVE', name: 'Live Events',       org: 'Content' },
    { id: 'BOOK', name: 'Books & Audio',     org: 'Content' },
    { id: 'BRND', name: 'Brand Campaigns',   org: 'Marketing' },
    { id: 'PERF', name: 'Performance Media', org: 'Marketing' },
    { id: 'EXP',  name: 'Experiential',      org: 'Marketing' }
  ];
  const TITLES = {
    FILM: ['The Lantern Keeper', 'Saltwater Kings', 'Midnight Ferry'],
    SER:  ['Orchard Street S2', 'The Quiet Season', 'Borough Lines', 'Glasswork'],
    LIVE: ['Harbor Cup Finals', 'Night Market Live', 'Summer Sessions'],
    BOOK: ['Audio Originals Slate', 'Paper Moon Imprint', 'Narrator Fund'],
    BRND: ['Spring Tentpole', 'Holiday Spot', 'City Walls OOH'],
    PERF: ['Search & Social', 'Retargeting Always-On', 'Creator Partnerships'],
    EXP:  ['Premiere Night', 'Pop-Up Tour', 'Press Junket']
  };
  const VENDORS = ['Brightline Post', 'Kestrel Sound', 'Harbor & Finch', 'Copperleaf Studios', 'Bluejay Media',
                   'Northpier Events', 'Fernhill Talent', 'Vantage Buying Co.', 'Quillon Print', 'Saltmarsh VFX'];
  const OWNERS = ['J. Okafor', 'M. Castillo', 'R. Brandt', 'S. Ito', 'D. Marsh'];

  let pid = 100, inv = 5000;
  const PROJECTS = [], LEDGER = [];
  LOBS.forEach(l => TITLES[l.id].forEach(title => {
    const big = l.org === 'Content';
    const allocation = round((big ? 900 : 350) * 1000 * (0.6 + R() * 1.4), 5000);
    const po = round(allocation * (0.82 + R() * 0.16), 1000);
    const p = { id: 'P' + (pid++), lob: l.id, title, vendor: pick(VENDORS), owner: pick(OWNERS),
                cc: 'CC-' + (4100 + Math.floor(R() * 80)), poNum: 'PO-' + (78000 + Math.floor(R() * 999)),
                allocation, po, judgment: 0 };
    PROJECTS.push(p);
    // monthly actuals Oct..Jan, roughly pacing against the PO
    for (let m = 0; m <= CLOSED_THROUGH; m++) {
      const amt = round(po / 12 * (0.4 + R() * 1.3), 100);
      if (R() < 0.85) LEDGER.push({ project: p.id, lob: l.id, month: MONTHS[m], m, vendor: p.vendor, invoice: 'INV-' + (inv++), amount: amt });
    }
  }));

  // ---- plant a few things for the audit to catch ----
  const byTitle = t => PROJECTS.find(p => p.title === t);
  (function plant() {
    // 1. Forecast running over allocation
    const a = byTitle('Borough Lines'); a.judgment = round(a.allocation * 1.11 - (actualsYTD(a) + openPO(a)), 1000);
    const a2 = byTitle('Retargeting Always-On'); a2.judgment = round(a2.allocation * 1.08 - (actualsYTD(a2) + openPO(a2)), 1000);
    // a couple of ordinary judgment calls so the column isn't empty
    byTitle('Harbor Cup Finals').judgment = 45000; byTitle('Holiday Spot').judgment = -20000;
    // 2. Spend with no PO
    const b = byTitle('Pop-Up Tour'); b.po = 0; b.poNum = '';
    // 3. Missing cost center
    byTitle('Narrator Fund').cc = '';
    // 4. Duplicate invoice
    const d = LEDGER.find(x => x.project === byTitle('Saltwater Kings').id);
    LEDGER.push(Object.assign({}, d, { month: MONTHS[CLOSED_THROUGH], m: CLOSED_THROUGH }));
    // 5. Stale PO: no spend since October
    const s = byTitle('City Walls OOH');
    for (let i = LEDGER.length - 1; i >= 0; i--) if (LEDGER[i].project === s.id && LEDGER[i].m > 0) LEDGER.splice(i, 1);
  })();

  const CONTRACTORS = [
    { name: 'Avery Lund',   vendor: 'Fernhill Talent', project: 'Orchard Street S2',  end: '2026-12-31', billingThrough: '2027-01-31' },
    { name: 'Theo Barros',  vendor: 'Fernhill Talent', project: 'Spring Tentpole',    end: '2027-06-30', billingThrough: '2027-01-31' },
    { name: 'Priya Sethi',  vendor: 'Bluejay Media',   project: 'Search & Social',    end: '2026-11-30', billingThrough: '2027-01-31' },
    { name: 'Gus Moreau',   vendor: 'Northpier Events',project: 'Premiere Night',     end: '2027-03-31', billingThrough: '2027-01-31' },
    { name: 'Lena Fischer', vendor: 'Kestrel Sound',   project: 'Audio Originals Slate', end: '2027-09-30', billingThrough: '2027-01-31' }
  ];

  // ---------- math ----------
  function actualsYTD(p) { return LEDGER.filter(x => x.project === p.id).reduce((s, x) => s + x.amount, 0); }
  function openPO(p) { return Math.max(0, p.po - actualsYTD(p)); }
  function forecast(p) { return actualsYTD(p) + openPO(p) + (Number(p.judgment) || 0); }
  function calcRow(p) {
    const act = actualsYTD(p), open = openPO(p), fc = act + open + (Number(p.judgment) || 0);
    return { p, lob: LOBS.find(l => l.id === p.lob), allocation: p.allocation, actuals: act, open, judgment: Number(p.judgment) || 0,
             forecast: fc, variance: p.allocation - fc, pct: p.allocation ? (p.allocation - fc) / p.allocation : 0 };
  }
  function summary(orgFilter) {
    return LOBS.filter(l => !orgFilter || l.org === orgFilter).map(l => {
      const rows = PROJECTS.filter(p => p.lob === l.id).map(calcRow);
      const s = k => rows.reduce((t, r) => t + r[k], 0);
      const alloc = s('allocation'), fc = s('forecast');
      return { lob: l, allocation: alloc, actuals: s('actuals'), open: s('open'), judgment: s('judgment'), forecast: fc, variance: alloc - fc, pct: alloc ? (alloc - fc) / alloc : 0 };
    });
  }

  // ---------- audit ----------
  const RULES = [
    { id: 'over',   sev: 'High',   name: 'Forecast over allocation', desc: 'Forecast runs more than 5% over the project allocation.' },
    { id: 'nopo',   sev: 'High',   name: 'Spend without a PO',       desc: 'Actuals posted to a project with no purchase order.' },
    { id: 'dupinv', sev: 'High',   name: 'Duplicate invoice',        desc: 'The same invoice number posted more than once.' },
    { id: 'nocc',   sev: 'Medium', name: 'Missing cost center',      desc: 'Project has no cost center, so spend can’t be routed.' },
    { id: 'staff',  sev: 'Medium', name: 'Contractor past end date', desc: 'Contractor is still billing after their engagement ended.' },
    { id: 'stale',  sev: 'Low',    name: 'Stale PO',                 desc: 'Open PO with no spend in the last 90 days.' }
  ];
  function runAudit() {
    const out = [];
    const lobName = id => LOBS.find(l => l.id === id).name;
    PROJECTS.forEach(p => {
      const r = calcRow(p);
      if (r.forecast > p.allocation * 1.05) out.push({ rule: 'over', key: 'over-' + p.id, item: p.title, lob: lobName(p.lob), detail: `Forecast ${fmt(r.forecast)} vs allocation ${fmt(p.allocation)} (${pct(-r.pct)} over)` });
      if (!p.poNum && r.actuals > 0) out.push({ rule: 'nopo', key: 'nopo-' + p.id, item: p.title, lob: lobName(p.lob), detail: `${fmt(r.actuals)} posted with no PO on file` });
      if (!p.cc) out.push({ rule: 'nocc', key: 'nocc-' + p.id, item: p.title, lob: lobName(p.lob), detail: 'Cost center is blank' });
      const recent = LEDGER.some(x => x.project === p.id && x.m >= CLOSED_THROUGH - 2);
      if (p.poNum && openPO(p) > 0 && !recent) out.push({ rule: 'stale', key: 'stale-' + p.id, item: p.title, lob: lobName(p.lob), detail: `${fmt(openPO(p))} open on ${p.poNum}, nothing billed since ${MONTHS[0]}` });
    });
    const seen = {};
    LEDGER.forEach(x => { if (seen[x.invoice]) { const p = PROJECTS.find(q => q.id === x.project); out.push({ rule: 'dupinv', key: 'dup-' + x.invoice, item: p.title, lob: lobName(p.lob), detail: `${x.invoice} from ${x.vendor} posted in ${seen[x.invoice]} and ${x.month} (${fmt(x.amount)} each)` }); } else seen[x.invoice] = x.month; });
    CONTRACTORS.forEach(c => { if (c.billingThrough > c.end) { const p = byTitle(c.project); out.push({ rule: 'staff', key: 'staff-' + c.name, item: c.name + ' (' + c.vendor + ')', lob: lobName(p.lob), detail: `Engagement ended ${c.end}; invoices through ${c.billingThrough}` }); } });
    const order = { High: 0, Medium: 1, Low: 2 };
    return out.map(f => Object.assign(f, { ruleObj: RULES.find(r => r.id === f.rule) }))
              .sort((a, b) => order[a.ruleObj.sev] - order[b.ruleObj.sev]);
  }

  // ---------- accruals (current quarter) ----------
  const ACCRUALS = LOBS.flatMap(l => PROJECTS.filter(p => p.lob === l.id && p.poNum && openPO(p) > 0).slice(0, 2)).map((p, i) => {
    const scope = round(Math.min(openPO(p), p.po * (0.18 + R() * 0.2)), 500);
    const invoiced = LEDGER.filter(x => x.project === p.id && CUR_Q.months.includes(x.m)).reduce((s, x) => s + x.amount, 0);
    return { id: 'A' + (i + 1), project: p.id, title: p.title, lob: p.lob, vendor: p.vendor, poNum: p.poNum, scope, invoiced,
             pctComplete: [100, 75, 60, 50, 90, 40, 100, 25][i % 8], reviewed: false };
  });
  function accrualAmount(a) { return Math.max(0, Math.round(a.scope * a.pctComplete / 100 - a.invoiced)); }

  // ---------- formatting ----------
  function fmt(n) { const s = Math.round(Math.abs(n)).toLocaleString('en-US'); return (n < 0 ? '-$' : '$') + s; }
  function fmtK(n) { const a = Math.abs(n); const s = a >= 1e6 ? (a / 1e6).toFixed(2) + 'M' : a >= 1e3 ? Math.round(a / 1e3) + 'K' : Math.round(a); return (n < 0 ? '-$' : '$') + s; }
  function pct(x) { return (x * 100).toFixed(1) + '%'; }

  // ---------- Excel: forecast workbook with live formulas ----------
  async function forecastWorkbook(ExcelJS, comments) {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'TrueUp demo'; wb.created = new Date();
    const money = '$#,##0;[Red]-$#,##0';
    const head = (ws, row) => { ws.getRow(row).eachCell(c => { c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3A5F' } }; c.alignment = { vertical: 'middle' }; }); ws.getRow(row).height = 20; };

    // Source: ledger lines
    const src = wb.addWorksheet('Ledger');
    src.columns = [{ header: 'Project ID', key: 'p', width: 12 }, { header: 'LOB', key: 'l', width: 10 }, { header: 'Month', key: 'm', width: 8 },
                   { header: 'Vendor', key: 'v', width: 22 }, { header: 'Invoice', key: 'i', width: 12 }, { header: 'Amount', key: 'a', width: 14 }];
    LEDGER.forEach(x => src.addRow({ p: x.project, l: x.lob, m: x.month, v: x.vendor, i: x.invoice, a: x.amount }));
    src.getColumn('a').numFmt = money; head(src, 1); src.views = [{ state: 'frozen', ySplit: 1 }];

    // POs
    const pos = wb.addWorksheet('POs');
    pos.columns = [{ header: 'Project ID', key: 'p', width: 12 }, { header: 'PO', key: 'n', width: 12 }, { header: 'PO Amount', key: 'a', width: 14 }];
    PROJECTS.forEach(p => pos.addRow({ p: p.id, n: p.poNum || '(none)', a: p.po }));
    pos.getColumn('a').numFmt = money; head(pos, 1);

    // Calculation
    const calc = wb.addWorksheet('Calculation');
    calc.columns = [{ header: 'Project ID', width: 11 }, { header: 'Project', width: 26 }, { header: 'LOB', width: 8 }, { header: 'Allocation', width: 14 },
                    { header: 'Actuals YTD', width: 14 }, { header: 'Open PO', width: 14 }, { header: 'Judgment', width: 13 }, { header: 'Forecast', width: 14 },
                    { header: 'Variance', width: 14 }, { header: 'Var %', width: 9 }];
    head(calc, 1);
    PROJECTS.forEach((p, i) => {
      const r = i + 2;
      calc.addRow([p.id, p.title, p.lob, p.allocation,
        { formula: `SUMIFS(Ledger!$F:$F,Ledger!$A:$A,A${r})` },
        { formula: `MAX(0,SUMIFS(POs!$C:$C,POs!$A:$A,A${r})-E${r})` },
        Number(p.judgment) || 0,
        { formula: `E${r}+F${r}+G${r}` },
        { formula: `D${r}-H${r}` },
        { formula: `IF(D${r}=0,0,I${r}/D${r})` }]);
      calc.getCell(`G${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF4CC' } };
    });
    ['D', 'E', 'F', 'G', 'H', 'I'].forEach(c => calc.getColumn(c).numFmt = money);
    calc.getColumn('J').numFmt = '0.0%';
    calc.views = [{ state: 'frozen', ySplit: 1, xSplit: 2 }];
    calc.getCell('L1').value = 'Yellow cells are inputs. Change a Judgment and Forecast, Summary and Commentary update.';
    calc.getCell('L1').font = { italic: true, color: { argb: 'FF666666' } };

    // Summary
    const sum = wb.addWorksheet('Summary');
    sum.columns = [{ header: 'LOB', width: 8 }, { header: 'Line of business', width: 22 }, { header: 'Org', width: 12 }, { header: 'Allocation', width: 15 },
                   { header: 'Actuals YTD', width: 15 }, { header: 'Open PO', width: 15 }, { header: 'Judgment', width: 14 }, { header: 'Forecast', width: 15 },
                   { header: 'Variance', width: 15 }, { header: 'Var %', width: 9 }];
    head(sum, 1);
    const n = PROJECTS.length + 1;
    LOBS.forEach((l, i) => {
      const r = i + 2, col = c => ({ formula: `SUMIFS(Calculation!$${c}$2:$${c}$${n},Calculation!$C$2:$C$${n},$A${r})` });
      sum.addRow([l.id, l.name, l.org, col('D'), col('E'), col('F'), col('G'), col('H'), { formula: `D${r}-H${r}` }, { formula: `IF(D${r}=0,0,I${r}/D${r})` }]);
    });
    const t = LOBS.length + 2;
    sum.addRow(['', 'Total', '', ...['D', 'E', 'F', 'G', 'H', 'I'].map(c => ({ formula: `SUM(${c}2:${c}${t - 1})` })), { formula: `IF(D${t}=0,0,I${t}/D${t})` }]);
    sum.getRow(t).font = { bold: true }; sum.getRow(t).border = { top: { style: 'thin' } };
    ['D', 'E', 'F', 'G', 'H', 'I'].forEach(c => sum.getColumn(c).numFmt = money);
    sum.getColumn('J').numFmt = '0.0%';

    // Commentary
    const com = wb.addWorksheet('Commentary');
    com.columns = [{ header: 'Line of business', width: 22 }, { header: 'Variance', width: 15 }, { header: 'Position', width: 26 }, { header: 'Finance commentary', width: 80 }];
    head(com, 1);
    LOBS.forEach((l, i) => {
      const r = i + 2;
      com.addRow([{ formula: `Summary!B${r}` }, { formula: `Summary!I${r}` },
        { formula: `IF(Summary!I${r}<0,"Over by "&TEXT(-Summary!I${r},"$#,##0"),"Under by "&TEXT(Summary!I${r},"$#,##0"))` },
        (comments && comments[l.id]) || '']);
      com.getCell(`D${r}`).alignment = { wrapText: true, vertical: 'top' };
    });
    com.getColumn('B').numFmt = money;
    wb.views = [{ activeTab: 3 }];
    return wb;
  }

  async function accrualWorkbook(ExcelJS) {
    const wb = new ExcelJS.Workbook(); const money = '$#,##0';
    const ws = wb.addWorksheet(CUR_Q.name + ' Accruals');
    ws.columns = [{ header: 'Vendor', width: 22 }, { header: 'Project', width: 26 }, { header: 'LOB', width: 8 }, { header: 'PO', width: 11 },
                  { header: 'Quarter scope', width: 14 }, { header: '% complete', width: 11 }, { header: 'Invoiced in quarter', width: 17 }, { header: 'Accrual', width: 14 }];
    ws.getRow(1).font = { bold: true };
    ACCRUALS.forEach((a, i) => { const r = i + 2; ws.addRow([a.vendor, a.title, a.lob, a.poNum, a.scope, a.pctComplete / 100, a.invoiced, { formula: `MAX(0,ROUND(E${r}*F${r}-G${r},0))` }]); });
    ['E', 'G', 'H'].forEach(c => ws.getColumn(c).numFmt = money); ws.getColumn('F').numFmt = '0%';
    const je = wb.addWorksheet('Journal Entry');
    je.columns = [{ header: 'Account', width: 30 }, { header: 'LOB', width: 8 }, { header: 'Debit', width: 14 }, { header: 'Credit', width: 14 }];
    je.getRow(1).font = { bold: true };
    const last = ACCRUALS.length + 1;
    LOBS.forEach(l => { je.addRow(['Production & marketing expense', l.id, { formula: `SUMIFS('${CUR_Q.name} Accruals'!$H$2:$H$${last},'${CUR_Q.name} Accruals'!$C$2:$C$${last},B${je.rowCount + 1})` }, null]); });
    const k = je.rowCount;
    je.addRow(['Accrued liabilities', '', null, { formula: `SUM(C2:C${k})` }]);
    ['C', 'D'].forEach(c => je.getColumn(c).numFmt = money);
    return wb;
  }

  const api = { MONTHS, CLOSED_THROUGH, CUR_Q, LOBS, PROJECTS, LEDGER, CONTRACTORS, RULES, ACCRUALS,
                actualsYTD, openPO, forecast, calcRow, summary, runAudit, accrualAmount,
                fmt, fmtK, pct, forecastWorkbook, accrualWorkbook };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.TrueUp = api;
})(this);

import { state } from '../state.js';
import { exportCSV } from '../helpers.js';
import { table } from '../ui.js';

function expAuditLog(currentLogs) {
    const headers = ['Timestamp', 'Action', 'Details'];
    const rows = currentLogs.map(log => [log.timestamp, log.description, JSON.stringify(log.details)]);
    exportCSV(headers, rows, 'audit_log.csv');
}

export function renderAuditLog(){
  const view = document.getElementById('view');
  let currentLogs = [];

  function draw() {
    const q = (document.getElementById('al-q')?.value || '').trim().toLowerCase();
    const from = document.getElementById('al-from')?.value;
    const to = document.getElementById('al-to')?.value;

    let logs = state.auditLog.slice(-500).reverse();

    if (q) {
      logs = logs.filter(log => (log.description || '').toLowerCase().includes(q));
    }
    if (from) {
      logs = logs.filter(log => log.timestamp.slice(0, 10) >= from);
    }
    if (to) {
      logs = logs.filter(log => log.timestamp.slice(0, 10) <= to);
    }

    currentLogs = logs;

    const rows = logs.map(log => {
      const time = new Date(log.timestamp).toLocaleString('ar-EG');
      return [
        time,
        log.description,
        `<pre style="white-space:pre-wrap;font-size:11px;max-width:400px;word-break:break-all;">${JSON.stringify(log.details, null, 2)}</pre>`
      ];
    });

    document.getElementById('audit-list').innerHTML = table(['الوقت والتاريخ', 'الإجراء', 'التفاصيل'], rows);
  }

  view.innerHTML = `
    <div class="card">
      <h3>سجل تتبع التغييرات</h3>
      <p>يعرض هذا السجل آخر 500 إجراء تم في النظام.</p>
      <div class="tools">
        <input class="input" id="al-q" placeholder="بحث بالوصف..." style="flex:1;">
        <input type="date" class="input" id="al-from">
        <input type="date" class="input" id="al-to">
        <button class="btn secondary" id="exp-audit-btn">تصدير CSV</button>
      </div>
      <div id="audit-list" style="margin-top:12px;"></div>
    </div>
  `;

  document.getElementById('al-q').addEventListener('input', draw);
  document.getElementById('al-from').addEventListener('input', draw);
  document.getElementById('al-to').addEventListener('input', draw);
  document.getElementById('exp-audit-btn').addEventListener('click', () => expAuditLog(currentLogs));

  draw();
}

import { state } from '../state.js';
import { egp, today } from '../helpers.js';
import { getUnitDisplayName, unitById, custById } from '../state-utils.js';
import { table, printHTML } from '../ui.js';
import { nav } from '../app.js';
import { calcRemaining } from './units.js';

function calculateKpis(filter = {}) {
  const { from, to } = filter;
  let contracts = state.contracts;
  let vouchers = state.vouchers;

  if (from) {
    contracts = contracts.filter(c => c.start >= from);
    vouchers = vouchers.filter(v => v.date >= from);
  }
  if (to) {
    contracts = contracts.filter(c => c.start <= to);
    vouchers = vouchers.filter(v => v.date <= to);
  }

  const totalSales = contracts.reduce((sum, c) => sum + Number(c.totalPrice || 0), 0);
  const totalReceipts = vouchers.filter(v => v.type === 'receipt').reduce((sum, v) => sum + v.amount, 0);

  const totalDebt = state.units.reduce((sum, u) => sum + calcRemaining(u), 0);

  const collectionPercentage = totalSales > 0 ? (totalReceipts / totalSales) * 100 : 0;

  const totalExpenses = vouchers.filter(v => v.type === 'payment').reduce((sum, v) => sum + v.amount, 0);

  const netProfit = totalReceipts - totalExpenses;

  const unitCounts = {
    total: state.units.length,
    available: state.units.filter(u=>u.status==='متاحة').length,
    sold: state.units.filter(u=>u.status==='مباعة').length,
    reserved: state.units.filter(u=>u.status==='محجوزة').length,
  };

  const investorCount = state.partners.length;

  return {
    totalSales, totalReceipts, totalDebt, collectionPercentage,
    totalExpenses, netProfit, unitCounts, investorCount
  };
}

function exportDashboardExcel() {
    const fromDate = document.getElementById('dash-from')?.value;
    const toDate = document.getElementById('dash-to')?.value;

    const kpis = calculateKpis({ from: fromDate, to: toDate });
    const kpiData = [
        ['المؤشر', 'القيمة'],
        ['إجمالي المبيعات', kpis.totalSales],
        ['إجمالي المتحصلات', kpis.totalReceipts],
        ['إجمالي المديونية', kpis.totalDebt],
        ['إجمالي المصروفات', kpis.totalExpenses],
    ];

    let upcomingInstallments = state.installments.filter(i => i.status !== 'مدفوع').sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
    if (fromDate) upcomingInstallments = upcomingInstallments.filter(i => i.dueDate >= fromDate);
    if (toDate) upcomingInstallments = upcomingInstallments.filter(i => i.dueDate <= toDate);
    const installmentData = upcomingInstallments.map(i => ({
        'الوحدة': getUnitDisplayName(unitById(i.unitId)),
        'العميل': (custById(state.contracts.find(c => c.unitId === i.unitId)?.customerId) || {}).name,
        'المبلغ': i.amount,
        'تاريخ الاستحقاق': i.dueDate
    }));

    let transactions = [];
    state.vouchers.forEach(v => {
        if ((!fromDate || v.date >= fromDate) && (!toDate || v.date <= toDate)) {
            transactions.push({
                'التاريخ': v.date,
                'النوع': v.type === 'receipt' ? 'قبض' : 'صرف',
                'المبلغ': v.amount,
                'البيان': v.description
            });
        }
    });

    const wb = XLSX.utils.book_new();
    const wsKpis = XLSX.utils.aoa_to_sheet(kpiData);
    const wsInstallments = XLSX.utils.json_to_sheet(installmentData);
    const wsTransactions = XLSX.utils.json_to_sheet(transactions.sort((a, b) => (b.Date || '').localeCompare(a.Date || '')));

    XLSX.utils.book_append_sheet(wb, wsKpis, "المؤشرات الرئيسية");
    XLSX.utils.book_append_sheet(wb, wsInstallments, "الأقساط القادمة");
    XLSX.utils.book_append_sheet(wb, wsTransactions, "أحدث الحركات");

    XLSX.writeFile(wb, `dashboard_export_${today()}.xlsx`);
}

export function renderDash() {
  const view = document.getElementById('view');
  const fromDate = document.getElementById('dash-from')?.value;
  const toDate = document.getElementById('dash-to')?.value;

  const kpis = calculateKpis({ from: fromDate, to: toDate });
  const kpiHTML = `
    <div class="card"><h4>إجمالي المبيعات</h4><div class="big">${egp(kpis.totalSales)}</div></div>
    <div class="card"><h4>إجمالي المتحصلات</h4><div class="big">${egp(kpis.totalReceipts)}</div></div>
    <div class="card"><h4>إجمالي المديونية</h4><div class="big">${egp(kpis.totalDebt)}</div></div>
    <div class="card"><h4>إجمالي المصروفات</h4><div class="big">${egp(kpis.totalExpenses)}</div></div>
  `;

  const filterHTML = `
    <div class="panel" style="margin-bottom: 16px;">
        <div class="tools" style="justify-content: space-between; flex-wrap: wrap;">
            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                <label>من:</label>
                <input type="date" class="input" id="dash-from" value="${fromDate || ''}">
                <label>إلى:</label>
                <input type="date" class="input" id="dash-to" value="${toDate || ''}">
                <button class="btn" id="dash-apply-filter">تطبيق</button>
            </div>
            <div style="display: flex; gap: 8px;">
                <button class="btn secondary" id="print-dash-btn">طباعة PDF</button>
                <button class="btn secondary" id="export-dash-btn">تصدير Excel</button>
            </div>
        </div>
    </div>
  `;

  view.innerHTML = filterHTML + `
    <div id="kpi-container-new" class="grid grid-4 panel">
      ${kpiHTML}
    </div>

    <div class="grid grid-3" style="margin-top:16px; gap:16px; align-items:flex-start;">
      <div class="panel" style="grid-column: span 2;">
        <h3>الأقساط القادمة والمتأخرة</h3>
        <div id="upcoming-installments-table">
          <p style="color:var(--muted); font-size:12px;">سيتم عرض الأقساط هنا...</p>
        </div>
      </div>
      <div class="panel">
        <h3>حالة الوحدات</h3>
        <div class="chart-container" style="position: relative; height:200px; width:100%">
          <canvas id="new-units-chart"></canvas>
        </div>
      </div>
    </div>

    <div class="panel" style="margin-top:16px;">
      <h3>أحدث الحركات المالية</h3>
      <div id="recent-transactions-table">
        <p style="color:var(--muted); font-size:12px;">سيتم عرض أحدث الحركات هنا...</p>
      </div>
    </div>
  `;

  // Render Unit Status Chart
  try {
    new Chart(document.getElementById('new-units-chart').getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['متاحة', 'مباعة', 'محجوزة'],
        datasets: [{
          data: [kpis.unitCounts.available, kpis.unitCounts.sold, kpis.unitCounts.reserved],
          backgroundColor: ['#2563eb', '#16a34a', '#f59e0b'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: {font: { family: 'system-ui' }} } }
      }
    });
  } catch(e) {
    console.error("Failed to render unit status chart:", e);
    document.getElementById('new-units-chart').parentElement.innerHTML = '<p style="color:var(--warn)">فشل تحميل الرسم البياني.</p>';
  }

  document.getElementById('dash-apply-filter').onclick = () => nav('dash');
  document.getElementById('print-dash-btn').addEventListener('click', () => printHTML('لوحة التحكم', document.getElementById('view').innerHTML));
  document.getElementById('export-dash-btn').addEventListener('click', exportDashboardExcel);


  // Render Upcoming Installments Table
  try {
    let upcomingInstallments = state.installments
      .filter(i => i.status !== 'مدفوع')
      .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

    if (fromDate) upcomingInstallments = upcomingInstallments.filter(i => i.dueDate >= fromDate);
    if (toDate) upcomingInstallments = upcomingInstallments.filter(i => i.dueDate <= toDate);

    upcomingInstallments = upcomingInstallments.slice(0, 5);

    const headers = ['الوحدة', 'العميل', 'المبلغ', 'تاريخ الاستحقاق'];
    const rows = upcomingInstallments.map(i => {
      const contract = state.contracts.find(c => c.unitId === i.unitId);
      const customer = contract ? custById(contract.customerId) : null;
      return [
        getUnitDisplayName(unitById(i.unitId)),
        customer ? customer.name : '—',
        egp(i.amount),
        i.dueDate
      ];
    });

    document.getElementById('upcoming-installments-table').innerHTML = table(headers, rows);
  } catch(e) {
    console.error("Failed to render upcoming installments table:", e);
    document.getElementById('upcoming-installments-table').innerHTML = '<p style="color:var(--warn)">فشل تحميل جدول الأقساط.</p>';
  }

  // Render Recent Transactions Table
  try {
    let transactions = [];
    state.vouchers.forEach(v => {
        if ((!fromDate || v.date >= fromDate) && (!toDate || v.date <= toDate)) {
            transactions.push({
                date: v.date,
                type: v.type, // 'receipt' or 'payment'
                amount: v.amount,
                description: v.description
            });
        }
    });
    const recentTransactions = transactions.sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5);

    const headers = ['التاريخ', 'البيان', 'المبلغ'];
    const rows = recentTransactions.map(t => {
      const amountStyle = t.type === 'receipt' ? 'color:var(--ok)' : 'color:var(--warn)';
      const amountPrefix = t.type === 'receipt' ? '+' : '-';
      return [
        t.date,
        t.description,
        `<span style="${amountStyle}; font-weight:bold;">${amountPrefix} ${egp(t.amount)}</span>`
      ];
    });

    document.getElementById('recent-transactions-table').innerHTML = table(headers, rows);
  } catch(e) {
    console.error("Failed to render recent transactions table:", e);
    document.getElementById('recent-transactions-table').innerHTML = '<p style="color:var(--warn)">فشل تحميل جدول الحركات المالية.</p>';
  }
}

function printProjection() {
  const now=new Date(); const proj={};
  state.installments.filter(i=>i.status!=='مدفوع' && i.dueDate && new Date(i.dueDate)>=now).forEach(i=>{ const ym=i.dueDate.slice(0,7); proj[ym]=(proj[ym]||0)+Number(i.amount||0); });
  const rows=Object.keys(proj).sort().slice(0,12).map(k=>`<tr><td>${k}</td><td>${egp(proj[k])}</td></tr>`).join('');
  printHTML('تدفقات نقدية (12 شهر)', `<h1>تدفقات نقدية (12 شهر)</h1><table><thead><tr><th>الشهر</th><th>الإجمالي</th></tr></thead><tbody>${rows}</tbody></table>`);
}

export function renderOldDash(){
  const view = document.getElementById('view');
  const total=state.units.length, avail=state.units.filter(u=>u.status==='متاحة').length, sold=state.units.filter(u=>u.status==='مباعة').length, ret=state.units.filter(u=>u.status==='مرتجعة').length;
  const revenue=state.vouchers.filter(v=>v.type === 'receipt').reduce((s,p)=>s+Number(p.amount||0),0);
  const now=new Date(); const proj={};
  state.installments.filter(i=>i.status!=='مدفوع' && i.dueDate && new Date(i.dueDate)>=now).forEach(i=>{ const ym=i.dueDate.slice(0,7); proj[ym]=(proj[ym]||0)+Number(i.amount||0); });
  const projRows=Object.keys(proj).sort().slice(0,6).map(k=>[k, proj[k]]);

  view.innerHTML=`
    <div class="grid grid-3">
        <div class="card">
            <h3>نظرة عامة على الوحدات</h3>
            <div class="chart-container" style="position: relative; height:160px; width:100%">
              <canvas id="unitsChart"></canvas>
            </div>
        </div>
        <div class="card"><h3>إجمالي الوحدات</h3><div class="big">${total}</div></div>
        <div class="card"><h3>إجمالي المتحصلات</h3><div class="big">${egp(revenue)}</div></div>
    </div>
    <div class="card" style="margin-top:10px">
      <h3>التدفقات النقدية المتوقعة (6 أشهر)</h3>
       <div class="chart-container" style="position: relative; height:160px; width:100%">
          <canvas id="cashflowChart"></canvas>
      </div>
      <div class="tools"><button class="btn" id="print-projection-btn">طباعة PDF</button></div>
    </div>`;

  // Units Doughnut Chart
  new Chart(document.getElementById('unitsChart').getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: ['متاحة', 'مباعة', 'مرتجعة'],
      datasets: [{
        data: [avail, sold, ret],
        backgroundColor: ['#2563eb', '#16a34a', '#ef4444'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: {font: { family: 'system-ui' }} } }
    }
  });

  // Cashflow Bar Chart
  new Chart(document.getElementById('cashflowChart').getContext('2d'), {
    type: 'bar',
    data: {
      labels: projRows.map(r => r[0]),
      datasets: [{
        label: 'التدفق المتوقع',
        data: projRows.map(r => r[1]),
        backgroundColor: '#2563eb',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { callback: value => egp(value).replace('ج.م', '') } },
        x: { ticks: {font: { family: 'system-ui' }} }
      }
    }
  });

  document.getElementById('print-projection-btn').addEventListener('click', printProjection);
}

import { state, saveState } from '../state.js';
import { egp, today, parseNumber, exportCSV, uid } from '../helpers.js';
import { logAction } from '../state-utils.js';
import { table, showModal, printHTML } from '../ui.js';
import { persist } from '../data.js';
import { nav } from '../app.js';

function showAddExpenseModal() {
    const safeOptions = state.safes.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    const content = `
        <div class="grid grid-2" style="gap: 10px;">
            <input class="input" id="exp-desc" placeholder="بيان المصروف">
            <input class="input" id="exp-beneficiary" placeholder="المستفيد">
            <input class="input" id="exp-amount" type="number" placeholder="المبلغ">
            <input class="input" id="exp-date" type="date" value="${today()}">
        </div>
        <select class="select" id="exp-safe" style="margin-top: 10px;">
            <option value="">اختر الخزنة...</option>
            ${safeOptions}
        </select>
    `;

    showModal('إضافة سند صرف جديد', content, () => {
        const description = document.getElementById('exp-desc').value.trim();
        const beneficiary = document.getElementById('exp-beneficiary').value.trim();
        const amount = parseNumber(document.getElementById('exp-amount').value);
        const date = document.getElementById('exp-date').value;
        const safeId = document.getElementById('exp-safe').value;

        if (!description || !amount || !date || !safeId) {
            alert('الرجاء ملء جميع الحقول.');
            return false;
        }

        const safe = state.safes.find(s => s.id === safeId);
        if (safe.balance < amount) {
            alert(`رصيد الخزنة "${safe.name}" غير كافٍ.`);
            return false;
        }

        saveState();

        safe.balance -= amount;

        const newVoucher = {
            id: uid('V'),
            type: 'payment',
            date,
            amount,
            safeId,
            description,
            beneficiary,
            linked_ref: 'general_expense'
        };
        state.vouchers.push(newVoucher);
        logAction('إضافة سند صرف يدوي', newVoucher);

        persist();
        nav('vouchers');
        return true;
    });
}

export function renderVouchers() {
  const view = document.getElementById('view');
  let activeTab = 'all';
  const safeFilterId = state.currentParam?.safeId;
  const safeFilterName = safeFilterId ? (state.safes.find(s => s.id === safeFilterId) || {}).name : null;
  const title = safeFilterName ? `سجل حركات خزنة: ${safeFilterName}` : 'سجل السندات';

  let currentList = [];

  function draw() {
    const q = (document.getElementById('v-q')?.value || '').trim().toLowerCase();
    const from = document.getElementById('v-from')?.value;
    const to = document.getElementById('v-to')?.value;

    let list = state.vouchers.slice();

    if (safeFilterId) {
        list = list.filter(v => v.safeId === safeFilterId);
    }
    if (activeTab !== 'all') {
      list = list.filter(v => v.type === activeTab);
    }
    if (q) {
        list = list.filter(v =>
            (v.description || '').toLowerCase().includes(q) ||
            (v.payer || '').toLowerCase().includes(q) ||
            (v.beneficiary || '').toLowerCase().includes(q)
        );
    }
    if (from) list = list.filter(v => v.date >= from);
    if (to) list = list.filter(v => v.date <= to);

    list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    currentList = list;

    const safeName = (id) => (state.safes.find(s => s.id === id) || {}).name || '—';

    const rows = list.map(v => {
        const typeText = v.type === 'receipt' ? 'قبض' : 'صرف';
        const typeClass = v.type === 'receipt' ? 'ok' : 'warn';
        const party = v.type === 'receipt' ? `من: ${v.payer || 'غير محدد'}` : `إلى: ${v.beneficiary || 'غير محدد'}`;

        return [
            v.date,
            `<span class="badge ${typeClass}">${typeText}</span>`,
            `<span style="font-weight:bold; color:var(--${typeClass})">${egp(v.amount)}</span>`,
            v.description,
            safeName(v.safeId),
            party
        ];
    });

    const headers = ['التاريخ', 'النوع', 'المبلغ', 'البيان', 'الخزنة', 'الطرف الآخر'];
    document.getElementById('vouchers-list').innerHTML = table(headers, rows);
  }

  view.innerHTML = `
    <div class="card">
      <div class="header">
        <h3>${title}</h3>
        <div class="tools">
            ${safeFilterId ? `<button class="btn secondary" id="back-to-treasury-btn">⬅️ العودة للخزينة</button>` : `<button class="btn" id="add-expense-btn">إضافة سند صرف</button>`}
        </div>
      </div>
      <div class="tabs" style="margin: 12px 0;">
          <button class="tab-btn active" data-tab="all">الكل</button>
          <button class="tab-btn" data-tab="receipt">سندات قبض</button>
          <button class="tab-btn" data-tab="payment">سندات صرف</button>
      </div>
      <div class="tools" style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
        <input class="input" id="v-q" placeholder="بحث بالبيان أو الطرف الآخر..." style="flex: 1;">
        <input type="date" class="input" id="v-from">
        <input type="date" class="input" id="v-to">
        <button class="btn" id="v-apply-filter">فلترة</button>
        <button class="btn secondary" id="exp-vouchers-btn">تصدير CSV</button>
        <button class="btn secondary" id="print-vouchers-btn">طباعة</button>
      </div>
      <div id="vouchers-list" style="margin-top: 12px;"></div>
    </div>
  `;

  if(safeFilterId) {
    document.getElementById('back-to-treasury-btn').addEventListener('click', () => nav('treasury'));
  } else {
    document.getElementById('add-expense-btn').addEventListener('click', showAddExpenseModal);
  }

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTab = btn.dataset.tab;
        draw();
    };
  });

  document.getElementById('v-apply-filter').onclick = draw;
  document.getElementById('exp-vouchers-btn').addEventListener('click', () => {
      const headers = ['التاريخ', 'النوع', 'المبلغ', 'البيان', 'الخزنة', 'الدافع', 'المستفيد'];
      const rows = currentList.map(v => [
          v.date,
          v.type === 'receipt' ? 'قبض' : 'صرف',
          v.amount,
          v.description,
          (state.safes.find(s => s.id === v.safeId) || {}).name || '—',
          v.payer || '',
          v.beneficiary || ''
      ]);
      exportCSV(headers, rows, 'vouchers.csv');
  });

  document.getElementById('print-vouchers-btn').addEventListener('click', () => {
      const headers = ['التاريخ', 'النوع', 'المبلغ', 'البيان', 'الخزنة', 'الطرف الآخر'];
      const rows = currentList.map(v => {
          const typeText = v.type === 'receipt' ? 'قبض' : 'صرف';
          const party = v.type === 'receipt' ? `من: ${v.payer || 'غير محدد'}` : `إلى: ${v.beneficiary || 'غير محدد'}`;
          return `<tr><td>${v.date}</td><td>${typeText}</td><td>${egp(v.amount)}</td><td>${v.description}</td><td>${(state.safes.find(s=>s.id===v.safeId)||{}).name||'—'}</td><td>${party}</td></tr>`;
      }).join('');
      printHTML('تقرير السندات', `<h1>تقرير السندات</h1><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`);
  });

  draw();
}

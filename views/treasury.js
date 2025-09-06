import { state, saveState } from '../state.js';
import { egp, parseNumber, today, uid, exportCSV } from '../helpers.js';
import { logAction } from '../state-utils.js';
import { table, showModal } from '../ui.js';
import { persist } from '../data.js';
import { nav } from '../app.js';

function addSafe() {
    const name = document.getElementById('s-name').value.trim();
    const balance = parseNumber(document.getElementById('s-balance').value);
    if (!name) return alert('الرجاء إدخال اسم الخزنة.');

    if (state.safes.some(s => s.name.toLowerCase() === name.toLowerCase())) {
        return alert('خزنة بنفس الاسم موجودة بالفعل.');
    }

    saveState();
    const newSafe = { id: uid('S'), name, balance };
    logAction('إضافة خزنة جديدة', { safeId: newSafe.id, name, initialBalance: balance });
    state.safes.push(newSafe);
    persist();
    nav('treasury');
}

function showAddSafeModal() {
    const content = `
        <input class="input" id="s-name" placeholder="اسم الخزنة (مثلاً: الخزنة الرئيسية، حساب البنك)">
        <input class="input" id="s-balance" placeholder="الرصيد الافتتاحي" type="text" value="0">
    `;
    showModal('إضافة خزنة جديدة', content, () => {
        addSafe();
        return true;
    });
}

function showAddTransferModal() {
    const safeOptions = state.safes.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
    const content = `
      <div class="grid grid-2" style="gap:10px;">
        <select class="select" id="t-from"><option value="">من خزنة...</option>${safeOptions}</select>
        <select class="select" id="t-to"><option value="">إلى خزنة...</option>${safeOptions}</select>
      </div>
      <input class="input" id="t-amount" type="number" placeholder="المبلغ" style="margin-top:10px;">
      <input class="input" id="t-date" type="date" value="${today()}" style="margin-top:10px;">
      <textarea class="input" id="t-notes" placeholder="ملاحظات" style="margin-top:10px;" rows="2"></textarea>
    `;
    showModal('تسجيل تحويل بين الخزن', content, () => {
        const fromSafeId = document.getElementById('t-from').value;
        const toSafeId = document.getElementById('t-to').value;
        const amount = parseNumber(document.getElementById('t-amount').value);
        const date = document.getElementById('t-date').value;
        const notes = document.getElementById('t-notes').value.trim();

        if (!fromSafeId || !toSafeId || !amount) { alert('الرجاء ملء جميع الحقول.'); return false; }
        if (fromSafeId === toSafeId) { alert('لا يمكن التحويل إلى نفس الخزنة.'); return false; }

        const fromSafe = state.safes.find(s => s.id === fromSafeId);
        const toSafe = state.safes.find(s => s.id === toSafeId);
        if (fromSafe.balance < amount) { alert(`رصيد الخزنة "${fromSafe.name}" غير كافٍ.`); return false; }

        saveState();
        fromSafe.balance -= amount;
        toSafe.balance += amount;

        const newTransfer = { id: uid('T'), fromSafeId, toSafeId, amount, date, notes };
        state.transfers.push(newTransfer);
        logAction('تنفيذ تحويل بين الخزن', newTransfer);

        persist();
        nav('treasury');
        return true;
    });
}

export function renderTreasury() {
    const view = document.getElementById('view');
    let safesList = [];

    function draw() {
        const q = (document.getElementById('t-q')?.value || '').trim().toLowerCase();
        safesList = state.safes.slice();
        if (q) {
            safesList = safesList.filter(s => s.name.toLowerCase().includes(q));
        }

        const rows = safesList.map(s => [
            `<a href="#" data-nav-safe="${s.id}">${s.name || ''}</a>`,
            `<span>${egp(s.balance || 0)}</span>`,
        ]);
        document.getElementById('safes-list').innerHTML = table(['اسم الخزنة', 'الرصيد الحالي'], rows);
        document.querySelectorAll('[data-nav-safe]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); nav('vouchers', { safeId: e.target.dataset.navSafe })}));
    }

    view.innerHTML = `
        <div class="card">
            <div class="header">
                <h3>إدارة الخزينة</h3>
                <div class="tools">
                    <button class="btn" id="add-safe-btn">إضافة خزنة جديدة</button>
                    <button class="btn secondary" id="add-transfer-btn">تسجيل تحويل</button>
                </div>
            </div>
            <div class="tools" style="margin-top:12px;">
                <input class="input" id="t-q" placeholder="بحث باسم الخزنة..." oninput="draw()">
                <button class="btn secondary" id="exp-treasury-btn">تصدير CSV</button>
            </div>
            <div id="safes-list" style="margin-top: 16px;"></div>
        </div>
    `;

    document.getElementById('add-safe-btn').addEventListener('click', showAddSafeModal);
    document.getElementById('add-transfer-btn').addEventListener('click', showAddTransferModal);
    document.getElementById('exp-treasury-btn').addEventListener('click', () => {
        exportCSV(['اسم الخزنة', 'الرصيد'], safesList.map(s => [s.name, s.balance]), 'safes.csv');
    });

    draw();
}

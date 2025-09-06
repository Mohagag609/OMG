import { state, saveState } from '../state.js';
import { uid, exportCSV, egp, parseNumber, today } from '../helpers.js';
import { partnerById, unitCode, logAction, getUnitDisplayName } from '../state-utils.js';
import { table } from '../ui.js';
import { persist } from '../data.js';
import { nav } from '../app.js';

function generatePartnerLedger(partnerId) {
    const transactions = [];
    let totalIncome = 0;
    let totalExpense = 0;

    state.vouchers.forEach(v => {
        let contract;
        const directContract = state.contracts.find(c => c.id === v.linked_ref);
        if (directContract) {
            contract = directContract;
        } else {
            const installment = state.installments.find(i => i.id === v.linked_ref);
            if (installment) {
                contract = state.contracts.find(c => c.unitId === installment.unitId);
            } else {
                const brokerDue = state.brokerDues.find(d => d.id === v.linked_ref);
                if (brokerDue) {
                    contract = state.contracts.find(c => c.id === brokerDue.contractId);
                }
            }
        }

        if (!contract) return;

        const unitPartners = state.unitPartners.filter(up => up.unitId === contract.unitId);
        if (unitPartners.length === 0) return;

        const partnerLink = unitPartners.find(up => up.partnerId === partnerId);
        if (partnerLink) {
            const share = partnerLink.percent / 100;
            if (v.type === 'receipt') {
                const income = v.amount * share;
                transactions.push({ date: v.date, description: v.description, income: income, expense: 0 });
                totalIncome += income;
            } else if (v.description.includes('عمولة سمسار')) {
                const expense = v.amount * share;
                transactions.push({ date: v.date, description: v.description, income: 0, expense: expense });
                totalExpense += expense;
            }
        }
    });

    state.partnerDebts.forEach(d => {
        if (d.status !== 'مدفوع') return;
        if (d.owedPartnerId === partnerId) {
            transactions.push({ date: d.paymentDate, description: `تحصيل دين من ${partnerById(d.payingPartnerId)?.name || 'شريك'}`, income: d.amount, expense: 0 });
            totalIncome += d.amount;
        }
        if (d.payingPartnerId === partnerId) {
            transactions.push({ date: d.paymentDate, description: `سداد دين إلى ${partnerById(d.owedPartnerId)?.name || 'شريك'}`, income: 0, expense: d.amount });
            totalExpense += d.amount;
        }
    });

    transactions.sort((a,b) => (a.date||'').localeCompare(b.date||''));

    return {
        transactions,
        totalIncome,
        totalExpense,
        netPosition: totalIncome - totalExpense
    };
}

export function renderPartnerDetails(partnerId) {
    const view = document.getElementById('view');
    const partner = partnerById(partnerId);
    if (!partner) {
        view.innerHTML = `<div class="card"><p>لم يتم العثور على الشريك.</p></div>`;
        return;
    }

    const ledger = generatePartnerLedger(partnerId);
    const ownedUnits = state.unitPartners.filter(up => up.partnerId === partnerId);

    const kpiHTML = `
        <div class="card"><h4>إجمالي الدخل</h4><div class="big" style="color:var(--ok);">${egp(ledger.totalIncome)}</div></div>
        <div class="card"><h4>إجمالي المصروفات</h4><div class="big" style="color:var(--warn);">${egp(ledger.totalExpense)}</div></div>
        <div class="card"><h4>صافي الموقف</h4><div class="big" style="color:var(--brand);">${egp(ledger.netPosition)}</div></div>
    `;

    const unitsRows = ownedUnits.map(up => [
        getUnitDisplayName(unitById(up.unitId)),
        `${up.percent} %`
    ]);

    let balance = 0;
    const ledgerRows = ledger.transactions.map(tx => {
        balance += (tx.income || 0) - (tx.expense || 0);
        return [
            tx.date,
            tx.description,
            tx.income ? `<span style="color:var(--ok)">${egp(tx.income)}</span>` : '—',
            tx.expense ? `<span style="color:var(--warn)">${egp(tx.expense)}</span>` : '—',
            `<strong style="color:var(--brand)">${egp(balance)}</strong>`
        ];
    });

    view.innerHTML = `
        <div class="card">
            <div class="header">
                <h3>تفاصيل الشريك: ${partner.name}</h3>
                <button class="btn secondary" id="back-to-partners-btn">⬅️ العودة للشركاء</button>
            </div>
            <p style="color:var(--muted);">${partner.phone||''}</p>
        </div>

        <div class="grid grid-3" style="margin-top:16px;">
            ${kpiHTML}
        </div>

        <div class="grid grid-2" style="margin-top:16px; align-items: flex-start;">
            <div class="card">
                <h4>الوحدات المملوكة</h4>
                ${table(['الوحدة', 'نسبة الملكية'], unitsRows)}
            </div>
            <div class="card">
                <h4>كشف الحساب التفصيلي</h4>
                <div style="max-height: 400px; overflow-y: auto;">
                    ${table(['التاريخ', 'البيان', 'دخل', 'صرف', 'الرصيد'], ledgerRows)}
                </div>
            </div>
        </div>
    `;
    document.getElementById('back-to-partners-btn').addEventListener('click', () => nav('partners'));
}

export function renderPartners(){
  const view = document.getElementById('view');
  let activeTab = 'partners';
  let partnersList = [];
  let debtsList = [];

  function draw() {
    if (activeTab === 'partners') drawPartnersTab();
    else if (activeTab === 'groups') drawGroupsTab();
    else drawDebtsTab();
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === activeTab);
    });
  }

  function drawPartnersTab() {
    const q = (document.getElementById('pr-q')?.value || '').trim().toLowerCase();
    partnersList = state.partners.slice();
    if (q) {
        partnersList = partnersList.filter(p => (p.name.toLowerCase().includes(q) || (p.phone||'').includes(q)));
    }

    document.getElementById('partners-content').innerHTML = `
      <div class="grid grid-2">
        <div>
          <h3>إضافة شريك</h3>
          <input class="input" id="pr-name" placeholder="اسم الشريك">
          <input class="input" id="pr-phone" placeholder="الهاتف" style="margin-top:8px;">
          <button class="btn" id="add-partner-btn" style="margin-top:8px;">حفظ</button>
        </div>
        <div>
          <h3>قائمة الشركاء</h3>
          <div class="tools">
             <input class="input" id="pr-q" placeholder="بحث بالاسم أو الهاتف..." oninput="drawPartnersTab()" value="${q || ''}">
             <button class="btn secondary" id="exp-partners-btn">تصدير CSV</button>
          </div>
          <div id="pr-list"></div>
        </div>
      </div>
    `;
    const prRows = partnersList.map(p => [
        `<a href="#" data-nav-details="${p.id}">${p.name}</a>`,
        p.phone,
        `<button class="btn secondary" data-del-partner="${p.id}">حذف</button>`
    ]);
    document.getElementById('pr-list').innerHTML = table(['الاسم', 'الهاتف', ''], prRows);
    document.getElementById('add-partner-btn').addEventListener('click', () => addPartner(draw));
    document.getElementById('exp-partners-btn').addEventListener('click', () => expPartners(partnersList));
    document.querySelectorAll('[data-nav-details]').forEach(a => a.addEventListener('click', e => {e.preventDefault(); nav('partner-details', e.target.dataset.navDetails)}));
    document.querySelectorAll('[data-del-partner]').forEach(b => b.addEventListener('click', e => delRow('partners', e.target.dataset.delPartner)));
  }

  function drawGroupsTab() {
      const rows = state.partnerGroups.map(g => {
        const totalPercent = g.partners.reduce((sum, p) => sum + p.percent, 0);
        const partners = g.partners.map(p => {
          const partner = partnerById(p.partnerId);
          return `${partner ? partner.name : 'محذوف'} (${p.percent}%)`;
        }).join(', ');
        return [
          `<a href="#" data-nav-group="${g.id}">${g.name}</a>`,
          partners,
          `<span class="badge ${totalPercent === 100 ? 'ok' : 'warn'}">${totalPercent}%</span>`,
          `<button class="btn secondary" data-del-group="${g.id}">حذف</button>`
        ];
      });

      document.getElementById('partners-content').innerHTML = `
        <div class="grid grid-2">
          <div class="card">
            <h3>إضافة مجموعة شركاء</h3>
            <input class="input" id="pg-name" placeholder="اسم المجموعة (مثال: مستثمرو المرحلة الأولى)">
            <button class="btn" style="margin-top:10px;" id="add-group-btn">إضافة وبدء الإدارة</button>
          </div>
          <div class="card">
            <h3>قائمة المجموعات</h3>
            <div id="pg-list">
              ${table(['اسم المجموعة', 'الشركاء', 'إجمالي النسبة', ''], rows)}
            </div>
          </div>
        </div>
      `;
      document.getElementById('add-group-btn').addEventListener('click', addGroup);
      document.querySelectorAll('[data-nav-group]').forEach(a => a.addEventListener('click', e => {e.preventDefault(); nav('partner-group-details', e.target.dataset.navGroup)}));
      document.querySelectorAll('[data-del-group]').forEach(b => b.addEventListener('click', e => delRow('partnerGroups', e.target.dataset.delGroup)));
  }

  function drawDebtsTab() {
    const q = (document.getElementById('pd-q')?.value || '').trim().toLowerCase();
    debtsList = state.partnerDebts.slice();
    if(q) {
      debtsList = debtsList.filter(d => {
        const paying = partnerById(d.payingPartnerId)?.name || '';
        const owed = partnerById(d.owedPartnerId)?.name || '';
        const unit = unitCode(d.unitId) || '';
        const searchable = `${paying} ${owed} ${unit} ${d.status}`.toLowerCase();
        return searchable.includes(q);
      });
    }

    document.getElementById('partners-content').innerHTML = `
        <h3>ديون الشركاء</h3>
        <div class="tools">
            <input class="input" id="pd-q" placeholder="بحث..." oninput="drawDebtsTab()" value="${q || ''}">
            <button class="btn secondary" id="exp-debts-btn">تصدير CSV</button>
        </div>
        <div id="pd-list"></div>
    `;
    let sort = { idx: 3, dir: 'asc' };
    debtsList.sort((a,b) => (a.dueDate||'').localeCompare(b.dueDate||''));
    const rows = debtsList.map(d => {
      const paying = partnerById(d.payingPartnerId)?.name || 'محذوف';
      const owed = partnerById(d.owedPartnerId)?.name || 'محذوف';
      const unit = unitCode(d.unitId);
      const payButton = d.status !== 'مدفوع' ? `<button class="btn ok" data-pay-debt="${d.id}">تسجيل السداد</button>` : 'تم السداد';
      return [paying, owed, unit, d.dueDate, egp(d.amount), d.status, payButton];
    });
    const headers = ['الشريك الدافع', 'الشريك المستحق', 'الوحدة', 'تاريخ الاستحقاق', 'المبلغ', 'الحالة', ''];
    document.getElementById('pd-list').innerHTML = table(headers, rows, sort, (ns) => { sort = ns; drawDebtsTab(); });
    document.getElementById('exp-debts-btn').addEventListener('click', () => expPartnerDebts(debtsList));
    document.querySelectorAll('[data-pay-debt]').forEach(b => b.addEventListener('click', e => payPartnerDebt(e.target.dataset.payDebt)));
  }

  view.innerHTML = `
    <div class="card">
      <div class="tabs">
        <button class="tab-btn active" data-tab="partners">الشركاء</button>
        <button class="tab-btn" data-tab="groups">مجموعات الشركاء</button>
        <button class="tab-btn" data-tab="debts">ديون الشركاء</button>
      </div>
      <div id="partners-content" style="padding-top: 16px;"></div>
    </div>
  `;

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => {
        activeTab = btn.dataset.tab;
        draw();
    };
  });

  draw();
}

function addPartner(draw){
    const name=document.getElementById('pr-name').value.trim(); if(!name) return;
    const phone = document.getElementById('pr-phone').value;
    if (state.partners.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        return alert('شريك بنفس الاسم موجود بالفعل. الرجاء استخدام اسم مختلف.');
    }
    saveState();
    const newPartner = {id:uid('PR'),name,phone};
    logAction('إضافة شريك جديد', { partnerId: newPartner.id, name });
    state.partners.push(newPartner);
    persist();
    draw();
}

function addGroup() {
    const name = document.getElementById('pg-name').value.trim();
    if (!name) return alert('الرجاء إدخال اسم للمجموعة.');
    if (state.partnerGroups.some(g => g.name.toLowerCase() === name.toLowerCase())) {
      return alert('مجموعة بنفس الاسم موجودة بالفعل.');
    }
    saveState();
    const newGroup = { id: uid('PG'), name, partners: [] };
    state.partnerGroups.push(newGroup);
    logAction('إنشاء مجموعة شركاء جديدة', { groupId: newGroup.id, name });
    persist();
    nav('partner-group-details', newGroup.id);
}

function payPartnerDebt(debtId) {
    const debt = state.partnerDebts.find(d => d.id === debtId);
    if(!debt) return alert('لم يتم العثور على الدين.');
    if(confirm(`هل تؤكد سداد هذا الدين بمبلغ ${egp(debt.amount)}؟`)){
        saveState();
        debt.status = 'مدفوع';
        debt.paymentDate = today();
        persist();
        // re-render the current view
        nav('partners');
    }
}

function expPartners(partnersList) {
    exportCSV(['الاسم', 'الهاتف'], partnersList.map(p => [p.name, p.phone]), 'partners.csv');
}

function expPartnerDebts(debtsList) {
    const headers = ['الدافع', 'المستحق', 'الوحدة', 'تاريخ الاستحقاق', 'المبلغ', 'الحالة'];
    const rows = debtsList.map(d => [
        partnerById(d.payingPartnerId)?.name || 'محذوف',
        partnerById(d.owedPartnerId)?.name || 'محذوف',
        unitCode(d.unitId),
        d.dueDate,
        d.amount,
        d.status
    ]);
    exportCSV(headers, rows, 'partner_debts.csv');
}

export function renderPartnerGroupDetails(groupId) {
  const view = document.getElementById('view');
  const group = state.partnerGroups.find(g => g.id === groupId);
  if (!group) return nav('partners');

  function draw() {
    const totalPercent = group.partners.reduce((sum, p) => sum + p.percent, 0);
    const rows = group.partners.map(p => {
        const partner = partnerById(p.partnerId);
        return [
            partner ? partner.name : 'شريك محذوف',
            `${p.percent}%`,
            `<button class="btn secondary" data-del-partner-from-group="${p.partnerId}">حذف</button>`
        ];
    });
    document.getElementById('pgd-list').innerHTML = table(['الشريك', 'النسبة', ''], rows);
    const sumEl = document.getElementById('pgd-sum');
    sumEl.textContent = `الإجمالي: ${totalPercent}%`;
    sumEl.className = `badge ${totalPercent === 100 ? 'ok' : 'warn'}`;

    document.querySelectorAll('[data-del-partner-from-group]').forEach(b => b.addEventListener('click', e => removePartnerFromGroup(e.target.dataset.delPartnerFromGroup)));
  }

  function removePartnerFromGroup(partnerId) {
    saveState();
    group.partners = group.partners.filter(p => p.partnerId !== partnerId);
    logAction('حذف شريك من مجموعة', { groupId, partnerId });
    persist();
    draw();
  }

  function addPartnerToGroup() {
    const partnerId = document.getElementById('pgd-partner-select').value;
    const percent = parseNumber(document.getElementById('pgd-percent').value);

    if (!partnerId || !percent) return alert('الرجاء اختيار شريك وإدخال نسبة.');
    if (group.partners.some(p => p.partnerId === partnerId)) return alert('هذا الشريك موجود بالفعل في المجموعة.');

    const currentTotal = group.partners.reduce((sum, p) => sum + p.percent, 0);
    if (currentTotal + percent > 100) {
      return alert(`لا يمكن إضافة هذه النسبة. الإجمالي الحالي هو ${currentTotal}%. إضافة ${percent}% سيجعل المجموع يتجاوز 100%.`);
    }

    saveState();
    group.partners.push({ partnerId, percent });
    logAction('إضافة شريك إلى مجموعة', { groupId, partnerId, percent });
    persist();
    draw();
  }

  view.innerHTML = `
    <div class="card">
      <div class="header">
        <h3>إدارة مجموعة: <span contenteditable="true" onblur="inlineUpd('partnerGroups', '${group.id}', 'name', this.textContent)">${group.name}</span></h3>
        <button class="btn secondary" id="back-to-partners-btn">⬅️ العودة للشركاء</button>
      </div>

      <div class="grid grid-2" style="margin-top:16px; align-items: flex-start;">
        <div class="card">
          <h4>إضافة شريك للمجموعة</h4>
          <div class="tools">
            <select class="select" id="pgd-partner-select" style="flex:1"><option value="">اختر شريك...</option>${state.partners.map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}</select>
            <input class="input" id="pgd-percent" type="number" placeholder="النسبة %" style="flex:0.5">
            <button class="btn" id="add-partner-to-group-btn">إضافة</button>
          </div>
        </div>
        <div class="card">
          <h4>الشركاء في المجموعة (<span id="pgd-sum"></span>)</h4>
          <div id="pgd-list"></div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('back-to-partners-btn').addEventListener('click', () => nav('partners'));
  document.getElementById('add-partner-to-group-btn').addEventListener('click', addPartnerToGroup);
  draw();
}

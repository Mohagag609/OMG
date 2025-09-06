import { state, saveState } from '../state.js';
import { egp, exportCSV, parseNumber, today } from '../helpers.js';
import { getUnitDisplayName, unitById, custById, logAction } from '../state-utils.js';
import { table, showModal } from '../ui.js';
import { persist } from '../data.js';
import { nav } from '../app.js';

function delRow(coll,id) {
  const nameMap = {
    customers: 'العميل',
    units: 'الوحدة',
    partners: 'الشريك',
    unitPartners: 'ربط شريك بوحدة',
    contracts: 'العقد',
    installments: 'القسط',
    safes: 'الخزنة'
  };
  const collName = nameMap[coll] || coll;
  const itemToDelete = state[coll] ? state[coll].find(x=>x.id===id) : undefined;
  const itemName = itemToDelete?.name || itemToDelete?.code || id;

  if(confirm(`هل أنت متأكد من حذف ${collName} "${itemName}"؟ هذا الإجراء لا يمكن التراجع عنه.`)){
    saveState();
    logAction(`حذف ${collName}`, { collection: coll, id, deletedItem: JSON.stringify(itemToDelete) });
    state[coll]=state[coll].filter(x=>x.id!==id);
    persist();
    if (coll === 'unitPartners') {
      nav('unit-details', itemToDelete.unitId);
    } else {
      nav(coll);
    }
  }
}

function processPayment(unitId, amount, method, date, safeId, installmentId = null) {
    if (!unitId || !amount || !date || !safeId) {
        alert('بيانات الدفع غير مكتملة.');
        return false;
    }

    const safe = state.safes.find(s => s.id === safeId);
    if (!safe) {
        alert('لم يتم العثور على الخزنة المحددة.');
        return false;
    }

    let remainingAmountToProcess = amount;

    const customer = custById(state.contracts.find(c => c.unitId === unitId)?.customerId);
    const voucher = {
        id: uid('V'),
        type: 'receipt',
        date: date,
        amount: amount,
        safeId: safeId,
        description: `سداد دفعة للوحدة ${getUnitDisplayName(unitById(unitId))}`,
        payer: customer ? customer.name : 'غير محدد',
        linked_ref: installmentId || unitId
    };
    state.vouchers.push(voucher);
    logAction('تسجيل سند قبض', { voucherId: voucher.id, unitId, amount, safeId });

    safe.balance = (safe.balance || 0) + amount;

    const installmentsToPay = state.installments
        .filter(i => i.unitId === unitId && i.status !== 'مدفوع')
        .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

    if (installmentsToPay.length === 0 && installmentId) {
        console.warn(`Payment made for installment ${installmentId}, but no payable installments found for unit ${unitId}.`);
        return true;
    }

    for (const inst of installmentsToPay) {
        if (remainingAmountToProcess <= 0) break;

        const amountToPayOnThisInstallment = Math.min(remainingAmountToProcess, inst.amount);

        if (typeof inst.originalAmount !== 'number') {
            inst.originalAmount = inst.amount;
        }

        inst.amount -= amountToPayOnThisInstallment;
        remainingAmountToProcess -= amountToPayOnThisInstallment;

        if (inst.amount <= 0.005) {
            inst.amount = 0;
            inst.status = 'مدفوع';
            inst.paymentDate = date;
        } else {
            inst.status = 'مدفوع جزئياً';
        }
        logAction('تطبيق دفعة على قسط', { installmentId: inst.id, paidAmount: amountToPayOnThisInstallment, remainingAmount: inst.amount });
    }

    if (remainingAmountToProcess > 0.005) {
        console.log(`Overpayment of ${egp(remainingAmountToProcess)} for unit ${unitId}.`);
    }

    return true;
}

function rescheduleInstallment(id, drawTable) {
  const i = state.installments.find(x=>x.id===id); if(!i) return;
  const oldDetails = { amount: i.amount, dueDate: i.dueDate };

  const newAmtStr = prompt('قيمة القسط الجديدة', i.amount);
  if (newAmtStr === null) return;
  const newAmt = parseNumber(newAmtStr);

  const newDate = prompt('تاريخ الاستحقاق الجديد (YYYY-MM-DD)', i.dueDate || '');
  if (newDate === null) return;

  if (newAmt === oldDetails.amount && newDate === oldDetails.dueDate) return;

  saveState();
  const unitId = i.unitId;
  const remainList = state.installments
    .filter(x=>x.unitId===unitId && x.status!=='مدفوع')
    .sort((a,b)=>(a.dueDate||'').localeCompare(b.dueDate||''));

  const idx = remainList.findIndex(x=>x.id===id);
  const diff = Math.round((i.amount - newAmt) * 100) / 100;

  if (typeof i.originalAmount !== 'number') i.originalAmount = i.amount;
  i.amount = newAmt;
  i.dueDate = newDate;

  const others = remainList.slice(idx+1);
  if (others.length > 0 && diff !== 0) {
      const share = Math.round((diff / others.length) * 100) / 100;
      others.forEach(x=>{
        if (typeof x.originalAmount !== 'number') x.originalAmount = x.amount;
        x.amount = Math.round((x.amount + share) * 100) / 100;
      });
      logAction('إعادة جدولة قسط وتوزيع الفرق', { installmentId: id, oldDetails, newAmount: newAmt, newDueDate: newDate, distributedDiff: diff });
      alert('تمت إعادة الجدولة وتوزيع الفرق على الأقساط التالية.');
  } else {
       logAction('إعادة جدولة قسط', { installmentId: id, oldDetails, newAmount: newAmt, newDueDate: newDate });
       alert('تمت إعادة جدولة القسط.');
  }

  persist();
  drawTable();
}

function payInstallment(id, drawTable) {
  const i = state.installments.find(x=>x.id===id);
  if(!i || i.status==='مدفوع' || i.amount<=0) return alert('هذا القسط غير صالح للدفع.');

  const safeOptions = state.safes.map(s => `<option value="${s.id}">${s.name} (${egp(s.balance)})</option>`).join('');
  const content = `
      <p>المبلغ المتبقي على القسط: <strong>${egp(i.amount)}</strong></p>
      <input class="input" id="inst-pay-amount" type="number" placeholder="المبلغ المدفوع" value="${i.amount}">
      <select class="select" id="inst-pay-safe" style="margin-top: 10px;">
          <option value="">اختر الخزنة...</option>
          ${safeOptions}
      </select>
  `;
  showModal('تسجيل دفعة قسط', content, () => {
      const paid = parseNumber(document.getElementById('inst-pay-amount').value);
      const safeId = document.getElementById('inst-pay-safe').value;
      if(!(paid > 0) || !safeId) {
          alert('الرجاء إدخال مبلغ صحيح واختيار خزنة.');
          return false;
      }
      saveState();
      if (processPayment(i.unitId, paid, 'قسط', today(), safeId, i.id)) {
        persist();
        drawTable();
      } else {
        undo();
      }
      return true;
  });
}

export function renderInstallments() {
    const view = document.getElementById('view');
    let expandedGroups = {};
    let currentList = [];

    function drawTable() {
        const q = (document.getElementById('i-q')?.value || '').trim().toLowerCase();
        const from = document.getElementById('i-from')?.value;
        const to = document.getElementById('i-to')?.value;

        let list = state.installments.slice();
        if (from) list = list.filter(i => i.dueDate >= from);
        if (to) list = list.filter(i => i.dueDate <= to);

        const grouped = list.reduce((acc, i) => {
            if (!acc[i.unitId]) {
                const contract = state.contracts.find(c => c.unitId === i.unitId);
                const customer = contract ? custById(contract.customerId) : null;
                acc[i.unitId] = {
                    unit: unitById(i.unitId),
                    customer: customer,
                    installments: [],
                    totalRemaining: 0,
                    overdueCount: 0,
                };
            }
            acc[i.unitId].installments.push(i);
            acc[i.unitId].totalRemaining += i.amount;
            if (i.status !== 'مدفوع' && i.dueDate && new Date(i.dueDate) < new Date()) {
              acc[i.unitId].overdueCount++;
            }
            return acc;
        }, {});

        let filteredGroups = Object.values(grouped);

        if (q) {
            filteredGroups = filteredGroups.filter(g => {
                const unitName = getUnitDisplayName(g.unit).toLowerCase();
                const customerName = (g.customer?.name || '').toLowerCase();
                return unitName.includes(q) || customerName.includes(q);
            });
        }

        currentList = filteredGroups.flatMap(g => g.installments);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tableRows = filteredGroups.map(g => {
            const isExpanded = expandedGroups[g.unit.id];
            const summaryRow = `
                <tr class="group-summary ${g.overdueCount > 0 ? 'overdue' : ''}" data-toggle-group="${g.unit.id}">
                    <td><span class="expand-icon">${isExpanded ? '−' : '+'}</span> ${g.unit.code || getUnitDisplayName(g.unit)}</td>
                    <td>${g.customer?.name || '—'}</td>
                    <td colspan="3" style="text-align:center;">ملخص الوحدة</td>
                    <td><strong>${egp(g.totalRemaining)}</strong></td>
                    <td><span class="badge ${g.overdueCount > 0 ? 'warn' : 'ok'}">${g.installments.length} أقساط</span></td>
                </tr>
            `;

            if (!isExpanded) return summaryRow;

            const detailRows = g.installments.map(i => {
                const isPaid = i.status === 'مدفوع';
                const originalAmount = i.originalAmount ?? i.amount;
                const paidAmount = originalAmount - i.amount;
                return `
                    <tr class="installment-detail ${isPaid ? 'paid' : ''}">
                        <td></td>
                        <td>${i.type || ''}</td>
                        <td>${egp(originalAmount)}</td>
                        <td>${egp(paidAmount)}</td>
                        <td><strong>${egp(i.amount)}</strong></td>
                        <td>${i.dueDate || ''}</td>
                        <td>
                            <button class="btn ok" data-pay-inst="${i.id}" ${isPaid ? 'disabled' : ''}>دفع</button>
                            <button class="btn" data-resched-inst="${i.id}" ${isPaid ? 'disabled' : ''}>إعادة جدولة</button>
                            <button class="btn secondary" data-del-inst="${i.id}" ${isPaid ? 'disabled' : ''}>حذف</button>
                        </td>
                    </tr>
                `;
            }).join('');

            return summaryRow + detailRows;

        }).join('');

        const headers = ['الوحدة', 'العميل', 'النوع', 'المبلغ الأصلي', 'المسدد', 'المتبقي', 'إجراءات'];
        document.getElementById('i-list').innerHTML = table(headers, []);
        document.querySelector('#i-list tbody').innerHTML = tableRows || `<tr><td colspan="${headers.length}"><small>لا توجد بيانات</small></td></tr>`;

        document.querySelectorAll('[data-toggle-group]').forEach(row => {
            row.addEventListener('click', (e) => {
                const unitId = e.currentTarget.dataset.toggleGroup;
                expandedGroups[unitId] = !expandedGroups[unitId];
                drawTable();
            });
        });

        document.querySelectorAll('[data-pay-inst]').forEach(b => b.addEventListener('click', e => payInstallment(e.target.dataset.payInst, drawTable)));
        document.querySelectorAll('[data-resched-inst]').forEach(b => b.addEventListener('click', e => rescheduleInstallment(e.target.dataset.reschedInst, drawTable)));
        document.querySelectorAll('[data-del-inst]').forEach(b => b.addEventListener('click', e => delRow('installments', e.target.dataset.delInst)));
    }

    view.innerHTML = `
    <div class="card">
      <h3>الأقساط</h3>
      <div class="tools">
        <input class="input" id="i-q" placeholder="بحث بالوحدة/العميل/الحالة..." style="flex:1">
        <input type="date" class="input" id="i-from">
        <input type="date" class="input" id="i-to">
        <button class="btn" id="filter-installments-btn">فلترة</button>
        <button class="btn secondary" id="i-reset-filter">إعادة تعيين</button>
        <button class="btn secondary" id="exp-installments-btn">CSV</button>
        <button class="btn" id="print-installments-btn">طباعة PDF</button>
      </div>
      <div id="i-list" style="margin-top:12px;"></div>
    </div>
    `;

    document.getElementById('filter-installments-btn').addEventListener('click', drawTable);
    document.getElementById('i-reset-filter').onclick = () => {
        document.getElementById('i-q').value = '';
        document.getElementById('i-from').value = '';
        document.getElementById('i-to').value = '';
        drawTable();
    };

    document.getElementById('exp-installments-btn').addEventListener('click', () => {
        const headers=['الوحدة','العميل','النوع','المبلغ الأصلي','المسدد','المتبقي','الاستحقاق','تاريخ السداد','الحالة'];
        const rows=currentList.map(i=> {
            const originalAmount = i.originalAmount ?? i.amount;
            const paidAmount = originalAmount - i.amount;
            const contract = state.contracts.find(c => c.unitId === i.unitId);
            const customer = contract ? custById(contract.customerId) : null;
            return [getUnitDisplayName(unitById(i.unitId)), customer?.name, i.type, originalAmount, paidAmount, i.amount, i.dueDate||'', i.paymentDate||'', i.status||''];
        });
        exportCSV(headers, rows, 'installments.csv');
    });

    document.getElementById('print-installments-btn').addEventListener('click', () => {
        const rows=currentList.map(i=> {
            const originalAmount = i.originalAmount ?? i.amount;
            const paidAmount = originalAmount - i.amount;
            const contract = state.contracts.find(c => c.unitId === i.unitId);
            const customer = contract ? custById(contract.customerId) : null;
            return `
            <tr>
              <td>${getUnitDisplayName(unitById(i.unitId))}</td>
              <td>${customer?.name || ''}</td>
              <td>${i.type || ''}</td>
              <td>${egp(originalAmount)}</td>
              <td>${egp(paidAmount)}</td>
              <td>${egp(i.amount)}</td>
              <td>${i.dueDate || ''}</td>
              <td>${i.status || ''}</td>
            </tr>`}).join('');
          printHTML('تقرير الأقساط',
            `<h1>تقرير الأقساط</h1>
             <table>
               <thead><tr>
                 <th>الوحدة</th><th>العميل</th><th>النوع</th><th>المبلغ الأصلي</th><th>المسدد</th><th>المتبقي</th><th>الاستحقاق</th><th>الحالة</th>
               </tr></thead>
               <tbody>${rows}</tbody>
             </table>`);
    });

    drawTable();
}

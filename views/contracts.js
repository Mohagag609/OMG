import { state, saveState } from '../state.js';
import { uid, today, parseNumber, exportCSV } from '../helpers.js';
import { getUnitDisplayName, unitById, custById, logAction } from '../state-utils.js';
import { table, printHTML } from '../ui.js';
import { persist } from '../data.js';
import { nav } from '../app.js';

function deleteContract(contractId) {
    const contract = state.contracts.find(c => c.id === contractId);
    if (!contract) {
      alert('لم يتم العثور على العقد.');
      return;
    }

    if (!confirm(`هل أنت متأكد من حذف العقد ${contract.code}؟ سيتم حذف جميع الأقساط والمدفوعات المرتبطة به.`)) return;

    const unitId = contract.unitId;
    const brokerDue = state.brokerDues.find(d => d.contractId === contractId);
    let commissionVoucher = null;
    if (brokerDue) {
        commissionVoucher = state.vouchers.find(v => v.linked_ref === brokerDue.id && v.description.includes('عمولة سمسار'));
    }

    let keepCommission = false;
    if (commissionVoucher) {
        if (!confirm("تم العثور على عمولة مدفوعة لهذا العقد. هل تريد حذفها أيضًا وإرجاع المبلغ للخزنة؟")) {
            keepCommission = true;
        }
    }

    saveState();
    logAction('حذف عقد وكل ما يتعلق به', { contractId, unitId, keepCommission, deletedContract: JSON.stringify(contract) });

    const installmentIds = state.installments.filter(i => i.unitId === unitId).map(i => i.id);
    const relatedVouchers = state.vouchers.filter(v => {
        return (v.linked_ref === contractId || installmentIds.includes(v.linked_ref)) && !v.description.includes('عمولة سمسار');
    });

    relatedVouchers.forEach(v => {
        const safe = state.safes.find(s => s.id === v.safeId);
        if (safe && v.type === 'receipt') {
            safe.balance -= v.amount;
        }
    });

    const voucherIdsToDelete = new Set(relatedVouchers.map(v => v.id));

    if (commissionVoucher && !keepCommission) {
        const safe = state.safes.find(s => s.id === commissionVoucher.safeId);
        if (safe) {
            safe.balance += commissionVoucher.amount;
        }
        voucherIdsToDelete.add(commissionVoucher.id);
    }

    state.vouchers = state.vouchers.filter(v => !voucherIdsToDelete.has(v.id));
    state.payments = state.payments.filter(p => p.unitId !== unitId);
    state.installments = state.installments.filter(i => i.unitId !== unitId);

    if (brokerDue && !keepCommission) {
        state.brokerDues = state.brokerDues.filter(d => d.id !== brokerDue.id);
    }

    state.contracts = state.contracts.filter(c => c.id !== contractId);

    const unit = unitById(unitId);
    if (unit) {
        unit.status = 'متاحة';
    }

    persist();
    nav('contracts');
}

function editContract(contractId) {
    const contract = state.contracts.find(c => c.id === contractId);
    if (!contract) {
        return alert('لم يتم العثور على العقد.');
    }

    const hasPayments = state.payments.some(p => p.unitId === contract.unitId);
    if (hasPayments) {
        alert('لا يمكن تعديل هذا العقد لأنه توجد مدفوعات مسجلة عليه.');
        return;
    }

    if (confirm('هل أنت متأكد أنك تريد "تعديل" هذا العقد؟ سيتم حذف العقد الحالي وجميع أقساطه، ويجب عليك إنشاء عقد جديد.')) {
        deleteContract(contractId);
    }
}

function createContract() {
    const total=parseNumber(document.getElementById('ct-total').value), down=parseNumber(document.getElementById('ct-down').value);
    const discount = parseNumber(document.getElementById('ct-discount').value);
    const brokerName = document.getElementById('ct-broker-name').value.trim();
    const brokerP=parseNumber(document.getElementById('ct-brokerp').value);
    const brokerAmt=Math.round((total*brokerP/100)*100)/100;
    const commissionSafeId = document.getElementById('ct-commission-safe').value;
    const downPaymentSafeId = document.getElementById('ct-downpayment-safe').value;
    let paymentType = document.getElementById('ct-payment-type').value;

    if (paymentType === 'installment' && down >= total) {
        paymentType = 'cash';
    }

    if (brokerAmt > 0 && !commissionSafeId) return alert('الرجاء تحديد الخزنة التي سيتم دفع العمولة منها.');
    if (down > 0 && !downPaymentSafeId) return alert('الرجاء تحديد الخزنة التي سيتم إيداع المقدم بها.');

    saveState();
    const unitId=document.getElementById('ct-unit').value, customerId=document.getElementById('ct-cust').value;
    if(!unitId||!customerId) return alert('الرجاء اختيار الوحدة والعميل.');

    const unitPartners = state.unitPartners.filter(up => up.unitId === unitId);
    const totalPercent = unitPartners.reduce((sum, p) => sum + Number(p.percent), 0);

    if (unitPartners.length === 0) return alert('لا يمكن إنشاء عقد. يجب تحديد شركاء لهذه الوحدة أولاً.');
    if (totalPercent !== 100) return alert(`لا يمكن إنشاء عقد. مجموع نسب الشركاء هو ${totalPercent}% ويجب أن يكون 100% بالضبط.`);

    const type=document.getElementById('ct-type').value, count=parseInt(document.getElementById('ct-count').value||'0',10);
    const extra=parseInt(document.getElementById('ct-annual-bonus').value||'0',10);
    const annualBonusValue = parseNumber(document.getElementById('ct-annual-bonus-value').value);
    const maintenanceDeposit = parseNumber(document.getElementById('ct-maintenance-deposit').value);
    const startStr=document.getElementById('ct-start').value||today(); const start=new Date(startStr);

    if(paymentType === 'installment' && count <= 0 && extra <= 0) return alert('الرجاء إدخال عدد دفعات أو عدد دفعات سنوية.');
    if(paymentType === 'installment' && extra > 0 && annualBonusValue <= 0) return alert('الرجاء إدخال قيمة الدفعة السنوية.');

    const code='CTR-'+String(state.contracts.length+1).padStart(5,'0');
    const ct={id:uid('CT'), code, unitId, customerId, totalPrice:total, downPayment:down, discountAmount: discount, maintenanceDeposit, brokerName, brokerPercent:brokerP, brokerAmount:brokerAmt, commissionSafeId, type, count, extraAnnual:Math.min(Math.max(extra,0),3), annualPaymentValue: annualBonusValue, start:startStr};
    state.contracts.push(ct);
    logAction('إنشاء عقد جديد', { contractId: ct.id, unitId, customerId, price: total });

    const customer = custById(customerId);
    if (down > 0) {
        const downPaymentSafe = state.safes.find(s => s.id === downPaymentSafeId);
        downPaymentSafe.balance += down;
        state.vouchers.push({id:uid('V'), type:'receipt', date:startStr, amount:down, safeId:downPaymentSafeId, description:`مقدم عقد للوحدة ${getUnitDisplayName(unitById(unitId))}`, payer:customer?.name, linked_ref:ct.id});
        logAction('إنشاء سند قبض للمقدم', { contractId: ct.id, amount: down, safeId: downPaymentSafeId });
    }
    if (brokerAmt > 0) {
        const newBrokerDue = {
            id: uid('BD'),
            contractId: ct.id,
            brokerName: brokerName || 'سمسار غير محدد',
            amount: brokerAmt,
            dueDate: startStr,
            status: 'due',
            paymentDate: null,
            paidFromSafeId: null
        };
        state.brokerDues.push(newBrokerDue);
        logAction('إنشاء عمولة مستحقة للسمسار', { brokerDueId: newBrokerDue.id, contractId: ct.id, amount: brokerAmt });
    }

    if (paymentType === 'installment') {
        const installmentBase = total - (ct.maintenanceDeposit || 0);
        const totalAfterDown = installmentBase - discount - down;
        const totalAnnualPayments = extra * annualBonusValue;

        if (totalAfterDown < 0) {
            return alert('خطأ: المقدم والخصم أكبر من قيمة العقد الخاضعة للتقسيط.');
        }
        if (totalAnnualPayments > totalAfterDown) {
            return alert('خطأ: مجموع الدفعات السنوية أكبر من المبلغ المتبقي للتقسيط.');
        }

        const amountForRegularInstallments = totalAfterDown - totalAnnualPayments;
        const months={'شهري':1,'ربع سنوي':3,'نصف سنوي':6,'سنوي':12}[type]||1;

        if (count > 0) {
            const baseAmount = Math.floor((amountForRegularInstallments / count) * 100) / 100;
            let accumulatedAmount = 0;
            for(let i=0; i<count; i++){
              const d = new Date(start);
              d.setMonth(d.getMonth() + months * (i + 1));
              const amount = (i === count - 1) ? Math.round((amountForRegularInstallments - accumulatedAmount) * 100) / 100 : baseAmount;
              accumulatedAmount += amount;
              state.installments.push({id:uid('I'),unitId,type,amount,originalAmount:amount,dueDate:d.toISOString().slice(0,10),paymentDate:null,status:'غير مدفوع'});
            }
        }

        for(let j=0; j<extra; j++){
          const d = new Date(start);
          d.setMonth(d.getMonth() + 12 * (j + 1));
          state.installments.push({id:uid('I'),unitId,type:'دفعة سنوية',amount:annualBonusValue,originalAmount:annualBonusValue,dueDate:d.toISOString().slice(0,10),paymentDate:null,status:'غير مدفوع'});
        }

        if (ct.maintenanceDeposit > 0) {
            const allInstallments = state.installments.filter(i => i.unitId === unitId);
            const lastInstallment = allInstallments.sort((a, b) => (b.dueDate || '').localeCompare(a.dueDate || ''))[0];
            const lastDate = new Date(lastInstallment ? lastInstallment.dueDate : startStr);
            const lastPeriodMonths = lastInstallment ? months : 0;
            lastDate.setMonth(lastDate.getMonth() + lastPeriodMonths);
            state.installments.push({
                id: uid('I'),
                unitId,
                type: 'دفعة صيانة',
                amount: ct.maintenanceDeposit,
                originalAmount: ct.maintenanceDeposit,
                dueDate: lastDate.toISOString().slice(0,10),
                paymentDate: null,
                status:'غير مدفوع'
            });
        }
    }

    const u=unitById(unitId); if(u) u.status='مباعة';
    persist();
    nav('contracts');
}

function expContracts() {
    const headers = ['كود العقد','الوحدة','العميل','السعر','المقدم','الخصم','اسم السمسار','نسبة العمولة','مبلغ العمولة'];
    const rows = state.contracts.map(c => [
        c.code,
        getUnitDisplayName(unitById(c.unitId)),
        (custById(c.customerId) || {}).name || '',
        c.totalPrice,
        c.downPayment,
        c.discountAmount || 0,
        c.brokerName || '',
        c.brokerPercent || 0,
        c.brokerAmount || 0
    ]);
    exportCSV(headers, rows, 'contracts.csv');
}

function printContracts() {
    const headers = ['الكود','الوحدة','العميل','السعر','المقدم','نوع','عدد','بداية'];
    const rows=state.contracts.map(c=>`<tr><td>${c.code||''}</td><td>${getUnitDisplayName(unitById(c.unitId))}</td><td>${(custById(c.customerId)||{}).name||'—'}</td><td>${c.totalPrice}</td><td>${c.downPayment}</td><td>${c.type}</td><td>${c.count}</td><td>${c.start}</td></tr>`).join('');
    printHTML('تقرير العقود', `<h1>تقرير العقود</h1><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`);
}

function printContract(ct) {
    const html=`<h1>عقد بيع — ${ct.code}</h1>
      <p>الوحدة: ${getUnitDisplayName(unitById(ct.unitId))} — العميل: ${(custById(ct.customerId)||{}).name||'—'}</p>
      <table>
        <tr><th>السعر الكلي</th><td>${ct.totalPrice}</td></tr>
        <tr><th>الخصم</th><td style="color:var(--ok);">${ct.discountAmount||0}</td></tr>
        <tr><th>المقدم</th><td>${ct.downPayment}</td></tr>
        <tr><th>نظام الأقساط</th><td>${ct.type} × ${ct.count} + سنوية إضافية: ${ct.extraAnnual}</td></tr>
        <tr><th>بداية العقد</th><td>${ct.start}</td></tr>
      </table>`;
    printHTML('عقد بيع', html);
}

export function renderContracts(){
  const view = document.getElementById('view');

  function draw(){
    const q = (document.getElementById('ct-q')?.value || '').trim().toLowerCase();
    let list = state.contracts.slice();
    if (q) {
        list = list.filter(c => {
            const customerName = (custById(c.customerId) || {}).name || '';
            const unitName = getUnitDisplayName(unitById(c.unitId));
            const searchable = `${c.code || ''} ${unitName} ${customerName} ${c.brokerName || ''}`.toLowerCase();
            return searchable.includes(q);
        });
    }

    const rows=list.map(c=> {
        const broker = state.brokers.find(b => b.name === c.brokerName);
        const brokerNav = broker ? `data-nav-broker="${broker.id}"` : `data-alert-broker="لم يتم العثور على هذا السمسار في القائمة."`;
        return [
            c.code,
            getUnitDisplayName(unitById(c.unitId)),
            (custById(c.customerId)||{}).name||'—',
            c.brokerName ? `<a href="#" ${brokerNav}>${c.brokerName}</a>` : '—',
            c.totalPrice,
            c.start,
            `<button class="btn" data-nav-details="${c.id}">عرض</button> <button class="btn gold" data-edit-contract="${c.id}">تعديل</button>`,
            `<button class="btn secondary" data-del-contract="${c.id}">حذف</button>`
        ];
    });
    document.getElementById('ct-list').innerHTML=table(['كود العقد','الوحدة','العميل','السمسار','السعر','تاريخ البدء','إجراءات',''], rows);

    document.querySelectorAll('[data-nav-details]').forEach(b => b.addEventListener('click', e => openContractDetails(e.target.dataset.navDetails)));
    document.querySelectorAll('[data-edit-contract]').forEach(b => b.addEventListener('click', e => editContract(e.target.dataset.editContract)));
    document.querySelectorAll('[data-del-contract]').forEach(b => b.addEventListener('click', e => deleteContract(e.target.dataset.delContract)));
    document.querySelectorAll('[data-nav-broker]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); nav('broker-details', e.target.dataset.navBroker)}));
    document.querySelectorAll('[data-alert-broker]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); alert(e.target.dataset.alertBroker)}));
  }

  view.innerHTML=`
  <div class="grid">
    <div class="card">
      <h3>إضافة عقد</h3>
      <div class="grid grid-4">
        <select class="select" id="ct-unit"><option value="">اختر الوحدة...</option>${state.units.filter(u=>u.status==='متاحة' || u.status ==='محجوزة').map(u=>`<option value="${u.id}">${u.code}</option>`).join('')}</select>
        <select class="select" id="ct-cust"><option value="">اختر العميل...</option>${state.customers.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select>
        <input class="input" id="ct-total" placeholder="السعر الكلي" readonly style="background:var(--bg);">
        <select class="select" id="ct-payment-type">
            <option value="installment">تقسيط</option>
            <option value="cash">كاش</option>
        </select>
        <input class="input" id="ct-down" placeholder="المقدم" oninput="this.value=this.value.replace(/[^\\d.]/g,'')">
        <select class="select" id="ct-downpayment-safe"><option value="">اختر خزنة المقدم...</option>${state.safes.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</select>
        <input class="input" id="ct-discount" placeholder="مبلغ الخصم" oninput="this.value=this.value.replace(/[^\\d.]/g,'')">
        <input class="input" id="ct-maintenance-deposit" placeholder="وديعة الصيانة" oninput="this.value=this.value.replace(/[^\\d.]/g,'')">
        <select class="select" id="ct-broker-name"><option value="">اختر سمسار...</option>${state.brokers.map(b=>`<option value="${b.name}">${b.name}</option>`).join('')}</select>
        <input class="input" id="ct-brokerp" placeholder="نسبة العمولة %" oninput="this.value=this.value.replace(/[^\\d.]/g,'')">
        <select class="select" id="ct-commission-safe"><option value="">اختر خزنة العمولة...</option>${state.safes.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</select>
        <input class="input" id="ct-start" type="date" value="${today()}">
      </div>
      <div id="installment-options-wrapper">
        <div class="grid grid-2" style="margin-top:10px; gap: 8px;">
            <select class="select" id="ct-type"><option>شهري</option><option>ربع سنوي</option><option>نصف سنوي</option><option>سنوي</option></select>
            <input class="input" id="ct-count" placeholder="عدد الدفعات" oninput="this.value=this.value.replace(/[^\\d]/g,'')">
            <input class="input" id="ct-annual-bonus" placeholder="عدد الدفعات السنوية (0-3)" oninput="this.value=this.value.replace(/[^\\d]/g,'')">
            <input class="input" id="ct-annual-bonus-value" placeholder="قيمة الدفعة السنوية" oninput="this.value=this.value.replace(/[^\\d.]/g,'')">
        </div>
        <div style="color:var(--muted); font-size:12px; margin-top:4px; padding-right: 5px;">
            إجمالي عدد الأقساط: <span id="ct-total-installments" style="font-weight:bold;">0</span>
        </div>
      </div>
      <div class="tools">
        <button class="btn" id="create-contract-btn">حفظ + توليد أقساط</button>
      </div>
    </div>
    <div class="card">
      <h3>العقود</h3>
      <div class="tools">
        <input class="input" id="ct-q" placeholder="بحث بالكود, الوحدة, العميل..." oninput="draw()">
        <button class="btn secondary" id="exp-contracts-btn">تصدير CSV</button>
        <button class="btn secondary" id="print-contracts-btn">طباعة PDF</button>
      </div>
      <div id="ct-list"></div>
    </div>
  </div>`;

  document.getElementById('create-contract-btn').addEventListener('click', createContract);
  document.getElementById('exp-contracts-btn').addEventListener('click', expContracts);
  document.getElementById('print-contracts-btn').addEventListener('click', printContracts);

  const unitSelect = document.getElementById('ct-unit');
  const totalInput = document.getElementById('ct-total');
  const paymentTypeSelect = document.getElementById('ct-payment-type');
  const downPaymentInput = document.getElementById('ct-down');
  const installmentOptionsWrapper = document.getElementById('installment-options-wrapper');

  function updateFormForPaymentType() {
      const paymentType = paymentTypeSelect.value;
      const total = parseNumber(totalInput.value);

      if (paymentType === 'cash') {
          installmentOptionsWrapper.style.display = 'none';
          downPaymentInput.value = total || '';
          downPaymentInput.readOnly = true;
      } else {
          installmentOptionsWrapper.style.display = 'block';
          downPaymentInput.readOnly = false;
      }
      updateTotalInstallments();
  }

  function updateFormForUnit() {
      const unitId = unitSelect.value;
      const unit = unitById(unitId);
      totalInput.value = unit ? unit.totalPrice : '';
      updateFormForPaymentType();
  }

  function updateTotalInstallments() {
    const countInput = document.getElementById('ct-count');
    const extraInput = document.getElementById('ct-annual-bonus');
    const totalDisplay = document.getElementById('ct-total-installments');
    if (!countInput || !extraInput || !totalDisplay) return;

    const count = parseInt(countInput.value || '0', 10);
    const extra = parseInt(extraInput.value || '0', 10);
    totalDisplay.textContent = count + extra;
  }

  unitSelect.onchange = updateFormForUnit;
  paymentTypeSelect.onchange = updateFormForPaymentType;
  document.getElementById('ct-count').oninput = updateTotalInstallments;
  document.getElementById('ct-annual-bonus').oninput = updateTotalInstallments;

  draw();
  updateFormForUnit();
  updateTotalInstallments();
  updateFormForPaymentType();
}

function openContractDetails(id) {
    const view = document.getElementById('view');
    const ct = state.contracts.find(c => c.id === id);
    if (!ct) {
        alert('لم يتم العثور على العقد');
        return nav('contracts');
    }

    const unit = unitById(ct.unitId);
    const customer = custById(ct.customerId);

    const allInstallments = state.installments.filter(i => i.unitId === ct.unitId);
    const installmentIds = new Set(allInstallments.map(i => i.id));

    const totalPaid = state.vouchers
        .filter(v => v.type === 'receipt' && (v.linked_ref === ct.id || installmentIds.has(v.linked_ref)))
        .reduce((sum, v) => sum + v.amount, 0);

    const remainingInstallments = allInstallments.filter(i => i.status !== 'مدفوع');
    const remainingRegular = remainingInstallments
        .filter(i => i.type !== 'دفعة صيانة')
        .reduce((sum, i) => sum + i.amount, 0);
    const remainingMaintenance = remainingInstallments
        .find(i => i.type === 'دفعة صيانة')?.amount || 0;
    const totalDebt = remainingRegular + remainingMaintenance;

    const instRows = allInstallments.sort((a,b) => (a.dueDate||'').localeCompare(b.dueDate||'')).map(i => {
      const originalAmount = i.originalAmount ?? i.amount;
      const paidSoFar = originalAmount - i.amount;
      return `<tr>
        <td>${i.type || ''}</td>
        <td>${originalAmount}</td>
        <td>${i.amount}</td>
        <td>${paidSoFar}</td>
        <td>${i.dueDate || ''}</td>
        <td>${i.paymentDate || ''}</td>
        <td>${i.status || ''}</td>
      </tr>`;
    }).join('');

    const pays = state.vouchers.filter(v => v.type === 'receipt' && (v.linked_ref === ct.id || installmentIds.has(v.linked_ref)));
    const payRows = pays.map(p => `<tr>
        <td>${p.amount}</td>
        <td>${p.description||'—'}</td>
        <td>${p.date||'—'}</td>
        <td>${(state.safes.find(s=>s.id===p.safeId)||{}).name||'—'}</td>
      </tr>`).join('');

    const html = `
        <div class="card">
            <div class="header">
                <h1>تفاصيل العقد — ${ct.code}</h1>
                <button class="btn secondary" id="back-to-contracts-btn">⬅️ العودة إلى العقود</button>
            </div>
            <div class="grid grid-2" style="margin-top:12px; align-items: flex-start;">
                <div class="card">
                    <h3>بيانات العقد</h3>
                    <table>
                        <tr><th>العميل</th><td>${customer?.name || '—'} (${customer?.phone || '—'})</td></tr>
                        <tr><th>الوحدة</th><td>${getUnitDisplayName(unitById(ct.unitId))}</td></tr>
                        <tr style="font-weight: bold;"><th>إجمالي قيمة الشقة</th><td>${ct.totalPrice}</td></tr>
                        <tr><th>(-) وديعة الصيانة</th><td style="color:var(--warn);">${ct.maintenanceDeposit || 0}</td></tr>
                        <tr style="font-weight: bold;"><th>= المبلغ الخاضع للتقسيط</th><td>${(ct.totalPrice || 0) - (ct.maintenanceDeposit || 0)}</td></tr>
                        <tr><th>الخصم</th><td style="color:var(--ok);">${ct.discountAmount || 0}</td></tr>
                        <tr><th>المقدم</th><td>${ct.downPayment}</td></tr>
                        <tr><th>نظام الأقساط</th><td>${ct.type} × ${ct.count} + ${ct.extraAnnual} سنوية</td></tr>
                        <tr><th>تاريخ البدء</th><td>${ct.start}</td></tr>
                    </table>
                </div>
                <div class="card">
                    <h3>ملخص مالي للوحدة</h3>
                    <table>
                        <tr><th>الأقساط العادية المتبقية</th><td>${remainingRegular}</td></tr>
                        <tr><th>(+) وديعة الصيانة المتبقية</th><td>${remainingMaintenance}</td></tr>
                        <tr style="font-weight:bold; border-top: 1px solid var(--border);"><th>= إجمالي المديونية الحالية</th><td>${totalDebt}</td></tr>
                        <tr style="font-weight:bold;"><th>إجمالي المبالغ المدفوعة</th><td style="color:var(--ok);">${totalPaid}</td></tr>
                    </table>
                </div>
            </div>

            <h3 style="margin-top:16px;">جدول الأقساط</h3>
            <div style="max-height: 300px; overflow-y: auto;">
              <table class="table">
                <thead><tr><th>النوع</th><th>المبلغ الأصلي</th><th>المتبقي</th><th>المسدد</th><th>الاستحقاق</th><th>تاريخ السداد</th><th>الحالة</th></tr></thead>
                <tbody>${instRows.length ? instRows : '<tr><td colspan="7">لا توجد أقساط</td></tr>'}</tbody>
              </table>
            </div>

            <h3 style="margin-top:16px;">سجل المدفوعات</h3>
            <div style="max-height: 300px; overflow-y: auto;">
              <table class="table">
                <thead><tr><th>المبلغ</th><th>البيان</th><th>التاريخ</th><th>الخزنة</th></tr></thead>
                <tbody>${payRows.length ? payRows : '<tr><td colspan="4">لا توجد مدفوعات</td></tr>'}</tbody>
              </table>
            </div>
        </div>
    `;

    view.innerHTML = html;
    document.getElementById('back-to-contracts-btn').addEventListener('click', () => nav('contracts'));
};

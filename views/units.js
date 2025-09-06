import { state, saveState } from '../state.js';
import { uid, parseNumber, exportCSV } from '../helpers.js';
import { unitById, partnerById, getUnitDisplayName, logAction } from '../state-utils.js';
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

function deleteUnit(unitId) {
  const isLinked = state.contracts.some(c => c.unitId === unitId);
  if (isLinked) {
    alert('لا يمكن حذف هذه الوحدة لأنها مرتبطة بعقد قائم. يجب حذف العقد أولاً.');
    return;
  }
  delRow('units', unitId);
}

export function calcRemaining(u){
  const ct = state.contracts.find(c => c.unitId === u.id);
  if (!ct) return 0;

  const totalOwed = (ct.totalPrice || 0) - (ct.discountAmount || 0);

  const installmentIds = new Set(state.installments.filter(i => i.unitId === u.id).map(i => i.id));

  const totalPaid = state.vouchers
      .filter(v => v.type === 'receipt' && (v.linked_ref === ct.id || installmentIds.has(v.linked_ref)))
      .reduce((sum, v) => sum + v.amount, 0);

  const remaining = totalOwed - totalPaid;
  return Math.max(0, remaining);
}

function addUnit() {
    const name=document.getElementById('u-name').value.trim();
    const area=document.getElementById('u-area').value.trim();
    const floor=document.getElementById('u-floor').value.trim();
    const building=document.getElementById('u-building').value.trim();
    const notes=document.getElementById('u-notes').value.trim();
    const totalPrice = parseNumber(document.getElementById('u-total-price').value);
    const partnerGroupId = document.getElementById('u-partner-group').value;

    let unitType = document.getElementById('u-unit-type').value;
    if (unitType === 'other') {
        unitType = document.getElementById('u-unit-type-other').value.trim();
        if (!unitType) return alert('الرجاء إدخال نوع الوحدة المخصص.');
    }

    if(!name || !floor || !building) return alert('الرجاء إدخال اسم الوحدة والدور والبرج.');
    if(!totalPrice) return alert('الرجاء إدخال سعر الوحدة.');
    if(!partnerGroupId) return alert('الرجاء اختيار مجموعة شركاء.');

    const group = state.partnerGroups.find(g => g.id === partnerGroupId);
    if (!group) return alert('لم يتم العثور على مجموعة الشركاء المحددة.');
    const totalPercent = group.partners.reduce((sum, p) => sum + p.percent, 0);
    if (totalPercent !== 100) {
      return alert(`لا يمكن استخدام هذه المجموعة. إجمالي النسب فيها هو ${totalPercent}% ويجب أن يكون 100%.`);
    }

    const san_b = building.replace(/\s/g, '');
    const san_f = floor.replace(/\s/g, '');
    const san_n = name.replace(/\s/g, '');
    const code = `${san_b}-${san_f}-${san_n}`;

    if (state.units.some(u => u.code.toLowerCase() === code.toLowerCase())) {
        return alert('هذه الوحدة (نفس الاسم والدور والبرج) موجودة بالفعل.');
    }

    saveState();

    const newUnit = {
      id:uid('U'), code, name, status: 'متاحة', area, floor, building, notes, totalPrice, unitType
    };
    logAction('إضافة وحدة جديدة', { id: newUnit.id, code: newUnit.code, partnerGroupId });
    state.units.push(newUnit);

    group.partners.forEach(p => {
      const link = {id: uid('UP'), unitId: newUnit.id, partnerId: p.partnerId, percent: p.percent};
      state.unitPartners.push(link);
    });
    logAction('ربط مجموعة شركاء بوحدة', { unitId: newUnit.id, partnerGroupId });

    persist();
    nav('unit-details', newUnit.id);
    alert('تم حفظ الوحدة وربط مجموعة الشركاء بنجاح. يتم الآن عرض تفاصيل الوحدة.');
}

function expUnits() {
    const headers=['اسم الوحدة','الدور','البرج','نوع الوحدة','الشركاء','السعر','المتبقي','الحالة','ملاحظات'];
    const rows=state.units.map(u=> {
      const partners = state.unitPartners.filter(up => up.unitId === u.id)
          .map(up => `${(partnerById(up.partnerId) || {}).name} (${up.percent}%)`)
          .join(' | ');
      return [u.name||'',u.floor||'',u.building||'',u.unitType||'',partners,u.totalPrice,calcRemaining(u),u.status,u.notes||''];
    });
    exportCSV(headers, rows, 'units.csv');
}

function printUnits() {
    const headers=['اسم الوحدة','الدور','البرج','نوع الوحدة','السعر','المتبقي','الحالة'];
    const rows=state.units.map(u=>`<tr><td>${u.name||''}</td><td>${u.floor||''}</td><td>${u.building||''}</td><td>${u.unitType||''}</td><td>${egp(u.totalPrice)}</td><td>${egp(calcRemaining(u))}</td><td>${u.status}</td></tr>`).join('');
    printHTML('تقرير الوحدات', `<h1>تقرير الوحدات</h1><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`);
}

function updateUnit(id) {
    const u = unitById(id);
    if (!u) return alert('لم يتم العثور على الوحدة.');

    const name = document.getElementById('u-edit-name').value.trim();
    const floor = document.getElementById('u-edit-floor').value.trim();
    const building = document.getElementById('u-edit-building').value.trim();

    if (!name || !floor || !building) {
        return alert('الرجاء إدخال اسم الوحدة والدور والبرج.');
    }

    saveState();
    u.name = name;
    u.floor = floor;
    u.building = building;
    u.totalPrice = parseNumber(document.getElementById('u-edit-total-price').value);
    u.area = document.getElementById('u-edit-area').value.trim();
    u.status = document.getElementById('u-edit-status').value;
    u.notes = document.getElementById('u-edit-notes').value.trim();

    u.code = `${building.replace(/\s/g, '')}-${floor.replace(/\s/g, '')}-${name.replace(/\s/g, '')}`;

    logAction('تعديل بيانات الوحدة', { unitId: id, updatedData: { name, floor, building, price: u.totalPrice } });
    persist();
    alert('تم حفظ التعديلات بنجاح.');
    nav('units');
}

export function renderUnits(){
  const view = document.getElementById('view');
  let sort={idx:0,dir:'asc'};

  function draw(){
    const q=(document.getElementById('u-q')?.value || '').trim().toLowerCase();
    let list=state.units.slice();
    if(q) {
      list=list.filter(u=> {
        const searchable = `${u.code||''} ${u.name||''} ${u.floor||''} ${u.building||''} ${u.status||''} ${u.area||''} ${u.unitType||''}`.toLowerCase();
        return searchable.includes(q);
      });
    }
    list.sort((a,b)=>(a.name||'').localeCompare(b.name||''));

    const rows=list.map(u=> {
      const isSold = u.status === 'مباعة';
      let actions = `
        <button class="btn" data-nav-details="${u.id}" ${isSold ? 'disabled' : ''}>إدارة</button>
        <button class="btn gold" data-nav-edit="${u.id}" ${isSold ? 'disabled' : ''}>تعديل</button>
        <button class="btn secondary" data-del-unit="${u.id}" ${isSold ? 'disabled' : ''}>حذف</button>
      `;
      if (isSold) {
        actions += ` <button class="btn" style="margin-right: 5px;" data-return-unit="${u.id}">إرجاع</button>`;
      }
      const partners = state.unitPartners.filter(up => up.unitId === u.id)
          .map(up => `${(partnerById(up.partnerId) || {}).name} (${up.percent}%)`)
          .join(', ');

      return [
        u.name || '',
        u.floor || '',
        u.building || '',
        u.unitType || 'سكني',
        partners || '—',
        u.totalPrice,
        `<span>${calcRemaining(u)}</span>`,
        u.status||'متاحة',
        `<div class="tools" style="gap:5px; flex-wrap:nowrap;">${actions}</div>`,
      ];
    });
    document.getElementById('u-list').innerHTML=
      table(['اسم الوحدة','الدور','البرج','نوع الوحدة','الشركاء','السعر','المتبقي','الحالة','إجراءات'], rows);

    document.querySelectorAll('[data-nav-details]').forEach(b => b.addEventListener('click', e => nav('unit-details', e.target.dataset.navDetails)));
    document.querySelectorAll('[data-nav-edit]').forEach(b => b.addEventListener('click', e => nav('unit-edit', e.target.dataset.navEdit)));
    document.querySelectorAll('[data-del-unit]').forEach(b => b.addEventListener('click', e => deleteUnit(e.target.dataset.delUnit)));
    document.querySelectorAll('[data-return-unit]').forEach(b => b.addEventListener('click', e => startReturnProcess(e.target.dataset.returnUnit)));
  }

  view.innerHTML=`
  <div class="grid">
    <div class="card">
      <h3>إضافة وحدة</h3>
      <div class="grid grid-5">
        <input class="input" id="u-name" placeholder="اسم الوحدة">
        <input class="input" id="u-floor" placeholder="رقم الدور">
        <input class="input" id="u-building" placeholder="البرج/العمارة">
        <input class="input" id="u-total-price" placeholder="السعر الكلي" oninput="this.value=this.value.replace(/[^\\d.]/g,'')">
        <input class="input" id="u-area" placeholder="المساحة (م²)">
        <select class="select" id="u-unit-type">
            <option>سكني</option>
            <option>تجاري</option>
            <option value="other">أخرى...</option>
        </select>
        <input class="input" id="u-unit-type-other" placeholder="ادخل نوع الوحدة" style="display:none; grid-column: span 2;">
        <select class="select" id="u-partner-group" style="grid-column: span 3;"><option value="">اختر مجموعة شركاء...</option>${state.partnerGroups.map(g=>`<option value="${g.id}">${g.name}</option>`).join('')}</select>
      </div>
      <textarea class="input" id="u-notes" placeholder="ملاحظات" style="margin-top:10px;" rows="2"></textarea>
      <button class="btn" style="margin-top:10px;" id="add-unit-btn">حفظ</button>
    </div>
    <div class="card">
      <h3>قائمة الوحدات</h3>
      <div class="tools">
        <input class="input" id="u-q" placeholder="بحث..." oninput="draw()">
        <button class="btn secondary" id="exp-units-btn">CSV</button>
        <label class="btn secondary"><input type="file" id="u-imp" style="display:none" accept=".csv">استيراد CSV</label>
        <button class="btn" id="print-units-btn">طباعة PDF</button>
      </div>
      <div id="u-list"></div>
    </div>
  </div>`;

  document.getElementById('u-unit-type').addEventListener('change', () => {
    const typeSelect = document.getElementById('u-unit-type');
    const otherInput = document.getElementById('u-unit-type-other');
    otherInput.style.display = typeSelect.value === 'other' ? 'block' : 'none';
  });

  document.getElementById('add-unit-btn').addEventListener('click', addUnit);
  document.getElementById('exp-units-btn').addEventListener('click', expUnits);
  document.getElementById('print-units-btn').addEventListener('click', printUnits);

  document.getElementById('u-imp').onchange=(e)=>{
    const f=e.target.files[0]; if(!f) return;
    const r=new FileReader();
    r.onload=()=>{
      saveState();
      const lines=String(r.result).split(/\r?\n/).slice(1);
      lines.forEach(line=>{
        const [name,floor,building,unitType,partners,price,status,notes]=line.split(',').map(x=>x?.replace(/^"|"$/g,'')||'');
        if(name&&floor&&building) {
            const code = `${building.replace(/\s/g, '')}-${floor.replace(/\s/g, '')}-${name.replace(/\s/g, '')}`;
            state.units.push({id:uid('U'),code,name,totalPrice:parseNumber(price),status:status||'متاحة',floor,building,notes,unitType});
        }
      });
      persist(); draw();
    };
    r.readAsText(f,'utf-8');
  };

  draw();
}

export function renderUnitEdit(unitId) {
    const view = document.getElementById('view');
    const unit = unitById(unitId);
    if (!unit) {
        return nav('units');
    }

    view.innerHTML = `
    <div class="card">
      <h3>تعديل الوحدة: ${getUnitDisplayName(unit)}</h3>
      <div class="grid grid-4">
        <input class="input" id="u-edit-name" placeholder="اسم الوحدة" value="${unit.name || ''}">
        <input class="input" id="u-edit-floor" placeholder="رقم الدور" value="${unit.floor || ''}">
        <input class="input" id="u-edit-building" placeholder="البرج/العمارة" value="${unit.building || ''}">
        <input class="input" id="u-edit-total-price" placeholder="السعر الكلي" value="${unit.totalPrice || 0}" oninput="this.value=this.value.replace(/[^\\d.]/g,'')">
        <input class="input" id="u-edit-area" placeholder="المساحة (م²)" value="${unit.area || ''}">
        <select class="select" id="u-edit-status">
            <option value="متاحة" ${unit.status === 'متاحة' ? 'selected' : ''}>متاحة</option>
            <option value="محجوزة" ${unit.status === 'محجوزة' ? 'selected' : ''}>محجوزة</option>
        </select>
      </div>
      <textarea class="input" id="u-edit-notes" placeholder="ملاحظات" style="margin-top:10px;" rows="2">${unit.notes || ''}</textarea>
      <div class="tools" style="margin-top:10px;">
        <button class="btn" id="update-unit-btn">حفظ التعديلات</button>
        <button class="btn secondary" id="cancel-edit-btn">إلغاء</button>
      </div>
    </div>
    `;

    document.getElementById('update-unit-btn').addEventListener('click', () => updateUnit(unit.id));
    document.getElementById('cancel-edit-btn').addEventListener('click', () => nav('units'));
}

function updatePartnerPercent(element, linkId, originalPercent) {
  const link = state.unitPartners.find(up => up.id === linkId);
  if (!link) return;

  const newPercent = parseNumber(element.textContent);
  if (isNaN(newPercent) || newPercent <= 0) {
    alert('الرجاء إدخال نسبة مئوية صحيحة.');
    element.textContent = originalPercent;
    return;
  }

  const otherPartners = state.unitPartners.filter(up => up.unitId === link.unitId && up.id !== linkId);
  const otherPartnersTotal = otherPartners.reduce((sum, p) => sum + p.percent, 0);

  if (otherPartnersTotal + newPercent > 100) {
    alert(`لا يمكن حفظ هذه النسبة. مجموع نسب الشركاء الآخرين هو ${otherPartnersTotal}%. إضافة ${newPercent}% سيجعل المجموع يتجاوز 100%.`);
    element.textContent = originalPercent;
    return;
  }

  saveState();
  link.percent = newPercent;
  logAction('تعديل نسبة الشريك', { unitPartnerId: linkId, newPercent });
  persist();
  nav('unit-details', link.unitId);
  alert('تم تحديث النسبة بنجاح.');
};

function executeReturn(unitId, buyingPartnerId) {
    saveState();
    const u = unitById(unitId);
    const ct = state.contracts.find(c => c.unitId === unitId);
    if (!u || !ct) {
        return alert('خطأ: لم يتم العثور على الوحدة أو العقد.');
    }

    const originalPartners = state.unitPartners.filter(up => up.unitId === unitId);
    const originalInstallments = state.installments.filter(i => i.unitId === unitId);

    u.status = 'متاحة';
    state.contracts = state.contracts.filter(c => c.id !== ct.id);
    state.installments = state.installments.filter(i => i.unitId !== unitId || i.status === 'مدفوع');

    const sellingPartners = originalPartners.filter(p => p.partnerId !== buyingPartnerId);
    const scheduleBasis = originalInstallments.sort((a,b) => (a.dueDate||'').localeCompare(b.dueDate||''));
    const numInstallments = scheduleBasis.length;

    if (numInstallments > 0) {
        for (const seller of sellingPartners) {
            const debtOwed = (ct.totalPrice * seller.percent / 100);
            const installmentAmount = Math.round((debtOwed / numInstallments) * 100) / 100;
            let accumulatedAmount = 0;

            for (let i = 0; i < scheduleBasis.length; i++) {
                const inst = scheduleBasis[i];
                let amount = installmentAmount;
                if (i === numInstallments - 1) {
                    amount = Math.round((debtOwed - accumulatedAmount) * 100) / 100;
                }

                const newDebt = {
                    id: uid('PD'),
                    unitId: unitId,
                    payingPartnerId: buyingPartnerId,
                    owedPartnerId: seller.partnerId,
                    amount: amount,
                    dueDate: inst.dueDate,
                    status: 'غير مدفوع'
                };
                state.partnerDebts.push(newDebt);
                accumulatedAmount += amount;
            }
        }
    }

    state.unitPartners = state.unitPartners.filter(up => up.unitId !== unitId);
    state.unitPartners.push({ id: uid('UP'), unitId, partnerId: buyingPartnerId, percent: 100 });

    persist();
    alert('تمت عملية الإرجاع وشراء الشريك بنجاح.');
    nav('units');
    return true; // for modal
};

function startReturnProcess(unitId) {
    const u = unitById(unitId);
    const originalPartners = state.unitPartners.filter(up => up.unitId === unitId);

    if (!u || u.status !== 'مباعة') {
        return alert('يمكن تنفيذ هذه العملية على الوحدات المباعة فقط.');
    }
    if (originalPartners.length === 0) {
        return alert('لا يوجد شركاء مرتبطون بهذه الوحدة. لا يمكن إتمام العملية.');
    }

    const partnerOptions = originalPartners.map(up => {
        const p = partnerById(up.partnerId);
        return `<option value="${p.id}">${p.name} (${up.percent}%)</option>`;
    }).join('');

    const content = `
        <p>الرجاء تحديد الشريك الذي سيقوم بشراء الوحدة. سيتم تحويل ملكية الوحدة بالكامل إليه وإنشاء مديونية عليه لصالح الشركاء الآخرين.</p>
        <select class="select" id="buying-partner-select">${partnerOptions}</select>
    `;

    showModal('إرجاع وشراء شريك', content, () => {
        const buyingPartnerId = document.getElementById('buying-partner-select').value;
        if (!buyingPartnerId) {
            alert('الرجاء اختيار شريك.');
            return false;
        }
        return executeReturn(unitId, buyingPartnerId);
    });
};

export function renderUnitDetails(unitId){
  try {
    const view = document.getElementById('view');
    const u = unitById(unitId);
    if(!u) return nav('units');
    const links = state.unitPartners.filter(up => up.unitId === u.id);

    function drawPartners(){
      const rows = links.map(link => {
        const partner = partnerById(link.partnerId);
        const originalPercent = link.percent;
        return [
          partner ? partner.name : 'شريك محذوف',
          `<span contenteditable="true" data-percent-edit='${JSON.stringify({linkId: link.id, originalPercent: originalPercent})}'>${link.percent}</span> %`,
          `<button class="btn secondary" data-del-partner-link="${link.id}">حذف</button>`
        ];
      });
      document.getElementById('ud-partners-list').innerHTML = table(['الشريك', 'النسبة', ''], rows);
      const sum = links.reduce((s, p) => s + Number(p.percent || 0), 0);
      const sumEl = document.getElementById('ud-partners-sum');
      sumEl.textContent = sum + ' %';
      sumEl.className = 'badge ' + (sum > 100 ? 'warn' : (sum === 100 ? 'ok' : 'info'));

      document.querySelectorAll('[data-del-partner-link]').forEach(b => b.addEventListener('click', e => delRow('unitPartners', e.target.dataset.delPartnerLink)));
      document.querySelectorAll('[data-percent-edit]').forEach(el => {
        el.addEventListener('blur', e => {
            const { linkId, originalPercent } = JSON.parse(e.currentTarget.dataset.percentEdit);
            updatePartnerPercent(e.currentTarget, linkId, originalPercent);
        });
      });
    }

    let warningHTML = '';
    if (links.length === 0) {
      warningHTML = `<div class="card warn" style="margin-bottom: 16px; background: var(--warn-light); border-color: var(--warn);">
          <strong>تحذير:</strong> هذه الوحدة ليس لها شركاء. لن تتمكن من إنشاء <strong>عقد</strong> لها حتى يتم إضافة شريك واحد على الأقل بنسبة 100%.
      </div>`;
    }

    view.innerHTML = `
      ${warningHTML}
      <div class="card">
          <div class="header" style="justify-content: space-between;">
              <h1>إدارة الوحدة — ${u.code}</h1>
              <button class="btn secondary" id="back-to-units-btn">⬅️ العودة للوحدات</button>
          </div>
          <p><b>اسم الوحدة:</b> ${u.name||'—'} | <b>البرج:</b> ${u.building||'—'} | <b>الدور:</b> ${u.floor||'—'}</p>
          <p><b>السعر:</b> ${u.totalPrice}</p>

          <div class="card" style="margin-top:16px;">
              <h3>الشركاء في هذه الوحدة</h3>
              <div id="ud-partners-list"></div>
              <hr>
              <h4>إضافة شريك جديد</h4>
              <div class="tools">
                  <select class="select" id="ud-pr-select" style="flex:1;"><option value="">اختر شريك...</option>${state.partners.map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}</select>
                  <input class="input" id="ud-pr-percent" type="number" min="0.1" max="100" step="0.1" placeholder="النسبة %" style="flex:0.5;">
                  <button class="btn" id="add-partner-to-unit-btn">إضافة</button>
                  <span class="badge" id="ud-partners-sum">0 %</span>
              </div>
          </div>
      </div>
    `;

    document.getElementById('back-to-units-btn').addEventListener('click', () => nav('units'));

    document.getElementById('add-partner-to-unit-btn').addEventListener('click', () => {
      const partnerId = document.getElementById('ud-pr-select').value;
      const percent = parseNumber(document.getElementById('ud-pr-percent').value);
      if(!partnerId || !(percent > 0)) return alert('الرجاء اختيار شريك وإدخال نسبة صحيحة.');
      if(state.unitPartners.some(up => up.unitId === unitId && up.partnerId === partnerId)) return alert('هذا الشريك تم إضافته بالفعل لهذه الوحدة.');

      const existingPartners = state.unitPartners.filter(up => up.unitId === unitId);
      const currentTotalPercent = existingPartners.reduce((sum, p) => sum + Number(p.percent), 0);
      if (currentTotalPercent + percent > 100) {
          return alert(`خطأ: لا يمكن إضافة هذه النسبة. الإجمالي الحالي هو ${currentTotalPercent}%. إضافة ${percent}% سيجعل المجموع يتجاوز 100%.`);
      }

      saveState();
      const link = {id: uid('UP'), unitId, partnerId, percent};
      logAction('ربط شريك بوحدة', { unitId, partnerId, percent });
      state.unitPartners.push(link);
      persist();
      drawPartners();
    });

    drawPartners();
  } catch (err) {
    alert('حدث خطأ أثناء عرض تفاصيل الوحدة. الرجاء إبلاغ المطور بالتفاصيل التالية:\n\n' + err.stack);
    console.error("Error in renderUnitDetails:", err);
  }
}

import { state, saveState } from '../state.js';
import { uid, exportCSV } from '../helpers.js';
import { custById, logAction } from '../state-utils.js';
import { table, printHTML } from '../ui.js';
import { persist } from '../data.js';
import { nav } from '../app.js';
import { calcRemaining } from './units.js';

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
      // Special case to re-render the unit details view
      nav('unit-details', itemToDelete.unitId);
    } else {
      nav(coll);
    }
  }
}

function inlineUpd(coll,id,key,val){
  saveState();
  const o=state[coll].find(x=>x.id===id);
  if(o){
    const oldValue = o[key];
    o[key]=val;
    logAction(`تعديل مباشر في ${coll}`, { collection: coll, id, key, oldValue, newValue: val });
    persist();
  }
};

function addCustomer(draw) {
    const name = document.getElementById('c-name').value.trim();
    const phone = document.getElementById('c-phone').value.trim();
    const nationalId = document.getElementById('c-nationalId').value.trim();
    const address = document.getElementById('c-address').value.trim();
    const status = document.getElementById('c-status').value;
    const notes = document.getElementById('c-notes').value.trim();

    if(!name || !phone) return alert('الرجاء إدخال الاسم ورقم الهاتف على الأقل.');
    if(state.customers.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      return alert('عميل بنفس الاسم موجود بالفعل. الرجاء استخدام اسم مختلف.');
    }

    saveState();
    const newCustomer = { id: uid('C'), name, phone, nationalId, address, status, notes };
    logAction('إضافة عميل جديد', { id: newCustomer.id, name: newCustomer.name });
    state.customers.push(newCustomer);
    persist();

    // Reset form
    document.getElementById('c-name').value = '';
    document.getElementById('c-phone').value = '';
    document.getElementById('c-nationalId').value = '';
    document.getElementById('c-address').value = '';
    document.getElementById('c-notes').value = '';

    draw();
}

function expCustomers() {
    const headers = ['الاسم','الهاتف','الرقم القومي','العنوان','الحالة','ملاحظات'];
    const rows = state.customers.map(c=>[c.name||'', c.phone||'', c.nationalId||'', c.address||'', c.status||'', c.notes||'']);
    exportCSV(headers, rows, 'customers.csv');
}

function printCustomers() {
    const headers = ['الاسم','الهاتف','الرقم القومي','العنوان','الحالة'];
    const rows=state.customers.map(c=>`<tr><td>${c.name||''}</td><td>${c.phone||''}</td><td>${c.nationalId||''}</td><td>${c.address||''}</td><td>${c.status||''}</td></tr>`).join('');
    printHTML('تقرير العملاء', `<h1>تقرير العملاء</h1><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`);
}

export function renderCustomers(){
  const view = document.getElementById('view');
  let sort={idx:0,dir:'asc'};

  function draw(){
    const q=(document.getElementById('c-q')?.value || '').trim().toLowerCase();
    let list=state.customers.slice();
    if(q) {
      list=list.filter(c=> {
        const searchable = `${c.name||''} ${c.phone||''} ${c.nationalId||''} ${c.address||''} ${c.status||''}`.toLowerCase();
        return searchable.includes(q);
      });
    }
    list.sort((a,b)=>{
      const colsA=[a.name||'', a.phone||'', a.nationalId||'', a.status||''];
      const colsB=[b.name||'', b.phone||'', b.nationalId||'', b.status||''];
      return (colsA[sort.idx]+'').localeCompare(colsB[sort.idx]+'')*(sort.dir==='asc'?1:-1);
    });
    const rows=list.map(c=>[
      `<a href="#" data-navigo data-navigo-id="customer-details" data-navigo-param="${c.id}">${c.name||''}</a>`,
      c.phone||'',
      c.nationalId||'',
      c.status||'نشط',
      `<button class="btn secondary" data-del-customer-id="${c.id}">حذف</button>`
    ]);
    document.getElementById('c-list').innerHTML=table(['الاسم','الهاتف','الرقم القومي','الحالة',''], rows, sort, ns=>{sort=ns;draw();});

    // Add event listeners for delete buttons
    document.querySelectorAll('[data-del-customer-id]').forEach(button => {
        button.addEventListener('click', (e) => {
            const customerId = e.currentTarget.dataset.delCustomerId;
            delRow('customers', customerId);
        });
    });

    // Add event listeners for navigation links
    document.querySelectorAll('[data-navigo-id]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const { navigoId, navigoParam } = e.currentTarget.dataset;
            nav(navigoId, navigoParam);
        });
    });
  }

  view.innerHTML=`
  <div class="grid grid-2">
    <div class="card">
      <h3>إضافة عميل</h3>
      <div class="grid grid-2" style="gap: 10px;">
        <input class="input" id="c-name" placeholder="اسم العميل">
        <input class="input" id="c-phone" placeholder="الهاتف">
        <input class="input" id="c-nationalId" placeholder="الرقم القومي">
        <input class="input" id="c-address" placeholder="العنوان">
      </div>
      <select class="select" id="c-status" style="margin-top:10px;"><option value="نشط">نشط</option><option value="موقوف">موقوف</option></select>
      <textarea class="input" id="c-notes" placeholder="ملاحظات" style="margin-top:10px;" rows="2"></textarea>
      <button class="btn" style="margin-top:10px;" id="add-customer-btn">حفظ</button>
    </div>
    <div class="card">
      <h3>العملاء</h3>
      <div class="tools">
        <input class="input" id="c-q" placeholder="بحث..." oninput="draw()">
        <button class="btn secondary" id="exp-customers-btn">CSV</button>
        <label class="btn secondary"><input type="file" id="c-imp" accept=".csv" style="display:none">استيراد CSV</label>
        <button class="btn" id="print-customers-btn">طباعة PDF</button>
      </div>
      <div id="c-list"></div>
    </div>
  </div>`;

  document.getElementById('add-customer-btn').addEventListener('click', () => addCustomer(draw));
  document.getElementById('exp-customers-btn').addEventListener('click', expCustomers);
  document.getElementById('print-customers-btn').addEventListener('click', printCustomers);

  document.getElementById('c-imp').onchange=(e)=>{
    const f=e.target.files[0]; if(!f) return;
    const r=new FileReader();
    r.onload=()=>{
      saveState();
      const lines=String(r.result).split(/\r?\n/).slice(1);
      lines.forEach(line=>{
        const [name,phone,nationalId,address,status,notes]=line.split(',').map(x=>x?.replace(/^"|"$/g,'')||'');
        if(name) state.customers.push({id:uid('C'),name,phone,nationalId,address,status,notes});
      });
      persist(); draw();
    };
    r.readAsText(f,'utf-8');
  };

  draw();
}

export function renderCustomerDetails(customerId) {
    const view = document.getElementById('view');
    const customer = custById(customerId);
    if (!customer) {
        view.innerHTML = `<div class="card"><p>لم يتم العثور على العميل.</p></div>`;
        return;
    }

    const customerContracts = state.contracts.filter(c => c.customerId === customerId);
    let totalPaid = 0;
    let totalDebt = 0;
    let totalValue = 0;

    customerContracts.forEach(c => {
        const unit = state.units.find(u => u.id === c.unitId);
        if (!unit) return;

        const remaining = calcRemaining(unit);
        const value = c.totalPrice || 0;
        const paid = value - remaining;

        totalValue += value;
        totalPaid += paid;
        totalDebt += remaining;
    });

    const kpiHTML = `
        <div class="card"><h4>إجمالي قيمة العقود</h4><div class="big">${egp(totalValue)}</div></div>
        <div class="card"><h4>إجمالي المدفوع</h4><div class="big" style="color:var(--ok);">${egp(totalPaid)}</div></div>
        <div class="card"><h4>إجمالي المديونية</h4><div class="big" style="color:var(--warn);">${egp(totalDebt)}</div></div>
    `;

    const contractRows = customerContracts.map(c => [
        c.code,
        (state.units.find(u => u.id === c.unitId) || {}).code || '—',
        c.totalPrice,
        `<button class="btn" data-navigo-id="contract-details" data-navigo-param="${c.id}">عرض التفاصيل</button>`
    ]);

    view.innerHTML = `
        <div class="card">
            <div class="header" style="justify-content: space-between;">
                <h3>تفاصيل العميل: ${customer.name}</h3>
                <button class="btn secondary" id="back-to-customers">⬅️ العودة للعملاء</button>
            </div>
            <div class="grid grid-3" style="margin-top:16px;">
                <p><strong>الهاتف:</strong> <span contenteditable="true" data-inline-edit='${JSON.stringify({coll: 'customers', id: customer.id, key: 'phone'})}'>${customer.phone || ''}</span></p>
                <p><strong>الرقم القومي:</strong> <span contenteditable="true" data-inline-edit='${JSON.stringify({coll: 'customers', id: customer.id, key: 'nationalId'})}'>${customer.nationalId || ''}</span></p>
                <p><strong>الحالة:</strong> <span contenteditable="true" data-inline-edit='${JSON.stringify({coll: 'customers', id: customer.id, key: 'status'})}'>${customer.status || ''}</span></p>
                <p style="grid-column: span 3;"><strong>العنوان:</strong> <span contenteditable="true" data-inline-edit='${JSON.stringify({coll: 'customers', id: customer.id, key: 'address'})}'>${customer.address || ''}</span></p>
                <p style="grid-column: span 3;"><strong>ملاحظات:</strong> <span contenteditable="true" data-inline-edit='${JSON.stringify({coll: 'customers', id: customer.id, key: 'notes'})}'>${customer.notes || ''}</span></p>
            </div>
        </div>

        <div class="grid grid-3" style="margin-top:16px;">
            ${kpiHTML}
        </div>

        <div class="card" style="margin-top:16px;">
            <h4>عقود العميل</h4>
            ${table(['كود العقد', 'الوحدة', 'السعر', ''], contractRows)}
        </div>
    `;

    document.getElementById('back-to-customers').addEventListener('click', () => nav('customers'));

    document.querySelectorAll('[data-inline-edit]').forEach(el => {
        el.addEventListener('blur', (e) => {
            const { coll, id, key } = JSON.parse(e.currentTarget.dataset.inlineEdit);
            inlineUpd(coll, id, key, e.currentTarget.textContent);
        });
    });

    document.querySelectorAll('[data-navigo-id]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const { navigoId, navigoParam } = e.currentTarget.dataset;
            nav(navigoId, navigoParam);
        });
    });
}

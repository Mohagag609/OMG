import { state, saveState } from '../state.js';
import { egp, today } from '../helpers.js';
import { partnerById, getUnitDisplayName, unitById } from '../state-utils.js';
import { table } from '../ui.js';
import { persist } from '../data.js';

function payPartnerDebt(debtId, draw) {
    const debt = state.partnerDebts.find(d => d.id === debtId);
    if(!debt) return alert('لم يتم العثور على الدين.');
    if(confirm(`هل تؤكد سداد هذا الدين بمبلغ ${egp(debt.amount)}؟`)){
        saveState();
        debt.status = 'مدفوع';
        debt.paymentDate = today();
        persist();
        draw();
    }
}

export function renderPartnerDebts(){
  const view = document.getElementById('view');
  let sort = { idx: 3, dir: 'asc' };

  function draw(){
    const q = (document.getElementById('pd-q')?.value || '').trim().toLowerCase();
    let list = state.partnerDebts.slice();
    if(q) {
      list = list.filter(d => {
        const paying = partnerById(d.payingPartnerId)?.name || '';
        const owed = partnerById(d.owedPartnerId)?.name || '';
        const unit = getUnitDisplayName(unitById(d.unitId)) || '';
        const searchable = `${paying} ${owed} ${unit} ${d.status}`.toLowerCase();
        return searchable.includes(q);
      });
    }

    list.sort((a,b)=>{
      const pA = partnerById(a.payingPartnerId)?.name || '';
      const oA = partnerById(a.owedPartnerId)?.name || '';
      const uA = getUnitDisplayName(unitById(a.unitId));
      const colsA = [pA, oA, uA, a.dueDate, a.amount, a.status];

      const pB = partnerById(b.payingPartnerId)?.name || '';
      const oB = partnerById(b.owedPartnerId)?.name || '';
      const uB = getUnitDisplayName(unitById(b.unitId));
      const colsB = [pB, oB, uB, b.dueDate, b.amount, b.status];

      const valA = colsA[sort.idx];
      const valB = colsB[sort.idx];

      if (typeof valA === 'number') {
        return (valA - valB) * (sort.dir === 'asc' ? 1 : -1);
      }
      return (valA+'').localeCompare(valB+'') * (sort.dir === 'asc' ? 1 : -1);
    });

    const rows = list.map(d => {
      const paying = partnerById(d.payingPartnerId)?.name || 'محذوف';
      const owed = partnerById(d.owedPartnerId)?.name || 'محذوف';
      const unit = getUnitDisplayName(unitById(d.unitId));
      const payButton = d.status !== 'مدفوع' ? `<button class="btn ok" data-pay-debt="${d.id}">تسجيل السداد</button>` : 'تم السداد';
      return [paying, owed, unit, d.dueDate, egp(d.amount), d.status, payButton];
    });
    const headers = ['الشريك الدافع', 'الشريك المستحق', 'الوحدة', 'تاريخ الاستحقاق', 'المبلغ', 'الحالة', ''];
    document.getElementById('pd-list').innerHTML = table(headers, rows, sort, (ns) => { sort = ns; draw(); });

    document.querySelectorAll('[data-pay-debt]').forEach(b => b.addEventListener('click', e => payPartnerDebt(e.target.dataset.payDebt, draw)));
  }

  view.innerHTML = `
    <div class="card">
        <h3>ديون الشركاء</h3>
        <p style="font-size:13px; color:var(--muted);">هذه هي الديون التي نشأت بين الشركاء نتيجة عمليات إرجاع الوحدات.</p>
        <div class="tools">
            <input class="input" id="pd-q" placeholder="بحث باسم الشريك أو الوحدة..." oninput="draw()">
        </div>
        <div id="pd-list"></div>
    </div>
  `;

  draw();
}

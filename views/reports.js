import { state } from '../state.js';
import { egp } from '../helpers.js';
import { getUnitDisplayName, custById, unitById } from '../state-utils.js';
import { table, printHTML } from '../ui.js';
import { nav } from '../app.js';

const REPORT_DEFINITIONS = {
  'المالية': [
    {
      id: 'payments_monthly',
      title: 'مدفوعات شهرية',
      description: 'عرض إجمالي المدفوعات مجمعة حسب الشهر.',
      icon: '📅'
    },
    {
      id: 'cashflow',
      title: 'التدفقات النقدية العامة',
      description: 'كشف حساب يوضح كل الحركات المالية الداخلة والخارجة.',
      icon: '💰'
    }
  ],
  'الشركاء': [
    {
      id: 'partner_summary',
      title: 'ملخص أرباح الشركاء',
      description: 'عرض ملخص دخل ومصروفات وصافي ربح كل شريك.',
      icon: '👥'
    },
    {
      id: 'partner_profits',
      title: 'تفاصيل أرباح الشركاء',
      description: 'عرض تفصيلي لكل دفعة وكيف تم توزيعها كأرباح على الشركاء.',
      icon: '📊'
    },
    {
      id: 'partner_cashflow',
      title: 'ملخص تدفقات الشركاء',
      description: 'عرض شهري لحصة الأرباح الخاصة بشريك معين.',
      icon: '📈'
    }
  ],
  'المتابعة': [
    {
      id: 'inst_due',
      title: 'كل الأقساط المستحقة',
      description: 'قائمة بكل الأقساط القادمة التي لم يتم سدادها بعد.',
      icon: '🔔'
    },
    {
      id: 'inst_overdue',
      title: 'الأقساط المتأخرة فقط',
      description: 'عرض الأقساط التي تجاوزت تاريخ استحقاقها ولم تسدد.',
      icon: '⚠️'
    },
    {
      id: 'cust_activity',
      title: 'نشاط العملاء',
      description: 'تقرير يوضح عدد الوحدات وإجمالي المدفوعات لكل عميل.',
      icon: '🧍'
    },
    {
      id: 'units_status',
      title: 'حالة الوحدات',
      description: 'ملخص لعدد الوحدات المتاحة، المباعة، والمحجوزة.',
      icon: '🏠'
    }
  ]
};

let lastReportData = null;

function printLastReport() {
    if (lastReportData) {
        const {title, headers, rows} = lastReportData;
        const head = `<tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr>`;
        const body = `<tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>`;
        printHTML(title, `<h1>${title}</h1><table><thead>${head}</thead>${body}</table>`);
    } else {
        alert('لا توجد بيانات تقرير للطباعة. يرجى إنشاء تقرير أولاً.');
    }
}

function runReport(type){
  const from=document.getElementById('rep-from')?.value;
  const to=document.getElementById('rep-to')?.value;
  let title='', headers=[], rows=[];
  const out=document.getElementById('rep-out'); out.innerHTML='';
  switch(type){
    case 'units_status':
      title='تقرير حالة الوحدات'; headers=['الحالة','العدد','إجمالي السعر'];
      const stats={}; state.units.forEach(u=>{ stats[u.status]=(stats[u.status]||{c:0,p:0}); stats[u.status].c++; stats[u.status].p+=Number(u.totalPrice||0); });
      rows=Object.keys(stats).map(k=>[k,stats[k].c,egp(stats[k].p)]);
      break;
    case 'cust_activity':
      title='تقرير نشاط العملاء'; headers=['العميل','عدد الوحدات','إجمالي المدفوعات'];
      const custs={}; state.contracts.forEach(c=>{ custs[c.customerId]=(custs[c.customerId]||{u:new Set(),p:0}); custs[c.customerId].u.add(c.unitId); });

      let custVouchers=state.vouchers.filter(v=>v.type === 'receipt');
      if(from) custVouchers=custVouchers.filter(p=>p.date>=from);
      if(to) custVouchers=custVouchers.filter(p=>p.date<=to);
      custVouchers.forEach(p=>{
        const ct=state.contracts.find(c=>c.unitId===p.linked_ref || state.installments.find(i => i.id === p.linked_ref && i.unitId === c.unitId));
        if(ct&&ct.customerId&&custs[ct.customerId]) custs[ct.customerId].p+=Number(p.amount||0);
      });
      rows=Object.keys(custs).map(k=>[(custById(k)||{}).name||k,custs[k].u.size,egp(custs[k].p)]);
      break;
    case 'inst_due':
      title='تقرير الأقساط المستحقة'; headers=['الوحدة','العميل','المبلغ','تاريخ الاستحقاق'];
      let inst=state.installments.filter(i=>i.status!=='مدفوع');
      if(from) inst=inst.filter(i=>i.dueDate>=from); if(to) inst=inst.filter(i=>i.dueDate<=to);
      rows=inst.map(i=>[getUnitDisplayName(unitById(i.unitId)),(custById(state.contracts.find(c=>c.unitId===i.unitId)?.customerId)||{}).name,egp(i.amount),i.dueDate]);
      break;
    case 'inst_overdue':
      title='تقرير الأقساط المتأخرة فقط';
      headers=['الوحدة', 'العميل', 'المبلغ', 'تاريخ الاستحقاق', 'أيام التأخير'];
      const today = new Date();
      today.setHours(0,0,0,0);
      let overdueInst = state.installments.filter(i => {
          return i.status !== 'مدفوع' && i.dueDate && new Date(i.dueDate) < today;
      });
      if (from) overdueInst = overdueInst.filter(i => i.dueDate >= from);
      if (to) overdueInst = overdueInst.filter(i => i.dueDate <= to);
      rows = overdueInst.map(i => {
        const delay = Math.floor((today - new Date(i.dueDate)) / (1000 * 60 * 60 * 24));
        return [
          getUnitDisplayName(unitById(i.unitId)),
          (custById(state.contracts.find(c=>c.unitId===i.unitId)?.customerId)||{}).name,
          egp(i.amount),
          i.dueDate,
          `${delay} يوم`
        ]
      });
      break;
    case 'payments_monthly':
      title='تقرير المدفوعات الشهرية'; headers=['الشهر','إجمالي المدفوعات'];
      let pays=state.vouchers.filter(v=>v.type === 'receipt');
      if(from) pays=pays.filter(p=>p.date>=from); if(to) pays=pays.filter(p=>p.date<=to);
      const months={}; pays.forEach(p=>{ const ym=p.date.slice(0,7); months[ym]=(months[ym]||0)+Number(p.amount||0); });
      const reportData = Object.keys(months).sort().map(k=>({month: k, total: months[k]}));
      rows=reportData.map(r=>[r.month, egp(r.total)]);

      lastReportData = { title, headers, rows: reportData.map(r=>[r.month, r.total]) };
      const bodyHTML=`<canvas id="reportChart" height="150"></canvas><hr><h1>${title}</h1>`+table(headers,rows);
      out.innerHTML=bodyHTML + `<div class="tools"><button class="btn" id="print-report-btn">طباعة PDF</button></div>`;
      document.getElementById('print-report-btn').addEventListener('click', printLastReport);

      new Chart(document.getElementById('reportChart').getContext('2d'), {
        type: 'bar',
        data: {
          labels: reportData.map(r => r.month),
          datasets: [{
            label: 'إجمالي المدفوعات',
            data: reportData.map(r => r.total),
            backgroundColor: '#16a34a',
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { ticks: { callback: value => egp(value).replace('ج.م', '') } } }
        }
      });
      return;
    case 'partner_summary':
      title = 'ملخص أرباح الشركاء';
      headers = ['الشريك', 'إجمالي الدخل', 'إجمالي المصروفات', 'صافي الربح'];
      let summary = {};
      state.partners.forEach(p => {
        summary[p.id] = { name: p.name, income: 0, expense: 0 };
      });

      let trans_sum = state.vouchers.slice();
      if(from) trans_sum=trans_sum.filter(t=>t.date>=from);
      if(to) trans_sum=trans_sum.filter(t=>t.date<=to);

      trans_sum.forEach(v => {
          const contract = state.contracts.find(c => c.id === v.linked_ref || state.installments.find(i=>i.id === v.linked_ref && i.unitId === c.unitId));
          if(!contract) return;
          const unitPartners = state.unitPartners.filter(up => up.unitId === contract.unitId);
          unitPartners.forEach(link => {
              if (summary[link.partnerId]) {
                  const share = link.percent / 100;
                  if (v.type === 'receipt') {
                      summary[link.partnerId].income += v.amount * share;
                  } else if (v.description.includes('عمولة سمسار')) {
                      summary[link.partnerId].expense += v.amount * share;
                  }
              }
          });
      });

      rows = Object.values(summary).map(s => [
        s.name,
        egp(s.income),
        egp(s.expense),
        egp(s.income - s.expense)
      ]);
      break;
    case 'partner_profits':
      title='تقرير أرباح الشركاء'; headers=['الشريك','الوحدة','إجمالي الدفعة','نسبة الشريك','ربح الشريك'];
      let partnerPays=state.vouchers.filter(v=>v.type === 'receipt');
      if(from) partnerPays=partnerPays.filter(p=>p.date>=from); if(to) partnerPays=partnerPays.filter(p=>p.date<=to);
      const partnerIdForProfit = document.getElementById('rep-partner-sel')?.value;
      partnerPays.forEach(p=>{
        const contract = state.contracts.find(c => c.id === p.linked_ref || state.installments.find(i=>i.id === p.linked_ref && i.unitId === c.unitId));
        if(!contract) return;
        const links=state.unitPartners.filter(up=>up.unitId===contract.unitId && (!partnerIdForProfit || up.partnerId === partnerIdForProfit));
        links.forEach(l=>{
          const profit=Math.round((p.amount*l.percent/100)*100)/100;
          rows.push([(partnerById(l.partnerId)||{}).name||'—',getUnitDisplayName(unitById(contract.unitId)),egp(p.amount),l.percent+'%',egp(profit)]);
        });
      });
      break;
    case 'partner_cashflow':
      title = 'تقرير ملخص تدفقات الشريك';
      headers = ['الشهر', 'إجمالي حصة الأرباح'];
      const partnerId = document.getElementById('rep-partner-sel')?.value;
      if (!partnerId) {
          out.innerHTML = '<p style=\"color:var(--warn)\">الرجاء اختيار شريك لعرض هذا التقرير.</p>';
          return;
      }
      const partner = partnerById(partnerId);
      title += ` - ${partner.name}`;

      let paysForPartner = state.vouchers.filter(v=>v.type === 'receipt');
      if (from) paysForPartner = paysForPartner.filter(p => p.date >= from);
      if (to) paysForPartner = paysForPartner.filter(p => p.date <= to);

      const monthlyProfits = {};
      paysForPartner.forEach(p => {
          const contract = state.contracts.find(c => c.id === p.linked_ref || state.installments.find(i=>i.id === p.linked_ref && i.unitId === c.unitId));
          if(!contract) return;
          const link = state.unitPartners.find(up => up.unitId === contract.unitId && up.partnerId === partnerId);
          if (link) {
              const profit = (p.amount * link.percent / 100);
              const month = p.date.slice(0, 7);
              monthlyProfits[month] = (monthlyProfits[month] || 0) + profit;
          }
      });

      rows = Object.keys(monthlyProfits).sort().map(month => [
          month,
          egp(monthlyProfits[month])
      ]);
      break;
    case 'cashflow':
      title='تقرير التدفقات النقدية العامة'; headers=['التاريخ','البيان','مدين','دائن','الرصيد'];
      let trans=[];
      let cashflowVouchers=state.vouchers.slice();
      if(from) cashflowVouchers=cashflowVouchers.filter(p=>p.date>=from); if(to) cashflowVouchers=cashflowVouchers.filter(p=>p.date<=to);
      cashflowVouchers.forEach(v => {
          if (v.type === 'receipt') {
              trans.push({d:v.date, n:v.description, i:v.amount, o:0});
          } else {
              trans.push({d:v.date, n:v.description, i:0, o:v.amount});
          }
      });

      trans.sort((a,b)=>a.d.localeCompare(b.d));
      let bal=0;
      rows=trans.map(t=>{ bal+=Number(t.i||0)-Number(t.o||0); return [t.d,t.n,egp(t.i),egp(t.o),egp(bal)]; });
      break;
  }
  lastReportData = { title, headers, rows };
  const bodyHTML=`<h1>${title}</h1>`+table(headers,rows);
  out.innerHTML=bodyHTML + `<div class="tools"><button class="btn" id="print-report-btn">طباعة PDF</button></div>`;
  document.getElementById('print-report-btn').addEventListener('click', printLastReport);
};

function renderReportFilterScreen(reportId) {
  const view = document.getElementById('view');
  let report = null;
  for (const category in REPORT_DEFINITIONS) {
    const found = REPORT_DEFINITIONS[category].find(r => r.id === reportId);
    if (found) {
      report = found;
      break;
    }
  }

  if (!report) {
    view.innerHTML = `
        <div class="card">
            <h2>خطأ</h2>
            <p>لم يتم العثور على التقرير المطلوب.</p>
            <button class="btn" id="back-to-reports-btn">العودة إلى التقارير</button>
        </div>
    `;
    document.getElementById('back-to-reports-btn').addEventListener('click', () => nav('reports'));
    return;
  }

  view.innerHTML = `
    <div class="card">
        <div class="header">
            <h3>فلترة تقرير: ${report.title}</h3>
            <button class="btn secondary" id="back-to-reports-btn">⬅️ العودة</button>
        </div>
        <div id="rep-filters-container" class="grid grid-4" style="gap:8px; align-items: end; margin: 16px 0;">
        </div>
        <div class="tools">
            <button class="btn" id="generate-report-btn" style="flex:1; padding: 12px; font-size: 16px;">إنشاء التقرير</button>
        </div>
        <hr>
        <div id="rep-out"></div>
    </div>
  `;

  document.getElementById('back-to-reports-btn').addEventListener('click', () => nav('reports'));
  const filtersContainer = document.getElementById('rep-filters-container');

  const needsDates = ['payments_monthly', 'cashflow', 'partner_profits', 'inst_due', 'inst_overdue', 'cust_activity', 'partner_cashflow', 'partner_summary'];
  const needsPartner = ['partner_profits', 'partner_cashflow', 'partner_summary'];

  if (needsDates.includes(reportId)) {
    filtersContainer.innerHTML += `
        <input type="date" class="input" id="rep-from" placeholder="من تاريخ">
        <input type="date" class="input" id="rep-to" placeholder="إلى تاريخ">
    `;
  }
  if (needsPartner.includes(reportId) && reportId !== 'partner_summary') {
    filtersContainer.innerHTML += `
      <select id="rep-partner-sel" class="select">
          <option value="">اختر شريك...</option>
          ${state.partners.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
      </select>
    `;
  }

  document.getElementById('generate-report-btn').onclick = () => {
    runReport(reportId);
  };
}

function renderReportCards(category) {
    const reports = REPORT_DEFINITIONS[category];
    const gridEl = document.querySelector('.report-cards-grid');
    if (!gridEl) return;

    gridEl.innerHTML = reports.map(report => `
        <div class="report-card" data-report-id="${report.id}">
            <div class="report-card-icon">${report.icon}</div>
            <div class="report-card-body">
                <h4>${report.title}</h4>
                <p>${report.description}</p>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.report-card').forEach(card => {
        card.onclick = () => {
            const reportId = card.dataset.reportId;
            renderReportFilterScreen(reportId);
        };
    });
}

export function renderReports() {
  const view = document.getElementById('view');
  const categories = Object.keys(REPORT_DEFINITIONS);
  let activeCategory = categories[0];

  view.innerHTML = `
    <div class="reports-layout">
      <div class="report-cards-grid">
      </div>
      <div class="report-categories">
        <h3>الفئات</h3>
        <ul id="report-category-list"></ul>
      </div>
    </div>
  `;

  const categoryListEl = document.getElementById('report-category-list');

  function selectCategory(category) {
    activeCategory = category;
    document.querySelectorAll('#report-category-list li').forEach(li => {
      if (li.dataset.category === category) {
        li.classList.add('active');
      } else {
        li.classList.remove('active');
      }
    });
    renderReportCards(category);
  }

  categories.forEach(category => {
    const li = document.createElement('li');
    li.textContent = category;
    li.dataset.category = category;
    li.onclick = () => selectCategory(category);
    categoryListEl.appendChild(li);
  });

  if (categoryListEl.firstChild) {
    selectCategory(activeCategory);
  }
}

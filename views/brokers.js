import { state, saveState } from '../state.js';
import { uid, egp, today } from '../helpers.js';
import { brokerById, logAction, getUnitDisplayName, unitById } from '../state-utils.js';
import { table, showModal } from '../ui.js';
import { persist } from '../data.js';
import { nav } from '../app.js';

function addBroker(draw) {
    const name = document.getElementById('b-name').value.trim();
    const phone = document.getElementById('b-phone').value.trim();
    const notes = document.getElementById('b-notes').value.trim();

    if (!name) return alert('الرجاء إدخال اسم السمسار.');
    if (state.brokers.some(b => b.name.toLowerCase() === name.toLowerCase())) {
        return alert('هذا السمسار موجود بالفعل.');
    }
    saveState();
    const newBroker = { id: uid('B'), name, phone, notes };
    state.brokers.push(newBroker);
    logAction('إضافة سمسار جديد', { id: newBroker.id, name: newBroker.name });
    persist();
    draw();
    document.getElementById('b-name').value = '';
    document.getElementById('b-phone').value = '';
    document.getElementById('b-notes').value = '';
}

function payBrokerDue(dueId) {
    const due = state.brokerDues.find(d => d.id === dueId);
    if (!due || due.status === 'paid') {
        return alert('هذه العمولة غير صالحة للدفع.');
    }

    const contract = state.contracts.find(c => c.id === due.contractId);
    if (!contract) {
        return alert('لم يتم العثور على العقد المرتبط بهذه العمولة.');
    }

    const safeId = contract.commissionSafeId;
    if (!safeId) {
        return alert('لم يتم تحديد خزنة على العقد الأصلي. لا يمكن إتمام الدفع.');
    }

    const safe = state.safes.find(s => s.id === safeId);
    if (!safe) {
        return alert('لم يتم العثور على الخزنة المرتبطة بالعقد.');
    }

    const content = `
        <p>سيتم دفع مبلغ <strong>${egp(due.amount)}</strong> للسمسار <strong>${due.brokerName}</strong>.</p>
        <p>سيتم خصم المبلغ من خزنة العقد: <strong>${safe.name}</strong> (الرصيد الحالي: ${egp(safe.balance)})</p>
        <p style="color:var(--warn)">هل أنت متأكد؟</p>
    `;

    showModal('تأكيد دفع عمولة سمسار', content, () => {
        if (safe.balance < due.amount) {
            alert(`رصيد الخزنة "${safe.name}" غير كافٍ.`);
            return false;
        }

        saveState();
        safe.balance -= due.amount;
        due.status = 'paid';
        due.paymentDate = today();
        due.paidFromSafeId = safeId;

        const unit = unitById(contract.unitId);
        const newVoucher = {
            id: uid('V'),
            type: 'payment',
            date: today(),
            amount: due.amount,
            safeId: safeId,
            description: `صرف عمولة سمسار للوحدة ${getUnitDisplayName(unit)}`,
            beneficiary: due.brokerName,
            linked_ref: due.id
        };
        state.vouchers.push(newVoucher);

        logAction('دفع عمولة سمسار مستحقة', { brokerDueId: due.id, safeId: safeId, amount: due.amount });

        persist();
        nav(currentView, currentParam);
        return true;
    });
};

export function renderBrokers() {
    const view = document.getElementById('view');
    let activeTab = 'list';

    function draw() {
        if (activeTab === 'list') {
            drawListTab();
        } else {
            drawDuesTab();
        }
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === activeTab);
        });
    }

    function drawListTab() {
        const q = (document.getElementById('b-q')?.value || '').trim().toLowerCase();
        let list = state.brokers.slice();
        if (q) {
            list = list.filter(b => (b.name || '').toLowerCase().includes(q) || (b.phone || '').toLowerCase().includes(q));
        }

        const rows = list.map(b => [
            `<a href="#" data-nav-details="${b.id}">${b.name || ''}</a>`,
            `<span contenteditable="true" data-inline-edit='${JSON.stringify({coll: 'brokers', id: b.id, key: 'phone'})}'>${b.phone || ''}</span>`,
            `<span contenteditable="true" data-inline-edit='${JSON.stringify({coll: 'brokers', id: b.id, key: 'notes'})}'>${b.notes || ''}</span>`,
            `<button class="btn secondary" data-del-broker="${b.id}">حذف</button>`
        ]);

        document.getElementById('brokers-content').innerHTML = `
            <div class="grid grid-2">
                <div class="card">
                    <h3>إضافة سمسار</h3>
                    <input class="input" id="b-name" placeholder="اسم السمسار">
                    <input class="input" id="b-phone" placeholder="الهاتف" style="margin-top:10px;">
                    <textarea class="input" id="b-notes" placeholder="ملاحظات" style="margin-top:10px;" rows="2"></textarea>
                    <button class="btn" style="margin-top:10px;" id="add-broker-btn">حفظ</button>
                </div>
                <div class="card">
                    <h3>قائمة السماسرة</h3>
                    <div class="tools">
                        <input class="input" id="b-q" placeholder="بحث..." oninput="draw()" value="${q}">
                    </div>
                    <div id="b-list">${table(['الاسم', 'الهاتف', 'ملاحظات', ''], rows)}</div>
                </div>
            </div>
        `;

        document.getElementById('add-broker-btn').addEventListener('click', () => addBroker(draw));
    }

    function drawDuesTab() {
        const dueList = state.brokerDues.filter(d => d.status === 'due').sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
        const rows = dueList.map(d => {
            const contract = state.contracts.find(c => c.id === d.contractId);
            return [
                d.brokerName,
                contract ? unitCode(contract.unitId) : '—',
                d.dueDate,
                egp(d.amount),
                `<button class="btn ok" data-pay-due="${d.id}">دفع الآن</button>`
            ];
        });
        document.getElementById('brokers-content').innerHTML = `
            <h3>العمولات المستحقة للدفع</h3>
            ${table(['السمسار', 'الوحدة', 'تاريخ الاستحقاق', 'المبلغ', ''], rows)}
        `;
        document.querySelectorAll('[data-pay-due]').forEach(b => b.addEventListener('click', e => payBrokerDue(e.target.dataset.payDue)));
    }

    view.innerHTML = `
    <div class="card">
        <div class="tabs">
            <button class="tab-btn active" data-tab="list">قائمة السماسرة</button>
            <button class="tab-btn" data-tab="dues">العمولات المستحقة</button>
        </div>
        <div id="brokers-content" style="padding-top: 16px;"></div>
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

export function renderBrokerDetails(brokerId) {
    const view = document.getElementById('view');
    const broker = brokerById(brokerId);
    if (!broker) {
        return nav('brokers');
    }

    const brokerDues = state.brokerDues.filter(d => d.brokerName === broker.name);
    const dueAmount = brokerDues.filter(d => d.status === 'due').reduce((sum, d) => sum + d.amount, 0);
    const paidAmount = brokerDues.filter(d => d.status === 'paid').reduce((sum, d) => sum + d.amount, 0);

    const dueRows = brokerDues.map(d => {
        const contract = state.contracts.find(c => c.id === d.contractId);
        let payButton = '';
        if (d.status === 'due') {
            payButton = `<button class="btn ok" data-pay-due="${d.id}">دفع الآن</button>`;
        } else {
            payButton = `مدفوعة بتاريخ ${d.paymentDate || 'غير مسجل'}`;
        }
        return [
            contract ? getUnitDisplayName(unitById(contract.unitId)) : '—',
            d.dueDate,
            egp(d.amount),
            d.status,
            payButton
        ];
    });

    view.innerHTML = `
        <div class="card">
            <div class="header">
                <h3>تفاصيل السمسار: ${broker.name}</h3>
                <button class="btn secondary" id="back-to-brokers-btn">⬅️ العودة للسماسرة</button>
            </div>
            <p><strong>الهاتف:</strong> ${broker.phone || '—'}</p>
            <p><strong>ملاحظات:</strong> ${broker.notes || '—'}</p>
        </div>
        <div class="grid grid-2" style="margin-top:16px;">
            <div class="card"><h4>العمولات المستحقة</h4><div class="big" style="color:var(--warn);">${egp(dueAmount)}</div></div>
            <div class="card"><h4>العمولات المدفوعة</h4><div class="big" style="color:var(--ok);">${egp(paidAmount)}</div></div>
        </div>
        <div class="card" style="margin-top:16px;">
            <h4>سجل العمولات</h4>
            ${table(['الوحدة', 'تاريخ الاستحقاق', 'المبلغ', 'الحالة', ''], dueRows)}
        </div>
    `;

    document.getElementById('back-to-brokers-btn').addEventListener('click', () => nav('brokers'));
    document.querySelectorAll('[data-pay-due]').forEach(b => b.addEventListener('click', e => payBrokerDue(e.target.dataset.payDue)));
}

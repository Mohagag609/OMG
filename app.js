import { openDB, getKeyVal, setKeyVal, OBJECT_STORES } from './db.js';
import { state, saveState, updateUndoRedoButtons, setCurrentView, undo, redo, initState } from './state.js';
import { persist, loadStateFromDB, loadFromLocalStorage } from './data.js';
import { applySettings, checkLock } from './state-utils.js';
import { uid } from './helpers.js';

// Import Renderers
import { renderDash, renderOldDash } from './views/dashboard.js';
import { renderCustomers, renderCustomerDetails } from './views/customers.js';
import { renderUnits, renderUnitDetails, renderUnitEdit } from './views/units.js';
import { renderContracts } from './views/contracts.js';
import { renderBrokers, renderBrokerDetails } from './views/brokers.js';
import { renderInstallments } from './views/installments.js';
import { renderVouchers } from './views/vouchers.js';
import { renderPartners, renderPartnerDetails, renderPartnerGroupDetails } from './views/partners.js';
import { renderPartnerDebts } from './views/partner-debts.js';
import { renderTreasury } from './views/treasury.js';
import { renderReports } from './views/reports.js';
import { renderAuditLog } from './views/audit.js';
import { renderBackup } from './views/backup.js';

const routes=[
  {id:'dash',title:'لوحة التحكم',render:renderDash, tab: true},
  {id:'old-dash',title:'لوحة التحكم القديمة',render:renderOldDash, tab: false},
  {id:'customers',title:'العملاء',render:renderCustomers, tab: true},
  {id:'units',title:'الوحدات',render:renderUnits, tab: true},
  {id:'contracts',title:'العقود',render:renderContracts, tab: true},
  {id:'brokers',title:'السماسرة',render:renderBrokers, tab: true},
  {id:'installments',title:'الأقساط',render:renderInstallments, tab: true},
  {id:'vouchers',title:'السندات',render:renderVouchers, tab: true},
  {id:'partners',title:'الشركاء',render:renderPartners, tab: true},
  {id:'treasury',title:'الخزينة',render:renderTreasury, tab: true},
  {id:'reports',title:'التقارير',render:renderReports, tab: true},
  {id:'partner-debts',title:'ديون الشركاء',render:renderPartnerDebts, tab: false},
  {id:'audit', title: 'سجل التغييرات', render: renderAuditLog, tab: true},
  {id:'backup',title:'نسخة احتياطية',render:renderBackup, tab: true},
  {id:'unit-details', title:'تفاصيل الوحدة', render:renderUnitDetails, tab: false},
  {id:'partner-group-details', title:'تفاصيل مجموعة الشركاء', render:renderPartnerGroupDetails, tab: false},
  {id: 'broker-details', title: 'تفاصيل السمسار', render: renderBrokerDetails, tab: false},
  {id: 'partner-details', title: 'تفاصيل الشريك', render: renderPartnerDetails, tab: false},
  {id: 'customer-details', title: 'تفاصيل العميل', render: renderCustomerDetails, tab: false},
  {id: 'unit-edit', title: 'تعديل الوحدة', render: renderUnitEdit, tab: false},
];

export function nav(id, param = null){
  setCurrentView(id, param);
  const route = routes.find(x=>x.id===id); if(!route) return;

  if (route.tab) {
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    const tab = document.getElementById('tab-'+id); if(tab) tab.classList.add('active');
  }

  route.render(param);
}

function createTabs() {
    const tabsContainer = document.getElementById('tabs');
    if (!tabsContainer) return;
    tabsContainer.innerHTML = '';
    routes.forEach(r => {
        if (r.tab) {
            const b = document.createElement('button');
            b.className = 'tab';
            b.id = 'tab-' + r.id;
            b.textContent = r.title;
            b.addEventListener('click', () => nav(r.id));
            tabsContainer.appendChild(b);
        }
    });
}

function setupGlobalEventListeners() {
    document.getElementById('themeSel').value = state.settings.theme || 'dark';
    document.getElementById('fontSel').value = String(state.settings.font || 16);

    document.getElementById('themeSel').addEventListener('change', async (e) => { state.settings.theme = e.target.value; await persist(); });
    document.getElementById('fontSel').addEventListener('change', async (e) => { state.settings.font = Number(e.target.value); await persist(); });
    document.getElementById('lockBtn').addEventListener('click', async () => {
        const pass = prompt('ضع كلمة مرور أو اتركها فارغة لإلغاء القفل', '');
        state.locked = !!pass;
        state.settings.pass = pass || null;
        await persist();
        alert(state.locked ? 'تم تفعيل القفل' : 'تم إلغاء القفل');
        checkLock();
    });
    document.getElementById('undoBtn').addEventListener('click', undo);
    document.getElementById('redoBtn').addEventListener('click', redo);

    document.addEventListener('keydown', (e) => {
        const targetNode = e.target.nodeName.toLowerCase();
        if (targetNode === 'input' || targetNode === 'textarea' || e.target.isContentEditable) return;
        if (e.ctrlKey) {
            if (e.key === 'z') { e.preventDefault(); undo(); }
            else if (e.key === 'y') { e.preventDefault(); redo(); }
        }
    });
}

/* ===== CORE APP INITIALIZATION ===== */
document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('ServiceWorker registered.', reg))
                .catch(err => console.error('ServiceWorker registration failed:', err));
        });
    }

    try {
        await openDB();
        const migrationComplete = await getKeyVal('migrationComplete');
        if (migrationComplete) {
            console.log("Loading state from IndexedDB...");
            Object.assign(state, await loadStateFromDB());
        } else {
            console.log("Checking for localStorage data to migrate...");
            const localStorageState = loadFromLocalStorage();
            if (localStorageState && localStorageState.customers && localStorageState.customers.length > 0) {
                console.log("Migrating data from localStorage to IndexedDB...");
                Object.assign(state, localStorageState);
                await persist();
                console.log("Migration successful.");
            } else {
                console.log("No data to migrate, loading fresh state from DB.");
                Object.assign(state, await loadStateFromDB());
            }
            await setKeyVal('migrationComplete', true);
        }

        OBJECT_STORES.forEach(storeName => {
            if (storeName !== 'keyval' && storeName !== 'settings' && !state[storeName]) {
                state[storeName] = [];
            }
        });
        if (typeof state.settings !== 'object' || state.settings === null) { state.settings = {theme:'dark',font:16, pass:null}; }
        if (!state.locked) { state.locked = false; }
        if (!state.safes || state.safes.length === 0) {
            state.safes = [{ id: uid('S'), name: 'الخزنة الرئيسية', balance: 0 }];
            await persist();
        }

        applySettings();
        setupGlobalEventListeners();
        checkLock();
        saveState();
        initState(nav);
        updateUndoRedoButtons();
        createTabs();
        nav('dash');
    } catch (error) {
        console.error("Failed to initialize the application:", error);
        const viewEl = document.getElementById('view');
        if (viewEl) {
            viewEl.innerHTML = `<div class="card warn"><h3>خطأ فادح</h3><p>لم يتمكن التطبيق من التحميل. قد تكون قاعدة البيانات تالفة أو أن متصفحك لا يدعم IndexedDB.</p><pre>${error.stack}</pre></div>`;
        }
    }
}

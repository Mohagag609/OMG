import { openDB, OBJECT_STORES, setKeyVal, getKeyVal } from './db.js';
import { state } from './state.js';
import { applySettings } from './state-utils.js';
import { uid } from './helpers.js';

/* ===== DATA PERSISTENCE & MIGRATION ===== */
export async function persist() {
    try {
        const db = await openDB();
        const transaction = db.transaction(OBJECT_STORES.filter(s => s !== 'keyval'), 'readwrite');
        const promises = [];
        for (const storeName of OBJECT_STORES) {
            if (storeName === 'keyval') continue;

            const store = transaction.objectStore(storeName);
            // This is a simple but potentially slow strategy: clear and write all.
            // A more advanced strategy would diff the state.
            await (new Promise(res => store.clear().onsuccess = res));

            const dataToStore = state[storeName];
            if (storeName === 'settings') {
                if (dataToStore) {
                    await (new Promise(res => store.put({key: 'appSettings', ...dataToStore}).onsuccess = res));
                }
            } else if (dataToStore && Array.isArray(dataToStore)) {
                for(const item of dataToStore) {
                    if(typeof item === 'object' && item !== null && item.id) {
                       await (new Promise(res => store.put(item).onsuccess = res));
                    }
                }
            }
        }
        await transaction.done;
        applySettings();
    } catch (error) { console.error('Failed to persist state to IndexedDB:', error); }
}

export async function loadStateFromDB() {
    const newState = {};
    const db = await openDB();
    const transaction = db.transaction(OBJECT_STORES.filter(s => s !== 'keyval'), 'readonly');
    const promises = [];
    for (const storeName of OBJECT_STORES) {
        if (storeName === 'keyval') continue;
        const store = transaction.objectStore(storeName);
        promises.push(new Promise((resolve, reject) => {
            const req = store.getAll();
            req.onsuccess = () => {
                if (storeName === 'settings') {
                    newState.settings = req.result.length > 0 ? req.result[0] : {theme:'dark',font:16, pass:null};
                } else {
                    newState[storeName] = req.result;
                }
                resolve();
            };
            req.onerror = (e) => reject(e.target.error);
        }));
    }
    await Promise.all(promises);
    return newState;
}

export function loadFromLocalStorage(){
  const APPKEY_LEGACY='estate_pro_final_v3';
  try{
    const s_str = localStorage.getItem(APPKEY_LEGACY);
    if (!s_str) return null;
    const s = JSON.parse(s_str)||{};
    if (Object.keys(s).length === 0) return null;
    if(s.customers&&s.customers.length>0){s.customers.forEach(c=>{c.nationalId=c.nationalId||'';c.address=c.address||'';c.status=c.status||'نشط';c.notes=c.notes||'';});}
    if(s.units&&s.units.length>0){s.units.forEach(u=>{u.area=u.area||'';u.notes=u.notes||'';u.unitType=u.unitType||'سكني';if(u.plans&&u.plans.length>0){u.totalPrice=u.plans[0].price;}else if(!u.hasOwnProperty('totalPrice')){u.totalPrice=0;}delete u.plans;});}
    if(s.contracts&&s.contracts.length>0){s.contracts.forEach(c=>{c.brokerName=c.brokerName||'';c.commissionSafeId=c.commissionSafeId||null;c.discountAmount=c.discountAmount||0;delete c.planName;});}
    s.safes=s.safes||[];if(s.safes.length===0){s.safes.push({id:uid('S'),name:'الخزنة الرئيسية',balance:0});}else{s.safes.forEach(safe=>{safe.balance=safe.balance||0;});}
    s.auditLog=s.auditLog||[];s.vouchers=s.vouchers||[];
    if(s.payments&&s.payments.length>0&&s.vouchers.length===0){console.log('Migrating payments to vouchers...');s.payments.forEach(p=>{const unit=s.units.find(u=>u.id===p.unitId);const contract=s.contracts.find(c=>c.unitId===p.unitId);const customer=contract?s.customers.find(cust=>cust.id===contract.customerId):null;s.vouchers.push({id:uid('V'),type:'receipt',date:p.date,amount:p.amount,safeId:p.safeId,description:`دفعة للوحدة ${unit?unit.code:'غير معروفة'}`,payer:customer?customer.name:'غير محدد',linked_ref:p.unitId});});s.contracts.forEach(c=>{if(c.brokerAmount>0){const unit=s.units.find(u=>u.id===c.unitId);s.vouchers.push({id:uid('V'),type:'payment',date:c.start,amount:c.brokerAmount,safeId:c.commissionSafeId,description:`عمولة سمسار للوحدة ${unit?unit.code:'غير معروفة'}`,beneficiary:c.brokerName||'سمسار',linked_ref:c.id});}});}
    s.brokerDues=s.brokerDues||[];s.brokers=s.brokers||[];s.partnerGroups=s.partnerGroups||[];
    if(s.brokers.length===0&&(s.contracts.some(c=>c.brokerName)||s.brokerDues.some(d=>d.brokerName))){console.log('Populating brokers list from existing data...');const brokerNames=new Set([...s.contracts.map(c=>c.brokerName),...s.brokerDues.map(d=>d.brokerName)].filter(Boolean));brokerNames.forEach(name=>{s.brokers.push({id:uid('B'),name:name,phone:'',notes:''});});}
    const defaultState = {customers:[],units:[],partners:[],unitPartners:[],contracts:[],installments:[],payments:[],partnerDebts:[],safes:[],transfers:[],auditLog:[],vouchers:[],brokerDues:[],brokers:[],partnerGroups:[],settings:{theme:'dark',font:16},locked:false};
    return {...defaultState, ...s};
  }catch{
    return null;
  }
}

import { state, saveState } from '../state.js';
import { today } from '../helpers.js';
import { persist } from '../data.js';

function doBackup() {
    const data=JSON.stringify(state);
    const blob=new Blob([data],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download=`estate-backup-${today()}.json`; a.click();
    URL.revokeObjectURL(url);
}

function doExcelBackup() {
    try {
        const wb = XLSX.utils.book_new();
        const dataMap = {
            'العملاء': state.customers,
            'الوحدات': state.units,
            'الشركاء': state.partners,
            'شركاءالوحدات': state.unitPartners,
            'العقود': state.contracts,
            'الأقساط': state.installments,
            'السندات': state.vouchers,
            'الخزن': state.safes,
            'الإعدادات': [state.settings]
        };

        for (const sheetName in dataMap) {
            if (dataMap[sheetName] && dataMap[sheetName].length > 0) {
                const ws = XLSX.utils.json_to_sheet(dataMap[sheetName]);
                XLSX.utils.book_append_sheet(wb, ws, sheetName);
            }
        }

        XLSX.writeFile(wb, `estate-backup-${today()}.xlsx`);
    } catch (err) {
        console.error(err);
        alert('حدث خطأ أثناء إنشاء ملف Excel.');
    }
}

function doReset() {
    if(prompt('اكتب "مسح" لتأكيد حذف كل البيانات')==='مسح'){
      saveState();
      indexedDB.deleteDatabase(DB_NAME);
      localStorage.clear();
      location.reload();
    }
}

export function renderBackup(){
  const view = document.getElementById('view');
  view.innerHTML=`
    <div class="card">
      <h3>نسخة احتياطية</h3>
      <p>يتم حفظ بياناتك في متصفحك. قم بتنزيل نسخة احتياطية بشكل دوري.</p>
      <div class="tools">
        <button class="btn" id="backup-json-btn">تنزيل نسخة JSON</button>
        <label class="btn secondary">
          <input type="file" id="restore-file" accept=".json" style="display:none">
          استعادة نسخة JSON
        </label>
        <button class="btn ok" id="backup-excel-btn">تنزيل نسخة Excel</button>
        <button class="btn warn" id="reset-btn">مسح كل البيانات</button>
      </div>
    </div>`;

  document.getElementById('backup-json-btn').addEventListener('click', doBackup);
  document.getElementById('backup-excel-btn').addEventListener('click', doExcelBackup);
  document.getElementById('reset-btn').addEventListener('click', doReset);

  document.getElementById('restore-file').onchange=(e)=>{
    const f=e.target.files[0]; if(!f) return;
    if(!confirm('سيتم استبدال كل البيانات الحالية. هل أنت متأكد؟')) return;
    const r=new FileReader();
    r.onload=async ()=>{
      try{
        saveState();
        const restored=JSON.parse(String(r.result));
        Object.keys(state).forEach(key => delete state[key]);
        Object.assign(state,restored);
        await persist();
        alert('تمت الاستعادة بنجاح');
        location.reload();
      }catch(err){ alert('ملف غير صالح'); }
    };
    r.readAsText(f);
  };
}

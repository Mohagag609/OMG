export function showModal(title, content, onSave) {
    const modal = document.createElement('div'); modal.id = 'dynamic-modal';
    modal.style = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:1000;';
    modal.innerHTML = `<div style="background:var(--panel);padding:20px;border-radius:12px;width:90%;max-width:500px;"><h3>${title}</h3><div>${content}</div><div class="tools" style="margin-top:20px;justify-content:flex-end;"><button class="btn secondary" id="modal-cancel">إلغاء</button><button class="btn" id="modal-save">حفظ</button></div></div>`;
    document.body.appendChild(modal);
    document.getElementById('modal-cancel').addEventListener('click', () => document.body.removeChild(modal));
    document.getElementById('modal-save').addEventListener('click', async () => {
        if (await onSave()) { document.body.removeChild(modal); }
    });
}

export function table(headers, rows, sortKey=null, onSort=null){ const head = headers.map((h,i)=>`<th data-idx="${i}">${h}${sortKey&&sortKey.idx===i?(sortKey.dir==='asc'?' ▲':' ▼'):''}</th>`).join(''); const body = rows.length? rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${headers.length}"><small>لا توجد بيانات</small></td></tr>`; const html = `<table class="table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`; const wrap=document.createElement('div'); wrap.innerHTML=html; if(onSort){ wrap.querySelectorAll('th').forEach(th=> th.addEventListener('click', ()=>{ const idx=Number(th.dataset.idx); const dir = sortKey && sortKey.idx===idx && sortKey.dir==='asc' ? 'desc' : 'asc'; onSort({idx,dir}); })); } return wrap.innerHTML; }

export function printHTML(title, bodyHTML){ const w=window.open('','_blank'); if(!w) return alert('الرجاء السماح بالنوافذ المنبثقة لطباعة التقارير.'); w.document.write(`<html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${title}</title><style>@page{size:A4;margin:12mm}body{font-family:system-ui,Segoe UI,Roboto; padding:0; margin:0; direction:rtl; color:#111}.wrap{padding:16px 18px}h1{font-size:20px;margin:0 0 12px 0}table{width:100%;border-collapse:collapse;font-size:13px}th,td{border:1px solid #ccc;padding:6px 8px;text-align:right;vertical-align:top}thead th{background:#f1f5f9}footer{margin-top:12px;font-size:11px;color:#555}</style></head><body><div class="wrap">${bodyHTML}<footer>تمت الطباعة في ${new Date().toLocaleString('ar-EG')}</footer></div></body></html>`); w.document.close(); setTimeout(() => { w.focus(); w.print(); }, 250); }

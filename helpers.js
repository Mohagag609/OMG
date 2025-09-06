export function uid(p){ return p+'-'+Math.random().toString(36).slice(2,9); }
export function today(){ return new Date().toISOString().slice(0,10); }
export const fmt = new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export function egp(v){ v=Number(v||0); return isFinite(v)?fmt.format(v)+' ج.م':'' }
export function parseNumber(v){ v=String(v||'').replace(/[^\d.]/g,''); return Number(v||0); }
export function exportCSV(headers, rows, name){
  const csv=[headers.join(','), ...rows.map(r=>r.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(','))].join('\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=name; a.click(); URL.revokeObjectURL(url);
}

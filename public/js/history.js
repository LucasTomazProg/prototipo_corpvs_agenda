const $$ = (sel, el=document)=> el.querySelector(sel);
const $$$ = (sel, el=document)=> Array.from(el.querySelectorAll(sel));
async function api(path, options={}){
  const token = localStorage.getItem('token') || '';
  const r = await fetch(path, { ...options, headers: { 'Content-Type':'application/json', ...(options.headers||{}), 'Authorization': `Bearer ${token}` } });
  if(r.status === 401){ location.href='login.html'; throw new Error('Não autenticado'); }
  return r;
}
function composeMessage(payload){
  const linhas = [
    `*Olá!* Tenho um novo atendimento para você:`,'',
    `*Cliente:* ${payload.cliente?.nome || payload.cliente}`,
    `*Serviço:* ${payload.servico?.nome || payload.servico}`,
    `*Data:* ${new Date(payload.data).toLocaleDateString()}`,
    `*Período:* ${payload.periodo}`,'',
    `Responsável no local: ${payload.responsavel}`,
    `Endereço: ${payload.endereco}`,
    payload.obs ? `Obs.: ${payload.obs}` : null,'',
    'Por favor, confirme o recebimento.'
  ].filter(Boolean);
  return linhas.join('\n');
}
function openWhats(telefone, mensagem){
  const onlyDigits = (telefone||'').replace(/\D/g,''); 
  if(!/^\d{11,15}$/.test(onlyDigits)){ alert('Telefone do técnico inválido. Use o formato 55DDDXXXXXXXX.'); return; }
  const url = `https://wa.me/${onlyDigits}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, '_blank', 'noopener');
}
async function load(){
  const r = await api('/atendimentos');
  const itens = await r.json();
  const tbody = $$('#tbody'); tbody.innerHTML = '';
  if(!itens.length){
    const tr = document.createElement('tr'); const td = document.createElement('td');
    td.colSpan = 9; td.className = 'center muted'; td.textContent = 'Nenhum atendimento.';
    tr.appendChild(td); tbody.appendChild(tr); return;
  }
  for(const a of itens){
    const tr = document.createElement('tr');
    const t = (k)=>{ const td = document.createElement('td'); td.textContent = k; return td; };
    tr.appendChild(t(new Date(a.data).toLocaleDateString()));
    tr.appendChild(t(a.periodo));
    tr.appendChild(t(a.cliente?.nome || ''));
    tr.appendChild(t(a.servico?.nome || ''));
    tr.appendChild(t(a.tecnico?.nome || ''));
    tr.appendChild(t(a.responsavel));
    tr.appendChild(t(a.endereco));
    tr.appendChild(t(a.obs || ''));
    const tdA = document.createElement('td');
    const btnW = document.createElement('button'); btnW.textContent = 'WhatsApp';
    btnW.addEventListener('click', ()=>{ const msg = composeMessage(a); openWhats(a.tecnico?.telefone || '', msg); });
    tdA.appendChild(btnW);
    if(localStorage.getItem('userRole') === 'ADM'){
      const btnD = document.createElement('button'); btnD.className = 'danger'; btnD.textContent = 'Excluir';
      btnD.addEventListener('click', async ()=>{ if(!confirm('Excluir este atendimento?')) return; await api('/atendimentos/'+a.id, { method: 'DELETE' }); load(); });
      tdA.appendChild(btnD);
    }
    tr.appendChild(tdA); tbody.appendChild(tr);
  }
}
document.addEventListener('DOMContentLoaded', load);
const $$ = (sel, el=document)=> el.querySelector(sel);
const $$$ = (sel, el=document)=> Array.from(el.querySelectorAll(sel));
function populateSelect(select, options){
  select.innerHTML = '<option value="" disabled selected>Selecione...</option>';
  options.forEach(opt => {
    const o = document.createElement('option');
    if(typeof opt === 'string'){ o.value = opt; o.textContent = opt; }
    else {
      o.value = opt.id || opt.value || opt.nome;
      o.textContent = opt.nome || opt.label || opt.value;
      if(opt.telefone) o.dataset.telefone = opt.telefone;
      if(opt.id) o.dataset.id = opt.id;
    }
    select.appendChild(o);
  });
}
async function api(path, options={}){
  const token = localStorage.getItem('token') || '';
  const r = await fetch(path, { ...options, headers: { 'Content-Type':'application/json', ...(options.headers||{}), 'Authorization': `Bearer ${token}` } });
  if(r.status === 401){ location.href='login.html'; throw new Error('Não autenticado'); }
  return r;
}
function composeMessage(payload){
  const linhas = [
    `*Olá!* Tenho um novo atendimento para você:`,'',
    `*Cliente:* ${payload.cliente}`,
    `*Serviço:* ${payload.servico}`,
    `*Data:* ${payload.data.split('-').reverse().join('/')}`,
    `*Período:* ${payload.periodo}`,'',
    `Responsável no local: ${payload.responsavel}`,
    `Endereço: ${payload.endereco}`,
    payload.obs ? `Obs.: ${payload.obs}` : null,'',
    'Por favor, confirme o recebimento.'
  ].filter(Boolean);
  return linhas.join('\\n');
}
function openWhats(telefone, mensagem){
  const onlyDigits = (telefone||'').replace(/\D/g,''); 
  if(!/^\d{11,15}$/.test(onlyDigits)){ alert('Telefone do técnico inválido. Use o formato 55DDDXXXXXXXX.'); return; }
  const url = `https://wa.me/${onlyDigits}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, '_blank', 'noopener');
}
async function loadOptions(){
  const r = await api('/options');
  const { clientes, servicos, tecnicos } = await r.json();
  populateSelect($$('#cliente'), clientes.map(n => ({ value:n, nome:n })));
  populateSelect($$('#servico'), servicos.map(n => ({ value:n, nome:n })));
  populateSelect($$('#tecnico'), tecnicos.map(t => ({ id: t.id, nome: t.nome, telefone: t.telefone })));
}
async function salvarAtendimento(payload){
  const r = await api('/atendimentos', { method:'POST', body: JSON.stringify(payload) });
  if(!r.ok){ const j = await r.json().catch(()=>({})); throw new Error(j.error || 'Falha ao salvar'); }
  return r.json();
}
document.addEventListener('DOMContentLoaded', async ()=>{
  if(!localStorage.getItem('token')){ location.href='login.html'; return; }
  try { await loadOptions(); } catch(e){ alert('Erro ao carregar opções'); return; }
  $$('#formAtendimento').addEventListener('submit', async (e)=>{ e.preventDefault(); await handleSave({ enviarWhats: true }); });
  $$('#btnSalvar').addEventListener('click', ()=> handleSave({ enviarWhats:false }));
  //const btnExport = $$('#btnExportar'); if(btnExport){ btnExport.addEventListener('click', exportarCSV); }
  //const btnClear = $$('#btnLimpar'); if(btnClear){ btnClear.addEventListener('click', ()=> alert('Use o Histórico para gerenciar.')); }
});
async function handleSave({ enviarWhats=false }={}){
  const cliente = $$('#cliente').value;
  const servico = $$('#servico').value;
  const data = $$('#data').value;
  const periodo = $$('#periodo').value;
  const optTec = $$('#tecnico').selectedOptions[0];
  const tecnicoId = optTec?.dataset?.id;
  const telefoneTecnico = optTec?.dataset?.telefone || '';
  const responsavel = $$('#responsavel').value;
  const endereco = $$('#endereco').value;
  const obs = $$('#obs').value.trim();
  if(!cliente || !servico || !data || !periodo || !tecnicoId || !responsavel || !endereco){
    alert('Preencha todos os campos obrigatórios.'); return;
  }
  const payload = { clienteNome: cliente, servicoNome: servico, data, periodo, tecnicoId, responsavel, endereco, obs };
  try{
    await salvarAtendimento(payload);
    if(enviarWhats){
      const msg = composeMessage({ cliente, servico, data, periodo, responsavel, endereco, obs });
      openWhats(telefoneTecnico, msg);
    }
    $$('#obs').value = ''; alert('Atendimento salvo!');
  }catch(err){ alert(err.message); }
}
async function exportarCSV(){
  const r = await api('/atendimentos'); const rows = await r.json();
  const headers = ['data','periodo','cliente','servico','tecnico','responsavel','endereco','obs'];
  const lines = [headers.join(',')];
  for(const a of rows){
    const row = [
      new Date(a.data).toISOString().split('T')[0], a.periodo,
      a.cliente?.nome || '', a.servico?.nome || '', a.tecnico?.nome || '',
      a.responsavel, a.endereco, (a.obs||'').replace(/\n/g,' ').replace(/"/g,'\\"')
    ];
    lines.push(row.map(v=>`"${(v||'').toString().replace(/"/g,'\\"')}"`).join(','));
  }
  const blob = new Blob([lines.join('\n')], { type:'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = `atendimentos_${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
}
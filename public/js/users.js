const $$ = (sel, el=document)=> el.querySelector(sel);
const $$$ = (sel, el=document)=> Array.from(el.querySelectorAll(sel));
function token(){ return localStorage.getItem('token') || ''; }
function role(){ return localStorage.getItem('userRole') || ''; }
async function api(path, options={}){
  const r = await fetch(path, { ...options, headers: { 'Content-Type':'application/json', ...(options.headers||{}), 'Authorization': `Bearer ${token()}` } });
  if(r.status === 401){ location.href='login.html'; throw new Error('Não autenticado'); }
  if(r.status === 403){ alert('Acesso restrito a ADM.'); location.href='index.html'; throw new Error('Sem permissão'); }
  return r;
}
function resetForm(){ $$('#userId').value=''; $$('#nome').value=''; $$('#email').value=''; $$('#telefone').value=''; $$('#role').value='TECNICO'; $$('#senha').value=''; $$('#ativo').value='true'; $$('#btnSalvarUser').textContent = 'Salvar'; }
async function loadUsers(){
  const params = new URLSearchParams(); const q = $$('#q').value.trim(); const fRole = $$('#fRole').value; const fAtivo = $$('#fAtivo').value;
  if(q) params.set('q', q); if(fRole) params.set('role', fRole); if(fAtivo !== '') params.set('ativo', fAtivo);
  const r = await api('/usuarios?'+params.toString()); const lista = await r.json(); renderTable(lista);
}
function renderTable(lista){
  const tb = $$('#tbodyUsers'); tb.innerHTML = '';
  if(!lista.length){
    const tr = document.createElement('tr'); const td = document.createElement('td'); td.colSpan = 6; td.className='center muted'; td.textContent = 'Nenhum usuário cadastrado.';
    tr.appendChild(td); tb.appendChild(tr); return;
  }
  for(const u of lista){
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${u.nome}</td><td>${u.email}</td><td>${u.role}</td><td>${u.telefone||''}</td><td>${u.ativo?'Ativo':'Inativo'}</td>`;
    const tdA = document.createElement('td');
    const bEdit = document.createElement('button'); bEdit.textContent = 'Editar';
    bEdit.addEventListener('click', ()=>{
      $$('#userId').value = u.id; $$('#nome').value = u.nome; $$('#email').value = u.email; $$('#telefone').value = u.telefone || ''; $$('#role').value = u.role; $$('#senha').value = ''; $$('#ativo').value = String(u.ativo); $$('#btnSalvarUser').textContent = 'Salvar alterações'; window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    const bStatus = document.createElement('button'); bStatus.className = u.ativo ? 'warn' : ''; bStatus.textContent = u.ativo ? 'Desativar' : 'Reativar';
    bStatus.addEventListener('click', async ()=>{ const novo = !u.ativo; if(!confirm(`Confirmar ${novo ? 'reativar' : 'desativar'} ${u.nome}?`)) return; await api('/usuarios/'+u.id+'/status', { method:'POST', body: JSON.stringify({ ativo: novo }) }); loadUsers(); });
    tdA.appendChild(bEdit); tdA.appendChild(bStatus); const td = document.createElement('td'); td.appendChild(tdA); tr.appendChild(td); $$('#tbodyUsers').appendChild(tr);
  }
}
async function salvarUser(e){
  e.preventDefault();
  const id = $$('#userId').value.trim(); const nome = $$('#nome').value.trim(); const email = $$('#email').value.trim(); const telefone = $$('#telefone').value.trim(); const roleVal = $$('#role').value; const senha = $$('#senha').value; const ativo = $$('#ativo').value === 'true';
  if(!nome || !email || (!id && !senha)){ alert('Preencha nome, email e senha (para novo usuário).'); return; }
  if(id){
    const body = { nome, email, role: roleVal, telefone, ativo }; if(senha) body.senha = senha;
    const r = await api('/usuarios/'+id, { method:'PATCH', body: JSON.stringify(body) }); if(!r.ok){ const j = await r.json().catch(()=>({})); alert(j.error || 'Falha ao atualizar'); return; }
  }else{
    const r = await api('/usuarios', { method:'POST', body: JSON.stringify({ nome, email, senha, role: roleVal, telefone, ativo }) }); if(!r.ok){ const j = await r.json().catch(()=>({})); alert(j.error || 'Falha ao criar'); return; }
  }
  resetForm(); loadUsers();
}
document.addEventListener('DOMContentLoaded', ()=>{
  if(!token()) return location.href='login.html'; if(role() !== 'ADM'){ alert('Acesso restrito a ADM.'); location.href='index.html'; return; }
  $$('#btnBuscar').addEventListener('click', loadUsers);
  $$('#btnLimparFiltros').addEventListener('click', ()=>{ $$('#q').value=''; $$('#fRole').value=''; $$('#fAtivo').value=''; loadUsers(); });
  $$('#formUser').addEventListener('submit', salvarUser);
  $$('#btnCancelarEdicao').addEventListener('click', resetForm);
  loadUsers();
});
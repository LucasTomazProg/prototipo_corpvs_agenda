document.querySelector('#loginForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const email = document.querySelector('#email').value.trim();
  const senha = document.querySelector('#senha').value;
  try{
    const r = await fetch('/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, senha }) });
    if(!r.ok){ const j = await r.json().catch(()=>({})); throw new Error(j.error || 'Login inválido'); }
    const data = await r.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('userRole', data.user?.role || '');
    localStorage.setItem('userId', data.user?.id || '');
    location.href = 'index.html';
  }catch(err){ alert(err.message); }
});

console.log('Tentando login:', email, senha);

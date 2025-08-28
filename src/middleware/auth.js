const jwt = require('jsonwebtoken');
function auth(requiredRole){
  return (req, res, next) => {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : '';
    if(!token) return res.status(401).json({ error: 'Sem token' });
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
      req.user = payload;
      if(requiredRole && payload.role !== requiredRole){ return res.status(403).json({ error: 'Sem permissão' }); }
      next();
    } catch (e) { return res.status(401).json({ error: 'Token inválido' }); }
  }
}
module.exports = { auth };
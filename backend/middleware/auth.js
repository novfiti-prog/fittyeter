const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fitmeet_dev_secret_change_in_prod';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message_tr: 'Yetkilendirme gerekli', message_en: 'Authorization required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token', message_tr: 'Geçersiz token', message_en: 'Invalid or expired token' });
  }
}

function generateToken(userId, email) {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '30d' });
}

module.exports = { authMiddleware, generateToken };

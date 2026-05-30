import jwt from 'jsonwebtoken';

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_kitchen_jwt_key_2026');
    req.user = decoded; // { id: userId, iat, exp }
    next();
  } catch (error) {
    res.status(401).json({ error: 'Not authorized, token failed' });
  }
};

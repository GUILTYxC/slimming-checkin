const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'slimming-ds-secret-key-change-in-production'

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录，请先登录' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.userId
    req.username = decoded.username
    next()
  } catch (err) {
    return res.status(401).json({ error: '登录已过期，请重新登录' })
  }
}

function generateToken(userId, username) {
  return jwt.sign(
    { userId, username },
    JWT_SECRET,
    { expiresIn: '30d' }
  )
}

module.exports = { authMiddleware, generateToken, JWT_SECRET }
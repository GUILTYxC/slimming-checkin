const express = require('express')
const bcrypt = require('bcryptjs')
const db = require('../db')
const { authMiddleware, generateToken } = require('../middleware/auth')

const router = express.Router()

router.post('/register', (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' })
  }
  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: '用户名长度应为3-20个字符' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: '密码长度不能少于6个字符' })
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (existing) {
    return res.status(409).json({ error: '用户名已存在' })
  }

  const passwordHash = bcrypt.hashSync(password, 10)
  const result = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, passwordHash)

  const token = generateToken(result.lastInsertRowid, username)

  res.status(201).json({
    message: '注册成功',
    token,
    user: { id: result.lastInsertRowid, username },
  })
})

router.post('/login', (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' })
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' })
  }

  const valid = bcrypt.compareSync(password, user.password_hash)
  if (!valid) {
    return res.status(401).json({ error: '用户名或密码错误' })
  }

  const token = generateToken(user.id, user.username)

  res.json({
    message: '登录成功',
    token,
    user: { id: user.id, username: user.username },
  })
})

router.get('/me', authMiddleware, (req, res) => {
  res.json({
    user: { id: req.userId, username: req.username },
  })
})

module.exports = router
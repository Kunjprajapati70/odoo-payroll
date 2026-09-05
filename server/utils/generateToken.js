const jwt = require('jsonwebtoken')
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env')

const generateToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })

module.exports = generateToken

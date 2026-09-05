require('dotenv').config()

// Prefer SMTP_* (existing); accept MAIL_* aliases from the notification brief
const SMTP_HOST = process.env.SMTP_HOST || process.env.MAIL_HOST || ''
const SMTP_PORT = process.env.SMTP_PORT || process.env.MAIL_PORT || '587'
const SMTP_USER = process.env.SMTP_USER || process.env.MAIL_USER || ''
const SMTP_PASS = process.env.SMTP_PASS || process.env.MAIL_PASSWORD || ''
const SMTP_FROM =
  process.env.SMTP_FROM ||
  process.env.MAIL_FROM ||
  process.env.SMTP_USER ||
  process.env.MAIL_USER ||
  ''

module.exports = {
  PORT: process.env.PORT || 5000,
  HOST: process.env.HOST || '0.0.0.0',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/peoplepay360',
  JWT_SECRET: process.env.JWT_SECRET || 'changeme_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development',
  COMPANY_NAME: process.env.COMPANY_NAME || 'PeoplePay360',
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  // Aliases for clarity in docs
  MAIL_HOST: SMTP_HOST,
  MAIL_PORT: SMTP_PORT,
  MAIL_USER: SMTP_USER,
  MAIL_PASSWORD: SMTP_PASS,
  MAIL_FROM: SMTP_FROM,
}

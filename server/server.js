require('dotenv').config()
const os = require('os')
const app = require('./app')
const connectDB = require('./config/db')
const { PORT, HOST } = require('./config/env')

const lanIPv4 = () => {
  const nets = os.networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) return net.address
    }
  }
  return null
}

const start = async () => {
  await connectDB()
  app.listen(PORT, HOST, () => {
    const lan = lanIPv4()
    console.log(`PeoplePay360 API listening on ${HOST}:${PORT}`)
    console.log(`  Local:   http://localhost:${PORT}`)
    if (lan) console.log(`  Wi‑Fi:   http://${lan}:${PORT}`)
  })
}

start()

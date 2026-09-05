require('dotenv').config()
const app = require('./app')
const connectDB = require('./config/db')
const { PORT } = require('./config/env')

const start = async () => {
  await connectDB()
  app.listen(PORT, () => {
    console.log(`PeoplePay360 API running on http://localhost:${PORT}`)
  })
}

start()

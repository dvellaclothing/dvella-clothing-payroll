import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

import authRoutes from './routes/auth.js'
import dashboardAnalytics from './routes/dashboard-analytics.js'
import employeesRoute from './routes/employees-route.js'
import kpiRoute from './routes/kpiRoute.js'
import payrollRoute from './routes/payrollRoute.js'
import performanceRoute from './routes/performance.js'
import reportsRoute from './routes/reports.js'
import forecastingRoute from './routes/forecasting.js'
import employeeSide from './routes/employeeSide.js'
import notificationRoute from './routes/notification.js'
import forgotPasswordRoute from './routes/forgotPasswordRoute.js'

dotenv.config()

const app = express()
const port = process.env.PORT

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Middlewares
app.use(cors())
app.use(express.json())

// CRITICAL: Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Routes
app.use('/api', authRoutes)
app.use('/api', dashboardAnalytics)
app.use('/api', employeesRoute)
app.use('/api/kpi', kpiRoute)
app.use('/api', payrollRoute)
app.use('/api/attendance', performanceRoute)
app.use('/api/reports', reportsRoute)
app.use('/api/forecasting', forecastingRoute)
app.use('/api', employeeSide)
app.use('/api', notificationRoute)
app.use('/api', forgotPasswordRoute)

app.get("/", (req, res) => {
    console.log("Server is running")
})

app.listen(port, () => {
    console.log(`SERVER IS RUNNING ON PORT ${port}`)
    console.log('Database Connection: ', process.env.DATABASE_URL)
    console.log(`Brevo email notifications: ${process.env.BREVO_API_KEY ? 'Enabled' : 'Disabled'}`)
})
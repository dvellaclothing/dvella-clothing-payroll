
import express from 'express'
import pool from '../db/pool.js'

const router = express.Router()

router.get("/get-total-employees", async (req, res) => {
    try {
        const addedThisMonth = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'employee' AND hire_date >= CURRENT_DATE - 30")
        const totalEmployees = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'employee'")
        return res.status(200).json({
            addedThisMonth: addedThisMonth.rows[0].count,
            totalEmployees: totalEmployees.rows[0].count,
        })
    } catch (err) {
        console.error("get-total-employees: ", err)
        return res.status(500).json({ error: "Failed to fetch employees" })
    }
})

router.get("/get-monthly-payroll", async (req, res) => {
    try {
        const currentMonth = await pool.query(`SELECT SUM(net_pay) as total FROM payroll_records WHERE created_at >= CURRENT_DATE - 30`)
        const lastMonth = await pool.query(`SELECT SUM(net_pay) as total FROM payroll_records WHERE created_at >= CURRENT_DATE - 60 AND created_at < CURRENT_DATE - 30`)
        return res.status(200).json({
            currentMonth: currentMonth.rows[0].total || 0,
            lastMonth: lastMonth.rows[0].total || 0,
        })
    } catch (err) {
        console.error("get-monthly-payroll: ", err)
        return res.status(500).json({ error: "Failed to fetch payroll" })
    }
})

router.get("/get-avg-kpi-score", async (req, res) => {
    try {
        const currentMonth = await pool.query(`SELECT AVG(score) as avg_score FROM kpi_scores WHERE month = EXTRACT(MONTH FROM CURRENT_DATE) AND year = EXTRACT(YEAR FROM CURRENT_DATE)`)
        const lastMonth = await pool.query(`SELECT AVG(score) as avg_score FROM kpi_scores WHERE month = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month') AND year = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')`)
        return res.status(200).json({
            currentMonth: parseFloat(currentMonth.rows[0].avg_score) || 0,
            lastMonth: parseFloat(lastMonth.rows[0].avg_score) || 0
        })
    } catch (err) {
        console.error("get-avg-kpi-score: ", err)
        return res.status(500).json({ error: "Failed to fetch KPI scores" })
    }
})

router.get("/get-growth-forecast", async (req, res) => {
    try {
        const lastMonth = await pool.query("SELECT AVG(score) as avg FROM kpi_scores WHERE created_at >= CURRENT_DATE - 30")
        const twoMonthsAgo = await pool.query("SELECT AVG(score) as avg FROM kpi_scores WHERE created_at >= CURRENT_DATE - 60 AND created_at < CURRENT_DATE - 30")
        const current = parseFloat(lastMonth.rows[0].avg) || 0
        const previous = parseFloat(twoMonthsAgo.rows[0].avg) || 0
        const growth = current - previous
        const forecastPercentage = previous > 0 ? ((growth / previous) * 100).toFixed(1) : 0
        return res.status(200).json({
            predictedValue: forecastPercentage,
            confidence: 87,
            period: "Q1 2025"
        })
    } catch (err) {
        console.error("get-growth-forecast: ", err)
        return res.status(500).json({ error: "Failed to fetch forecast" })
    }
})

export default router
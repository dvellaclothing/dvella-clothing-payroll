
import express from 'express'
import pool from '../db/pool.js'

const router = express.Router()

// router.get("/get-total-employees", async (req, res) => {
//     try {
//         const addedThisMonth = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'employee' AND hire_date >= CURRENT_DATE - 30")
//         const totalEmployees = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'employee'")
//         return res.status(200).json({
//             addedThisMonth: addedThisMonth.rows[0].count,
//             totalEmployees: totalEmployees.rows[0].count,
//         })
//     } catch (err) {
//         console.error("get-total-employees: ", err)
//         return res.status(500).json({ error: "Failed to fetch employees" })
//     }
// })

// router.get("/get-monthly-payroll", async (req, res) => {
//     try {
//         const currentMonth = await pool.query(`SELECT SUM(net_pay) as total FROM payroll_records WHERE created_at >= CURRENT_DATE - 30`)
//         const lastMonth = await pool.query(`SELECT SUM(net_pay) as total FROM payroll_records WHERE created_at >= CURRENT_DATE - 60 AND created_at < CURRENT_DATE - 30`)
//         return res.status(200).json({
//             currentMonth: currentMonth.rows[0].total || 0,
//             lastMonth: lastMonth.rows[0].total || 0,
//         })
//     } catch (err) {
//         console.error("get-monthly-payroll: ", err)
//         return res.status(500).json({ error: "Failed to fetch payroll" })
//     }
// })

// router.get("/get-avg-kpi-score", async (req, res) => {
//     try {
//         const currentMonth = await pool.query(`SELECT AVG(score) as avg_score FROM kpi_scores WHERE month = EXTRACT(MONTH FROM CURRENT_DATE) AND year = EXTRACT(YEAR FROM CURRENT_DATE)`)
//         const lastMonth = await pool.query(`SELECT AVG(score) as avg_score FROM kpi_scores WHERE month = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month') AND year = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')`)
//         return res.status(200).json({
//             currentMonth: parseFloat(currentMonth.rows[0].avg_score) || 0,
//             lastMonth: parseFloat(lastMonth.rows[0].avg_score) || 0
//         })
//     } catch (err) {
//         console.error("get-avg-kpi-score: ", err)
//         return res.status(500).json({ error: "Failed to fetch KPI scores" })
//     }
// })

// router.get("/get-growth-forecast", async (req, res) => {
//     try {
//         const lastMonth = await pool.query("SELECT AVG(score) as avg FROM kpi_scores WHERE created_at >= CURRENT_DATE - 30")
//         const twoMonthsAgo = await pool.query("SELECT AVG(score) as avg FROM kpi_scores WHERE created_at >= CURRENT_DATE - 60 AND created_at < CURRENT_DATE - 30")
//         const current = parseFloat(lastMonth.rows[0].avg) || 0
//         const previous = parseFloat(twoMonthsAgo.rows[0].avg) || 0
//         const growth = current - previous
//         const forecastPercentage = previous > 0 ? ((growth / previous) * 100).toFixed(1) : 0
//         return res.status(200).json({
//             predictedValue: forecastPercentage,
//             confidence: 87,
//             period: "Q1 2025"
//         })
//     } catch (err) {
//         console.error("get-growth-forecast: ", err)
//         return res.status(500).json({ error: "Failed to fetch forecast" })
//     }
// })

router.get("/get-total-employees", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_employees,
                COUNT(*) FILTER (
                    WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
                    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
                ) as added_this_month
            FROM users
            WHERE status = 'active' AND role IN ('employee', 'manager', 'admin')
        `)
        
        return res.json({
            totalEmployees: parseInt(result.rows[0].total_employees),
            addedThisMonth: parseInt(result.rows[0].added_this_month)
        })
    } catch (err) {
        console.error('Error in get-total-employees:', err)
        return res.status(500).json({ error: err.message })
    }
})

router.get("/get-monthly-payroll", async (req, res) => {
    try {
        const currentMonth = await pool.query(`
            SELECT 
                COALESCE(SUM(
                    CASE 
                        WHEN a.total_hours <= 8 THEN a.total_hours * COALESCE(u.hourly_rate, 0)
                        ELSE (8 * COALESCE(u.hourly_rate, 0)) + 
                             ((a.total_hours - 8) * COALESCE(u.hourly_rate, 0) * 1.5)
                    END
                ), 0) as total_gross
            FROM attendance a
            INNER JOIN users u ON a.user_id = u.user_id
            WHERE a.status = 'approved'
                AND EXTRACT(MONTH FROM a.date) = EXTRACT(MONTH FROM CURRENT_DATE)
                AND EXTRACT(YEAR FROM a.date) = EXTRACT(YEAR FROM CURRENT_DATE)
        `)

        const lastMonth = await pool.query(`
            SELECT 
                COALESCE(SUM(
                    CASE 
                        WHEN a.total_hours <= 8 THEN a.total_hours * COALESCE(u.hourly_rate, 0)
                        ELSE (8 * COALESCE(u.hourly_rate, 0)) + 
                             ((a.total_hours - 8) * COALESCE(u.hourly_rate, 0) * 1.5)
                    END
                ), 0) as total_gross
            FROM attendance a
            INNER JOIN users u ON a.user_id = u.user_id
            WHERE a.status = 'approved'
                AND EXTRACT(MONTH FROM a.date) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')
                AND EXTRACT(YEAR FROM a.date) = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')
        `)
        
        const currentNet = parseFloat(currentMonth.rows[0].total_gross) * 0.85
        const lastNet = parseFloat(lastMonth.rows[0].total_gross) * 0.85
        
        return res.json({
            currentMonth: parseFloat(currentNet.toFixed(2)),
            lastMonth: parseFloat(lastNet.toFixed(2))
        })
    } catch (err) {
        console.error('Error in get-monthly-payroll:', err)
        return res.status(500).json({ error: err.message })
    }
})

router.get("/get-avg-kpi-score", async (req, res) => {
    try {
        const currentMonth = await pool.query(`
            SELECT 
                COALESCE(AVG(score), 0) as avg_score
            FROM kpi_scores
            WHERE EXTRACT(MONTH FROM TO_DATE(month || '-' || year, 'MM-YYYY')) = EXTRACT(MONTH FROM CURRENT_DATE)
                AND year = EXTRACT(YEAR FROM CURRENT_DATE)
        `)
        
        const lastMonth = await pool.query(`
            SELECT 
                COALESCE(AVG(score), 0) as avg_score
            FROM kpi_scores
            WHERE EXTRACT(MONTH FROM TO_DATE(month || '-' || year, 'MM-YYYY')) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')
                AND year = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')
        `)
        
        return res.json({
            currentMonth: parseFloat(currentMonth.rows[0].avg_score) || 0,
            lastMonth: parseFloat(lastMonth.rows[0].avg_score) || 0
        })
    } catch (err) {
        console.error('Error in get-avg-kpi-score:', err)
        return res.status(500).json({ error: err.message })
    }
})

router.get("/get-recent-activities", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                'attendance' as activity_type,
                CONCAT(u.first_name, ' ', u.last_name) as user_name,
                a.status,
                a.date as activity_date,
                a.created_at,
                'Submitted attendance for ' || TO_CHAR(a.date, 'Mon DD, YYYY') as description
            FROM attendance a
            INNER JOIN users u ON a.user_id = u.user_id
            WHERE a.created_at >= CURRENT_DATE - INTERVAL '7 days'
            
            UNION ALL
            
            SELECT 
                'user' as activity_type,
                CONCAT(first_name, ' ', last_name) as user_name,
                'active' as status,
                created_at as activity_date,
                created_at,
                'New employee added' as description
            FROM users
            WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
                AND role IN ('employee', 'manager')
            
            ORDER BY created_at DESC
            LIMIT 10
        `)
        
        return res.json({ activities: result.rows })
    } catch (err) {
        console.error('Error in get-recent-activities:', err)
        return res.status(500).json({ error: err.message })
    }
})

router.get("/get-upcoming-payroll", async (req, res) => {
    try {
        const nextPeriod = await pool.query(`
            SELECT 
                period_id,
                period_name,
                start_date,
                end_date,
                pay_date,
                status
            FROM payroll_periods
            WHERE pay_date >= CURRENT_DATE
            ORDER BY pay_date ASC
            LIMIT 1
        `)
        
        if (nextPeriod.rows.length === 0) {
            return res.json({ 
                period: null,
                message: 'No upcoming payroll periods found' 
            })
        }
        
        const period = nextPeriod.rows[0]
        
        const employeeCount = await pool.query(`
            SELECT COUNT(DISTINCT u.user_id) as count
            FROM users u
            INNER JOIN attendance a ON u.user_id = a.user_id
            WHERE u.status = 'active'
                AND u.role IN ('employee', 'manager')
                AND a.status = 'approved'
                AND a.date BETWEEN $1 AND $2
        `, [period.start_date, period.end_date])
        
        const estimatedAmount = await pool.query(`
            SELECT 
                COALESCE(SUM(
                    CASE 
                        WHEN a.total_hours <= 8 THEN a.total_hours * COALESCE(u.hourly_rate, 0)
                        ELSE (8 * COALESCE(u.hourly_rate, 0)) + 
                             ((a.total_hours - 8) * COALESCE(u.hourly_rate, 0) * 1.5)
                    END
                ), 0) * 0.85 as estimated_net
            FROM attendance a
            INNER JOIN users u ON a.user_id = u.user_id
            WHERE a.status = 'approved'
                AND a.date BETWEEN $1 AND $2
        `, [period.start_date, period.end_date])
        
        return res.json({
            period: {
                ...period,
                employee_count: parseInt(employeeCount.rows[0].count),
                estimated_amount: parseFloat(estimatedAmount.rows[0].estimated_net).toFixed(2)
            }
        })
    } catch (err) {
        console.error('Error in get-upcoming-payroll:', err)
        return res.status(500).json({ error: err.message })
    }
})

export default router
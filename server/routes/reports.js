import express from 'express'
import pool from '../db/pool.js'
const router = express.Router()

// Get payroll reports with filters (based on payroll periods and attendance)
router.get("/payroll-reports", async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query
        
        let query = `
            SELECT 
                pp.period_id,
                pp.period_name,
                pp.start_date,
                pp.end_date,
                pp.pay_date,
                pp.status
            FROM payroll_periods pp
            WHERE 1=1
        `
        
        const params = []
        let paramCount = 1
        
        if (startDate) {
            query += ` AND pp.start_date >= $${paramCount}`
            params.push(startDate)
            paramCount++
        }
        
        if (endDate) {
            query += ` AND pp.end_date <= $${paramCount}`
            params.push(endDate)
            paramCount++
        }
        
        if (status && status !== 'all') {
            query += ` AND pp.status = $${paramCount}`
            params.push(status)
            paramCount++
        }
        
        query += ` ORDER BY pp.end_date DESC`
        
        const result = await pool.query(query, params)
        
        // For each period, calculate stats from attendance
        const enrichedReports = await Promise.all(result.rows.map(async (period) => {
            const statsQuery = `
                SELECT 
                    COUNT(DISTINCT a.user_id) as employee_count,
                    COALESCE(SUM(a.total_hours), 0) as total_hours,
                    COALESCE(AVG(a.total_hours), 0) as avg_hours
                FROM attendance a
                WHERE a.status = 'approved'
                    AND a.date BETWEEN $1 AND $2
            `
            const stats = await pool.query(statsQuery, [period.start_date, period.end_date])
            
            return {
                ...period,
                employee_count: parseInt(stats.rows[0].employee_count),
                total_hours: parseFloat(stats.rows[0].total_hours),
                avg_hours: parseFloat(stats.rows[0].avg_hours),
                total_amount: 0
            }
        }))
        
        return res.json({ reports: enrichedReports })
    } catch (err) {
        console.error('Error in payroll-reports:', err)
        return res.status(500).json({ error: err.message })
    }
})

// Get detailed payroll report for a specific period - EMPLOYEE FOCUSED
router.get("/payroll-detail/:periodId", async (req, res) => {
    try {
        const { periodId } = req.params
        
        const periodResult = await pool.query(`
            SELECT * FROM payroll_periods WHERE period_id = $1
        `, [periodId])
        
        if (periodResult.rows.length === 0) {
            return res.json({ details: [] })
        }
        
        const period = periodResult.rows[0]
        
        // Get individual employee attendance for this period
        const result = await pool.query(`
            SELECT 
                u.first_name,
                u.last_name,
                u.employee_id,
                u.salary as basic_salary,
                u.hourly_rate,
                u.position as department,
                COALESCE(SUM(a.total_hours), 0) as hours_worked,
                COALESCE(SUM(CASE 
                    WHEN a.total_hours > 8 
                    THEN a.total_hours - 8 
                    ELSE 0 
                END), 0) as overtime_hours,
                0 as overtime_amount,
                0 as bonuses,
                0 as deductions,
                0 as gross_pay,
                0 as net_pay,
                'approved' as status,
                NOW() as created_at
            FROM users u
            LEFT JOIN attendance a ON u.user_id = a.user_id
                AND a.status = 'approved'
                AND a.date BETWEEN $1 AND $2
            WHERE u.role IN ('employee', 'manager', 'admin')
                AND u.status = 'active'
            GROUP BY u.user_id, u.first_name, u.last_name, u.employee_id, 
                     u.salary, u.hourly_rate, u.position
            ORDER BY hours_worked DESC, u.last_name, u.first_name
        `, [period.start_date, period.end_date])
        
        return res.json({ details: result.rows })
    } catch (err) {
        console.error('Error in payroll-detail:', err)
        return res.status(500).json({ error: err.message })
    }
})

// Get monthly payroll trend data - EMPLOYEE HOURS BASED
router.get("/payroll-trend", async (req, res) => {
    try {
        const { year } = req.query
        const targetYear = year || new Date().getFullYear()
        
        const result = await pool.query(`
            SELECT 
                EXTRACT(MONTH FROM pp.end_date) as month,
                TO_CHAR(pp.end_date, 'Mon') as month_name,
                pp.period_id,
                pp.start_date,
                pp.end_date
            FROM payroll_periods pp
            WHERE EXTRACT(YEAR FROM pp.end_date) = $1
            ORDER BY EXTRACT(MONTH FROM pp.end_date)
        `, [targetYear])
        
        // Enrich with actual attendance data
        const enrichedTrend = await Promise.all(result.rows.map(async (row) => {
            const attendanceQuery = `
                SELECT 
                    COUNT(DISTINCT user_id) as employee_count,
                    COALESCE(SUM(total_hours), 0) as total_hours,
                    COALESCE(AVG(total_hours), 0) as avg_hours
                FROM attendance
                WHERE status = 'approved'
                    AND date BETWEEN $1 AND $2
            `
            const attendance = await pool.query(attendanceQuery, [row.start_date, row.end_date])
            
            return {
                month: parseInt(row.month),
                month_name: row.month_name,
                total_hours: parseFloat(attendance.rows[0].total_hours),
                avg_hours: parseFloat(attendance.rows[0].avg_hours),
                employee_count: parseInt(attendance.rows[0].employee_count),
                total_net: 0
            }
        }))
        
        return res.json({ trend: enrichedTrend })
    } catch (err) {
        console.error('Error in payroll-trend:', err)
        return res.status(500).json({ error: err.message })
    }
})

// Get INDIVIDUAL EMPLOYEE breakdown by hours worked
router.get("/department-breakdown", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                u.user_id,
                CONCAT(u.first_name, ' ', u.last_name) as name,
                u.employee_id as code,
                1 as employee_count,
                COALESCE(SUM(a.total_hours), 0) as total_hours_this_month,
                COALESCE(AVG(a.total_hours), 0) as avg_hours_per_attendance,
                COUNT(DISTINCT CASE 
                    WHEN a.status = 'approved' 
                    THEN a.date 
                END) as attendance_days
            FROM users u
            LEFT JOIN attendance a ON u.user_id = a.user_id
                AND a.status = 'approved'
                AND EXTRACT(MONTH FROM a.date) = EXTRACT(MONTH FROM CURRENT_DATE)
                AND EXTRACT(YEAR FROM a.date) = EXTRACT(YEAR FROM CURRENT_DATE)
            WHERE u.status = 'active'
                AND u.role IN ('employee', 'manager', 'admin')
            GROUP BY u.user_id, u.first_name, u.last_name, u.employee_id
            HAVING COALESCE(SUM(a.total_hours), 0) > 0
            ORDER BY total_hours_this_month DESC
            LIMIT 10
        `)
        
        return res.json({ departments: result.rows })
    } catch (err) {
        console.error('Error in department-breakdown:', err)
        return res.status(500).json({ error: err.message })
    }
})

// Get report statistics
router.get("/statistics", async (req, res) => {
    try {
        const recordsResult = await pool.query(`
            SELECT COUNT(*) as count FROM attendance WHERE status = 'approved'
        `)
        
        const activeEmployeesResult = await pool.query(`
            SELECT COUNT(*) as count FROM users 
            WHERE status = 'active' AND role IN ('employee', 'manager', 'admin')
        `)
        
        const hoursResult = await pool.query(`
            SELECT 
                COALESCE(SUM(total_hours), 0) as total_hours,
                COUNT(DISTINCT user_id) as active_employees
            FROM attendance
            WHERE status = 'approved'
                AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
                AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
        `)
        
        return res.json({
            statistics: {
                totalRecords: parseInt(recordsResult.rows[0].count),
                departments: parseInt(activeEmployeesResult.rows[0].count),
                reportTypes: parseInt(recordsResult.rows[0].count),
                totalHoursThisMonth: parseFloat(hoursResult.rows[0].total_hours),
                activeEmployees: parseInt(hoursResult.rows[0].active_employees)
            }
        })
    } catch (err) {
        console.error('Error in statistics:', err)
        return res.status(500).json({ error: err.message })
    }
})

// Get all employees for filter dropdown (NO DEPARTMENTS)
router.get("/departments", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                user_id as department_id,
                CONCAT(first_name, ' ', last_name) as name,
                employee_id as code
            FROM users
            WHERE status = 'active' 
                AND role IN ('employee', 'manager', 'admin')
            ORDER BY last_name, first_name
        `)
        
        return res.json({ departments: result.rows })
    } catch (err) {
        console.error('Error in departments:', err)
        return res.status(500).json({ error: err.message })
    }
})

// Get employee attendance report for current month
router.get("/employee-attendance-report", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                u.user_id,
                u.employee_id,
                u.first_name,
                u.last_name,
                u.position,
                COUNT(DISTINCT CASE 
                    WHEN a.status = 'approved' 
                    THEN a.date 
                END) as days_present,
                COALESCE(SUM(CASE 
                    WHEN a.status = 'approved' 
                    THEN a.total_hours 
                    ELSE 0 
                END), 0) as total_hours,
                COALESCE(AVG(CASE 
                    WHEN a.status = 'approved' 
                    THEN a.total_hours 
                END), 0) as avg_hours_per_day
            FROM users u
            LEFT JOIN attendance a ON u.user_id = a.user_id
                AND EXTRACT(MONTH FROM a.date) = EXTRACT(MONTH FROM CURRENT_DATE)
                AND EXTRACT(YEAR FROM a.date) = EXTRACT(YEAR FROM CURRENT_DATE)
            WHERE u.role IN ('employee', 'manager', 'admin')
                AND u.status = 'active'
            GROUP BY u.user_id, u.employee_id, u.first_name, u.last_name, u.position
            ORDER BY total_hours DESC
        `)
        
        return res.json({ employees: result.rows })
    } catch (err) {
        console.error('Error in employee-attendance-report:', err)
        return res.status(500).json({ error: err.message })
    }
})

export default router
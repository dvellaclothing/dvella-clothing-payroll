import express from "express"
import pool from "../db/pool.js"

const router = express.Router()

router.get("/top-performers", async (req, res) => {
    try {
        const { period = 'monthly' } = req.query
        
        const dateCondition = period === 'monthly' 
            ? `EXTRACT(MONTH FROM a.date) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM a.date) = EXTRACT(YEAR FROM CURRENT_DATE)`
            : `EXTRACT(QUARTER FROM a.date) = EXTRACT(QUARTER FROM CURRENT_DATE) AND EXTRACT(YEAR FROM a.date) = EXTRACT(YEAR FROM CURRENT_DATE)`
        
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
                END), 0) as avg_hours_per_day,
                COALESCE(SUM(CASE 
                    WHEN a.status = 'approved' AND a.total_hours > 8
                    THEN a.total_hours - 8
                    ELSE 0 
                END), 0) as overtime_hours,
                CASE 
                    WHEN ${period === 'monthly' ? 'EXTRACT(DAY FROM DATE_TRUNC(\'month\', CURRENT_DATE) + INTERVAL \'1 month\' - INTERVAL \'1 day\')' : '90'} > 0
                    THEN (COUNT(DISTINCT CASE WHEN a.status = 'approved' THEN a.date END)::float / ${period === 'monthly' ? 'EXTRACT(DAY FROM DATE_TRUNC(\'month\', CURRENT_DATE) + INTERVAL \'1 month\' - INTERVAL \'1 day\')' : '90'}) * 100
                    ELSE 0
                END as attendance_rate
            FROM users u
            LEFT JOIN attendance a ON u.user_id = a.user_id
                AND ${dateCondition}
            WHERE u.role IN ('employee', 'manager', 'admin')
                AND u.status = 'active'
            GROUP BY u.user_id, u.employee_id, u.first_name, u.last_name, u.position
            HAVING COALESCE(SUM(CASE 
                WHEN a.status = 'approved' 
                THEN a.total_hours 
                ELSE 0 
            END), 0) > 0
            ORDER BY total_hours DESC
            LIMIT 10
        `)
        
        return res.json({ performers: result.rows })
    } catch (err) {
        console.error('Error in top-performers:', err)
        return res.status(500).json({ error: err.message })
    }
})

router.get("/bottom-performers", async (req, res) => {
    try {
        const { period = 'monthly' } = req.query
        
        const dateCondition = period === 'monthly' 
            ? `EXTRACT(MONTH FROM a.date) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM a.date) = EXTRACT(YEAR FROM CURRENT_DATE)`
            : `EXTRACT(QUARTER FROM a.date) = EXTRACT(QUARTER FROM CURRENT_DATE) AND EXTRACT(YEAR FROM a.date) = EXTRACT(YEAR FROM CURRENT_DATE)`
        
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
                END), 0) as avg_hours_per_day,
                COALESCE(SUM(CASE 
                    WHEN a.status = 'approved' AND a.total_hours > 8
                    THEN a.total_hours - 8
                    ELSE 0 
                END), 0) as overtime_hours,
                CASE 
                    WHEN ${period === 'monthly' ? 'EXTRACT(DAY FROM DATE_TRUNC(\'month\', CURRENT_DATE) + INTERVAL \'1 month\' - INTERVAL \'1 day\')' : '90'} > 0
                    THEN (COUNT(DISTINCT CASE WHEN a.status = 'approved' THEN a.date END)::float / ${period === 'monthly' ? 'EXTRACT(DAY FROM DATE_TRUNC(\'month\', CURRENT_DATE) + INTERVAL \'1 month\' - INTERVAL \'1 day\')' : '90'}) * 100
                    ELSE 0
                END as attendance_rate
            FROM users u
            LEFT JOIN attendance a ON u.user_id = a.user_id
                AND ${dateCondition}
            WHERE u.role IN ('employee', 'manager', 'admin')
                AND u.status = 'active'
            GROUP BY u.user_id, u.employee_id, u.first_name, u.last_name, u.position
            ORDER BY total_hours ASC
            LIMIT 10
        `)
        
        return res.json({ performers: result.rows })
    } catch (err) {
        console.error('Error in bottom-performers:', err)
        return res.status(500).json({ error: err.message })
    }
})

router.get("/monthly-trends", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                EXTRACT(MONTH FROM a.date) as month,
                EXTRACT(YEAR FROM a.date) as year,
                TO_CHAR(a.date, 'Mon') as month_name,
                COUNT(DISTINCT a.user_id) as unique_employees,
                SUM(a.total_hours) as total_hours,
                AVG(a.total_hours) as avg_hours_per_attendance,
                COUNT(DISTINCT a.date) as total_days,
                COALESCE(SUM(a.total_hours) / NULLIF(COUNT(DISTINCT a.user_id), 0), 0) as avg_hours_per_employee
            FROM attendance a
            WHERE a.status = 'approved'
                AND a.date >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY EXTRACT(MONTH FROM a.date), EXTRACT(YEAR FROM a.date), TO_CHAR(a.date, 'Mon')
            ORDER BY year, month
        `)
        
        return res.json({ trends: result.rows })
    } catch (err) {
        console.error('Error in monthly-trends:', err)
        return res.status(500).json({ error: err.message })
    }
})

// Get overall metrics
router.get("/overall-metrics", async (req, res) => {
    try {
        const { period = 'monthly' } = req.query
        
        const dateCondition = period === 'monthly' 
            ? `EXTRACT(MONTH FROM a.date) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM a.date) = EXTRACT(YEAR FROM CURRENT_DATE)`
            : `EXTRACT(QUARTER FROM a.date) = EXTRACT(QUARTER FROM CURRENT_DATE) AND EXTRACT(YEAR FROM a.date) = EXTRACT(YEAR FROM CURRENT_DATE)`
        
        const metricsResult = await pool.query(`
            SELECT 
                COUNT(DISTINCT a.user_id) as total_employees,
                COALESCE(SUM(a.total_hours), 0) as total_hours,
                COALESCE(SUM(a.total_hours) / NULLIF(COUNT(DISTINCT a.user_id), 0), 0) as avg_hours_per_employee,
                COALESCE(SUM(CASE 
                    WHEN a.total_hours > 8 
                    THEN a.total_hours - 8 
                    ELSE 0 
                END), 0) as total_overtime_hours
            FROM attendance a
            WHERE a.status = 'approved'
                AND ${dateCondition}
        `)
        
        const employeeCountResult = await pool.query(`
            SELECT COUNT(*) as count
            FROM users
            WHERE status = 'active' AND role IN ('employee', 'manager', 'admin')
        `)
        
        const workingDays = period === 'monthly'
            ? await pool.query(`SELECT EXTRACT(DAY FROM DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day') as days`)
            : { rows: [{ days: 90 }] }
        
        const attendanceRateResult = await pool.query(`
            SELECT 
                COALESCE(
                    (COUNT(DISTINCT a.date)::float / NULLIF(${workingDays.rows[0].days}, 0)) * 100,
                    0
                ) as avg_attendance_rate
            FROM attendance a
            WHERE a.status = 'approved'
                AND ${dateCondition}
        `)
        
        const metrics = metricsResult.rows[0]
        const totalEmployees = parseInt(employeeCountResult.rows[0].count)
        const avgAttendanceRate = parseFloat(attendanceRateResult.rows[0].avg_attendance_rate)
        
        return res.json({
            metrics: {
                totalEmployees: totalEmployees,
                totalHours: parseFloat(metrics.total_hours),
                avgHoursPerEmployee: parseFloat(metrics.avg_hours_per_employee),
                avgAttendanceRate: avgAttendanceRate,
                totalOvertimeHours: parseFloat(metrics.total_overtime_hours)
            }
        })
    } catch (err) {
        console.error('Error in overall-metrics:', err)
        return res.status(500).json({ error: err.message })
    }
})

export default router
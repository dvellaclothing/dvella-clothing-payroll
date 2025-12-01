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
                    WHEN a.status = 'checked_out' 
                    THEN a.date 
                END) as days_present,
                COALESCE(SUM(CASE 
                    WHEN a.status = 'checked_out' 
                    THEN a.total_hours 
                    ELSE 0 
                END), 0) as total_hours,
                COALESCE(AVG(CASE 
                    WHEN a.status = 'checked_out' 
                    THEN a.total_hours 
                END), 0) as avg_hours_per_day,
                COALESCE(SUM(CASE 
                    WHEN a.status = 'checked_out' AND a.total_hours > 8
                    THEN a.total_hours - 8
                    ELSE 0 
                END), 0) as overtime_hours,
                CASE 
                    WHEN ${period === 'monthly' ? 'EXTRACT(DAY FROM DATE_TRUNC(\'month\', CURRENT_DATE) + INTERVAL \'1 month\' - INTERVAL \'1 day\')' : '90'} > 0
                    THEN (COUNT(DISTINCT CASE WHEN a.status = 'checked_out' THEN a.date END)::float / ${period === 'monthly' ? 'EXTRACT(DAY FROM DATE_TRUNC(\'month\', CURRENT_DATE) + INTERVAL \'1 month\' - INTERVAL \'1 day\')' : '90'}) * 100
                    ELSE 0
                END as attendance_rate
            FROM users u
            LEFT JOIN attendance a ON u.user_id = a.user_id
                AND ${dateCondition}
            WHERE u.role IN ('employee', 'manager', 'admin')
                AND u.status = 'active'
            GROUP BY u.user_id, u.employee_id, u.first_name, u.last_name, u.position
            HAVING COALESCE(SUM(CASE 
                WHEN a.status = 'checked_out' 
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
                    WHEN a.status = 'checked_out' 
                    THEN a.date 
                END) as days_present,
                COALESCE(SUM(CASE 
                    WHEN a.status = 'checked_out' 
                    THEN a.total_hours 
                    ELSE 0 
                END), 0) as total_hours,
                COALESCE(AVG(CASE 
                    WHEN a.status = 'checked_out' 
                    THEN a.total_hours 
                END), 0) as avg_hours_per_day,
                COALESCE(SUM(CASE 
                    WHEN a.status = 'checked_out' AND a.total_hours > 8
                    THEN a.total_hours - 8
                    ELSE 0 
                END), 0) as overtime_hours,
                CASE 
                    WHEN ${period === 'monthly' ? 'EXTRACT(DAY FROM DATE_TRUNC(\'month\', CURRENT_DATE) + INTERVAL \'1 month\' - INTERVAL \'1 day\')' : '90'} > 0
                    THEN (COUNT(DISTINCT CASE WHEN a.status = 'checked_out' THEN a.date END)::float / ${period === 'monthly' ? 'EXTRACT(DAY FROM DATE_TRUNC(\'month\', CURRENT_DATE) + INTERVAL \'1 month\' - INTERVAL \'1 day\')' : '90'}) * 100
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
            WHERE a.status = 'checked_out'
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
            WHERE a.status = 'checked_out'
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
            WHERE a.status = 'checked_out'
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

router.get("/:user_id", async (req, res) => {
    try {
        const { user_id } = req.params
        const currentMonthResult = await pool.query(`
            SELECT 
                COUNT(DISTINCT CASE 
                    WHEN a.status = 'checked_out' 
                    THEN a.date 
                END) as days_present,
                COALESCE(SUM(CASE 
                    WHEN a.status = 'checked_out' 
                    THEN a.total_hours
                    ELSE 0 
                END), 0) as total_hours,
                COALESCE(AVG(CASE 
                    WHEN a.status = 'checked_out' 
                    THEN a.total_hours 
                END), 0) as avg_hours_per_day,
                COALESCE(SUM(CASE 
                    WHEN a.status = 'checked_out' AND a.total_hours > 8
                    THEN a.total_hours - 8
                    ELSE 0 
                END), 0) as overtime_hours
            FROM attendance a
            WHERE a.user_id = $1
                AND a.status = 'checked_out'
                AND EXTRACT(MONTH FROM a.date) = EXTRACT(MONTH FROM CURRENT_DATE)
                AND EXTRACT(YEAR FROM a.date) = EXTRACT(YEAR FROM CURRENT_DATE)
        `, [user_id])
        
        const currentMonth = currentMonthResult.rows[0]
        const employeeResult = await pool.query(`
            SELECT first_name, last_name, position, hourly_rate
            FROM users
            WHERE user_id = $1
        `, [user_id])
        
        if (employeeResult.rows.length === 0) {
            return res.status(404).json({ message: 'Employee not found' })
        }
        const employee = employeeResult.rows[0]
        const workingDaysResult = await pool.query(`
            SELECT EXTRACT(DAY FROM DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day') as days
        `)
        const workingDays = parseFloat(workingDaysResult.rows[0].days)
        
        // Define KPI targets
        const targets = {
            hoursPerMonth: 160,
            attendanceRate: 95, 
            avgHoursPerDay: 8, 
            overtimeLimit: 20 
        }
        
        // Calculate actual values
        const totalHours = parseFloat(currentMonth.total_hours)
        const daysPresent = parseInt(currentMonth.days_present)
        const avgHoursPerDay = parseFloat(currentMonth.avg_hours_per_day)
        const overtimeHours = parseFloat(currentMonth.overtime_hours)
        const attendanceRate = (daysPresent / workingDays) * 100
        
        // Calculate scores (0-100 scale)
        const hoursScore = Math.min((totalHours / targets.hoursPerMonth) * 100, 100)
        const attendanceScore = Math.min((attendanceRate / targets.attendanceRate) * 100, 100)
        const avgHoursScore = Math.min((avgHoursPerDay / targets.avgHoursPerDay) * 100, 100)
        const overtimeScore = overtimeHours <= targets.overtimeLimit ? 100 : Math.max(100 - ((overtimeHours - targets.overtimeLimit) * 2), 0)
        
        // Calculate weighted overall score
        const weights = {
            hours: 40,
            attendance: 30,
            avgHours: 20,
            overtime: 10
        }
        
        const overallScore = (
            (hoursScore * weights.hours / 100) +
            (attendanceScore * weights.attendance / 100) +
            (avgHoursScore * weights.avgHours / 100) +
            (overtimeScore * weights.overtime / 100)
        )
        
        // Build metrics array
        const metrics = [
            {
                name: 'Total Working Hours',
                score: totalHours,
                target_value: targets.hoursPerMonth,
                weight: weights.hours,
                unit: 'hours',
                description: 'Total hours worked this month'
            },
            {
                name: 'Attendance Rate',
                score: attendanceRate,
                target_value: targets.attendanceRate,
                weight: weights.attendance,
                unit: '%',
                description: 'Percentage of days present'
            },
            {
                name: 'Average Hours per Day',
                score: avgHoursPerDay,
                target_value: targets.avgHoursPerDay,
                weight: weights.avgHours,
                unit: 'hours',
                description: 'Average working hours per attendance day'
            },
            {
                name: 'Overtime Management',
                score: overtimeScore,
                target_value: 100,
                weight: weights.overtime,
                unit: 'score',
                description: `${overtimeHours.toFixed(1)}h overtime (target: max ${targets.overtimeLimit}h)`
            }
        ]
        
        return res.json({
            employee: {
                name: `${employee.first_name} ${employee.last_name}`,
                position: employee.position,
                hourly_rate: employee.hourly_rate
            },
            overallScore: parseFloat(overallScore.toFixed(1)),
            maxScore: 100,
            metrics: metrics,
            summary: {
                total_hours: totalHours,
                days_present: daysPresent,
                working_days: workingDays,
                attendance_rate: parseFloat(attendanceRate.toFixed(1)),
                overtime_hours: overtimeHours
            }
        })
    } catch (err) {
        console.error('Error in employee KPI:', err)
        return res.status(500).json({ error: err.message })
    }
})

export default router
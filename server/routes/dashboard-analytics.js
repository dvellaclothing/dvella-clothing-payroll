
import express from 'express'
import pool from '../db/pool.js'

const router = express.Router()

router.get("/get-total-employees", async (req, res) => {
    let client;
    try {
        client = await pool.connect();
        
        const result = await client.query(`
            SELECT 
                COUNT(*) as total_employees,
                COUNT(*) FILTER (
                    WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
                    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
                ) as added_this_month
            FROM users
            WHERE status = 'active' 
            AND role IN ('employee', 'manager', 'admin')
            -- Removed deleted_at check since the column doesn't exist
        `);
        
        const total = parseInt(result.rows[0].total_employees) || 0;
        const addedThisMonth = parseInt(result.rows[0].added_this_month) || 0;
        
        return res.json({
            totalEmployees: total,
            addedThisMonth: addedThisMonth
        });
    } catch (err) {
        console.error('Error in get-total-employees:', {
            error: err.message,
            code: err.code
        });
        return res.status(500).json({ 
            error: "Failed to fetch employees",
            details: err.message
        });
    } finally {
        if (client) client.release();
    }
});

router.get("/get-monthly-payroll", async (req, res) => {
    try {
        const [currentMonth, lastMonth] = await Promise.all([
            pool.query(`
                SELECT 
                    COALESCE(SUM(
                        CASE 
                            WHEN a.total_hours <= 8 THEN 
                                a.total_hours * COALESCE(u.hourly_rate, 0)
                            ELSE 
                                (8 * COALESCE(u.hourly_rate, 0)) + 
                                ((a.total_hours - 8) * COALESCE(u.hourly_rate, 0) * 1.5)
                        END
                    ), 0) as total_gross,
                    COUNT(DISTINCT a.user_id) as employee_count
                FROM attendance a
                INNER JOIN users u ON a.user_id = u.user_id
                WHERE a.status = 'checked_out'
                    AND EXTRACT(MONTH FROM a.date) = EXTRACT(MONTH FROM CURRENT_DATE)
                    AND EXTRACT(YEAR FROM a.date) = EXTRACT(YEAR FROM CURRENT_DATE)
            `),
            pool.query(`
                SELECT 
                    COALESCE(SUM(
                        CASE 
                            WHEN a.total_hours <= 8 THEN 
                                a.total_hours * COALESCE(u.hourly_rate, 0)
                            ELSE 
                                (8 * COALESCE(u.hourly_rate, 0)) + 
                                ((a.total_hours - 8) * COALESCE(u.hourly_rate, 0) * 1.5)
                        END
                    ), 0) as total_gross
                FROM attendance a
                INNER JOIN users u ON a.user_id = u.user_id
                WHERE a.status = 'checked_out'
                    AND EXTRACT(MONTH FROM a.date) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')
                    AND EXTRACT(YEAR FROM a.date) = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')
            `)
        ])

        const currentGross = parseFloat(currentMonth.rows[0].total_gross) || 0
        const lastMonthGross = parseFloat(lastMonth.rows[0].total_gross) || 0
        const employeeCount = parseInt(currentMonth.rows[0].employee_count) || 0
        
        // Calculate net pay (15% deduction)
        const currentNet = currentGross * 0.85
        const lastMonthNet = lastMonthGross * 0.85
        
        // Calculate percentage change
        const change = currentNet - lastMonthNet
        const percentage = lastMonthNet > 0 ? (change / lastMonthNet) * 100 : 100

        return res.json({
            currentMonth: parseFloat(currentNet.toFixed(2)),
            lastMonth: parseFloat(lastMonthNet.toFixed(2)),
            change: parseFloat(change.toFixed(2)),
            percentage: parseFloat(percentage.toFixed(1)),
            employeeCount: employeeCount
        })
    } catch (err) {
        console.error('Error in get-monthly-payroll:', err)
        return res.status(500).json({ 
            error: "Failed to fetch payroll data",
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        })
    }
})

router.get("/get-avg-kpi-score", async (req, res) => {
    let client;
    try {
        client = await pool.connect();

        // First check if kpi_scores table exists
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'kpi_scores'
            )
        `);
        
        if (!tableCheck.rows[0].exists) {
            console.warn("KPI scores table doesn't exist, returning default values");
            return res.json({
                currentMonth: 0,
                lastMonth: 0,
                change: 0,
                percentage: 0,
                employeeCount: 0
            });
        }

        // Get the actual column names from the kpi_scores table
        const columns = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'kpi_scores'
        `);
        
        const hasDateColumn = columns.rows.some(col => 
            ['evaluation_date', 'created_at', 'date'].includes(col.column_name)
        );

        if (!hasDateColumn) {
            // If no date column exists, just get the latest scores
            const scores = await client.query(`
                SELECT 
                    COALESCE(AVG(score), 0) as avg_score,
                    COUNT(DISTINCT user_id) as employee_count
                FROM kpi_scores
            `);
            
            const avgScore = parseFloat(scores.rows[0].avg_score) || 0;
            
            return res.json({
                currentMonth: parseFloat(avgScore.toFixed(1)),
                lastMonth: 0,
                change: 0,
                percentage: 0,
                employeeCount: parseInt(scores.rows[0].employee_count) || 0
            });
        }

        // Determine which date column to use
        const dateColumn = columns.rows.some(col => col.column_name === 'evaluation_date') 
            ? 'evaluation_date' 
            : columns.rows.some(col => col.column_name === 'date')
                ? 'date'
                : 'created_at';

        const [currentMonth, lastMonth] = await Promise.all([
            client.query(`
                SELECT 
                    COALESCE(AVG(score), 0) as avg_score,
                    COUNT(DISTINCT user_id) as employee_count
                FROM kpi_scores
                WHERE EXTRACT(MONTH FROM ${dateColumn}) = EXTRACT(MONTH FROM CURRENT_DATE)
                AND EXTRACT(YEAR FROM ${dateColumn}) = EXTRACT(YEAR FROM CURRENT_DATE)
            `),
            client.query(`
                SELECT 
                    COALESCE(AVG(score), 0) as avg_score
                FROM kpi_scores
                WHERE EXTRACT(MONTH FROM ${dateColumn}) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')
                AND EXTRACT(YEAR FROM ${dateColumn}) = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')
            `)
        ]);

        const currentScore = parseFloat(currentMonth.rows[0].avg_score) || 0;
        const lastMonthScore = parseFloat(lastMonth.rows[0].avg_score) || 0;
        const employeeCount = parseInt(currentMonth.rows[0].employee_count) || 0;
        const change = currentScore - lastMonthScore;
        const percentage = lastMonthScore > 0 ? (change / lastMonthScore) * 100 : 0;

        return res.json({
            currentMonth: parseFloat(currentScore.toFixed(1)),
            lastMonth: parseFloat(lastMonthScore.toFixed(1)),
            change: parseFloat(change.toFixed(1)),
            percentage: parseFloat(percentage.toFixed(1)),
            employeeCount: employeeCount
        });
    } catch (err) {
        console.error('Error in get-avg-kpi-score:', {
            error: err.message,
            code: err.code,
            query: err.query
        });
        return res.status(500).json({ 
            error: "Failed to fetch KPI scores",
            details: err.message
        });
    } finally {
        if (client) client.release();
    }
});

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
        // Get the next upcoming payroll period
        const nextPeriod = await pool.query(`
            SELECT 
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
            // Return default values if no upcoming payroll
            return res.json({
                period_name: "No Upcoming Payroll",
                start_date: new Date().toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0],
                pay_date: new Date().toISOString().split('T')[0],
                employee_count: 0,
                estimated_amount: 0,
                status: "closed"
            })
        }
        
        const period = nextPeriod.rows[0]
        
        // Get total active employees
        const employeeCount = await pool.query(`
            SELECT COUNT(*) as count
            FROM users
            WHERE status = 'active' 
            AND role IN ('employee', 'manager')
        `)
        
        // Calculate estimated payroll amount
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
            WHERE a.status = 'checked_out'
                AND a.date BETWEEN $1 AND $2
        `, [period.start_date, period.end_date])
        
        // Format the response to match frontend expectations
        return res.json({
            period_name: period.period_name,
            start_date: period.start_date.toISOString().split('T')[0],
            end_date: period.end_date.toISOString().split('T')[0],
            pay_date: period.pay_date.toISOString().split('T')[0],
            employee_count: parseInt(employeeCount.rows[0].count) || 0,
            estimated_amount: parseFloat(estimatedAmount.rows[0].estimated_net) || 0,
            status: period.status || "open"
        })
        
    } catch (err) {
        console.error('Error in get-upcoming-payroll:', err)
        // Return default values in case of error
        return res.json({
            period_name: "Error Loading Payroll",
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date().toISOString().split('T')[0],
            pay_date: new Date().toISOString().split('T')[0],
            employee_count: 0,
            estimated_amount: 0,
            status: "error"
        })
    }
})

router.get("/employee-attendance/:user_id", async (req, res) => {
    try {
        const { user_id } = req.params
        
        const currentMonth = await pool.query(`
            SELECT 
                COUNT(DISTINCT CASE WHEN status = 'checked_out' THEN date END) as present_days,
                COUNT(DISTINCT CASE WHEN status = 'pending' THEN date END) as pending_days,
                COALESCE(SUM(CASE WHEN status = 'checked_out' THEN total_hours ELSE 0 END), 0) as total_hours,
                COALESCE(AVG(CASE WHEN status = 'checked_out' THEN total_hours END), 0) as avg_hours_per_day
            FROM attendance
            WHERE user_id = $1
                AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
                AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
        `, [user_id])
        
        const lastMonth = await pool.query(`
            SELECT 
                COUNT(DISTINCT CASE WHEN status = 'checked_out' THEN date END) as present_days,
                COALESCE(SUM(CASE WHEN status = 'checked_out' THEN total_hours ELSE 0 END), 0) as total_hours
            FROM attendance
            WHERE user_id = $1
                AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')
                AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')
        `, [user_id])
        
        const workingDays = await pool.query(`
            SELECT EXTRACT(DAY FROM DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day') as days
        `)
        
        const currentData = currentMonth.rows[0]
        const lastData = lastMonth.rows[0]
        const totalWorkingDays = parseInt(workingDays.rows[0].days)
        
        return res.json({
            currentMonth: {
                present_days: parseInt(currentData.present_days) || 0,
                pending_days: parseInt(currentData.pending_days) || 0,
                total_hours: parseFloat(currentData.total_hours) || 0,
                avg_hours_per_day: parseFloat(currentData.avg_hours_per_day) || 0,
                working_days: totalWorkingDays,
                attendance_rate: totalWorkingDays > 0 ? ((parseInt(currentData.present_days) / totalWorkingDays) * 100).toFixed(1) : 0
            },
            lastMonth: {
                present_days: parseInt(lastData.present_days) || 0,
                total_hours: parseFloat(lastData.total_hours) || 0
            }
        })
    } catch (err) {
        console.error('Error in employee-attendance:', err)
        return res.status(500).json({ error: err.message })
    }
})

router.get("/employee-recent-activity/:user_id", async (req, res) => {
    try {
        const { user_id } = req.params
        
        const result = await pool.query(`
            SELECT 
                'attendance' as activity_type,
                a.date,
                a.status,
                a.total_hours,
                a.created_at,
                'Attendance for ' || TO_CHAR(a.date, 'Mon DD, YYYY') as description
            FROM attendance a
            WHERE a.user_id = $1
                AND a.created_at >= CURRENT_DATE - INTERVAL '14 days'
            
            UNION ALL
            
            SELECT 
                'leave' as activity_type,
                lr.start_date as date,
                lr.status,
                NULL as total_hours,
                lr.created_at,
                'Leave request: ' || lr.leave_type as description
            FROM leave_requests lr
            WHERE lr.user_id = $1
                AND lr.created_at >= CURRENT_DATE - INTERVAL '14 days'
            
            ORDER BY created_at DESC
            LIMIT 10
        `, [user_id])
        
        return res.json({ activities: result.rows })
    } catch (err) {
        console.error('Error in employee-recent-activity:', err)
        return res.status(500).json({ error: err.message })
    }
})

// Get employee next payroll info
router.get("/employee-next-payroll/:user_id", async (req, res) => {
    try {
        const { user_id } = req.params
        
        // Get next payroll period
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
        
        // Get employee's data
        const userData = await pool.query(`
            SELECT hourly_rate, position
            FROM users
            WHERE user_id = $1
        `, [user_id])
        
        // Calculate employee's expected pay for this period
        const hoursWorked = await pool.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN status = 'checked_out' THEN total_hours ELSE 0 END), 0) as total_hours,
                COALESCE(SUM(CASE 
                    WHEN status = 'checked_out' AND total_hours > 8 
                    THEN total_hours - 8 
                    ELSE 0 
                END), 0) as overtime_hours
            FROM attendance
            WHERE user_id = $1
                AND date BETWEEN $2 AND $3
        `, [user_id, period.start_date, period.end_date])
        
        const user = userData.rows[0]
        const hours = hoursWorked.rows[0]
        const hourlyRate = parseFloat(user.hourly_rate) || 0
        const regularHours = parseFloat(hours.total_hours) - parseFloat(hours.overtime_hours)
        const overtimeHours = parseFloat(hours.overtime_hours)
        
        const regularPay = regularHours * hourlyRate
        const overtimePay = overtimeHours * hourlyRate * 1.5
        const grossPay = regularPay + overtimePay
        const estimatedNet = grossPay * 0.85 // Assuming 15% deductions
        
        return res.json({
            period: {
                ...period,
                hours_worked: parseFloat(hours.total_hours),
                overtime_hours: overtimeHours,
                estimated_gross: parseFloat(grossPay.toFixed(2)),
                estimated_net: parseFloat(estimatedNet.toFixed(2))
            }
        })
    } catch (err) {
        console.error('Error in employee-next-payroll:', err)
        return res.status(500).json({ error: err.message })
    }
})

// Get employee pending requests count
router.get("/employee-pending-requests/:user_id", async (req, res) => {
    try {
        const { user_id } = req.params
        
        const result = await pool.query(`
            SELECT 
                COUNT(*) FILTER (WHERE type = 'attendance') as pending_attendance,
                COUNT(*) FILTER (WHERE type = 'leave') as pending_leave
            FROM (
                SELECT 'attendance' as type
                FROM attendance
                WHERE user_id = $1 AND status = 'pending'
                
                UNION ALL
                
                SELECT 'leave' as type
                FROM leave_requests
                WHERE user_id = $1 AND status = 'pending'
            ) as combined
        `, [user_id])
        
        return res.json({
            pending_attendance: parseInt(result.rows[0].pending_attendance) || 0,
            pending_leave: parseInt(result.rows[0].pending_leave) || 0,
            total_pending: (parseInt(result.rows[0].pending_attendance) || 0) + (parseInt(result.rows[0].pending_leave) || 0)
        })
    } catch (err) {
        console.error('Error in employee-pending-requests:', err)
        return res.status(500).json({ error: err.message })
    }
})

export default router
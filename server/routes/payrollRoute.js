import express from 'express'
import pool from '../db/pool.js'

const router = express.Router()

// Philippine statutory deduction rates
const DEDUCTION_RATES = {
    // SSS Contributions (2024 rates - simplified)
    sss: (salary) => {
        if (salary < 3250) return 135
        if (salary < 3750) return 157.50
        if (salary < 4250) return 180
        if (salary < 4750) return 202.50
        if (salary < 5250) return 225
        if (salary < 5750) return 247.50
        if (salary < 6250) return 270
        if (salary < 6750) return 292.50
        if (salary < 7250) return 315
        if (salary < 7750) return 337.50
        if (salary < 8250) return 360
        if (salary < 8750) return 382.50
        if (salary < 9250) return 405
        if (salary < 9750) return 427.50
        if (salary < 10250) return 450
        if (salary < 10750) return 472.50
        if (salary < 11250) return 495
        if (salary < 11750) return 517.50
        if (salary < 12250) return 540
        if (salary < 12750) return 562.50
        if (salary < 13250) return 585
        if (salary < 13750) return 607.50
        if (salary < 14250) return 630
        if (salary < 14750) return 652.50
        if (salary < 15250) return 675
        if (salary < 15750) return 697.50
        if (salary < 16250) return 720
        if (salary < 16750) return 742.50
        if (salary < 17250) return 765
        if (salary < 17750) return 787.50
        if (salary < 18250) return 810
        if (salary < 18750) return 832.50
        if (salary < 19250) return 855
        if (salary < 19750) return 877.50
        return 900 // Maximum SSS contribution
    },
    
    // PhilHealth (2024 rates)
    philhealth: (salary) => {
        const monthlyBasicPay = salary
        if (monthlyBasicPay < 10000) return 450 * 0.5 // Employee share
        if (monthlyBasicPay > 100000) return 5000 * 0.5 // Maximum
        return (monthlyBasicPay * 0.05) * 0.5 // 5% total, employee pays 50%
    },
    
    // Pag-IBIG (HDMF)
    pagibig: (salary) => {
        if (salary <= 1500) return salary * 0.01
        if (salary > 1500 && salary < 5000) return salary * 0.02
        return 100 // Maximum of PHP 100
    },
    
    // Withholding Tax (simplified - you may want to use actual tax tables)
    withholdingTax: (taxableIncome) => {
        // Simplified Philippine tax brackets (2024)
        if (taxableIncome <= 20833) return 0 // 250k annually
        if (taxableIncome <= 33332) return (taxableIncome - 20833) * 0.15
        if (taxableIncome <= 66666) return 1875 + (taxableIncome - 33332) * 0.20
        if (taxableIncome <= 166666) return 8541.80 + (taxableIncome - 66666) * 0.25
        if (taxableIncome <= 666666) return 33541.80 + (taxableIncome - 166666) * 0.30
        return 183541.80 + (taxableIncome - 666666) * 0.35
    }
}

// Calculate deductions - only SSS and Pag-IBIG based on gross pay
// Returns zero deductions if gross pay is 0 or negative
const calculateDeductions = (grossPay) => {
    // No deductions if no gross pay
    if (grossPay <= 0) {
        return {
            sss: 0,
            pagibig: 0,
            total: 0
        }
    }
    
    const sss = DEDUCTION_RATES.sss(grossPay)
    const pagibig = DEDUCTION_RATES.pagibig(grossPay)
    
    return {
        sss: parseFloat(sss.toFixed(2)),
        pagibig: parseFloat(pagibig.toFixed(2)),
        total: parseFloat((sss + pagibig).toFixed(2))
    }
}

// Get all payroll periods
router.get('/payroll/periods', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                period_id,
                period_name,
                start_date,
                end_date,
                pay_date,
                status
            FROM payroll_periods
            ORDER BY start_date DESC
        `)
        
        return res.json(result.rows)
    } catch (err) {
        console.error('Error fetching periods:', err)
        return res.status(500).json({ error: err.message })
    }
})

// Get payroll data for a specific period
router.get('/payroll/:period_id', async (req, res) => {
    try {
        const { period_id } = req.params
        
        // Get period details
        const periodResult = await pool.query(`
            SELECT * FROM payroll_periods WHERE period_id = $1
        `, [period_id])
        
        if (periodResult.rows.length === 0) {
            return res.status(404).json({ message: 'Period not found' })
        }
        
        const period = periodResult.rows[0]
        
        // Get all active employees with their attendance data for the period
        const employeesResult = await pool.query(`
            SELECT 
                u.user_id,
                u.employee_id,
                u.first_name,
                u.last_name,
                u.position,
                u.salary as basic_salary,
                u.hourly_rate,
                COALESCE(SUM(CASE 
                    WHEN a.status = 'approved' 
                    THEN a.total_hours 
                    ELSE 0 
                END), 0) as hours_worked,
                COALESCE(SUM(CASE 
                    WHEN a.status = 'approved' AND a.total_hours > 8
                    THEN a.total_hours - 8
                    ELSE 0 
                END), 0) as overtime_hours
            FROM users u
            LEFT JOIN attendance a ON u.user_id = a.user_id
                AND a.date BETWEEN $1 AND $2
            WHERE u.role IN ('employee', 'manager')
                AND u.status = 'active'
            GROUP BY u.user_id, u.employee_id, u.first_name, u.last_name, u.position, u.salary, u.hourly_rate
            ORDER BY u.last_name, u.first_name
        `, [period.start_date, period.end_date])
        
        const employees = employeesResult.rows.map(emp => {
            const basicSalary = parseFloat(emp.basic_salary) || 0
            const hourlyRate = parseFloat(emp.hourly_rate) || (basicSalary / 160)
            const hoursWorked = parseFloat(emp.hours_worked) || 0
            const overtimeHours = parseFloat(emp.overtime_hours) || 0
            
            // Calculate regular hours (subtract overtime from total)
            const regularHours = hoursWorked - overtimeHours
            
            // Calculate pay based on hours worked
            const regularPay = regularHours * hourlyRate
            const overtimeRate = hourlyRate * 1.5
            const overtimeAmount = overtimeHours * overtimeRate
            
            // Gross pay = regular pay + overtime pay
            const grossPay = regularPay + overtimeAmount
            
            // Calculate deductions based on gross pay (SSS and Pag-IBIG only)
            // No deductions if gross pay is 0 or negative
            const deductions = calculateDeductions(grossPay)
            
            // Net pay = gross pay - deductions
            const netPay = grossPay - deductions.total
            
            return {
                user_id: emp.user_id,
                employee_id: emp.employee_id,
                first_name: emp.first_name,
                last_name: emp.last_name,
                position: emp.position,
                basic_salary: basicSalary,
                hourly_rate: hourlyRate,
                hours_worked: hoursWorked,
                overtime_hours: overtimeHours,
                regular_pay: parseFloat(regularPay.toFixed(2)),
                overtime_amount: parseFloat(overtimeAmount.toFixed(2)),
                gross_pay: parseFloat(grossPay.toFixed(2)),
                deductions: deductions.total,
                deduction_breakdown: deductions,
                net_pay: parseFloat(netPay.toFixed(2))
            }
        })
        
        // Calculate totals
        const totals = employees.reduce((acc, emp) => ({
            totalGross: acc.totalGross + emp.gross_pay,
            totalDeductions: acc.totalDeductions + emp.deductions,
            totalNet: acc.totalNet + emp.net_pay,
            totalHours: acc.totalHours + emp.hours_worked,
            totalOvertime: acc.totalOvertime + emp.overtime_amount
        }), {
            totalGross: 0,
            totalDeductions: 0,
            totalNet: 0,
            totalHours: 0,
            totalOvertime: 0
        })
        
        return res.json({
            period: period,
            employees: employees,
            totals: totals
        })
    } catch (err) {
        console.error('Error fetching payroll data:', err)
        return res.status(500).json({ error: err.message })
    }
})

// Generate individual payslip
router.post('/payroll/generate-payslip/:user_id/:period_id', async (req, res) => {
    try {
        const { user_id, period_id } = req.params
        
        // Get period details
        const periodResult = await pool.query(`
            SELECT * FROM payroll_periods WHERE period_id = $1
        `, [period_id])
        
        if (periodResult.rows.length === 0) {
            return res.status(404).json({ message: 'Period not found' })
        }
        
        const period = periodResult.rows[0]
        
        // Get employee data with attendance
        const employeeResult = await pool.query(`
            SELECT 
                u.user_id,
                u.employee_id,
                u.first_name,
                u.last_name,
                u.position,
                u.salary as basic_salary,
                u.hourly_rate,
                COALESCE(SUM(CASE 
                    WHEN a.status = 'approved' 
                    THEN a.total_hours 
                    ELSE 0 
                END), 0) as hours_worked,
                COALESCE(SUM(CASE 
                    WHEN a.status = 'approved' AND a.total_hours > 8
                    THEN a.total_hours - 8
                    ELSE 0 
                END), 0) as overtime_hours
            FROM users u
            LEFT JOIN attendance a ON u.user_id = a.user_id
                AND a.date BETWEEN $2 AND $3
            WHERE u.user_id = $1
            GROUP BY u.user_id, u.employee_id, u.first_name, u.last_name, u.position, u.salary, u.hourly_rate
        `, [user_id, period.start_date, period.end_date])
        
        if (employeeResult.rows.length === 0) {
            return res.status(404).json({ message: 'Employee not found' })
        }
        
        const emp = employeeResult.rows[0]
        
        const basicSalary = parseFloat(emp.basic_salary) || 0
        const hourlyRate = parseFloat(emp.hourly_rate) || (basicSalary / 160)
        const hoursWorked = parseFloat(emp.hours_worked) || 0
        const overtimeHours = parseFloat(emp.overtime_hours) || 0
        
        // Calculate regular hours (subtract overtime from total)
        const regularHours = hoursWorked - overtimeHours
        
        // Calculate pay based on hours worked
        const regularPay = regularHours * hourlyRate
        const overtimeRate = hourlyRate * 1.5
        const overtimeAmount = overtimeHours * overtimeRate
        
        // Gross pay = regular pay + overtime pay
        const grossPay = regularPay + overtimeAmount
        
        // Calculate deductions based on gross pay (SSS and Pag-IBIG only)
        // No deductions if gross pay is 0 or negative
        const deductions = calculateDeductions(grossPay)
        
        // Net pay = gross pay - deductions
        const netPay = grossPay - deductions.total
        
        return res.json({
            user_id: emp.user_id,
            employee_id: emp.employee_id,
            first_name: emp.first_name,
            last_name: emp.last_name,
            position: emp.position,
            period_name: period.period_name,
            pay_date: period.pay_date,
            salary: basicSalary,
            hourly_rate: hourlyRate,
            hours_worked: hoursWorked,
            overtime_hours: overtimeHours,
            regular_pay: parseFloat(regularPay.toFixed(2)),
            overtime_amount: parseFloat(overtimeAmount.toFixed(2)),
            bonuses: 0,
            gross_pay: parseFloat(grossPay.toFixed(2)),
            deductions: deductions.total,
            deduction_breakdown: deductions,
            net_pay: parseFloat(netPay.toFixed(2))
        })
    } catch (err) {
        console.error('Error generating payslip:', err)
        return res.status(500).json({ error: err.message })
    }
})

// Create new payroll period
router.post('/payroll/periods', async (req, res) => {
    try {
        const { period_name, start_date, end_date, pay_date } = req.body
        
        const result = await pool.query(`
            INSERT INTO payroll_periods (period_name, start_date, end_date, pay_date, status)
            VALUES ($1, $2, $3, $4, 'open')
            RETURNING *
        `, [period_name, start_date, end_date, pay_date])
        
        return res.json({
            message: 'Payroll period created successfully',
            period: result.rows[0]
        })
    } catch (err) {
        console.error('Error creating period:', err)
        return res.status(500).json({ error: err.message })
    }
})

export default router
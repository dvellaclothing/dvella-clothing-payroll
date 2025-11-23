import express from 'express'
import pool from '../db/pool.js'
const router = express.Router()

// Brevo API configuration
const BREVO_API_KEY = process.env.BREVO_API_KEY || 'your-brevo-api-key-here'
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'noreply@yourcompany.com'
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'HR Department'

// Function to send email via Brevo
const sendBrevoEmail = async (to, subject, htmlContent) => {
    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: {
                    name: BREVO_SENDER_NAME,
                    email: BREVO_SENDER_EMAIL
                },
                to: [{ email: to }],
                subject: subject,
                htmlContent: htmlContent
            })
        })
        
        const data = await response.json()
        console.log('Brevo email sent:', data)
        return { success: true, data }
    } catch (error) {
        console.error('Error sending Brevo email:', error)
        return { success: false, error }
    }
}

// ===========================================
// IMPORTANT: Static routes MUST come before parameterized routes
// ===========================================

// Get all attendance requests grouped by status
router.get("/requests", async (req, res) => {
    try {
        console.log('Fetching attendance requests...')
        
        const checkTable = await pool.query(`
            SELECT COUNT(*) as count FROM attendance
        `)
        console.log('Total attendance records:', checkTable.rows[0].count)
        
        const pendingResult = await pool.query(`
            SELECT 
                a.attendance_id,
                a.user_id,
                a.date,
                a.check_in_time,
                a.check_out_time,
                a.total_hours,
                a.status,
                a.notes,
                a.created_at,
                u.first_name,
                u.last_name,
                u.email,
                u.position
            FROM attendance a
            INNER JOIN users u ON a.user_id = u.user_id
            WHERE a.status = 'pending'
            ORDER BY a.date DESC, a.created_at DESC
        `)
        
        const approvedResult = await pool.query(`
            SELECT 
                a.attendance_id,
                a.user_id,
                a.date,
                a.check_in_time,
                a.check_out_time,
                a.total_hours,
                a.status,
                a.notes,
                a.created_at,
                u.first_name,
                u.last_name,
                u.email,
                u.position
            FROM attendance a
            INNER JOIN users u ON a.user_id = u.user_id
            WHERE a.status = 'approved'
            ORDER BY a.date DESC, a.created_at DESC
            LIMIT 50
        `)
        
        const rejectedResult = await pool.query(`
            SELECT 
                a.attendance_id,
                a.user_id,
                a.date,
                a.check_in_time,
                a.check_out_time,
                a.total_hours,
                a.status,
                a.notes,
                a.created_at,
                u.first_name,
                u.last_name,
                u.email,
                u.position
            FROM attendance a
            INNER JOIN users u ON a.user_id = u.user_id
            WHERE a.status = 'rejected'
            ORDER BY a.date DESC, a.created_at DESC
            LIMIT 50
        `)
        
        return res.json({
            pending: pendingResult.rows,
            approved: approvedResult.rows,
            rejected: rejectedResult.rows,
            total: checkTable.rows[0].count
        })
    } catch (err) {
        console.error('Error in /requests endpoint:', err)
        return res.status(500).json({ 
            error: err.message,
            details: err.stack
        })
    }
})

// Get attendance statistics
router.get("/stats", async (req, res) => {
    try {
        const pendingCount = await pool.query(`
            SELECT COUNT(*) as count
            FROM attendance
            WHERE status = 'pending'
        `)
        
        const approvedCount = await pool.query(`
            SELECT COUNT(*) as count
            FROM attendance
            WHERE status = 'approved'
            AND date >= CURRENT_DATE - INTERVAL '30 days'
        `)
        
        const rejectedCount = await pool.query(`
            SELECT COUNT(*) as count
            FROM attendance
            WHERE status = 'rejected'
            AND date >= CURRENT_DATE - INTERVAL '30 days'
        `)
        
        return res.json({
            pending: parseInt(pendingCount.rows[0].count),
            approved: parseInt(approvedCount.rows[0].count),
            rejected: parseInt(rejectedCount.rows[0].count)
        })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ error: err.message })
    }
})

// Debug routes
router.get("/debug/check", async (req, res) => {
    try {
        const tableExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'attendance'
            );
        `)
        
        const tableStructure = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'attendance'
            ORDER BY ordinal_position;
        `)
        
        const recordCount = await pool.query(`
            SELECT COUNT(*) as total,
                   COUNT(*) FILTER (WHERE status = 'pending') as pending,
                   COUNT(*) FILTER (WHERE status = 'approved') as approved,
                   COUNT(*) FILTER (WHERE status = 'rejected') as rejected
            FROM attendance;
        `)
        
        const sampleRecords = await pool.query(`
            SELECT 
                a.*,
                u.first_name,
                u.last_name
            FROM attendance a
            LEFT JOIN users u ON a.user_id = u.user_id
            ORDER BY a.created_at DESC
            LIMIT 5;
        `)
        
        const usersCount = await pool.query(`
            SELECT COUNT(*) as count FROM users;
        `)
        
        return res.json({
            status: 'success',
            database: {
                tableExists: tableExists.rows[0].exists,
                tableStructure: tableStructure.rows,
                recordCounts: recordCount.rows[0],
                sampleRecords: sampleRecords.rows,
                usersCount: usersCount.rows[0].count
            }
        })
    } catch (err) {
        return res.status(500).json({
            status: 'error',
            error: err.message,
            stack: err.stack
        })
    }
})

// Approve attendance request
router.post("/approve", async (req, res) => {
    try {
        const { attendance_id, user_id, approved_by } = req.body
        
        const updateResult = await pool.query(`
            UPDATE attendance 
            SET status = 'approved'
            WHERE attendance_id = $1
            RETURNING *
        `, [attendance_id])
        
        if (updateResult.rows.length === 0) {
            return res.status(404).json({ message: 'Attendance record not found' })
        }
        
        const attendance = updateResult.rows[0]
        
        const userResult = await pool.query(`
            SELECT first_name, last_name, email
            FROM users
            WHERE user_id = $1
        `, [user_id])
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' })
        }
        
        const user = userResult.rows[0]
        
        await pool.query(`
            INSERT INTO notifications (user_id, type, title, message, link_url)
            VALUES ($1, $2, $3, $4, $5)
        `, [
            user_id,
            'attendance_approved',
            'Attendance Request Approved',
            `Your attendance request for ${new Date(attendance.date).toLocaleDateString()} has been approved.`,
            '/attendance'
        ])
        
        const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #22c55e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                    .details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
                    .detail-label { font-weight: bold; color: #6b7280; }
                    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✓ Attendance Approved</h1>
                    </div>
                    <div class="content">
                        <p>Hello ${user.first_name} ${user.last_name},</p>
                        <p>Your attendance request has been <strong>approved</strong>.</p>
                        
                        <div class="details">
                            <div class="detail-row">
                                <span class="detail-label">Date:</span>
                                <span>${new Date(attendance.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Check In:</span>
                                <span>${attendance.check_in_time || 'N/A'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Check Out:</span>
                                <span>${attendance.check_out_time || 'N/A'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Total Hours:</span>
                                <span>${attendance.total_hours ? parseFloat(attendance.total_hours).toFixed(2) + ' hours' : 'N/A'}</span>
                            </div>
                        </div>
                        
                        <p>This attendance record has been added to your timesheet.</p>
                        <p style="margin-top: 30px;">Best regards,<br><strong>HR Department</strong></p>
                    </div>
                    <div class="footer">
                        <p>This is an automated message. Please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>
        `
        
        await sendBrevoEmail(
            user.email,
            'Attendance Request Approved',
            emailHtml
        )
        
        return res.json({ 
            message: 'Attendance approved and notification sent',
            attendance: attendance
        })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ error: err.message })
    }
})

// Reject attendance request
router.post("/reject", async (req, res) => {
    try {
        const { attendance_id, user_id, rejected_by, reason } = req.body
        
        const updateResult = await pool.query(`
            UPDATE attendance 
            SET status = 'rejected', notes = $2
            WHERE attendance_id = $1
            RETURNING *
        `, [attendance_id, reason || 'No reason provided'])
        
        if (updateResult.rows.length === 0) {
            return res.status(404).json({ message: 'Attendance record not found' })
        }
        
        const attendance = updateResult.rows[0]
        
        const userResult = await pool.query(`
            SELECT first_name, last_name, email
            FROM users
            WHERE user_id = $1
        `, [user_id])
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' })
        }
        
        const user = userResult.rows[0]
        
        await pool.query(`
            INSERT INTO notifications (user_id, type, title, message, link_url)
            VALUES ($1, $2, $3, $4, $5)
        `, [
            user_id,
            'attendance_rejected',
            'Attendance Request Rejected',
            `Your attendance request for ${new Date(attendance.date).toLocaleDateString()} has been rejected. Reason: ${reason || 'No reason provided'}`,
            '/attendance'
        ])
        
        const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                    .details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
                    .detail-label { font-weight: bold; color: #6b7280; }
                    .reason-box { background-color: #fee2e2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✕ Attendance Request Rejected</h1>
                    </div>
                    <div class="content">
                        <p>Hello ${user.first_name} ${user.last_name},</p>
                        <p>Unfortunately, your attendance request has been <strong>rejected</strong>.</p>
                        
                        <div class="details">
                            <div class="detail-row">
                                <span class="detail-label">Date:</span>
                                <span>${new Date(attendance.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Check In:</span>
                                <span>${attendance.check_in_time || 'N/A'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Check Out:</span>
                                <span>${attendance.check_out_time || 'N/A'}</span>
                            </div>
                        </div>
                        
                        <div class="reason-box">
                            <strong>Rejection Reason:</strong>
                            <p style="margin: 10px 0 0 0;">${reason || 'No reason provided'}</p>
                        </div>
                        
                        <p>If you have questions about this decision, please contact your manager or HR department.</p>
                        <p style="margin-top: 30px;">Best regards,<br><strong>HR Department</strong></p>
                    </div>
                    <div class="footer">
                        <p>This is an automated message. Please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>
        `
        
        await sendBrevoEmail(
            user.email,
            'Attendance Request Rejected',
            emailHtml
        )
        
        return res.json({ 
            message: 'Attendance rejected and notification sent',
            attendance: attendance
        })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ error: err.message })
    }
})

// Employee: Submit attendance request
router.post("/submit", async (req, res) => {
    try {
        const { user_id, date, check_in_time, check_out_time, total_hours, notes } = req.body
        
        const existing = await pool.query(`
            SELECT * FROM attendance
            WHERE user_id = $1 AND date = $2
        `, [user_id, date])
        
        if (existing.rows.length > 0) {
            return res.status(400).json({ 
                message: 'Attendance already submitted for this date. Please contact HR if you need to make changes.' 
            })
        }
        
        const result = await pool.query(`
            INSERT INTO attendance (user_id, date, check_in_time, check_out_time, total_hours, status, notes)
            VALUES ($1, $2, $3, $4, $5, 'pending', $6)
            RETURNING *
        `, [user_id, date, check_in_time, check_out_time, total_hours, notes])
        
        return res.json({ 
            message: 'Attendance request submitted successfully',
            attendance: result.rows[0]
        })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ error: err.message })
    }
})

// Debug: Create sample attendance record
router.post("/debug/create-sample", async (req, res) => {
    try {
        const user = await pool.query(`
            SELECT user_id FROM users LIMIT 1;
        `)
        
        if (user.rows.length === 0) {
            return res.status(400).json({
                error: 'No users found in database. Please create a user first.'
            })
        }
        
        const userId = user.rows[0].user_id
        
        const result = await pool.query(`
            INSERT INTO attendance (user_id, date, check_in_time, check_out_time, total_hours, status, notes)
            VALUES ($1, CURRENT_DATE, '09:00:00', '17:00:00', 8.00, 'pending', 'Sample test attendance')
            RETURNING *;
        `, [userId])
        
        return res.json({
            status: 'success',
            message: 'Sample attendance created',
            attendance: result.rows[0]
        })
    } catch (err) {
        return res.status(500).json({
            status: 'error',
            error: err.message,
            stack: err.stack
        })
    }
})

// Debug: Clear all attendance records
router.delete("/debug/clear-all", async (req, res) => {
    try {
        const result = await pool.query(`
            DELETE FROM attendance RETURNING *;
        `)
        
        return res.json({
            status: 'success',
            message: 'All attendance records deleted',
            deletedCount: result.rows.length
        })
    } catch (err) {
        return res.status(500).json({
            status: 'error',
            error: err.message
        })
    }
})

// ===========================================
// Parameterized routes MUST come after static routes
// ===========================================

// Employee: Get attendance summary
router.get("/summary/:user_id", async (req, res) => {
    try {
        const { user_id } = req.params
        
        const currentMonth = await pool.query(`
            SELECT 
                COUNT(*) FILTER (WHERE status = 'approved') as approved_days,
                SUM(total_hours) FILTER (WHERE status = 'approved') as total_hours
            FROM attendance
            WHERE user_id = $1
            AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
        `, [user_id])
        
        const lastMonth = await pool.query(`
            SELECT 
                COUNT(*) FILTER (WHERE status = 'approved') as approved_days,
                SUM(total_hours) FILTER (WHERE status = 'approved') as total_hours
            FROM attendance
            WHERE user_id = $1
            AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')
            AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')
        `, [user_id])
        
        const pendingCount = await pool.query(`
            SELECT COUNT(*) as count
            FROM attendance
            WHERE user_id = $1 AND status = 'pending'
        `, [user_id])
        
        return res.json({
            currentMonth: {
                approved_days: parseInt(currentMonth.rows[0].approved_days) || 0,
                total_hours: parseFloat(currentMonth.rows[0].total_hours) || 0
            },
            lastMonth: {
                approved_days: parseInt(lastMonth.rows[0].approved_days) || 0,
                total_hours: parseFloat(lastMonth.rows[0].total_hours) || 0
            },
            pending_count: parseInt(pendingCount.rows[0].count) || 0
        })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ error: err.message })
    }
})

// Employee: Get attendance records by month/year
router.get("/records/:user_id", async (req, res) => {
    try {
        const { user_id } = req.params
        const { month, year } = req.query
        
        const result = await pool.query(`
            SELECT 
                attendance_id,
                date,
                check_in_time,
                check_out_time,
                total_hours,
                status,
                notes,
                created_at
            FROM attendance
            WHERE user_id = $1
            AND EXTRACT(MONTH FROM date) = $2
            AND EXTRACT(YEAR FROM date) = $3
            ORDER BY date DESC
        `, [user_id, month, year])
        
        return res.json({ records: result.rows })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ error: err.message })
    }
})

export default router
import express from 'express'
import pool from '../db/pool.js'

const router = express.Router()

// Add this function to your backend attendance controller
// This should be called after successfully creating an attendance request

async function notifyAdminsOfAttendanceRequest(attendanceData, employeeName) {
    try {
        // First, get all admin and manager users
        const adminQuery = `
            SELECT user_id 
            FROM users 
            WHERE role IN ('admin', 'manager') 
            AND user_id != $1
        `;
        const adminResult = await pool.query(adminQuery, [attendanceData.user_id]);
        
        // Create notification for each admin/manager
        const notificationPromises = adminResult.rows.map(admin => {
            const insertNotification = `
                INSERT INTO notifications 
                (user_id, type, title, message, link_url, is_read, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
            `;
            
            const title = 'New Attendance Request';
            const message = `${employeeName} has submitted an attendance request for ${new Date(attendanceData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
            const linkUrl = '/admin/attendance'; // Adjust to your admin attendance page route
            
            return pool.query(insertNotification, [
                admin.user_id,
                'attendance_request',
                title,
                message,
                linkUrl,
                false
            ]);
        });
        
        await Promise.all(notificationPromises);
        console.log(`Notified ${adminResult.rows.length} admins about attendance request`);
    } catch (error) {
        console.error('Error creating admin notifications:', error);
        // Don't throw - we don't want to fail the attendance submission if notifications fail
    }
}

// In your attendance submission endpoint:
router.post('/api/attendance/submit', async (req, res) => {
    const { user_id, date, check_in_time, check_out_time, total_hours, notes } = req.body;
    
    try {
        // Insert attendance record
        const insertQuery = `
            INSERT INTO attendance 
            (user_id, date, check_in_time, check_out_time, total_hours, notes, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())
            RETURNING *
        `;
        
        const result = await pool.query(insertQuery, [
            user_id, date, check_in_time, check_out_time, total_hours, notes
        ]);
        
        // Get employee name for notification
        const employeeQuery = `
            SELECT first_name, last_name 
            FROM users 
            WHERE user_id = $1
        `;
        const employeeResult = await pool.query(employeeQuery, [user_id]);
        const employeeName = `${employeeResult.rows[0].first_name} ${employeeResult.rows[0].last_name}`;
        
        // Notify admins (non-blocking)
        notifyAdminsOfAttendanceRequest(
            { user_id, date, check_in_time, check_out_time }, 
            employeeName
        );
        
        res.status(201).json({
            success: true,
            message: 'Attendance request submitted successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error submitting attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit attendance request'
        });
    }
});

// Get notifications for a user
router.get('/notifications/:user_id', async (req, res) => {
    try {
        const { user_id } = req.params
        
        const result = await pool.query(`
            SELECT 
                notification_id,
                user_id,
                type,
                title,
                message,
                link_url,
                is_read,
                created_at
            FROM notifications
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT 50
        `, [user_id])
        
        const unreadCount = await pool.query(`
            SELECT COUNT(*) as count
            FROM notifications
            WHERE user_id = $1 AND is_read = false
        `, [user_id])
        
        return res.json({
            notifications: result.rows,
            unread_count: parseInt(unreadCount.rows[0].count)
        })
    } catch (err) {
        console.error('Error fetching notifications:', err)
        return res.status(500).json({ error: err.message })
    }
})

// Mark notification as read
router.put('/notifications/:notification_id/read', async (req, res) => {
    try {
        const { notification_id } = req.params
        
        const result = await pool.query(`
            UPDATE notifications
            SET is_read = true
            WHERE notification_id = $1
            RETURNING *
        `, [notification_id])
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Notification not found' })
        }
        
        return res.json({ 
            message: 'Notification marked as read',
            notification: result.rows[0]
        })
    } catch (err) {
        console.error('Error marking notification as read:', err)
        return res.status(500).json({ error: err.message })
    }
})

// Mark all notifications as read for a user
router.put('/notifications/:user_id/read-all', async (req, res) => {
    try {
        const { user_id } = req.params
        
        const result = await pool.query(`
            UPDATE notifications
            SET is_read = true
            WHERE user_id = $1 AND is_read = false
            RETURNING *
        `, [user_id])
        
        return res.json({ 
            message: 'All notifications marked as read',
            updated_count: result.rows.length
        })
    } catch (err) {
        console.error('Error marking all notifications as read:', err)
        return res.status(500).json({ error: err.message })
    }
})

// Delete a notification
router.delete('/notifications/:notification_id', async (req, res) => {
    try {
        const { notification_id } = req.params
        
        const result = await pool.query(`
            DELETE FROM notifications
            WHERE notification_id = $1
            RETURNING *
        `, [notification_id])
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Notification not found' })
        }
        
        return res.json({ 
            message: 'Notification deleted',
            notification: result.rows[0]
        })
    } catch (err) {
        console.error('Error deleting notification:', err)
        return res.status(500).json({ error: err.message })
    }
})

// Get unread notification count
router.get('/notifications/:user_id/unread-count', async (req, res) => {
    try {
        const { user_id } = req.params
        
        const result = await pool.query(`
            SELECT COUNT(*) as count
            FROM notifications
            WHERE user_id = $1 AND is_read = false
        `, [user_id])
        
        return res.json({
            unread_count: parseInt(result.rows[0].count)
        })
    } catch (err) {
        console.error('Error getting unread count:', err)
        return res.status(500).json({ error: err.message })
    }
})

// Get all notifications (not just recent ones)
router.get("/notifications/:userId/all", async (req, res) => {
    try {
        const { userId } = req.params
        
        const result = await pool.query(`
            SELECT * FROM notifications
            WHERE user_id = $1
            ORDER BY created_at DESC
        `, [userId])
        
        res.json({ notifications: result.rows })
    } catch (err) {
        console.error('Error fetching all notifications:', err)
        res.status(500).json({ error: err.message })
    }
})

// Delete notification
router.delete("/notifications/:notificationId", async (req, res) => {
    try {
        const { notificationId } = req.params
        
        await pool.query(`
            DELETE FROM notifications WHERE notification_id = $1
        `, [notificationId])
        
        res.json({ message: 'Notification deleted' })
    } catch (err) {
        console.error('Error deleting notification:', err)
        res.status(500).json({ error: err.message })
    }
})

export default router
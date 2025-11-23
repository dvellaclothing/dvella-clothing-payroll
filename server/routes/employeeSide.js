
import express from "express"
import bcrypt from 'bcrypt'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import pool from "../db/pool.js"

const router = express.Router()
const saltRounds = 10

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/profile-pictures'
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true })
        }
        cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
        const uniqueName = `${req.body.userId}-${Date.now()}${path.extname(file.originalname)}`
        cb(null, uniqueName)
    }
})

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
        const mimetype = allowedTypes.test(file.mimetype)
        
        if (mimetype && extname) {
            return cb(null, true)
        } else {
            cb(new Error('Only image files are allowed'))
        }
    }
})

router.patch("/employee/update-profile", upload.single('profilePicture'), async (req, res) => {
    try {
        const { userId, first_name, last_name, email, phone, address } = req.body
        
        console.log("=== UPDATE PROFILE DEBUG ===")
        console.log("User ID:", userId)
        console.log("Data:", { first_name, last_name, email, phone, address })
        console.log("File:", req.file ? req.file.filename : "No file")
        
        // Validate required fields
        if (!userId || !first_name || !last_name || !email) {
            if (req.file) fs.unlinkSync(req.file.path)
            return res.status(400).json({ message: "Missing required fields" })
        }
        
        // Check if email is already in use
        const emailCheck = await pool.query(
            "SELECT user_id FROM users WHERE email = $1 AND user_id != $2",
            [email.toLowerCase().trim(), userId]
        )
        
        if (emailCheck.rows.length > 0) {
            if (req.file) fs.unlinkSync(req.file.path)
            return res.status(400).json({ message: "Email already in use by another account" })
        }
        
        // Convert empty strings to null for optional fields
        const phoneValue = phone && phone.trim() !== '' ? phone.trim() : null
        const addressValue = address && address.trim() !== '' ? address.trim() : null
        
        // Build query based on whether there's a file upload
        let updateQuery
        let params
        
        if (req.file) {
            const profilePictureUrl = `/uploads/profile-pictures/${req.file.filename}`
            
            // Delete old profile picture if exists
            try {
                const oldUser = await pool.query(
                    "SELECT profile_picture_url FROM users WHERE user_id = $1", 
                    [userId]
                )
                if (oldUser.rows[0]?.profile_picture_url) {
                    const oldPath = path.join('uploads', 'profile-pictures', path.basename(oldUser.rows[0].profile_picture_url))
                    if (fs.existsSync(oldPath)) {
                        fs.unlinkSync(oldPath)
                        console.log("Deleted old profile picture:", oldPath)
                    }
                }
            } catch (err) {
                console.log("Could not delete old profile picture:", err.message)
            }
            
            updateQuery = `
                UPDATE users 
                SET first_name = $1, 
                    last_name = $2, 
                    email = $3, 
                    phone = $4, 
                    address = $5, 
                    profile_picture_url = $6,
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = $7 
                RETURNING user_id, employee_id, first_name, last_name, email, phone, 
                          address, profile_picture_url, role, position, salary, 
                          pay_grade, hourly_rate, hire_date, status, created_at, updated_at
            `
            params = [
                first_name.trim(), 
                last_name.trim(), 
                email.toLowerCase().trim(), 
                phoneValue, 
                addressValue, 
                profilePictureUrl, 
                userId
            ]
        } else {
            updateQuery = `
                UPDATE users 
                SET first_name = $1, 
                    last_name = $2, 
                    email = $3, 
                    phone = $4, 
                    address = $5,
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = $6 
                RETURNING user_id, employee_id, first_name, last_name, email, phone, 
                          address, profile_picture_url, role, position, salary, 
                          pay_grade, hourly_rate, hire_date, status, created_at, updated_at
            `
            params = [
                first_name.trim(), 
                last_name.trim(), 
                email.toLowerCase().trim(), 
                phoneValue, 
                addressValue, 
                userId
            ]
        }
        
        console.log("Executing query with params:", params)
        
        const result = await pool.query(updateQuery, params)
        
        if (result.rows.length === 0) {
            if (req.file) fs.unlinkSync(req.file.path)
            return res.status(404).json({ message: "User not found" })
        }
        
        const user = result.rows[0]
        delete user.password
        
        console.log("Profile updated successfully")
        console.log("=== END DEBUG ===")
        
        return res.status(200).json({ 
            message: "Profile updated successfully",
            user: user
        })
    } catch (err) {
        console.error("=== ERROR UPDATING PROFILE ===")
        console.error("Error message:", err.message)
        console.error("Error stack:", err.stack)
        console.error("Error code:", err.code)
        console.error("=== END ERROR ===")
        
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path)
            } catch (unlinkErr) {
                console.error("Failed to delete uploaded file:", unlinkErr)
            }
        }
        return res.status(500).json({ 
            message: "Error updating profile",
            error: err.message,
            detail: err.detail || "No additional details"
        })
    }
})

router.put("/employee/change-password", async (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = req.body
        const userQuery = await pool.query(
            "SELECT password FROM users WHERE user_id = $1",
            [userId]
        )
        
        if (userQuery.rows.length === 0) {
            return res.status(404).json({ message: "User not found" })
        }
        const isValid = await bcrypt.compare(currentPassword, userQuery.rows[0].password)
        
        if (!isValid) {
            return res.status(401).json({ message: "Current password is incorrect" })
        }
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds)
        await pool.query(
            "UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2",
            [hashedPassword, userId]
        )
        
        return res.status(200).json({ message: "Password changed successfully" })
    } catch (err) {
        console.error("Error changing password:", err.message)
        return res.status(500).json({ 
            message: "Error changing password",
            error: err.message 
        })
    }
})

router.put("/employee/update-notifications", async (req, res) => {
    try {
        const { userId, settings } = req.body
        
        // Store notification settings in a separate table or user preferences field
        // For now, we'll just return success
        // You can create a user_preferences table to store these settings
        
        return res.status(200).json({ message: "Notification settings updated successfully" })
    } catch (err) {
        console.error("Error updating notifications:", err.message)
        return res.status(500).json({ 
            message: "Error updating notification settings",
            error: err.message 
        })
    }
})

router.get("/attendance/records/:userId", async (req, res) => {
    try {
        const { userId } = req.params
        const { month, year } = req.query
        
        let query = `
            SELECT * FROM attendance
            WHERE user_id = $1
        `
        const params = [userId]
        
        if (month && year) {
            query += ` AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3`
            params.push(month, year)
        }
        
        query += ` ORDER BY date DESC`
        
        const result = await pool.query(query, params)
        return res.status(200).json(result.rows)
    } catch (err) {
        console.error("Error fetching attendance records:", err.message)
        return res.status(500).json({ 
            message: "Error fetching attendance records",
            error: err.message 
        })
    }
})

export default router
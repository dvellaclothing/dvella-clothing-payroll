import express from "express"
import bcrypt from 'bcrypt'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import pool from "../db/pool.js"

const router = express.Router()
const saltRounds = 10

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/profile-pictures'
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true })
        }
        cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
        const uniqueName = `${req.body.employeeId}-${Date.now()}${path.extname(file.originalname)}`
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
            cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'))
        }
    }
})

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body
        const trueEmail = email.toLowerCase().trim()
        const findUser = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [trueEmail]
        )
        if (findUser.rows.length === 0) {
            return res.status(400).json({ message: "User with this email doesnt exist" })
        }
        const user = findUser.rows[0]
        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) {
            console.log("Incorrect password")
            return res.status(401).json({ message: "Incorrect password" })
        }
        delete user.password
        
        return res.status(200).json({ 
            message: "Account found",
            user: user
        })
    } catch (err) {
        console.error(err.message)
        return res.status(500).json({ message: "Error logging in" })
    }
})

router.post("/create-account", upload.single('profilePicture'), async (req, res) => {
    try {
        const { firstName, lastName, email, employeeId, password, role, salary, phone, position, hireDate } = req.body
        
        const exists = await pool.query("SELECT * FROM users WHERE employee_id = $1", [employeeId])
        if (exists.rows.length > 0) {
            if (req.file) {
                fs.unlinkSync(req.file.path)
            }
            return res.status(400).json({ message: "User with this employee ID already exists." })
        }
        const emailExists = await pool.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase().trim()])
        if (emailExists.rows.length > 0) {
            if (req.file) {
                fs.unlinkSync(req.file.path)
            }
            return res.status(400).json({ message: "User with this email already exists." })
        }
        
        const hashedPassword = await bcrypt.hash(password, saltRounds)
        
        const profilePictureUrl = req.file ? `/uploads/profile-pictures/${req.file.filename}` : null
        
        const result = await pool.query(
            `INSERT INTO
                users (employee_id, first_name, last_name, email, phone, password, role, hourly_rate, position, profile_picture_url, hire_date)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
            `,
            [employeeId, firstName, lastName, email.toLowerCase().trim(), phone, hashedPassword, role, salary, position, profilePictureUrl, hireDate]
        )
        const user = result.rows[0]
        delete user.password
        
        return res.status(201).json({ 
            message: "Account created successfully",
            user: user
        })
    } catch (err) {
        console.error(err.message)
        if (req.file) {
            fs.unlinkSync(req.file.path)
        }
        return res.status(500).json({ message: "An error has occurred while creating account" })
    }
})

router.delete("/delete-employee", async (req, res) => {
    try {
        const { current_user_ID, target_ID, password } = req.body
        const getUser = await pool.query("SELECT * FROM users WHERE user_id = $1", [current_user_ID])
        if (getUser.rows.length === 0) return res.status(400).json({ message: "Your current ID doesn't exist" })
        const userPassword = getUser.rows[0].password
        const isValid = await bcrypt.compare(password, userPassword)
        if (!isValid) return res.status(401).json({ valid: false, message: "Invalid password" })
        const result = await pool.query("DELETE FROM users WHERE user_id = $1", [target_ID])
        return res.status(200).json({ valid: true, message: "User deleted successfully" })
    } catch (err) {
        console.error("Delete Employee Error:", err)
        return res.status(500).json({ valid: false, message: "An error has occurred while deleting this user." })
    }
})

router.post("/google-login", async (req, res) => {
    try {
        const { email, name, googleId, picture } = req.body
        
        if (!email) {
            return res.status(400).json({ message: "Email is required" })
        }

        const trueEmail = email.toLowerCase().trim()
        
        let findUser = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [trueEmail]
        )
        
        let user
        
        if (findUser.rows.length === 0) {
            return res.status(403).json({ 
                message: "No account found. Please contact your administrator to create an account for you." 
            })
            
        } else {
            user = findUser.rows[0]
            
            // Only update google_id if it doesn't exist
            // Never update profile_picture_url - keep the one from account creation
            if (!user.google_id) {
                await pool.query(
                    "UPDATE users SET google_id = $1 WHERE user_id = $2",
                    [googleId, user.user_id]
                )
                user.google_id = googleId
            }
        }
        
        if (user.status !== 'active') {
            return res.status(403).json({ message: "Your account has been deactivated. Contact administrator." })
        }
        
        delete user.password
        
        return res.status(200).json({ 
            message: "Successfully logged in with Google",
            user: user
        })
    } catch (err) {
        console.error("Google login error:", err)
        return res.status(500).json({ message: "Error logging in with Google" })
    }
})

export default router
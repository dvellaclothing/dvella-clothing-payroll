import express from 'express'
import pool from '../db/pool.js'
import bcrypt from 'bcrypt'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const router = express.Router()
const saltRounds = 10

router.get("/get-employees", async (req, res) => {
    try {
        const getAll = await pool.query("SELECT * FROM users")
        return res.status(200).json({ employees: getAll })
    } catch (err) {
        console.error("get-employees: ", err)
        return res.status(500).json({ error: "Failed to fetch all employees" })
    }
})

router.patch("/edit-employee", async (req, res) => {
    try {
        const { user_id, firstName, lastName, email, role, hourlyRate, phone, position } = req.body
        
        // Check if email already exists for another user
        const exists = await pool.query(
            "SELECT * FROM users WHERE email = $1 AND user_id != $2", 
            [email, user_id]
        )
        
        if (exists.rows.length > 0) {
            return res.status(400).json({ message: "User with this email already exists." })
        }
        
        // Calculate monthly salary based on hourly rate (160 hours)
        const monthlySalary = parseFloat(hourlyRate) * 160
        
        // Update user with hourly_rate and calculated salary
        const result = await pool.query(`
            UPDATE users 
            SET first_name = $1, 
                last_name = $2, 
                email = $3, 
                role = $4, 
                hourly_rate = $5,
                salary = $6,
                phone = $7, 
                position = $8,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $9
            RETURNING *
        `, [firstName, lastName, email, role, hourlyRate, monthlySalary, phone, position, user_id])
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Employee not found" })
        }
        
        return res.status(200).json({
            message: "Employee updated successfully!",
            user: result.rows[0]
        })
    } catch (err) {
        console.error("edit-employee:", err)
        return res.status(500).json({ 
            message: "An error has occurred while updating employee",
            error: err.message 
        })
    }
})

export default router
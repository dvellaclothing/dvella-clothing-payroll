import express from "express"
import pool from "../db/pool.js"
import bcrypt from "bcrypt"
import Brevo from "@getbrevo/brevo"

const router = express.Router()

// Initialize Brevo SDK
const brevoApi = new Brevo.TransactionalEmailsApi()
brevoApi.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY

const verificationCodes = new Map()
const rateLimits = new Map() // Track rate limiting

const sendBrevoEmail = async (to, subject, htmlContent) => {
    try {
        await brevoApi.sendTransacEmail({
            sender: { 
                name: process.env.BREVO_SENDER_NAME, 
                email: process.env.BREVO_SENDER_EMAIL 
            },
            to: [{ email: to }],
            subject: subject,
            htmlContent: htmlContent
        })
        console.log("Brevo email sent to:", to)
        return true
    } catch (err) {
        console.error("Error sending Brevo email:", err)
        return false
    }
}

// Rate limiting helper
const checkRateLimit = (email) => {
    const now = Date.now()
    const limit = rateLimits.get(email)
    
    if (limit && now - limit.lastRequest < 60000) { // 1 minute cooldown
        return { allowed: false, remainingTime: Math.ceil((60000 - (now - limit.lastRequest)) / 1000) }
    }
    
    rateLimits.set(email, { lastRequest: now })
    return { allowed: true }
}

router.post("/forgot-password", async (req, res) => {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: "Email is required" })

    // Check rate limit
    const rateCheck = checkRateLimit(email)
    if (!rateCheck.allowed) {
        return res.status(429).json({ 
            message: `Please wait ${rateCheck.remainingTime} seconds before requesting another code` 
        })
    }

    try {
        // Check if email exists
        const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email])
        if (userResult.rowCount === 0) {
            return res.status(404).json({ message: "Email not found" })
        }

        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString()
        const expiresAt = Date.now() + 1000 * 60 * 15 // 15 minutes
        
        // Store verification code
        verificationCodes.set(email, { code, expiresAt })

        // Send email
        const emailSent = await sendBrevoEmail(
            email,
            "Your Password Reset Verification Code",
            `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .code { font-size: 48px; font-weight: bold; color: #000; text-align: center; padding: 20px; background: #f9f9f9; border-radius: 8px; letter-spacing: 8px; margin: 20px 0; }
                    .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2 style="color: #333;">Password Reset Request</h2>
                    <p style="color: #666;">You requested to reset your password. Use the verification code below:</p>
                    <div class="code">${code}</div>
                    <p style="color: #666;">This code will expire in <strong>15 minutes</strong>.</p>
                    <p style="color: #666;">If you didn't request this, please ignore this email.</p>
                    <div class="footer">
                        <p>This is an automated message. Please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
            `
        )

        if (!emailSent) {
            return res.status(500).json({ message: "Failed to send email. Please try again." })
        }

        res.json({ message: "Verification code sent to your email" })
    } catch (err) {
        console.error("Forgot password error:", err)
        res.status(500).json({ message: "Internal server error" })
    }
})

router.post("/reset-password", async (req, res) => {
    const { email, code, newPassword } = req.body
    
    if (!email || !code || !newPassword) {
        return res.status(400).json({ message: "Email, code, and new password are required" })
    }

    // Validate password length
    if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" })
    }

    // Check if verification code exists
    const record = verificationCodes.get(email)
    if (!record) {
        return res.status(400).json({ message: "No verification code found. Please request a new one." })
    }

    // Check if code expired
    if (record.expiresAt < Date.now()) {
        verificationCodes.delete(email)
        return res.status(400).json({ message: "Verification code expired. Please request a new one." })
    }

    // Verify code
    if (record.code !== code) {
        return res.status(400).json({ message: "Invalid verification code" })
    }

    try {
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        
        // Update password in database
        const result = await pool.query(
            "UPDATE users SET password = $1 WHERE email = $2 RETURNING user_id",
            [hashedPassword, email]
        )

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "User not found" })
        }

        // Clean up
        verificationCodes.delete(email)
        rateLimits.delete(email)

        // Send confirmation email
        await sendBrevoEmail(
            email,
            "Password Successfully Reset",
            `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2 style="color: #333;">✅ Password Reset Successful</h2>
                    <p style="color: #666;">Your password has been successfully reset.</p>
                    <p style="color: #666;">You can now log in with your new password.</p>
                    <p style="color: #999; font-size: 14px; margin-top: 30px;">If you didn't make this change, please contact support immediately.</p>
                </div>
            </body>
            </html>
            `
        )

        res.json({ message: "Password successfully reset! Redirecting to login..." })
    } catch (err) {
        console.error("Reset password error:", err)
        res.status(500).json({ message: "Internal server error" })
    }
})

// Clean up expired codes periodically (every 10 minutes)
setInterval(() => {
    const now = Date.now()
    for (const [email, record] of verificationCodes.entries()) {
        if (record.expiresAt < now) {
            verificationCodes.delete(email)
        }
    }
}, 600000)

export default router
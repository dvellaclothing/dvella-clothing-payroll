import express from "express"
import pool from "../db/pool.js"

const router = express.Router()

// Get KPI scores for a user
router.get("/kpi/:userId", async (req, res) => {
    try {
        const { userId } = req.params
        
        const query = `
            SELECT 
                ks.score,
                km.name,
                km.weight,
                km.target_value
            FROM kpi_scores ks
            JOIN kpi_metrics km ON ks.metric_id = km.metric_id
            WHERE ks.user_id = $1
            AND km.is_active = true
            ORDER BY ks.created_at DESC
        `
        
        const result = await pool.query(query, [userId])
        
        // Calculate overall score
        let totalScore = 0
        let totalWeight = 0
        let maxPossibleScore = 0
        
        result.rows.forEach(row => {
            totalScore += (row.score * row.weight)
            totalWeight += row.weight
            maxPossibleScore += (row.target_value * row.weight)
        })
        
        const overallScore = totalWeight > 0 ? (totalScore / totalWeight).toFixed(2) : 0
        const maxScore = totalWeight > 0 ? (maxPossibleScore / totalWeight).toFixed(2) : 0
        
        return res.status(200).json({
            metrics: result.rows,
            overallScore,
            maxScore
        })
    } catch (err) {
        console.error(err.message)
        return res.status(500).json({ message: "Error fetching KPI data" })
    }
})

export default router
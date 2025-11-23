
import { useState, useEffect } from "react"
import { API_URL } from "../../../../config"

export default function KPIPerformance({ employee }) {
    const [kpi, setKpi] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchKPI = async () => {
            try {
                const response = await fetch(`${API_URL}/api/kpi/${employee.user_id}`)
                const data = await response.json()
                setKpi(data)
            } catch (error) {
                console.error('Error fetching KPI:', error)
            } finally {
                setLoading(false)
            }
        }

        if (employee?.user_id) {
            fetchKPI()
        }
    }, [employee])

    if (loading) return <div className="col-span-2 py-10 px-5">Loading...</div>

    return (
        <div className="col-span-2 py-10 px-5 flex flex-col items-start justify-start gap-5">
            <h2 className="text-lg font-medium">KPI Performance</h2>
            <div className="flex flex-row items-center justify-between h-auto w-full">
                <p className="text-md font-medium text-[rgba(0,0,0,0.6)]">Overall Score:</p>
                <p className="text-md font-medium text-black">
                    {kpi?.overallScore || 0} / {kpi?.maxScore || 100}
                </p>
            </div>
            {kpi?.metrics && kpi.metrics.length > 0 && (
                <div className="w-full mt-3">
                    <p className="text-sm font-medium text-[rgba(0,0,0,0.6)] mb-2">Breakdown:</p>
                    {kpi.metrics.map((metric, index) => (
                        <div key={index} className="flex flex-row items-center justify-between py-1">
                            <p className="text-sm">{metric.name}</p>
                            <p className="text-sm font-medium">{metric.score}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
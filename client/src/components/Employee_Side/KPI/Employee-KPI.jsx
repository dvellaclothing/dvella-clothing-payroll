
import { useState, useEffect } from "react"
import { API_URL } from "../../../config"
import Header from "../../Main/Header"

const kpiIcon = "/images/reports.png"

export default function EmployeeKPI({ pageLayout, currentUser }) {
    const [kpiData, setKpiData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchKPI()
    }, [])

    const fetchKPI = async () => {
        try {
            const response = await fetch(`${API_URL}/api/kpi/${currentUser.user_id}`)
            const data = await response.json()
            setKpiData(data)
        } catch (error) {
            console.error('Error fetching KPI:', error)
        } finally {
            setLoading(false)
        }
    }

    const getScoreColor = (score, target) => {
        const percentage = (score / target) * 100
        if (percentage >= 90) return 'text-green-600'
        if (percentage >= 70) return 'text-yellow-600'
        return 'text-red-600'
    }

    const getProgressBarColor = (score, target) => {
        const percentage = (score / target) * 100
        if (percentage >= 90) return 'bg-green-500'
        if (percentage >= 70) return 'bg-yellow-500'
        return 'bg-red-500'
    }

    return (
        <div className={`${pageLayout ? 'col-span-5' : 'col-span-17 xl:col-start-2'} col-start-2 flex flex-col w-full min-h-full`}>
            <Header pageLayout={pageLayout} pageTitle="KPI Performance" pageDescription="Track your key performance indicators" currentUser={currentUser} />
            
            <div className="flex flex-col items-center justify-start h-9/10 w-full p-5 gap-5 overflow-y-scroll">
                {/* Overall Score */}
                <div className="flex flex-col w-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-8 text-white gap-3">
                    <div className="flex flex-row items-center justify-between">
                        <div>
                            <p className="text-sm opacity-90">Overall KPI Score</p>
                            {loading ? (
                                <p className="text-4xl font-bold mt-2">Loading...</p>
                            ) : (
                                <>
                                    <p className="text-5xl font-bold mt-2">{kpiData?.overallScore || 0}</p>
                                    <p className="text-sm opacity-90 mt-1">out of {kpiData?.maxScore || 100}</p>
                                </>
                            )}
                        </div>
                        <img src={kpiIcon} className="h-20 w-auto opacity-30" alt="KPI" />
                    </div>
                    {kpiData && (
                        <div className="w-full bg-white bg-opacity-20 rounded-full h-3 mt-2">
                            <div 
                                className="bg-white h-3 rounded-full transition-all duration-500"
                                style={{ width: `${(kpiData.overallScore / kpiData.maxScore) * 100}%` }}
                            />
                        </div>
                    )}
                </div>

                {/* Individual Metrics */}
                <div className="flex flex-col w-full bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5 gap-4">
                    <h2 className="text-lg font-medium">Performance Breakdown</h2>
                    
                    {loading ? (
                        <div className="text-center py-10 text-gray-500">Loading metrics...</div>
                    ) : kpiData?.metrics && kpiData.metrics.length > 0 ? (
                        <div className="space-y-4">
                            {kpiData.metrics.map((metric, index) => (
                                <div key={index} className="flex flex-col gap-2 p-4 border border-[rgba(0,0,0,0.1)] rounded-lg hover:shadow-md transition">
                                    <div className="flex flex-row items-center justify-between">
                                        <div>
                                            <h3 className="font-medium">{metric.name}</h3>
                                            <p className="text-xs text-[rgba(0,0,0,0.6)] mt-1">
                                                Weight: {metric.weight}% | Target: {metric.target_value}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-2xl font-bold ${getScoreColor(metric.score, metric.target_value)}`}>
                                                {metric.score.toFixed(1)}
                                            </p>
                                            <p className="text-xs text-[rgba(0,0,0,0.6)]">
                                                {((metric.score / metric.target_value) * 100).toFixed(0)}%
                                            </p>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className={`h-2 rounded-full transition-all duration-500 ${getProgressBarColor(metric.score, metric.target_value)}`}
                                            style={{ width: `${Math.min((metric.score / metric.target_value) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-500">
                            No KPI metrics available
                        </div>
                    )}
                </div>

                {/* Performance Tips */}
                <div className="flex flex-col w-full bg-blue-50 rounded-2xl border border-blue-200 p-5 gap-3">
                    <h3 className="font-medium text-blue-900">Performance Tips</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-blue-800">
                        <li>Consistently meet or exceed your targets to improve your score</li>
                        <li>Focus on metrics with higher weights for maximum impact</li>
                        <li>Review your performance regularly and set personal goals</li>
                        <li>Discuss improvement strategies with your manager</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
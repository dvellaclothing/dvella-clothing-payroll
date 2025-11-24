import { useState, useEffect } from "react"
import { API_URL } from "../../../config"
import Header from "../../Main/Header"

const kpiIcon = "/images/reports.png"
const trendIcon = "/images/up.png"
const clockIcon = "/images/performance.png"

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

    const getPerformanceLevel = (score) => {
        if (score >= 90) return { text: 'Excellent', color: 'text-green-600', bg: 'bg-green-50' }
        if (score >= 75) return { text: 'Good', color: 'text-blue-600', bg: 'bg-blue-50' }
        if (score >= 60) return { text: 'Average', color: 'text-yellow-600', bg: 'bg-yellow-50' }
        return { text: 'Needs Improvement', color: 'text-red-600', bg: 'bg-red-50' }
    }

    const performanceLevel = kpiData ? getPerformanceLevel(kpiData.overallScore) : null

    return (
        <div className={`${pageLayout ? 'col-span-5' : 'col-span-17 xl:col-start-2'} col-start-2 flex flex-col w-full min-h-full`}>
            <Header pageLayout={pageLayout} pageTitle="My Performance" pageDescription="Track your key performance indicators" currentUser={currentUser} />
            
            <div className="flex flex-col items-center justify-start h-9/10 w-full p-5 gap-5 overflow-y-scroll">
                {/* Overall Score Card */}
                <div className="flex flex-col w-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-8 text-white gap-3">
                    <div className="flex flex-row items-center justify-between">
                        <div className="flex-1">
                            <p className="text-sm opacity-90">Overall KPI Score</p>
                            {loading ? (
                                <p className="text-4xl font-bold mt-2">Loading...</p>
                            ) : (
                                <>
                                    <p className="text-6xl font-bold mt-2">{kpiData?.overallScore || 0}<span className="text-2xl">/100</span></p>
                                    {performanceLevel && (
                                        <div className="mt-3">
                                            <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium">
                                                {performanceLevel.text} Performance
                                            </span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        <img src={kpiIcon} className="h-24 w-auto opacity-30" alt="KPI" />
                    </div>
                    {kpiData && (
                        <div className="w-full bg-white bg-opacity-20 rounded-full h-4 mt-2">
                            <div 
                                className="bg-white h-4 rounded-full transition-all duration-500 shadow-lg"
                                style={{ width: `${(kpiData.overallScore / kpiData.maxScore) * 100}%` }}
                            />
                        </div>
                    )}
                </div>

                {/* Summary Stats */}
                {kpiData?.summary && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <img src={clockIcon} className="h-5 opacity-60" alt="hours" />
                                <p className="text-sm text-gray-600">Total Hours</p>
                            </div>
                            <p className="text-2xl font-bold">{kpiData.summary.total_hours.toFixed(1)}h</p>
                            <p className="text-xs text-gray-500 mt-1">This month</p>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <img src={trendIcon} className="h-5 opacity-60" alt="days" />
                                <p className="text-sm text-gray-600">Days Present</p>
                            </div>
                            <p className="text-2xl font-bold">{kpiData.summary.days_present}</p>
                            <p className="text-xs text-gray-500 mt-1">out of {kpiData.summary.working_days} days</p>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <p className="text-sm text-gray-600">Attendance Rate</p>
                            </div>
                            <p className="text-2xl font-bold">{kpiData.summary.attendance_rate.toFixed(1)}%</p>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                <div 
                                    className={`h-1.5 rounded-full ${getProgressBarColor(kpiData.summary.attendance_rate, 95)}`}
                                    style={{ width: `${Math.min(kpiData.summary.attendance_rate, 100)}%` }}
                                />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <p className="text-sm text-gray-600">Overtime Hours</p>
                            </div>
                            <p className="text-2xl font-bold">{kpiData.summary.overtime_hours.toFixed(1)}h</p>
                            <p className="text-xs text-gray-500 mt-1">Extra hours worked</p>
                        </div>
                    </div>
                )}

                {/* Individual Metrics */}
                <div className="flex flex-col w-full bg-white rounded-2xl border border-gray-200 p-6 gap-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Performance Breakdown</h2>
                        <p className="text-sm text-gray-500">Current Month</p>
                    </div>
                    
                    {loading ? (
                        <div className="text-center py-10 text-gray-500">Loading metrics...</div>
                    ) : kpiData?.metrics && kpiData.metrics.length > 0 ? (
                        <div className="space-y-5">
                            {kpiData.metrics.map((metric, index) => (
                                <div key={index} className="flex flex-col gap-3 p-5 border border-gray-200 rounded-xl hover:shadow-md transition-shadow bg-gray-50">
                                    <div className="flex flex-row items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-base">{metric.name}</h3>
                                                <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-medium">
                                                    {metric.weight}%
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 mt-1">{metric.description}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Target: {metric.target_value} {metric.unit}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-3xl font-bold ${getScoreColor(metric.score, metric.target_value)}`}>
                                                {metric.score.toFixed(1)}
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                {((metric.score / metric.target_value) * 100).toFixed(0)}% of target
                                            </p>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-300 rounded-full h-3">
                                        <div 
                                            className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(metric.score, metric.target_value)}`}
                                            style={{ width: `${Math.min((metric.score / metric.target_value) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-500">
                            No KPI metrics available for this month
                        </div>
                    )}
                </div>

                {/* Performance Tips */}
                {kpiData && kpiData.overallScore < 75 && (
                    <div className="flex flex-col w-full bg-yellow-50 rounded-2xl border border-yellow-200 p-5 gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">💡</span>
                            <h3 className="font-semibold text-yellow-900">Performance Improvement Tips</h3>
                        </div>
                        <ul className="list-disc list-inside space-y-2 text-sm text-yellow-800 ml-8">
                            {kpiData.overallScore < 60 && (
                                <li>Your performance needs immediate attention. Focus on improving attendance and working hours.</li>
                            )}
                            {kpiData.summary?.attendance_rate < 90 && (
                                <li>Try to maintain consistent attendance to improve your overall score.</li>
                            )}
                            {kpiData.summary?.total_hours < 140 && (
                                <li>Work towards meeting the target working hours each month.</li>
                            )}
                            <li>Review your metrics regularly and set personal improvement goals.</li>
                            <li>Discuss performance strategies with your manager during check-ins.</li>
                        </ul>
                    </div>
                )}

                {kpiData && kpiData.overallScore >= 90 && (
                    <div className="flex flex-col w-full bg-green-50 rounded-2xl border border-green-200 p-5 gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">🎉</span>
                            <h3 className="font-semibold text-green-900">Excellent Performance!</h3>
                        </div>
                        <p className="text-sm text-green-800">
                            You're doing an outstanding job! Keep up the great work and continue maintaining these high standards.
                        </p>
                    </div>
                )}

                {/* General Tips */}
                {(!kpiData || (kpiData.overallScore >= 75 && kpiData.overallScore < 90)) && (
                    <div className="flex flex-col w-full bg-blue-50 rounded-2xl border border-blue-200 p-5 gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">📊</span>
                            <h3 className="font-semibold text-blue-900">Performance Tips</h3>
                        </div>
                        <ul className="list-disc list-inside space-y-2 text-sm text-blue-800 ml-8">
                            <li>Consistently meet or exceed your targets to improve your score</li>
                            <li>Focus on metrics with higher weights for maximum impact</li>
                            <li>Maintain good attendance and punctuality</li>
                            <li>Track your progress throughout the month</li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    )
}
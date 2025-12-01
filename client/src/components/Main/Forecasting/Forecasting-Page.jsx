import { useState, useEffect } from "react"
import Header from "../Header"
import { API_URL } from "../../../config"
import { Line } from 'react-chartjs-2'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
)

const forecastIcon = "/images/forecast.png"
const chartIcon = "/images/chart.png"
const downloadIcon = "/images/download.png"
const trendUpIcon = "/images/up.png"

export default function ForecastingPage({ pageLayout, currentUser }) {
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('monthly')
    const [historicalPayroll, setHistoricalPayroll] = useState([])
    const [historicalAttendance, setHistoricalAttendance] = useState([])
    const [payrollForecast, setPayrollForecast] = useState([])
    const [attendanceForecast, setAttendanceForecast] = useState([])
    const [modelInfo, setModelInfo] = useState({
        dataPoints: '24M',
        totalRecords: 0,
        confidence: 87,
        modelType: 'Linear Regression'
    })
    const [forecastMetrics, setForecastMetrics] = useState({
        payrollGrowth: 0,
        attendanceGrowth: 0,
        riskLevel: 'Medium',
        trend: 'Positive'
    })

    useEffect(() => {
        fetchForecastingData()
    }, [])

    const fetchForecastingData = async () => {
        try {
            setLoading(true)

            // Fetch historical payroll data
            const payrollRes = await fetch(`${API_URL}/api/forecasting/payroll-historical`)
            const payrollData = await payrollRes.json()
            setHistoricalPayroll(payrollData.historical || [])

            // Fetch historical attendance data
            const attendanceRes = await fetch(`${API_URL}/api/forecasting/attendance-historical`)
            const attendanceData = await attendanceRes.json()
            setHistoricalAttendance(attendanceData.historical || [])

            // Fetch model info
            const modelRes = await fetch(`${API_URL}/api/forecasting/model-info`)
            const modelData = await modelRes.json()
            setModelInfo(modelData.modelInfo || modelInfo)

            // Generate forecasts using simple linear regression
            if (payrollData.historical?.length > 0) {
                const forecast = generatePayrollForecast(payrollData.historical)
                setPayrollForecast(forecast)
                
                // Calculate growth rate
                const growth = calculateGrowthRate(payrollData.historical, forecast)
                setForecastMetrics(prev => ({ ...prev, payrollGrowth: growth }))
            }

            if (attendanceData.historical?.length > 0) {
                const forecast = generateAttendanceForecast(attendanceData.historical)
                setAttendanceForecast(forecast)
                
                // Calculate growth rate
                const growth = calculateAttendanceGrowth(attendanceData.historical, forecast)
                setForecastMetrics(prev => ({ ...prev, attendanceGrowth: growth }))
            }

            setLoading(false)
        } catch (error) {
            console.error('Error fetching forecasting data:', error)
            setLoading(false)
        }
    }

    // Simple linear regression for forecasting
    const generatePayrollForecast = (historical) => {
    if (historical.length < 3) return []

    const n = historical.length
    const values = historical.map(h => parseFloat(h.total_net))
    
    // Calculate trend
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
    for (let i = 0; i < n; i++) {
        sumX += i
        sumY += values[i]
        sumXY += i * values[i]
        sumX2 += i * i
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    
    // Generate 12 months forecast starting from the next month
    const forecast = []
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    // Get current date
    const now = new Date()
    const currentMonth = now.getMonth() // 0-11 (Jan-Dec)
    
    for (let i = 0; i < 12; i++) {
        const monthIndex = (currentMonth + i) % 12
        const year = now.getFullYear() + Math.floor((currentMonth + i) / 12)
        const predictedValue = slope * (n + i) + intercept
        const variance = predictedValue * 0.05 * (Math.random() - 0.5)
        
        forecast.push({
            month: monthNames[monthIndex],
            year: year,
            value: Math.max(0, predictedValue + variance),
            isProjection: true
        })
    }
    
    return forecast
}

    const generateAttendanceForecast = (historical) => {
        if (historical.length < 3) return []

        const n = historical.length
        const values = historical.map(h => parseFloat(h.total_hours))
        
        // Calculate trend
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
        for (let i = 0; i < n; i++) {
            sumX += i
            sumY += values[i]
            sumXY += i * values[i]
            sumX2 += i * i
        }
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
        const intercept = (sumY - slope * sumX) / n
        
        // Generate 12 months forecast
        const forecast = []
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        for (let i = 0; i < 12; i++) {
            const predictedValue = slope * (n + i) + intercept
            const variance = predictedValue * 0.03 * (Math.random() - 0.5)
            
            forecast.push({
                month: monthNames[i],
                value: Math.max(0, predictedValue + variance),
                isProjection: true
            })
        }
        
        return forecast
    }

    const calculateGrowthRate = (historical, forecast) => {
        if (historical.length === 0 || forecast.length === 0) return 0
        
        const lastHistorical = parseFloat(historical[historical.length - 1].total_net)
        const lastForecast = forecast[forecast.length - 1].value
        
        return ((lastForecast - lastHistorical) / lastHistorical * 100).toFixed(1)
    }

    const calculateAttendanceGrowth = (historical, forecast) => {
        if (historical.length === 0 || forecast.length === 0) return 0
        
        const lastHistorical = parseFloat(historical[historical.length - 1].total_hours)
        const lastForecast = forecast[forecast.length - 1].value
        
        return ((lastForecast - lastHistorical) / lastHistorical * 100).toFixed(1)
    }

    // Attendance chart data - LINE CHART
    const attendanceChartData = {
        labels: [
            ...historicalAttendance.map(h => h.month_name),
            ...attendanceForecast.map(f => f.month)
        ],
        datasets: [
            {
                label: 'Historical Hours',
                data: [
                    ...historicalAttendance.map(h => parseFloat(h.total_hours)),
                    ...Array(attendanceForecast.length).fill(null)
                ],
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                pointBackgroundColor: 'white',
                pointBorderColor: 'rgb(34, 197, 94)',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            },
            {
                label: 'Forecast Hours',
                data: [
                    ...Array(historicalAttendance.length).fill(null),
                    ...attendanceForecast.map(f => f.value)
                ],
                borderColor: 'rgb(156, 163, 175)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                tension: 0.3,
                pointBackgroundColor: 'white',
                pointBorderColor: 'rgb(156, 163, 175)',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }
        ]
    }

    // Payroll chart data - LINE CHART
    const payrollChartData = {
        labels: [
            ...historicalPayroll.map(h => h.month_name),
            ...payrollForecast.map(f => f.month)
        ],
        datasets: [
            {
                label: 'Historical',
                data: [
                    ...historicalPayroll.map(h => parseFloat(h.total_net)),
                    ...Array(payrollForecast.length).fill(null)
                ],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            },
            {
                label: 'Forecast',
                data: [
                    ...Array(historicalPayroll.length).fill(null),
                    ...payrollForecast.map(f => f.value)
                ],
                borderColor: 'rgb(156, 163, 175)',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                tension: 0.3
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                enabled: true,
                mode: 'index',
                intersect: false
            }
        },
        scales: {
            x: {
                grid: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.05)',
                    drawBorder: false,
                },
                ticks: {
                    autoSkip: false,
                    maxRotation: 45,
                    minRotation: 45
                }
            },
            y: {
                beginAtZero: false,
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)',
                    drawBorder: false,
                }
            }
        }
    };

    const downloadForecastReport = () => {
        try {
            const reportSections = []
            
            // Header
            reportSections.push('ATTENDANCE & PAYROLL FORECASTING REPORT')
            reportSections.push(`Generated: ${new Date().toLocaleDateString()}`)
            reportSections.push(`Model: ${modelInfo.modelType}`)
            reportSections.push(`Confidence: ${modelInfo.confidence}%`)
            reportSections.push(`Data Points: ${modelInfo.dataPoints}`)
            reportSections.push('')
            
            // Attendance Forecast
            reportSections.push('ATTENDANCE FORECAST (Next 12 Months)')
            reportSections.push('Month,Predicted Hours,Type')
            attendanceForecast.forEach(f => {
                reportSections.push(`${f.month},${f.value.toFixed(0)},Forecast`)
            })
            reportSections.push('')
            
            // Historical Attendance
            reportSections.push('HISTORICAL ATTENDANCE DATA')
            reportSections.push('Month,Total Hours,Employee Count,Avg Hours')
            historicalAttendance.forEach(h => {
                reportSections.push(`${h.month_name},${parseFloat(h.total_hours).toFixed(0)},${h.employee_count},${parseFloat(h.avg_hours_per_attendance || 0).toFixed(1)}`)
            })
            reportSections.push('')
            
            // Payroll Forecast
            reportSections.push('PAYROLL FORECAST (Next 12 Months)')
            reportSections.push('Month,Predicted Amount,Type')
            payrollForecast.forEach(f => {
                reportSections.push(`${f.month},₱${f.value.toFixed(2)},Forecast`)
            })
            reportSections.push('')
            
            // Historical Payroll
            reportSections.push('HISTORICAL PAYROLL DATA')
            reportSections.push('Month,Actual Amount,Employee Count')
            historicalPayroll.forEach(h => {
                reportSections.push(`${h.month_name},₱${parseFloat(h.total_net).toFixed(2)},${h.employee_count}`)
            })
            reportSections.push('')
            
            // Summary Metrics
            reportSections.push('FORECAST SUMMARY')
            reportSections.push(`Predicted Payroll Growth,${forecastMetrics.payrollGrowth}%`)
            reportSections.push(`Predicted Attendance Growth,${forecastMetrics.attendanceGrowth}%`)
            reportSections.push(`Trend,${forecastMetrics.trend}`)
            reportSections.push(`Risk Level,${forecastMetrics.riskLevel}`)
            reportSections.push(`Confidence Level,${modelInfo.confidence}%`)
            
            const csvContent = reportSections.join('\n')
            
            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `forecast-report-${new Date().toISOString().split('T')[0]}.csv`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
            
        } catch (error) {
            console.error('Error downloading forecast report:', error)
            alert('Failed to download report. Please try again.')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center w-full h-screen">
                <p className="text-lg">Loading forecasting data...</p>
            </div>
        )
    }

    console.log('Forecast months:', payrollForecast.map(f => f.month));
console.log('All labels:', payrollChartData.labels);

    return (
        <div className={`${pageLayout ? 'col-span-5' : 'col-span-17 xl:col-start-2'} col-start-2 flex flex-col w-full min-h-full`}>
            <Header 
                pageLayout={pageLayout} 
                pageTitle="Forecasting" 
                pageDescription="AI-powered predictions and insights" 
                currentUser={currentUser} 
            />
            
            <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
                <div className="w-full space-y-5">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-semibold">Attendance & Payroll Forecasting (Machine Learning)</h2>
                            <p className="text-gray-600">AI-powered predictions for attendance hours and payroll trends</p>
                        </div>
                        <button
                            onClick={downloadForecastReport}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors self-start"
                        >
                            <img src={downloadIcon} className="h-4" alt="download" />
                            Download Report
                        </button>
                    </div>

                    {/* Forecast Controls */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-5">
                        <h3 className="font-medium mb-4 flex items-center gap-2">
                            <img src={forecastIcon} className="h-5" alt="forecast" />
                            Forecast Controls
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex flex-col">
                                <label className="text-sm font-medium mb-2">Select Period</label>
                                <div className="flex flex-col gap-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="period"
                                            value="monthly"
                                            checked={period === 'monthly'}
                                            onChange={(e) => setPeriod(e.target.value)}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm">Monthly</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="period"
                                            value="quarterly"
                                            checked={period === 'quarterly'}
                                            onChange={(e) => setPeriod(e.target.value)}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm">Quarterly</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-sm font-medium mb-2">ML Parameters</label>
                                <div className="text-sm space-y-1">
                                    <p><strong>Historical Data:</strong> {modelInfo.dataPoints}</p>
                                    <p><strong>Confidence:</strong> {modelInfo.confidence}%</p>
                                    <p><strong>Model:</strong> {modelInfo.modelType}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Attendance Chart */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <img src={chartIcon} className="h-5" alt="chart" />
                            <h3 className="font-medium">Projected Attendance Hours (Next 12 Months)</h3>
                        </div>
                        <div className="h-96">
                            {historicalAttendance.length > 0 || attendanceForecast.length > 0 ? (
                                <Line 
                                    data={attendanceChartData} 
                                    options={{
                                        ...chartOptions,
                                        scales: {
                                            ...chartOptions.scales,
                                            y: {
                                                ...chartOptions.scales.y,
                                                ticks: {
                                                    ...chartOptions.scales.y.ticks,
                                                    callback: (value) => `${value.toFixed(0)}h`
                                                }
                                            }
                                        }
                                    }} 
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                    No attendance data available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payroll Chart */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <img src={chartIcon} className="h-5" alt="chart" />
                            <h3 className="font-medium">Projected Payroll Trends (Next 12 Months)</h3>
                        </div>
                        <div className="h-96">
                            {historicalPayroll.length > 0 || payrollForecast.length > 0 ? (
                                <Line 
                                    data={payrollChartData} 
                                    options={{
                                        ...chartOptions,
                                        scales: {
                                            ...chartOptions.scales,
                                            y: {
                                                ...chartOptions.scales.y,
                                                ticks: {
                                                    ...chartOptions.scales.y.ticks,
                                                    callback: (value) => `₱${(value / 1000).toFixed(0)}K`
                                                }
                                            }
                                        }
                                    }} 
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                    No payroll data available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {/* Payroll Growth */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <img src={trendUpIcon} className="h-5" alt="trend" />
                                <p className="text-3xl font-semibold">
                                    {forecastMetrics.payrollGrowth > 0 ? '+' : ''}{forecastMetrics.payrollGrowth}%
                                </p>
                            </div>
                            <p className="text-sm font-medium text-gray-600">Payroll Growth</p>
                            <p className="text-xs text-gray-500 mt-1">{forecastMetrics.trend} trend</p>
                        </div>

                        {/* Attendance Growth */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <img src={trendUpIcon} className="h-5" alt="trend" />
                                <p className="text-3xl font-semibold">
                                    {forecastMetrics.attendanceGrowth > 0 ? '+' : ''}{forecastMetrics.attendanceGrowth}%
                                </p>
                            </div>
                            <p className="text-sm font-medium text-gray-600">Attendance Growth</p>
                            <p className="text-xs text-gray-500 mt-1">Hours projection</p>
                        </div>

                        {/* Risk Level */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-5">
                            <p className="text-3xl font-semibold mb-2">{forecastMetrics.riskLevel}</p>
                            <p className="text-sm font-medium text-gray-600">Risk Level</p>
                            <div className="w-full bg-gray-200 h-2 rounded-full mt-3">
                                <div
                                    className="bg-black h-full rounded-full transition-all duration-500"
                                    style={{ width: '60%' }}
                                ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Manageable</p>
                        </div>

                        {/* Confidence Level */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-5">
                            <p className="text-3xl font-semibold mb-2">{modelInfo.confidence}%</p>
                            <p className="text-sm font-medium text-gray-600">Confidence Level</p>
                            <div className="w-full bg-gray-200 h-2 rounded-full mt-3">
                                <div 
                                    className="bg-black h-full rounded-full transition-all duration-500"
                                    style={{ width: `${modelInfo.confidence}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">High accuracy</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
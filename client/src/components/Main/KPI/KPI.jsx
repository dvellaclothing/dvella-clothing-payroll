import { useState, useEffect } from "react"
import { API_URL } from "../../../config"
import Header from "../Header"
import { Bar, Line } from 'react-chartjs-2'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js'

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
)

const kpiIcon = "/images/performance.png"
const chartIcon = "/images/chart.png"
const trendUpIcon = "/images/up.png"
const downloadIcon = "/images/download.png"
const userIcon = "/images/employees.png"

export default function KPIPage({ pageLayout, currentUser }) {
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('monthly')
    const [kpiData, setKpiData] = useState({
        topPerformers: [],
        bottomPerformers: [],
        monthlyTrends: [],
        overallMetrics: {
            avgHoursPerEmployee: 0,
            totalEmployees: 0,
            totalHours: 0,
            avgAttendanceRate: 0,
            totalOvertimeHours: 0
        }
    })

    useEffect(() => {
        fetchKPIData()
    }, [period])

    const fetchKPIData = async () => {
        try {
            setLoading(true)

            // Fetch top performers
            const topRes = await fetch(`${API_URL}/api/kpi/top-performers?period=${period}`)
            const topData = await topRes.json()

            // Fetch bottom performers
            const bottomRes = await fetch(`${API_URL}/api/kpi/bottom-performers?period=${period}`)
            const bottomData = await bottomRes.json()

            // Fetch monthly trends
            const trendsRes = await fetch(`${API_URL}/api/kpi/monthly-trends`)
            const trendsData = await trendsRes.json()

            // Fetch overall metrics
            const metricsRes = await fetch(`${API_URL}/api/kpi/overall-metrics?period=${period}`)
            const metricsData = await metricsRes.json()

            setKpiData({
                topPerformers: topData.performers || [],
                bottomPerformers: bottomData.performers || [],
                monthlyTrends: trendsData.trends || [],
                overallMetrics: metricsData.metrics || kpiData.overallMetrics
            })

            setLoading(false)
        } catch (error) {
            console.error('Error fetching KPI data:', error)
            setLoading(false)
        }
    }

    const downloadKPIReport = () => {
        try {
            const reportSections = []
            
            reportSections.push('EMPLOYEE KPI REPORT - ATTENDANCE & WORKING HOURS')
            reportSections.push(`Generated: ${new Date().toLocaleDateString()}`)
            reportSections.push(`Period: ${period === 'monthly' ? 'Current Month' : 'Current Quarter'}`)
            reportSections.push('')
            
            // Overall Metrics
            reportSections.push('OVERALL PERFORMANCE METRICS')
            reportSections.push(`Total Employees,${kpiData.overallMetrics.totalEmployees}`)
            reportSections.push(`Total Hours Worked,${kpiData.overallMetrics.totalHours.toFixed(1)}`)
            reportSections.push(`Average Hours per Employee,${kpiData.overallMetrics.avgHoursPerEmployee.toFixed(1)}`)
            reportSections.push(`Average Attendance Rate,${kpiData.overallMetrics.avgAttendanceRate.toFixed(1)}%`)
            reportSections.push(`Total Overtime Hours,${kpiData.overallMetrics.totalOvertimeHours.toFixed(1)}`)
            reportSections.push('')
            
            // Top Performers
            reportSections.push('TOP PERFORMERS (By Working Hours)')
            reportSections.push('Rank,Employee Name,Employee ID,Total Hours,Days Present,Avg Hours/Day,Overtime Hours,Attendance Rate')
            kpiData.topPerformers.forEach((emp, index) => {
                reportSections.push(`${index + 1},${emp.first_name} ${emp.last_name},${emp.employee_id},${parseFloat(emp.total_hours).toFixed(1)},${emp.days_present},${parseFloat(emp.avg_hours_per_day).toFixed(1)},${parseFloat(emp.overtime_hours).toFixed(1)},${parseFloat(emp.attendance_rate).toFixed(1)}%`)
            })
            reportSections.push('')
            
            // Bottom Performers
            reportSections.push('EMPLOYEES NEEDING ATTENTION (Low Working Hours)')
            reportSections.push('Employee Name,Employee ID,Total Hours,Days Present,Avg Hours/Day,Overtime Hours,Attendance Rate')
            kpiData.bottomPerformers.forEach(emp => {
                reportSections.push(`${emp.first_name} ${emp.last_name},${emp.employee_id},${parseFloat(emp.total_hours).toFixed(1)},${emp.days_present},${parseFloat(emp.avg_hours_per_day).toFixed(1)},${parseFloat(emp.overtime_hours).toFixed(1)},${parseFloat(emp.attendance_rate).toFixed(1)}%`)
            })
            reportSections.push('')
            
            // Monthly Trends
            reportSections.push('MONTHLY ATTENDANCE TRENDS (Last 12 Months)')
            reportSections.push('Month,Total Hours,Unique Employees,Avg Hours per Employee,Total Days')
            kpiData.monthlyTrends.forEach(trend => {
                reportSections.push(`${trend.month_name} ${trend.year},${parseFloat(trend.total_hours).toFixed(1)},${trend.unique_employees},${parseFloat(trend.avg_hours_per_employee).toFixed(1)},${trend.total_days}`)
            })
            
            const csvContent = reportSections.join('\n')
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `employee-kpi-report-${new Date().toISOString().split('T')[0]}.csv`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
            
        } catch (error) {
            console.error('Error downloading KPI report:', error)
            alert('Failed to download report. Please try again.')
        }
    }

    // Top Performers Chart
    const topPerformersChartData = {
        labels: kpiData.topPerformers.map(p => `${p.first_name} ${p.last_name}`),
        datasets: [
            {
                label: 'Total Hours',
                data: kpiData.topPerformers.map(p => parseFloat(p.total_hours)),
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderColor: 'rgb(0, 0, 0)',
                borderWidth: 1
            }
        ]
    }

    const topPerformersChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `${context.parsed.y.toFixed(1)} hours`
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        return value.toFixed(0) + 'h'
                    }
                }
            }
        }
    }

    // Monthly Trends Chart
    const monthlyTrendsChartData = {
        labels: kpiData.monthlyTrends.map(t => `${t.month_name} ${t.year}`),
        datasets: [
            {
                label: 'Total Hours',
                data: kpiData.monthlyTrends.map(t => parseFloat(t.total_hours)),
                borderColor: 'rgb(0, 0, 0)',
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                tension: 0.4,
                fill: true
            },
            {
                label: 'Avg Hours per Employee',
                data: kpiData.monthlyTrends.map(t => parseFloat(t.avg_hours_per_employee)),
                borderColor: 'rgb(150, 150, 150)',
                backgroundColor: 'rgba(150, 150, 150, 0.1)',
                tension: 0.4,
                fill: true
            }
        ]
    }

    const monthlyTrendsChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 15
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `${context.dataset.label}: ${context.parsed.y.toFixed(1)} hours`
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        return value.toFixed(0) + 'h'
                    }
                }
            }
        }
    }

    if (loading) {
        return (
            <div className={`${pageLayout ? 'col-span-5' : 'col-span-17 xl:col-start-2'} col-start-2 flex items-center justify-center w-full h-full`}>
                <p className="text-lg">Loading KPI data...</p>
            </div>
        )
    }

    return (
        <>
            <div className={`${pageLayout ? 'col-span-5' : 'col-span-17 xl:col-start-2'} col-start-2 flex flex-col w-full min-h-full`}>
                <Header pageLayout={pageLayout} pageTitle="Performance KPIs" pageDescription="Employee performance metrics and analytics" currentUser={currentUser} />
                
                <div className="flex flex-col items-center justify-start h-9/10 w-full p-5 gap-5 overflow-y-scroll">
                    {/* Header */}
                    <div className="flex flex-row items-center justify-between w-full">
                        <div className="flex flex-col items-start justify-start">
                            <h2 className="text-md font-medium">Employee KPI Dashboard</h2>
                            <p className="font-sans text-sm text-[rgba(0,0,0,0.6)]">Track and analyze employee performance based on working hours</p>
                        </div>
                        <button
                            onClick={downloadKPIReport}
                            className="flex flex-row items-center justify-center bg-white h-10 px-4 rounded-lg shadow-md gap-2 text-sm font-medium cursor-pointer hover:bg-gray-100 transition duration-200"
                        >
                            <img src={downloadIcon} alt="download" className="h-4" />
                            Download Report
                        </button>
                    </div>

                    {/* Period Selection */}
                    <div className="w-full bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5">
                        <h3 className="font-medium mb-4 flex items-center gap-2">
                            <img src={kpiIcon} className="h-5" alt="kpi" />
                            KPI Controls
                        </h3>
                        <div className="flex flex-col gap-2">
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
                                    <span className="text-sm">Current Month</span>
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
                                    <span className="text-sm">Current Quarter</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Overall Metrics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
                        <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <img src={userIcon} className="h-5" alt="employees" />
                                <p className="text-3xl font-semibold">{kpiData.overallMetrics.totalEmployees}</p>
                            </div>
                            <p className="text-sm font-medium text-gray-600">Total Employees</p>
                            <p className="text-xs text-gray-500 mt-1">Active workforce</p>
                        </div>

                        <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <img src={trendUpIcon} className="h-5" alt="hours" />
                                <p className="text-3xl font-semibold">{kpiData.overallMetrics.avgHoursPerEmployee.toFixed(1)}h</p>
                            </div>
                            <p className="text-sm font-medium text-gray-600">Avg Hours/Employee</p>
                            <p className="text-xs text-gray-500 mt-1">Per {period === 'monthly' ? 'month' : 'quarter'}</p>
                        </div>

                        <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5">
                            <p className="text-3xl font-semibold mb-2">{kpiData.overallMetrics.avgAttendanceRate.toFixed(1)}%</p>
                            <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                            <div className="w-full bg-gray-200 h-2 rounded-full mt-3">
                                <div
                                    className="bg-black h-full rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(kpiData.overallMetrics.avgAttendanceRate, 100)}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Overall performance</p>
                        </div>

                        <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5">
                            <p className="text-3xl font-semibold mb-2">{kpiData.overallMetrics.totalOvertimeHours.toFixed(1)}h</p>
                            <p className="text-sm font-medium text-gray-600">Total Overtime</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {kpiData.overallMetrics.totalHours > 0 
                                    ? `${((kpiData.overallMetrics.totalOvertimeHours / kpiData.overallMetrics.totalHours) * 100).toFixed(1)}% of total hours`
                                    : '0% of total hours'
                                }
                            </p>
                        </div>
                    </div>

                    {/* Top Performers Chart */}
                    <div className="w-full h-[350px] bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5">
                        <div className="flex flex-row items-center gap-2 mb-4">
                            <img src={chartIcon} className="h-5" alt="chart" />
                            <h3 className="font-medium">Top 10 Performers (By Working Hours)</h3>
                        </div>
                        <div className="h-[270px]">
                            {kpiData.topPerformers.length > 0 ? (
                                <Bar data={topPerformersChartData} options={topPerformersChartOptions} />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                    No performance data available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Monthly Trends Chart */}
                    <div className="w-full h-[350px] bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5">
                        <div className="flex flex-row items-center gap-2 mb-4">
                            <img src={chartIcon} className="h-5" alt="chart" />
                            <h3 className="font-medium">Monthly Attendance Trends (Last 12 Months)</h3>
                        </div>
                        <div className="h-[270px]">
                            {kpiData.monthlyTrends.length > 0 ? (
                                <Line data={monthlyTrendsChartData} options={monthlyTrendsChartOptions} />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                    No trend data available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Top Performers Table */}
                    <div className="w-full bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5">
                        <h3 className="font-medium mb-4">Top 10 Performers - Detailed View</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-2">Rank</th>
                                        <th className="text-left py-3 px-2">Employee</th>
                                        <th className="text-left py-3 px-2">ID</th>
                                        <th className="text-right py-3 px-2">Total Hours</th>
                                        <th className="text-right py-3 px-2">Days Present</th>
                                        <th className="text-right py-3 px-2">Avg Hours/Day</th>
                                        <th className="text-right py-3 px-2">Overtime</th>
                                        <th className="text-right py-3 px-2">Attendance Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {kpiData.topPerformers.length > 0 ? (
                                        kpiData.topPerformers.map((emp, index) => (
                                            <tr key={emp.user_id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-3 px-2 font-medium">{index + 1}</td>
                                                <td className="py-3 px-2">{emp.first_name} {emp.last_name}</td>
                                                <td className="py-3 px-2 text-gray-600">{emp.employee_id}</td>
                                                <td className="py-3 px-2 text-right font-medium">{parseFloat(emp.total_hours).toFixed(1)}h</td>
                                                <td className="py-3 px-2 text-right">{emp.days_present}</td>
                                                <td className="py-3 px-2 text-right">{parseFloat(emp.avg_hours_per_day).toFixed(1)}h</td>
                                                <td className="py-3 px-2 text-right">{parseFloat(emp.overtime_hours).toFixed(1)}h</td>
                                                <td className="py-3 px-2 text-right">
                                                    <span className={`px-2 py-1 rounded ${
                                                        parseFloat(emp.attendance_rate) >= 90 ? 'bg-green-100 text-green-800' :
                                                        parseFloat(emp.attendance_rate) >= 75 ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                        {parseFloat(emp.attendance_rate).toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="text-center py-8 text-gray-400">
                                                No performance data available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Bottom Performers Table */}
                    <div className="w-full bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5">
                        <h3 className="font-medium mb-4">Employees Needing Attention (Low Working Hours)</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-2">Employee</th>
                                        <th className="text-left py-3 px-2">ID</th>
                                        <th className="text-right py-3 px-2">Total Hours</th>
                                        <th className="text-right py-3 px-2">Days Present</th>
                                        <th className="text-right py-3 px-2">Avg Hours/Day</th>
                                        <th className="text-right py-3 px-2">Overtime</th>
                                        <th className="text-right py-3 px-2">Attendance Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {kpiData.bottomPerformers.length > 0 ? (
                                        kpiData.bottomPerformers.map((emp) => (
                                            <tr key={emp.user_id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-3 px-2">{emp.first_name} {emp.last_name}</td>
                                                <td className="py-3 px-2 text-gray-600">{emp.employee_id}</td>
                                                <td className="py-3 px-2 text-right font-medium text-red-600">{parseFloat(emp.total_hours).toFixed(1)}h</td>
                                                <td className="py-3 px-2 text-right">{emp.days_present}</td>
                                                <td className="py-3 px-2 text-right">{parseFloat(emp.avg_hours_per_day).toFixed(1)}h</td>
                                                <td className="py-3 px-2 text-right">{parseFloat(emp.overtime_hours).toFixed(1)}h</td>
                                                <td className="py-3 px-2 text-right">
                                                    <span className={`px-2 py-1 rounded ${
                                                        parseFloat(emp.attendance_rate) >= 90 ? 'bg-green-100 text-green-800' :
                                                        parseFloat(emp.attendance_rate) >= 75 ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                        {parseFloat(emp.attendance_rate).toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="text-center py-8 text-gray-400">
                                                All employees are performing well!
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
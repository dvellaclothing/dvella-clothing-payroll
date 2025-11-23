import { useState, useEffect } from "react"
import Header from "../Header"
import { API_URL } from "../../../config"
import { Bar, Doughnut } from 'react-chartjs-2'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js'

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
)

const reportIcon = "/images/report.png"
const chartIcon = "/images/chart.png"
const departmentIcon = "/images/department.png"
const downloadIcon = "/images/download.png"
const filterIcon = "/images/filter.png"

export default function ReportsPage({ pageLayout, currentUser }) {
    const [reports, setReports] = useState([])
    const [payrollTrend, setPayrollTrend] = useState([])
    const [departmentBreakdown, setDepartmentBreakdown] = useState([])
    const [statistics, setStatistics] = useState({
        totalRecords: 0,
        departments: 0,
        reportTypes: 0,
        totalHoursThisMonth: 0,
        activeEmployees: 0
    })
    const [departments, setDepartments] = useState([])
    const [loading, setLoading] = useState(true)
    
    // Filters
    const [filters, setFilters] = useState({
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        department: 'all',
        status: 'all'
    })
    
    const [showFilters, setShowFilters] = useState(false)
    const [selectedPeriod, setSelectedPeriod] = useState(null)
    const [periodDetails, setPeriodDetails] = useState([])

    useEffect(() => {
        fetchAllData()
    }, [filters])

    const fetchAllData = async () => {
        try {
            setLoading(true)
            
            // Fetch payroll reports
            const reportsRes = await fetch(
                `${API_URL}/api/reports/payroll-reports?` +
                `startDate=${filters.startDate}&endDate=${filters.endDate}&` +
                `department=${filters.department}&status=${filters.status}`
            )
            const reportsData = await reportsRes.json()
            setReports(reportsData.reports || [])

            // Fetch payroll trend
            const trendRes = await fetch(`${API_URL}/api/reports/payroll-trend?year=2025`)
            const trendData = await trendRes.json()
            setPayrollTrend(trendData.trend || [])

            // Fetch department breakdown
            const deptRes = await fetch(`${API_URL}/api/reports/department-breakdown`)
            const deptData = await deptRes.json()
            setDepartmentBreakdown(deptData.departments || [])

            // Fetch statistics
            const statsRes = await fetch(`${API_URL}/api/reports/statistics`)
            const statsData = await statsRes.json()
            setStatistics(statsData.statistics || statistics)

            // Fetch departments for filter
            const deptsRes = await fetch(`${API_URL}/api/reports/departments`)
            const deptsData = await deptsRes.json()
            setDepartments(deptsData.departments || [])

            setLoading(false)
        } catch (error) {
            console.error('Error fetching reports data:', error)
            setLoading(false)
        }
    }

    const fetchPeriodDetails = async (periodId) => {
        try {
            const res = await fetch(`${API_URL}/api/reports/payroll-detail/${periodId}`)
            const data = await res.json()
            setPeriodDetails(data.details || [])
            setSelectedPeriod(periodId)
        } catch (error) {
            console.error('Error fetching period details:', error)
        }
    }

    // Chart data for hours worked trend - BAR CHART
    const trendChartData = {
        labels: payrollTrend.map(t => t.month_name),
        datasets: [{
            label: 'Total Hours Worked',
            data: payrollTrend.map(t => parseFloat(t.total_hours) || 0),
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderColor: 'rgb(0, 0, 0)',
            borderWidth: 1,
            yAxisID: 'y'
        }, {
            label: 'Total Payroll',
            data: payrollTrend.map(t => parseFloat(t.total_net) || 0),
            backgroundColor: 'rgba(100, 100, 100, 0.6)',
            borderColor: 'rgb(100, 100, 100)',
            borderWidth: 1,
            yAxisID: 'y1'
        }]
    }

    const trendChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                display: true,
                position: 'bottom'
            }
        },
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'Hours'
                }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'Payroll (₱)'
                },
                grid: {
                    drawOnChartArea: false,
                },
                ticks: {
                    callback: function(value) {
                        return '₱' + (value / 1000).toFixed(0) + 'K'
                    }
                }
            }
        }
    }

    // Chart data for employee breakdown (by hours) - VIBRANT COLORS
    const deptChartData = {
        labels: departmentBreakdown.map(d => d.code || d.name),
        datasets: [{
            data: departmentBreakdown.map(d => parseFloat(d.total_hours_this_month) || 0),
            backgroundColor: [
                'rgba(0, 0, 0, 0.9)',         // Deep Black
                'rgba(64, 64, 64, 0.85)',     // Dark Charcoal
                'rgba(96, 96, 96, 0.85)',     // Medium Gray
                'rgba(128, 128, 128, 0.85)',  // True Gray
                'rgba(160, 160, 160, 0.85)',  // Light Gray
                'rgba(192, 192, 192, 0.80)',  // Silver
                'rgba(224, 224, 224, 0.75)',  // Soft Gray
                'rgba(48, 48, 48, 0.90)',     // Dark Slate
                'rgba(112, 112, 112, 0.85)',  // Medium Slate
                'rgba(176, 176, 176, 0.80)',  // Light Slate
            ],
            borderColor: [
                'rgba(0, 0, 0, 1)',
                'rgba(64, 64, 64, 1)',
                'rgba(96, 96, 96, 1)',
                'rgba(128, 128, 128, 1)',
                'rgba(160, 160, 160, 1)',
                'rgba(192, 192, 192, 1)',
                'rgba(224, 224, 224, 1)',
                'rgba(48, 48, 48, 1)',
                'rgba(112, 112, 112, 1)',
                'rgba(176, 176, 176, 1)',
            ],
            borderWidth: 2
        }]
    }

    const deptChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 10,
                    font: {
                        size: 11
                    }
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return context.label + ': ' + context.parsed + ' hours'
                    }
                }
            }
        }
    }

    const downloadCSV = () => {
        const headers = ['Date', 'Period', 'Total Hours', 'Avg Hours', 'Employees', 'Total Amount', 'Status']
        const rows = reports.map(r => [
            r.pay_date || '-',
            r.period_name || 'N/A',
            (r.total_hours || 0).toFixed(1),
            (r.avg_hours || 0).toFixed(1),
            r.employee_count || 0,
            '₱' + (r.total_amount || 0).toLocaleString(),
            r.status || '-'
        ])
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n')
        
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `payroll-attendance-report-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
    }

    if (loading) {
        return (
            <div className={`${pageLayout ? 'col-span-5' : 'col-span-17 xl:col-start-2'} col-start-2 flex items-center justify-center w-full h-full`}>
                <p className="text-lg">Loading reports...</p>
            </div>
        )
    }

    return (
        <>
            <div className={`${pageLayout ? 'col-span-5' : 'col-span-17 xl:col-start-2'} col-start-2 flex flex-col w-full min-h-full`}>
                <Header pageLayout={pageLayout} pageTitle="Reports" pageDescription="Analytics and reporting tools" currentUser={currentUser} />
                
                <div className="flex flex-col items-center justify-start h-9/10 w-full p-5 gap-5 overflow-y-scroll">
                    {/* Header with actions */}
                    <div className="flex flex-row items-center justify-between w-full">
                        <div className="flex flex-col items-start justify-start">
                            <h2 className="text-md font-medium">Attendance & Payroll Reports</h2>
                            <p className="font-sans text-sm text-[rgba(0,0,0,0.6)]">Comprehensive reporting and data analysis based on hours worked</p>
                        </div>
                        <div className="flex flex-row gap-2">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex flex-row items-center justify-center bg-white h-10 px-4 rounded-lg shadow-md gap-2 text-sm font-medium cursor-pointer hover:bg-gray-100 transition duration-200"
                            >
                                <img src={filterIcon} alt="filter" className="h-4" />
                                Filters
                            </button>
                            <button
                                onClick={downloadCSV}
                                className="flex flex-row items-center justify-center bg-white h-10 px-4 rounded-lg shadow-md gap-2 text-sm font-medium cursor-pointer hover:bg-gray-100 transition duration-200"
                            >
                                <img src={downloadIcon} alt="download" className="h-4" />
                                CSV
                            </button>
                        </div>
                    </div>

                    {/* Filters Panel */}
                    {showFilters && (
                        <div className="w-full bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5">
                            <h3 className="font-medium mb-4">Report Filters</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium mb-2">Start Date</label>
                                    <input
                                        type="date"
                                        value={filters.startDate}
                                        onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                                        className="border border-gray-300 rounded-lg p-2 text-sm"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium mb-2">End Date</label>
                                    <input
                                        type="date"
                                        value={filters.endDate}
                                        onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                                        className="border border-gray-300 rounded-lg p-2 text-sm"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium mb-2">Employee</label>
                                    <select
                                        value={filters.department}
                                        onChange={(e) => setFilters({...filters, department: e.target.value})}
                                        className="border border-gray-300 rounded-lg p-2 text-sm"
                                    >
                                        <option value="all">All Employees</option>
                                        {departments.map(dept => (
                                            <option key={dept.department_id} value={dept.department_id}>
                                                {dept.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium mb-2">Status</label>
                                    <select
                                        value={filters.status}
                                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                                        className="border border-gray-300 rounded-lg p-2 text-sm"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="processed">Processed</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full">
                        {/* Monthly Hours & Payroll Trend */}
                        <div className="w-full h-[300px] bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5">
                            <div className="flex flex-row items-center gap-2 mb-4">
                                <img src={chartIcon} className="h-5" alt="chart" />
                                <h3 className="font-medium">Monthly Hours & Payroll Trend</h3>
                            </div>
                            <div className="h-[220px]">
                                {payrollTrend.length > 0 ? (
                                    <Bar data={trendChartData} options={trendChartOptions} />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400">
                                        No trend data available
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Top Employees by Hours */}
                        <div className="w-full h-[300px] bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5">
                            <div className="flex flex-row items-center gap-2 mb-4">
                                <img src={departmentIcon} className="h-5" alt="employees" />
                                <h3 className="font-medium">Top 10 Employees by Hours (This Month)</h3>
                            </div>
                            <div className="h-[220px]">
                                {departmentBreakdown.length > 0 ? (
                                    <Doughnut data={deptChartData} options={deptChartOptions} />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400">
                                        No employee data available
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Detailed Payroll Report */}
                    <div className="w-full bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5">
                        <div className="flex flex-row items-center gap-2 mb-4">
                            <img src={reportIcon} className="h-5" alt="report" />
                            <h3 className="font-medium">Detailed Payroll Reports</h3>
                        </div>
                        <div className="w-full overflow-x-auto">
                            <table className="w-full min-w-[900px]">
                                <thead>
                                    <tr className="border-b bg-gray-50">
                                        <th className="text-left p-3 text-sm font-medium">Date</th>
                                        <th className="text-left p-3 text-sm font-medium">Period Name</th>
                                        <th className="text-right p-3 text-sm font-medium">Total Hours</th>
                                        <th className="text-right p-3 text-sm font-medium">Avg Hours</th>
                                        <th className="text-center p-3 text-sm font-medium">Employees</th>
                                        <th className="text-right p-3 text-sm font-medium">Total Amount</th>
                                        <th className="text-center p-3 text-sm font-medium">Status</th>
                                        <th className="text-center p-3 text-sm font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.length > 0 ? (
                                        reports.map((report, index) => (
                                            <tr key={index} className="border-b hover:bg-gray-50">
                                                <td className="p-3 text-sm">
                                                    {new Date(report.pay_date || report.end_date).toLocaleDateString()}
                                                </td>
                                                <td className="p-3 text-sm">
                                                    {report.period_name || 'N/A'}
                                                </td>
                                                <td className="p-3 text-sm text-right font-medium">
                                                    {(report.total_hours || 0).toFixed(1)}h
                                                </td>
                                                <td className="p-3 text-sm text-right">
                                                    {(report.avg_hours || 0).toFixed(1)}h
                                                </td>
                                                <td className="p-3 text-sm text-center">
                                                    {report.employee_count || 0}
                                                </td>
                                                <td className="p-3 text-sm text-right font-medium">
                                                    ₱{(report.total_amount || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}
                                                </td>
                                                <td className="p-3 text-sm text-center">
                                                    <span className={`px-2 py-1 rounded text-xs ${
                                                        report.status === 'processed' ? 'bg-green-100 text-green-800' :
                                                        report.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {report.status || 'pending'}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <button 
                                                        onClick={() => fetchPeriodDetails(report.period_id)}
                                                        className="text-blue-600 hover:underline text-sm"
                                                    >
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="p-8 text-center text-gray-400">
                                                No payroll reports found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Period Details Modal */}
                    {selectedPeriod && periodDetails.length > 0 && (
                        <div className="fixed inset-0 bg-[rgba(0,0,0,0.2)] flex items-center justify-center z-50" onClick={() => setSelectedPeriod(null)}>
                            <div className="bg-white rounded-2xl p-6 max-w-6xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-semibold">Payroll Details - {periodDetails[0]?.period_name}</h3>
                                    <button 
                                        onClick={() => setSelectedPeriod(null)}
                                        className="text-2xl hover:text-gray-600"
                                    >
                                        ×
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[1000px]">
                                        <thead>
                                            <tr className="border-b bg-gray-50">
                                                <th className="text-left p-2 text-sm">Employee</th>
                                                <th className="text-left p-2 text-sm">Position</th>
                                                <th className="text-right p-2 text-sm">Hours</th>
                                                <th className="text-right p-2 text-sm">Overtime</th>
                                                <th className="text-right p-2 text-sm">Basic Salary</th>
                                                <th className="text-right p-2 text-sm">OT Amount</th>
                                                <th className="text-right p-2 text-sm">Deductions</th>
                                                <th className="text-right p-2 text-sm">Net Pay</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {periodDetails.map((detail, index) => (
                                                <tr key={index} className="border-b hover:bg-gray-50">
                                                    <td className="p-2 text-sm">{detail.first_name} {detail.last_name}</td>
                                                    <td className="p-2 text-sm">{detail.department || detail.position || 'N/A'}</td>
                                                    <td className="p-2 text-sm text-right font-medium">{parseFloat(detail.hours_worked || 0).toFixed(1)}h</td>
                                                    <td className="p-2 text-sm text-right">{parseFloat(detail.overtime_hours || 0).toFixed(1)}h</td>
                                                    <td className="p-2 text-sm text-right">₱{parseFloat(detail.basic_salary).toLocaleString()}</td>
                                                    <td className="p-2 text-sm text-right">₱{parseFloat(detail.overtime_amount || 0).toLocaleString()}</td>
                                                    <td className="p-2 text-sm text-right">₱{parseFloat(detail.deductions).toLocaleString()}</td>
                                                    <td className="p-2 text-sm text-right font-semibold">₱{parseFloat(detail.net_pay).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 w-full">
                        <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5">
                            <p className="text-3xl font-semibold">{statistics.totalRecords.toLocaleString()}</p>
                            <p className="text-sm text-gray-600 mt-1">Total Records</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5">
                            <p className="text-3xl font-semibold">{statistics.activeEmployees}</p>
                            <p className="text-sm text-gray-600 mt-1">Active Employees</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5">
                            <p className="text-3xl font-semibold">{statistics.totalHoursThisMonth.toFixed(0)}</p>
                            <p className="text-sm text-gray-600 mt-1">Hours This Month</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5">
                            <p className="text-3xl font-semibold">{statistics.departments}</p>
                            <p className="text-sm text-gray-600 mt-1">Total Employees</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
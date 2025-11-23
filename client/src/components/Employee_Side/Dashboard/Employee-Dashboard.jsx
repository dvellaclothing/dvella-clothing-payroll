// Employee-Dashboard.jsx
import { useState, useEffect } from "react"
import { API_URL } from "../../../config"
import Header from "../../Main/Header"

const attendanceIcon = "/images/performance.png"
const payrollIcon = "/images/payroll.png"
const kpiIcon = "/images/reports.png"

export default function EmployeeDashboard({ pageLayout, currentUser }) {
    const [dashboardData, setDashboardData] = useState({
        attendance: null,
        kpi: null,
        recentPayslip: null
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            const [attendanceRes, kpiRes] = await Promise.all([
                fetch(`${API_URL}/api/attendance/${currentUser.user_id}`),
                fetch(`${API_URL}/api/kpi/${currentUser.user_id}`)
            ])

            const attendance = await attendanceRes.json()
            const kpi = await kpiRes.json()

            setDashboardData({
                attendance,
                kpi
            })
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={`${pageLayout ? 'col-span-5' : 'col-span-17 xl:col-start-2'} col-start-2 flex flex-col w-full min-h-full`}>
            <Header pageLayout={pageLayout} pageTitle="Employee Dashboard" pageDescription="Welcome back!" currentUser={currentUser} />
            
            <div className="flex flex-col items-center justify-start h-9/10 w-full p-5 gap-5 overflow-y-scroll">
                <div className="flex flex-col items-start justify-start w-full gap-2">
                    <h2 className="text-xl font-medium">Welcome, {currentUser.first_name}!</h2>
                    <p className="text-sm text-[rgba(0,0,0,0.6)]">Here's your overview for today</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
                    <div className="relative flex flex-col items-start justify-between h-40 w-full bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5">
                        <img src={attendanceIcon} className="absolute top-5 right-5 h-8 w-auto opacity-20" alt="Attendance" />
                        <p className="text-lg font-medium">Attendance</p>
                        <div className="flex flex-col items-start justify-center">
                            {loading ? (
                                <p className="text-sm text-gray-500">Loading...</p>
                            ) : (
                                <>
                                    <p className="text-3xl font-bold">
                                        {dashboardData.attendance?.currentMonth?.present_days || 0}
                                    </p>
                                    <p className="text-sm text-[rgba(0,0,0,0.6)]">
                                        Days present this month
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="relative flex flex-col items-start justify-between h-40 w-full bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5">
                        <img src={kpiIcon} className="absolute top-5 right-5 h-8 w-auto opacity-20" alt="KPI" />
                        <p className="text-lg font-medium">KPI Score</p>
                        <div className="flex flex-col items-start justify-center">
                            {loading ? (
                                <p className="text-sm text-gray-500">Loading...</p>
                            ) : (
                                <>
                                    <p className="text-3xl font-bold">
                                        {dashboardData.kpi?.overallScore || 0}
                                    </p>
                                    <p className="text-sm text-[rgba(0,0,0,0.6)]">
                                        Out of {dashboardData.kpi?.maxScore || 100}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="relative flex flex-col items-start justify-between h-40 w-full bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5">
                        <img src={payrollIcon} className="absolute top-5 right-5 h-8 w-auto opacity-20" alt="Payroll" />
                        <p className="text-lg font-medium">Position</p>
                        <div className="flex flex-col items-start justify-center">
                            <p className="text-2xl font-bold">{currentUser.position}</p>
                            <p className="text-sm text-[rgba(0,0,0,0.6)]">{currentUser.role}</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col w-full bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5 gap-3">
                    <h3 className="text-lg font-medium">Quick Actions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <a href="/employee/attendance" className="flex flex-col items-center justify-center p-4 border border-[rgba(0,0,0,0.1)] rounded-lg hover:bg-gray-50 transition cursor-pointer">
                            <img src={attendanceIcon} className="h-8 w-auto mb-2" alt="Check Attendance" />
                            <p className="text-sm font-medium">Check Attendance</p>
                        </a>
                        <a href="/employee/payslips" className="flex flex-col items-center justify-center p-4 border border-[rgba(0,0,0,0.1)] rounded-lg hover:bg-gray-50 transition cursor-pointer">
                            <img src={payrollIcon} className="h-8 w-auto mb-2" alt="View Payslips" />
                            <p className="text-sm font-medium">View Payslips</p>
                        </a>
                        <a href="/employee/kpi" className="flex flex-col items-center justify-center p-4 border border-[rgba(0,0,0,0.1)] rounded-lg hover:bg-gray-50 transition cursor-pointer">
                            <img src={kpiIcon} className="h-8 w-auto mb-2" alt="KPI Performance" />
                            <p className="text-sm font-medium">KPI Performance</p>
                        </a>
                        <a href="/employee/profile" className="flex flex-col items-center justify-center p-4 border border-[rgba(0,0,0,0.1)] rounded-lg hover:bg-gray-50 transition cursor-pointer">
                            <img src="/images/employees.png" className="h-8 w-auto mb-2" alt="Edit Profile" />
                            <p className="text-sm font-medium">Edit Profile</p>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
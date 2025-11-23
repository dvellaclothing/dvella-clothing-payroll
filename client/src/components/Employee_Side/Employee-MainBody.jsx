
import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import EmployeeSidebar from './Employee-Sidebar'
import EmployeeDashboard from './Dashboard/Employee-Dashboard'
import EmployeePOS from './POS/Employee-POS'
import EmployeeStocks from './Stocks/Employee-Stocks'
import EmployeeProfile from './Profile/Employee-Profile'
import EmployeePayslips from './Payslips/Employee-Payslips'
import EmployeeAttendance from './Attendance/Employee-Attendance'
import EmployeeKPI from './KPI/Employee-KPI'
import EmployeeSettings from './Settings/Employee-Settings'
import EmployeeHelp from './Help/Employee-Help'

export default function EmployeeMainBody() {
    const user = JSON.parse(localStorage.getItem("user"))
    const [sidebarData, setSidebarData] = useState(true)

    const handleSidebarAction = (data) => {
        setSidebarData(data)
    }

    return (
        <div className={`grid ${sidebarData ? 'grid-cols-6 xl:grid-cols-6' : 'grid-cols-6 xl:grid-cols-18'} w-screen h-screen bg-white overflow-hidden`}>
            <EmployeeSidebar onAction={handleSidebarAction} />
            <Routes>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<EmployeeDashboard pageLayout={sidebarData} currentUser={user} />} />
                <Route path="pos" element={<EmployeePOS pageLayout={sidebarData} currentUser={user} />} />
                <Route path="stocks" element={<EmployeeStocks pageLayout={sidebarData} currentUser={user} />} />
                <Route path="profile" element={<EmployeeProfile pageLayout={sidebarData} currentUser={user} />} />
                <Route path="payslips" element={<EmployeePayslips pageLayout={sidebarData} currentUser={user} />} />
                <Route path="attendance" element={<EmployeeAttendance pageLayout={sidebarData} currentUser={user} />} />
                <Route path="kpi" element={<EmployeeKPI pageLayout={sidebarData} currentUser={user} />} />
                <Route path="settings" element={<EmployeeSettings pageLayout={sidebarData} currentUser={user} />} />
                <Route path="help" element={<EmployeeHelp pageLayout={sidebarData} currentUser={user} />} />
            </Routes>
        </div>
    )
}
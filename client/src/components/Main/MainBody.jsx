
import { useState } from 'react'

import Sidebar from '../Sidebar/Sidebar'
import DashboardPage from './Dashboard/DashboardPage'
import EmployeesPage from './Employees/EmployeesPage'
import PayrollPage from './Payroll/Payroll-Page'
import AttendancePage from './Performance/Performance-Page'
import ReportsPage from './Reports/Reports-Page'
import ForecastingPage from './Forecasting/Forecasting-Page'
import UserSettings from './UserSettings/UserSettings'
import HelpPage from './Help/Help'
import Profile from './Profile/Profile'
import KPIPage from './KPI/KPI'
import NotificationsPage from '../Employee_Side/NotificationPage'

import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'

export default function MainBody() {
    const user = JSON.parse(localStorage.getItem("user"))
    const [sidebarData, setSidebarData] = useState(true)

    const handleSidebarAction = (data) => {
        setSidebarData(data)
    }

    return(
        <>
            <div className={`grid ${sidebarData ? 'grid-cols-6 xl:grid-cols-6' : 'grid-cols-6 xl:grid-cols-18'} w-screen h-screen bg-white overflow-hidden`}>
                <Sidebar onAction = {handleSidebarAction} />
                <Routes>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardPage pageLayout={sidebarData} currentUser={user} />} />
                    <Route path="employees" element={<EmployeesPage pageLayout={sidebarData} currentUser={user} />} />
                    <Route path="payroll" element={<PayrollPage pageLayout={sidebarData} currentUser={user} />} />
                    <Route path="attendance" element={<AttendancePage pageLayout={sidebarData} currentUser={user} />} />
                    <Route path="forecasting" element={<ForecastingPage pageLayout={sidebarData} currentUser={user} />} />
                    <Route path="reports" element={<ReportsPage pageLayout={sidebarData} currentUser={user} />} />
                    <Route path="settings" element={<UserSettings pageLayout={sidebarData} currentUser={user} />} />
                    <Route path="help" element={<HelpPage pageLayout={sidebarData} currentUser={user} />} />
                    <Route path="profile" element={<Profile pageLayout={sidebarData} currentUser={user} />} />
                    <Route path="kpi" element={<KPIPage pageLayout={sidebarData} currentUser={user} />} />
                    <Route path="notifications" element={<NotificationsPage pageLayout={true} currentUser={user} />} />
                </Routes>
            </div>
        </>
    )
}
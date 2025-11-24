
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { API_URL } from "../../config"

import NavLink from "./Nav-Link"

const companyLogo = "/images/logo.jpg"

const menuIcon = "/images/menu.png"
const dashboardIcon = "/images/dashboard.png"
const employeesIcon = "/images/employees.png"
const payrollIcon = "/images/payroll.png"
const performanceIcon = "/images/performance.png"
const forecastingIcon = "/images/forecasting.png"
const reportsIcon = "/images/reports.png"
const employeePortalIcon = "/images/employee-portal.png"
const settingsIcon = "/images/settings.png"
const helpIcon = "/images/help.png"
const signoutIcon = "/images/signout.png"

export default function Sidebar({ onAction }) {
    const navigate = useNavigate()
    const user = JSON.parse(localStorage.getItem("user"))
    const [sidebarStatus, setSidebarStatus] = useState(true)
    const firstLetter = user.first_name[0].toUpperCase()
    const secondLetter = user.last_name[0].toUpperCase()
    const initials = firstLetter + secondLetter
    const profilePictureUrl = user.profile_picture_url ? `${API_URL}${user.profile_picture_url}` : null

    const handleMenuClick = () => {
        onAction(false)
        setSidebarStatus(false)
    }

    const handleMenuClick2 = () => {
        onAction(true)
        setSidebarStatus(true)
    }

    const handleSignOut = () => {
        localStorage.removeItem("user")
        navigate("/")
    }
    
    return(
        <>
            <div className={`fixed xl:static z-50 flex flex-col items-center justify-start bg-gray-50 ${sidebarStatus ? 'w-20 xl:w-64' : 'w-64 xl:w-20'} xl:w-full h-full border-r border-[rgba(0,0,0,0.2)] transition-all duration-300`}>
                <div className="h-1/10 w-full border-b border-[rgba(0,0,0,0.2)] px-5">
                    <div className="flex flex-row w-full h-full items-center justify-between">
                        <div className={`${sidebarStatus ? 'hidden xl:flex' : 'flex xl:hidden'} flex-row h-full w-auto items-center justify-start gap-4`}>
                            <img src={companyLogo} className="bg-gray-300 h-10 w-10 rounded-lg" />
                            <h2 className="text-sans font-medium text-xl">D.Vella</h2>
                        </div>
                        <button
                            onClick={sidebarStatus ? handleMenuClick : handleMenuClick2}
                            className="flex flex-col items-center justify-center h-10 w-10 cursor-pointer rounded-lg hover:bg-gray-100 transition duration-200"
                        >
                            <img src={menuIcon} className="h-5 w-auto" />
                        </button>
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center h-1/2 w-full px-2 xl:px-5">
                    <div className="h-full w-full items-center justify-center flex flex-col border-b border-[rgba(0,0,0,0.2)] py-5">
                        <div className="flex flex-col items-center justify-start gap-2 w-full h-full">
                            <NavLink sidebarStatus={sidebarStatus} image={dashboardIcon} title="Dashboard" link="/admin/dashboard" />
                            <NavLink sidebarStatus={sidebarStatus} image={employeesIcon} title="Employees" link="/admin/employees" />
                            <NavLink sidebarStatus={sidebarStatus} image={payrollIcon} title="Payroll" link="/admin/payroll" />
                            <NavLink sidebarStatus={sidebarStatus} image={performanceIcon} title="Attendance" link="/admin/attendance" />
                            <NavLink sidebarStatus={sidebarStatus} image={forecastingIcon} title="Forecasting" link="/admin/forecasting" />
                            <NavLink sidebarStatus={sidebarStatus} image={reportsIcon} title="Reports" link="/admin/reports" />
                            <NavLink sidebarStatus={sidebarStatus} image={employeePortalIcon} title="Profile" link="/admin/profile" />
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center h-3/10 w-full p-2 xl:p-5 border-b border-[rgba(0,0,0,0.2)]">
                    <div className="flex flex-col items-center justify-start w-full h-full gap-2">
                        <NavLink sidebarStatus={sidebarStatus} image={settingsIcon} title="Settings" link="/admin/settings" />
                        <NavLink sidebarStatus={sidebarStatus} image={helpIcon} title="Help" link="/admin/help" />
                    </div>
                </div>
                <div className="h-1/10 w-full border-b border-[rgba(0,0,0,0.2)] px-5">
                    <div className="flex flex-row w-full h-full items-center justify-between">
                        <div className="flex flex-row h-full w-auto items-center justify-start gap-2">
                            <div className={`${user.profile_picture_url === null ? 'bg-gradient-to-tl from-blue-500 to-purple-500' : 'bg-gray-300'} h-10 w-10 rounded-full flex flex-row items-center justify-center overflow-hidden`}>
                                { profilePictureUrl ?
                                    <img src={profilePictureUrl} className="h-20 w-auto rounded-full object-cover" />
                                    : <p className="text-sans font-medium text-2xl text-white">{initials}</p>
                                }
                            </div>
                            <div className={`${sidebarStatus ? 'hidden xl:flex' : 'flex xl:hidden'} flex-col items-start justify-start h-10 overflow-hidden`}>
                                <h2 className="text-sans font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis">{user.first_name} {user.last_name}</h2>
                                <p className="text-sm text-[rgba(0,0,0,0.5)] text-sans">{user.role}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className={`${sidebarStatus ? 'hidden xl:flex' : 'flex xl:hidden'} flex-col items-center justify-center h-10 w-10 cursor-pointer rounded-lg hover:bg-gray-100 transition duration-200`}
                        >
                            <img src={signoutIcon} className="h-5 w-auto" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import NavLink from "../Sidebar/Nav-Link"
import { API_URL } from "../../config"

const companyLogo = "/images/logo.jpg"
const menuIcon = "/images/menu.png"
const dashboardIcon = "/images/dashboard.png"
const posIcon = "/images/payroll.png"
const stocksIcon = "/images/forecasting.png"
const profileIcon = "/images/employees.png"
const payslipsIcon = "/images/document.png"
const attendanceIcon = "/images/performance.png"
const settingsIcon = "/images/settings.png"
const helpIcon = "/images/help.png"
const signoutIcon = "/images/signout.png"

export default function EmployeeSidebar({ onAction }) {
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
    
    return (
        <div className={`fixed xl:static z-50 flex flex-col items-center justify-start bg-gray-50 ${sidebarStatus ? 'w-20 xl:w-64' : 'w-64 xl:w-20'} xl:w-full h-full border-r border-[rgba(0,0,0,0.2)] transition-all duration-300`}>
            <div className="h-1/10 w-full border-b border-[rgba(0,0,0,0.2)] px-5">
                <div className="flex flex-row w-full h-full items-center justify-between">
                    <div className={`${sidebarStatus ? 'hidden xl:flex' : 'flex xl:hidden'} flex-row h-full w-auto items-center justify-start gap-4`}>
                        <img src={companyLogo} className="bg-gray-300 h-10 w-10 rounded-lg" alt="Company Logo" />
                        <h2 className="text-sans font-medium text-xl">D.Vella</h2>
                    </div>
                    <button
                        onClick={sidebarStatus ? handleMenuClick : handleMenuClick2}
                        className="flex flex-col items-center justify-center h-10 w-10 cursor-pointer rounded-lg hover:bg-gray-100 transition duration-200"
                    >
                        <img src={menuIcon} className="h-5 w-auto" alt="Menu" />
                    </button>
                </div>
            </div>
            
            <div className="flex flex-col items-center justify-center h-1/2 w-full px-2 xl:px-5">
                <div className="h-full w-full items-center justify-center flex flex-col border-b border-[rgba(0,0,0,0.2)] py-5">
                    <div className="flex flex-col items-center justify-start gap-2 w-full h-full">
                        <NavLink sidebarStatus={sidebarStatus} image={dashboardIcon} title="Dashboard" link="/employee/dashboard" />
                        <NavLink sidebarStatus={sidebarStatus} image={profileIcon} title="Profile" link="/employee/profile" />
                        <NavLink sidebarStatus={sidebarStatus} image={payslipsIcon} title="Payslips" link="/employee/payslips" />
                        <NavLink sidebarStatus={sidebarStatus} image={attendanceIcon} title="Attendance" link="/employee/attendance" />
                    </div>
                </div>
            </div>
            
            <div className="flex flex-col items-center justify-center h-3/10 w-full p-2 xl:p-5 border-b border-[rgba(0,0,0,0.2)]">
                <div className="flex flex-col items-center justify-start w-full h-full gap-2">
                    <NavLink sidebarStatus={sidebarStatus} image={settingsIcon} title="Settings" link="/employee/settings" />
                    <NavLink sidebarStatus={sidebarStatus} image={helpIcon} title="Help" link="/employee/help" />
                </div>
            </div>
            
            <div className="h-1/10 w-full border-b border-[rgba(0,0,0,0.2)] px-5">
                <div className="flex flex-row w-full h-full items-center justify-between">
                    <div className="flex flex-row h-full w-auto items-center justify-start gap-2">
                        <div className={`${user.profile_picture_url === null ? 'bg-gradient-to-tl from-blue-500 to-purple-500' : 'bg-gray-300'} h-10 w-10 rounded-full flex flex-row items-center justify-center overflow-hidden`}>
                            { profilePictureUrl ?
                                <img src={profilePictureUrl} className="h-10 w-auto rounded-full object-cover" />
                                : <p className="text-sans font-medium text-2xl text-white">{initials}</p>
                            }
                        </div>
                        <div className={`${sidebarStatus ? 'hidden xl:flex' : 'flex xl:hidden'} flex-col items-start justify-start h-10`}>
                            <h2 className="text-sans font-medium text-sm">{user.first_name} {user.last_name}</h2>
                            <p className="text-sm text-[rgba(0,0,0,0.5)] text-sans">{user.role}</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleSignOut}
                        className={`${sidebarStatus ? 'hidden xl:flex' : 'flex xl:hidden'} flex-col items-center justify-center h-10 w-10 cursor-pointer rounded-lg hover:bg-gray-100 transition duration-200`}
                    >
                        <img src={signoutIcon} className="h-5 w-auto" alt="Sign Out" />
                    </button>
                </div>
            </div>
        </div>
    )
}
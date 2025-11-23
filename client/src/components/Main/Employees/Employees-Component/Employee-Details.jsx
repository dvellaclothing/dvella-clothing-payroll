
import { useState } from "react"
import PersonalInformation from "./Personal-Information"
import SalaryInformation from "./Salary-Information"
import AttendanceRecords from "./Attendance-Records"
import KPIPerformance from "./KPI-Performance"

const employeeIcon = "/images/employee.png"
const closeIcon = "/images/close.png"

export default function EmployeeDetails({ employee, toggleModal }) {
    const [modalPage, setModalPage] = useState(1)
    const [showMobileNav, setShowMobileNav] = useState(false)

    return (
        <>  

            <div
                
                className="fixed top-0 left-0 w-full h-full bg-[rgba(0,0,0,0.2)] flex flex-col items-center justify-center z-100"
            >
                <div className="relative flex flex-col lg:grid lg:grid-cols-3 w-3/4 lg:w-auto h-3/4 lg:h-5/9 bg-white rounded-2xl overflow-hidden">
                    <button
                        onClick={() => toggleModal(false)}
                        className="absolute top-5 right-5 cursor-pointer"
                    >
                        <img src={closeIcon} className="h-4 w-auto invert-40" />
                    </button>
                    <div className="col-span-1 h-auto lg:h-full border-r-2 border-[rgba(0,0,0,0.1)] flex flex-col items-start justify-start">
                        <div className="h-15 w-full border-b-2 border-[rgba(0,0,0,0.1)] flex flex-row items-center lg:justify-center gap-2 px-5">
                            <img src={employeeIcon} alt="" className="h-5 w-auto" />
                            <h2 className="text-md font-medium">Employee details</h2>
                        </div>
                        <div className="hidden lg:flex flex-col items-center justify-start h-full w-full p-5 gap-2">
                            <button
                                onClick={() => setModalPage(1)}
                                className={`flex flex-row items-center justify-start w-full h-10 ${modalPage === 1 ? 'bg-black text-white' : 'bg-transparent text-black hover:bg-gray-200'} transition duration-200 rounded-lg p-5 cursor-pointer`}
                            >
                                Personal Information
                            </button>
                            <button
                                onClick={() => setModalPage(2)}
                                className={`flex flex-row items-center justify-start w-full h-10 ${modalPage === 2 ? 'bg-black text-white' : 'bg-transparent text-black hover:bg-gray-200'} transition duration-200 rounded-lg p-5 cursor-pointer`}
                            >
                                Salary Information
                            </button>
                            <button
                                onClick={() => setModalPage(3)}
                                className={`flex flex-row items-center justify-start w-full h-10 ${modalPage === 3 ? 'bg-black text-white' : 'bg-transparent text-black hover:bg-gray-200'} transition duration-200 rounded-lg p-5 cursor-pointer`}
                            >
                                Attendance Records
                            </button>
                            <button
                                onClick={() => setModalPage(4)}
                                className={`flex flex-row items-center justify-start w-full h-10 ${modalPage === 4 ? 'bg-black text-white' : 'bg-transparent text-black hover:bg-gray-200'} transition duration-200 rounded-lg p-5 cursor-pointer`}
                            >
                                KPI Performance
                            </button>
                        </div>
                    </div>
                    <div className="lg:hidden w-full border-b-2 border-[rgba(0,0,0,0.1)] p-3 flex justify-between items-center">
                        <button
                            onClick={() => setShowMobileNav(!showMobileNav)}
                            className="px-3 py-2 w-full bg-black text-white rounded-lg text-sm"
                        >
                            Menu
                        </button>
                    </div>

                    {/* Mobile Dropdown Navigation */}
                    {showMobileNav && (
                        <div className="lg:hidden w-full flex flex-col items-start gap-2 p-3 border-b-2 border-[rgba(0,0,0,0.1)] bg-gray-100">
                            <button
                                onClick={() => { setModalPage(1); setShowMobileNav(false); }}
                                className={`w-full text-left px-3 py-2 rounded-md ${modalPage === 1 ? 'bg-black text-white' : 'bg-white text-black'}`}
                            >
                                Personal Information
                            </button>
                            <button
                                onClick={() => { setModalPage(2); setShowMobileNav(false); }}
                                className={`w-full text-left px-3 py-2 rounded-md ${modalPage === 2 ? 'bg-black text-white' : 'bg-white text-black'}`}
                            >
                                Salary Information
                            </button>
                            <button
                                onClick={() => { setModalPage(3); setShowMobileNav(false); }}
                                className={`w-full text-left px-3 py-2 rounded-md ${modalPage === 3 ? 'bg-black text-white' : 'bg-white text-black'}`}
                            >
                                Attendance Records
                            </button>
                            <button
                                onClick={() => { setModalPage(4); setShowMobileNav(false); }}
                                className={`w-full text-left px-3 py-2 rounded-md ${modalPage === 4 ? 'bg-black text-white' : 'bg-white text-black'}`}
                            >
                                KPI Performance
                            </button>
                        </div>
                    )}
                    { modalPage === 1 ?
                        <PersonalInformation employee = { employee } />
                        : modalPage === 2 ? <SalaryInformation employee = { employee } />
                        : modalPage === 3 ? <AttendanceRecords employee = { employee } />
                        : modalPage === 4 ? <KPIPerformance employee = { employee } />
                        : null
                    }
                </div>
            </div>
        </>
    )
}

import { useState, useEffect } from "react"

import Header from "../Header"
import EDItem from "./Employees-Component/ED-Item"
import AddEmployee from "./Employees-Component/Add-Employee"
import { API_URL } from "../../../config"

const plusIcon = "/images/plus.png"
const employeeIcon = "/images/employee.png"

export default function EmployeesPage({ pageLayout, currentUser }) {
    const [addEmployeeModal, setAddEmployeeModal] = useState(false)

    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 5

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                setLoading(true)
                const response = await fetch(`${API_URL}/api/get-employees`)
                if (!response.ok) throw new Error('Failed to fetch employees')
                const data = await response.json()
                setEmployees(data.employees.rows || data.employees)
            } catch (err) {
                console.error("Error fetching employees: ", err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchEmployees()
    }, [])

    const totalPages = Math.ceil(employees.length / itemsPerPage)
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    const currentEmployees = employees.slice(indexOfFirstItem, indexOfLastItem)

    const goToPage = (pageNumber) => {
        setCurrentPage(pageNumber)
    }

    const goToPrevious = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1)
    }

    const goToNext = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1)
    }

    return(
        <>
            {addEmployeeModal ? <AddEmployee setAddEmployeeModal={() => setAddEmployeeModal()} /> : null}
            <div className={`${pageLayout ? 'col-span-5' : 'col-span-17 xl:col-start-2'} col-start-2 flex flex-col w-full min-h-full`}>
                <Header pageLayout={pageLayout} pageTitle="Employees" pageDescription="Manage team members and profiles" currentUser={currentUser} />
                <div className="flex flex-col items-center justify-start h-9/10 w-full p-5 gap-5 overflow-y-scroll">
                    <div className="flex flex-row items-center justify-between w-full h-auto">
                        <div className="flex flex-col items-start justify-start w-full h-auto">
                            <h2 className="text-md font-medium">Employee Management</h2>
                            <p className="font-sans text-sm text-[rgba(0,0,0,0.6)]">Manage your team members and their information</p>
                        </div>
                        <button
                            onClick={() => setAddEmployeeModal(true)}
                            className="flex flex-row items-center justify-center bg-white w-50 h-10 rounded-lg shadow-[rgba(0,0,0,0.2)] shadow-md gap-3 text-sm font-medium cursor-pointer hover:invert-100 transition duration-200"
                        >
                            <img src={plusIcon} alt="plus icon" className="h-3" />
                            Add Employee
                        </button>
                    </div>
                    <div className="relative flex flex-col w-full h-100 bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5 gap-0">
                        <div className="flex flex-row items-center justify-start w-full h-auto gap-2">
                            <img src={employeeIcon} alt="employee icon" className="h-5 w-auto" />
                            <h2>Employee Directory</h2>
                        </div>
                        <div className="w-full overflow-x-auto">
                            <div className="flex flex-col min-w-[1000px]">
                                <div className="grid grid-cols-9 gap-4 w-full items-center justify-center h-10 px-2">
                                    <p className="col-span-2 font-medium text-sm">Name</p>
                                    <p className="col-span-1 font-medium text-sm">ID</p>
                                    <p className="col-span-2 font-medium text-sm">Position</p>
                                    <p className="col-span-1 font-medium text-sm">Hourly Rate</p>
                                    <p className="col-span-1 font-medium text-sm">Status</p>
                                    <p className="col-span-2 font-medium text-sm">Action</p>
                                </div>
                                {loading ? (
                                    <p className="text-sm text-gray-500 mt-5">Loading employees...</p>
                                ) : error ? (
                                    <p className="text-sm text-red-500 mt-5">Error: {error}</p>
                                ) : (
                                    currentEmployees.map((employee) => (
                                        <EDItem key={employee.user_id} employee={employee} />
                                    ))
                                )}
                            </div>
                        </div>
                        {!loading && !error && employees.length > 0 && (
                            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col xl:flex-row items-center justify-between w-[calc(100%-50px)] h-auto pt-3 border-t border-[rgba(0,0,0,0.1)] mt-5">
                                <p className="text-sm text-[rgba(0,0,0,0.6)]">
                                    Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, employees.length)} of {employees.length} employees
                                </p>
                                <div className="flex flex-row items-center gap-2">
                                    <button 
                                        onClick={goToPrevious}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 rounded border border-[rgba(0,0,0,0.2)] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition cursor-pointer"
                                    >
                                        Previous
                                    </button>
                                    {[...Array(totalPages)].map((_, index) => (
                                        <button
                                            key={index + 1}
                                            onClick={() => goToPage(index + 1)}
                                            className={`px-3 py-1 rounded border text-sm font-medium transition cursor-pointer ${
                                                currentPage === index + 1
                                                    ? 'bg-black text-white border-black'
                                                    : 'border-[rgba(0,0,0,0.2)] hover:bg-gray-100'
                                            }`}
                                        >
                                            {index + 1}
                                        </button>
                                    ))}
                                    <button 
                                        onClick={goToNext}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 rounded border border-[rgba(0,0,0,0.2)] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition cursor-pointer"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}
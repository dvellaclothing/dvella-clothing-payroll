import { useState, useEffect } from "react"
import { API_URL } from "../../../config"
import Header from "../../Main/Header"
import Swal from "sweetalert2"

const attendanceIcon = "/images/performance.png"
const calendarIcon = "/images/dashboard.png"
const clockIcon = "/images/kpi.png"

export default function EmployeeAttendance({ pageLayout, currentUser }) {
    const [attendanceData, setAttendanceData] = useState(null)
    const [attendanceRecords, setAttendanceRecords] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    
    // Real-time attendance state
    const [todayAttendance, setTodayAttendance] = useState(null)
    const [isCheckedIn, setIsCheckedIn] = useState(false)
    const [checkInTime, setCheckInTime] = useState(null)
    const [currentTime, setCurrentTime] = useState(new Date())
    const [processing, setProcessing] = useState(false)

    // Update current time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        fetchAttendance()
        fetchAttendanceRecords()
        checkTodayAttendance()
    }, [selectedMonth, selectedYear])

    const checkTodayAttendance = async () => {
        try {
            const today = new Date().toISOString().split('T')[0]
            const response = await fetch(`${API_URL}/api/attendance/today/${currentUser?.user_id}?date=${today}`)
            const data = await response.json()
            
            if (data.attendance) {
                setTodayAttendance(data.attendance)
                setIsCheckedIn(data.attendance.status === 'checked_in')
                setCheckInTime(data.attendance.check_in_time)
            }
        } catch (error) {
            console.error('Error checking today attendance:', error)
        }
    }

    const fetchAttendance = async () => {
        try {
            const response = await fetch(`${API_URL}/api/attendance/summary/${currentUser?.user_id || 1}`)
            const data = await response.json()
            setAttendanceData(data)
        } catch (error) {
            console.error('Error fetching attendance:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchAttendanceRecords = async () => {
        try {
            const response = await fetch(`${API_URL}/api/attendance/records/${currentUser?.user_id || 1}?month=${selectedMonth}&year=${selectedYear}`)
            const data = await response.json()
            if (Array.isArray(data.records)) {
                setAttendanceRecords(data.records)
            }
        } catch (error) {
            console.error('Error fetching attendance records:', error)
        }
    }

    const handleCheckIn = async () => {
        setProcessing(true)
        try {
            const now = new Date()
            const timeString = now.toTimeString().split(' ')[0] // HH:MM:SS
            
            const response = await fetch(`${API_URL}/api/attendance/check-in`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: currentUser?.user_id || 1,
                    date: now.toISOString().split('T')[0],
                    check_in_time: timeString
                })
            })
            
            const data = await response.json()
            
            if (response.ok) {
                setTodayAttendance(data.attendance)
                setIsCheckedIn(true)
                setCheckInTime(timeString)
                Swal.fire({
                    toast: true,
                    position: "top-end",
                    icon: "success",
                    title: "Checked in successfully",
                    showConfirmButton: false,
                    timer: 2000
                })
                await fetchAttendance()
                await fetchAttendanceRecords()
            } else {
                Swal.fire({
                    toast: true,
                    position: "top-end",
                    icon: "error",
                    title: data.message || 'Failed to check in',
                    showConfirmButton: false,
                    timer: 2000
                })
            }
        } catch (error) {
            console.error('Error checking in:', error)
            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "error",
                title: "Error checking in. Please try again",
                showConfirmButton: false,
                timer: 2000
            })
        } finally {
            setProcessing(false)
        }
    }

    const handleCheckOut = async () => {
        setProcessing(true)
        try {
            const now = new Date()
            const timeString = now.toTimeString().split(' ')[0]
            
            const response = await fetch(`${API_URL}/api/attendance/check-out`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    attendance_id: todayAttendance.attendance_id,
                    check_out_time: timeString
                })
            })
            
            const data = await response.json()
            
            if (response.ok) {
                setTodayAttendance(data.attendance)
                setIsCheckedIn(false)
                setCheckInTime(null)
                Swal.fire({
                    toast: true,
                    position: "top-end",
                    icon: "success",
                    title: "Checked out successfully",
                    showConfirmButton: false,
                    timer: 2000
                })
                await fetchAttendance()
                await fetchAttendanceRecords()
            } else {
                Swal.fire({
                    toast: true,
                    position: "top-end",
                    icon: "error",
                    title: data.message || 'Failed to check out',
                    showConfirmButton: false,
                    timer: 2000
                })
            }
        } catch (error) {
            console.error('Error checking out:', error)
            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "error",
                title: "Error checking out. Please try again",
                showConfirmButton: false,
                timer: 2000
            })
        } finally {
            setProcessing(false)
        }
    }

    const calculateWorkingHours = () => {
        if (!isCheckedIn || !checkInTime) return '0:00:00'
        
        const checkIn = new Date(`2000-01-01T${checkInTime}`)
        const now = currentTime
        const diff = now - checkIn
        
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            checked_in: 'bg-blue-100 text-blue-800'
        }
        return badges[status] || 'bg-gray-100 text-gray-800'
    }

    const formatTime = (timeString) => {
        if (!timeString) return '-'
        return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className={`${pageLayout ? 'col-span-5' : 'col-span-17 xl:col-start-2'} col-start-2 flex flex-col w-full min-h-full`}>
            <Header pageLayout={pageLayout} pageTitle="Attendance Management" pageDescription="Review and manage employee attendance requests" currentUser={currentUser} />
            
            <div className="flex flex-col items-center justify-start w-full p-5 gap-5 overflow-y-auto">
                {/* Check In/Out Card */}
                <div className="w-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-2xl p-8 text-white">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-blue-500 p-3 rounded-full">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">
                                        {currentTime.toLocaleTimeString('en-US', { 
                                            hour: '2-digit', 
                                            minute: '2-digit',
                                            second: '2-digit'
                                        })}
                                    </h2>
                                    <p className="text-blue-200 text-sm">
                                        {currentTime.toLocaleDateString('en-US', { 
                                            weekday: 'long',
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        })}
                                    </p>
                                </div>
                            </div>
                            
                            {isCheckedIn && (
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-blue-200 text-sm">Working Hours</span>
                                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                            Active
                                        </span>
                                    </div>
                                    <p className="text-3xl font-bold font-mono">{calculateWorkingHours()}</p>
                                    <p className="text-sm text-blue-200 mt-2">
                                        Checked in at {formatTime(checkInTime)}
                                    </p>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex flex-col gap-3">
                            {!isCheckedIn ? (
                                <button
                                    onClick={handleCheckIn}
                                    disabled={processing}
                                    className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {processing ? 'Processing...' : 'Check In'}
                                </button>
                            ) : (
                                <button
                                    onClick={handleCheckOut}
                                    disabled={processing}
                                    className="px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    {processing ? 'Processing...' : 'Check Out'}
                                </button>
                            )}
                            
                            {isCheckedIn && (
                                <p className="text-center text-xs text-blue-200">
                                    Don't forget to check out when you're done!
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5 w-full">
                    <div className="flex flex-col items-start justify-between h-32 w-full bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-sm text-gray-600">This Month</p>
                        {loading ? (
                            <p className="text-sm">Loading...</p>
                        ) : (
                            <>
                                <p className="text-3xl font-bold text-gray-900">{attendanceData?.currentMonth?.approved_days || 0}</p>
                                <p className="text-sm text-gray-600">days approved</p>
                            </>
                        )}
                    </div>

                    <div className="flex flex-col items-start justify-between h-32 w-full bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-sm text-gray-600">Total Hours</p>
                        {loading ? (
                            <p className="text-sm">Loading...</p>
                        ) : (
                            <>
                                <p className="text-3xl font-bold text-gray-900">{parseFloat(attendanceData?.currentMonth?.total_hours || 0).toFixed(1)}</p>
                                <p className="text-sm text-gray-600">hours worked</p>
                            </>
                        )}
                    </div>

                    <div className="flex flex-col items-start justify-between h-32 w-full bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-sm text-gray-600">Pending Requests</p>
                        {loading ? (
                            <p className="text-sm">Loading...</p>
                        ) : (
                            <>
                                <p className="text-3xl font-bold text-gray-900">{attendanceData?.pending_count || 0}</p>
                                <p className="text-sm text-yellow-600">awaiting approval</p>
                            </>
                        )}
                    </div>

                    <div className="flex flex-col items-start justify-between h-32 w-full bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-sm text-gray-600">Last Month</p>
                        {loading ? (
                            <p className="text-sm">Loading...</p>
                        ) : (
                            <>
                                <p className="text-3xl font-bold text-gray-900">{attendanceData?.lastMonth?.approved_days || 0}</p>
                                <p className="text-sm text-gray-600">days approved</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Attendance Records */}
                <div className="flex flex-col w-full bg-white rounded-2xl border border-gray-200 p-5 gap-4 shadow-sm">
                    <div className="flex flex-row items-center justify-between">
                        <div className="flex flex-row items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-semibold">Attendance Records</h2>
                        </div>
                        <div className="flex flex-row gap-2">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white cursor-pointer"
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white cursor-pointer"
                            >
                                {Array.from({ length: 5 }, (_, i) => (
                                    <option key={i} value={new Date().getFullYear() - i}>
                                        {new Date().getFullYear() - i}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <div className="min-w-[800px]">
                            <div className="grid grid-cols-6 gap-4 w-full items-center h-10 px-2 bg-gray-50 rounded-lg">
                                <p className="col-span-1 font-medium text-sm">Date</p>
                                <p className="col-span-1 font-medium text-sm">Check In</p>
                                <p className="col-span-1 font-medium text-sm">Check Out</p>
                                <p className="col-span-1 font-medium text-sm">Hours</p>
                                <p className="col-span-2 font-medium text-sm">Notes</p>
                            </div>
                            
                            <div className="flex flex-col gap-1 mt-2">
                                {attendanceRecords.length > 0 ? (
                                    attendanceRecords.map((record, index) => (
                                        <div key={index} className="grid grid-cols-6 gap-4 w-full items-center min-h-12 px-2 border-b border-gray-100 hover:bg-gray-50 rounded-lg transition-colors">
                                            <p className="col-span-1 text-sm">
                                                {new Date(record.date).toLocaleDateString('en-US', { 
                                                    month: 'short', 
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                            <p className="col-span-1 text-sm">{formatTime(record.check_in_time)}</p>
                                            <p className="col-span-1 text-sm">{formatTime(record.check_out_time)}</p>
                                            <p className="col-span-1 text-sm font-medium">
                                                {record.total_hours ? parseFloat(record.total_hours).toFixed(1) + ' hrs' : '-'}
                                            </p>
                                            <p className="col-span-2 text-sm text-gray-600 truncate">
                                                {record.notes || '-'}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-400">
                                        No attendance records found for this period
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
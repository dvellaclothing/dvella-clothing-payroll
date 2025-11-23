import { useState, useEffect } from "react"
import { API_URL } from "../../../config"
import Header from "../../Main/Header"

const attendanceIcon = "/images/performance.png"
const calendarIcon = "/images/dashboard.png"
const clockIcon = "/images/kpi.png"
const addIcon = "/images/add-employee.png"

export default function EmployeeAttendance({ pageLayout, currentUser }) {
    const [attendanceData, setAttendanceData] = useState(null)
    const [attendanceRecords, setAttendanceRecords] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [showRequestModal, setShowRequestModal] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    
    // Request form state
    const [requestDate, setRequestDate] = useState(new Date().toISOString().split('T')[0])
    const [checkInTime, setCheckInTime] = useState('')
    const [checkOutTime, setCheckOutTime] = useState('')
    const [notes, setNotes] = useState('')
    const [responseMessage, setResponseMessage] = useState('')
    const [responseStatus, setResponseStatus] = useState(null)

    useEffect(() => {
        fetchAttendance()
        fetchAttendanceRecords()
    }, [selectedMonth, selectedYear])

    const fetchAttendance = async () => {
        try {
            const response = await fetch(`${API_URL}/api/attendance/summary/${currentUser.user_id}`)
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
            const response = await fetch(`${API_URL}/api/attendance/records/${currentUser.user_id}?month=${selectedMonth}&year=${selectedYear}`)
            const data = await response.json()
            if (Array.isArray(data.records)) {
                setAttendanceRecords(data.records)
            }
        } catch (error) {
            console.error('Error fetching attendance records:', error)
        }
    }

    const handleSubmitRequest = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        setResponseMessage('')
        
        try {
            // Validate times
            if (!checkInTime || !checkOutTime) {
                setResponseMessage('Please provide both check-in and check-out times')
                setResponseStatus(false)
                return
            }
            
            // Calculate total hours
            const checkIn = new Date(`2000-01-01T${checkInTime}`)
            const checkOut = new Date(`2000-01-01T${checkOutTime}`)
            const totalHours = (checkOut - checkIn) / (1000 * 60 * 60)
            
            if (totalHours <= 0) {
                setResponseMessage('Check-out time must be after check-in time')
                setResponseStatus(false)
                return
            }
            
            const response = await fetch(`${API_URL}/api/attendance/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: currentUser.user_id,
                    date: requestDate,
                    check_in_time: checkInTime,
                    check_out_time: checkOutTime,
                    total_hours: totalHours.toFixed(2),
                    notes: notes
                })
            })
            
            const data = await response.json()
            
            if (response.ok) {
                setResponseMessage('Attendance request submitted successfully!')
                setResponseStatus(true)
                
                // Reset form
                setCheckInTime('')
                setCheckOutTime('')
                setNotes('')
                
                // Refresh data
                await fetchAttendance()
                await fetchAttendanceRecords()
                
                // Close modal after delay
                setTimeout(() => {
                    setShowRequestModal(false)
                    setResponseMessage('')
                }, 2000)
            } else {
                setResponseMessage(data.message || 'Failed to submit request')
                setResponseStatus(false)
            }
        } catch (error) {
            console.error('Error submitting request:', error)
            setResponseMessage('Error submitting request. Please try again.')
            setResponseStatus(false)
        } finally {
            setSubmitting(false)
        }
    }

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800'
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
        <>
            <div className={`${pageLayout ? 'col-span-5' : 'col-span-17 xl:col-start-2'} col-start-2 flex flex-col w-full min-h-full`}>
                <Header pageLayout={pageLayout} pageTitle="My Attendance" pageDescription="Track and submit your attendance records" currentUser={currentUser} />
                
                <div className="flex flex-col items-center justify-start h-9/10 w-full p-5 gap-5 overflow-y-scroll">
                    {/* Action Button */}
                    <div className="flex flex-row items-center justify-between w-full">
                        <div className="flex flex-col">
                            <h2 className="text-md font-medium">Attendance Overview</h2>
                            <p className="text-sm text-[rgba(0,0,0,0.6)]">Monitor your attendance and submit new requests</p>
                        </div>
                        <button
                            onClick={() => setShowRequestModal(true)}
                            className="flex flex-row items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition duration-200"
                        >
                            <span className="text-xl">+</span>
                            Submit Attendance
                        </button>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 w-full">
                        <div className="flex flex-col items-start justify-between h-32 w-full bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5">
                            <p className="text-sm text-[rgba(0,0,0,0.6)]">This Month</p>
                            {loading ? (
                                <p className="text-sm">Loading...</p>
                            ) : (
                                <>
                                    <p className="text-3xl font-bold">{attendanceData?.currentMonth?.approved_days || 0}</p>
                                    <p className="text-sm text-[rgba(0,0,0,0.6)]">
                                        days approved
                                    </p>
                                </>
                            )}
                        </div>

                        <div className="flex flex-col items-start justify-between h-32 w-full bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5">
                            <p className="text-sm text-[rgba(0,0,0,0.6)]">Total Hours</p>
                            {loading ? (
                                <p className="text-sm">Loading...</p>
                            ) : (
                                <>
                                    <p className="text-3xl font-bold">{parseFloat(attendanceData?.currentMonth?.total_hours || 0).toFixed(1)}</p>
                                    <p className="text-sm text-[rgba(0,0,0,0.6)]">
                                        hours worked
                                    </p>
                                </>
                            )}
                        </div>

                        <div className="flex flex-col items-start justify-between h-32 w-full bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5">
                            <p className="text-sm text-[rgba(0,0,0,0.6)]">Pending Requests</p>
                            {loading ? (
                                <p className="text-sm">Loading...</p>
                            ) : (
                                <>
                                    <p className="text-3xl font-bold">{attendanceData?.pending_count || 0}</p>
                                    <p className="text-sm text-yellow-600">
                                        awaiting approval
                                    </p>
                                </>
                            )}
                        </div>

                        <div className="flex flex-col items-start justify-between h-32 w-full bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5">
                            <p className="text-sm text-[rgba(0,0,0,0.6)]">Last Month</p>
                            {loading ? (
                                <p className="text-sm">Loading...</p>
                            ) : (
                                <>
                                    <p className="text-3xl font-bold">{attendanceData?.lastMonth?.approved_days || 0}</p>
                                    <p className="text-sm text-[rgba(0,0,0,0.6)]">
                                        days approved
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Attendance Records */}
                    <div className="flex flex-col w-full bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5 gap-4">
                        <div className="flex flex-row items-center justify-between">
                            <div className="flex flex-row items-center gap-3">
                                <img src={calendarIcon} className="h-6 w-auto" alt="Calendar" />
                                <h2 className="text-lg font-medium">Attendance Records</h2>
                            </div>
                            <div className="flex flex-row gap-2">
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                    className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:border-black bg-white cursor-pointer"
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
                                    className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:border-black bg-white cursor-pointer"
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
                                <div className="grid grid-cols-7 gap-4 w-full items-center h-10 px-2 bg-gray-50 rounded-lg">
                                    <p className="col-span-1 font-medium text-sm">Date</p>
                                    <p className="col-span-1 font-medium text-sm">Check In</p>
                                    <p className="col-span-1 font-medium text-sm">Check Out</p>
                                    <p className="col-span-1 font-medium text-sm">Hours</p>
                                    <p className="col-span-1 font-medium text-sm">Status</p>
                                    <p className="col-span-2 font-medium text-sm">Notes</p>
                                </div>
                                
                                <div className="flex flex-col gap-1 mt-2">
                                    {attendanceRecords.length > 0 ? (
                                        attendanceRecords.map((record, index) => (
                                            <div key={index} className="grid grid-cols-7 gap-4 w-full items-center min-h-12 px-2 border-b border-[rgba(0,0,0,0.05)] hover:bg-gray-50 rounded-lg">
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
                                                <div className="col-span-1">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(record.status)}`}>
                                                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                                    </span>
                                                </div>
                                                <p className="col-span-2 text-sm text-[rgba(0,0,0,0.6)] truncate">
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

            {/* Submit Attendance Modal */}
            {showRequestModal && (
                <div 
                    className="fixed inset-0 bg-[rgba(0,0,0,0.3)] flex items-center justify-center z-50"
                    onClick={() => setShowRequestModal(false)}
                >
                    <div 
                        className="bg-white rounded-2xl p-6 max-w-md w-full mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <img src={clockIcon} className="h-6 w-auto" alt="Clock" />
                                <h3 className="text-xl font-semibold">Submit Attendance</h3>
                            </div>
                            <button 
                                onClick={() => setShowRequestModal(false)}
                                className="text-3xl hover:text-gray-600 leading-none"
                            >
                                ×
                            </button>
                        </div>
                        
                        {responseMessage && (
                            <div className={`mb-4 p-3 rounded-lg text-sm ${
                                responseStatus 
                                    ? 'bg-green-100 text-green-700 border border-green-200' 
                                    : 'bg-red-100 text-red-700 border border-red-200'
                            }`}>
                                {responseMessage}
                            </div>
                        )}
                        
                        <form onSubmit={handleSubmitRequest} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Date *</label>
                                <input
                                    type="date"
                                    value={requestDate}
                                    onChange={(e) => setRequestDate(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                    required
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:border-black"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Check In *</label>
                                    <input
                                        type="time"
                                        value={checkInTime}
                                        onChange={(e) => setCheckInTime(e.target.value)}
                                        required
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Check Out *</label>
                                    <input
                                        type="time"
                                        value={checkOutTime}
                                        onChange={(e) => setCheckOutTime(e.target.value)}
                                        required
                                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:border-black"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    placeholder="Add any additional notes..."
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:border-black resize-none"
                                />
                            </div>
                            
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-xs text-blue-800">
                                    <strong>Note:</strong> Your attendance request will be reviewed by an administrator. You'll receive a notification once it's approved or rejected.
                                </p>
                            </div>
                            
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowRequestModal(false)}
                                    className="flex-1 px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-5 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
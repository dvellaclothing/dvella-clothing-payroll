import { useState, useEffect } from "react"
import Header from "../Header"
import { API_URL } from "../../../config"

const attendanceIcon = "/images/performance.png"
const checkIcon = "/images/right.png"
const closeIcon = "/images/close.png"
const clockIcon = "/images/kpi.png"

export default function AttendancePage({ pageLayout, currentUser }) {
    const [pendingRequests, setPendingRequests] = useState([])
    const [approvedRequests, setApprovedRequests] = useState([])
    const [rejectedRequests, setRejectedRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('checked_in')
    const [processingId, setProcessingId] = useState(null)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [selectedRequest, setSelectedRequest] = useState(null)

    useEffect(() => {
        fetchAttendanceRequests()
    }, [])

    const fetchAttendanceRequests = async () => {
        try {
            const response = await fetch(`${API_URL}/api/attendance/requests`)
            const data = await response.json()
            
            setPendingRequests(data.pending || [])
            setApprovedRequests(data.approved || [])
            setRejectedRequests(data.rejected || [])
            setLoading(false)
        } catch (error) {
            console.error('Error fetching attendance requests:', error)
            setLoading(false)
        }
    }

    const handleApprove = async (attendanceId, userId) => {
        setProcessingId(attendanceId)
        try {
            const response = await fetch(`${API_URL}/api/attendance/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    attendance_id: attendanceId,
                    user_id: userId,
                    approved_by: currentUser.user_id
                })
            })

            const data = await response.json()
            
            if (response.ok) {
                // Refresh the lists
                await fetchAttendanceRequests()
                alert('Attendance request approved and notification sent!')
            } else {
                alert(data.message || 'Failed to approve request')
            }
        } catch (error) {
            console.error('Error approving request:', error)
            alert('Error approving request')
        } finally {
            setProcessingId(null)
        }
    }

    const handleReject = async (attendanceId, userId) => {
        const reason = prompt('Enter rejection reason (optional):')
        
        setProcessingId(attendanceId)
        try {
            const response = await fetch(`${API_URL}/api/attendance/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    attendance_id: attendanceId,
                    user_id: userId,
                    rejected_by: currentUser.user_id,
                    reason: reason || 'No reason provided'
                })
            })

            const data = await response.json()
            
            if (response.ok) {
                await fetchAttendanceRequests()
                alert('Attendance request rejected and notification sent!')
            } else {
                alert(data.message || 'Failed to reject request')
            }
        } catch (error) {
            console.error('Error rejecting request:', error)
            alert('Error rejecting request')
        } finally {
            setProcessingId(null)
        }
    }

    const viewDetails = (request) => {
        setSelectedRequest(request)
        setShowDetailModal(true)
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const formatTime = (timeString) => {
        if (!timeString) return 'N/A'
        return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const calculateHours = (checkIn, checkOut) => {
        if (!checkIn || !checkOut) return 'N/A'
        const check_in = new Date(`2000-01-01T${checkIn}`)
        const check_out = new Date(`2000-01-01T${checkOut}`)
        const diff = (check_out - check_in) / (1000 * 60 * 60)
        return diff.toFixed(2)
    }

    const renderRequestRow = (request, showActions = false) => (
        <div key={request.attendance_id} className="grid grid-cols-7 gap-4 w-full border-t border-[rgba(0,0,0,0.1)] items-center justify-center min-h-12 px-2 hover:bg-gray-50">
            <p className="col-span-1 font-normal text-sm">
                {request.first_name} {request.last_name}
            </p>
            <p className="col-span-1 font-normal text-sm">
                {formatDate(request.date)}
            </p>
            <p className="col-span-1 font-normal text-sm">
                {formatTime(request.check_in_time)}
            </p>
            <p className="col-span-1 font-normal text-sm">
                {formatTime(request.check_out_time)}
            </p>
            <p className="col-span-1 font-normal text-sm">
                {calculateHours(request.check_in_time, request.check_out_time)} hrs
            </p>
            <div className="col-span-1">
                <span className={`px-2 py-1 rounded-full text-xs ${
                    request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    request.status === 'checked_in' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                }`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </span>
            </div>
            <div className="col-span-1 flex gap-2">
                <button 
                    onClick={() => viewDetails(request)}
                    className="border border-[rgba(0,0,0,0.2)] flex items-center justify-center px-3 h-7 rounded-lg cursor-pointer hover:bg-gray-100 bg-white transition duration-200 text-xs"
                >
                    View
                </button>
                {showActions && (
                    <>
                        <button 
                            onClick={() => handleApprove(request.attendance_id, request.user_id)}
                            disabled={processingId === request.attendance_id}
                            className="bg-green-500 text-white flex items-center justify-center w-7 h-7 rounded-lg cursor-pointer hover:bg-green-600 transition duration-200 disabled:opacity-50"
                        >
                            ✓
                        </button>
                        <button 
                            onClick={() => handleReject(request.attendance_id, request.user_id)}
                            disabled={processingId === request.attendance_id}
                            className="bg-red-500 text-white flex items-center justify-center w-7 h-7 rounded-lg cursor-pointer hover:bg-red-600 transition duration-200 disabled:opacity-50"
                        >
                            ✕
                        </button>
                    </>
                )}
            </div>
        </div>
    )

    if (loading) {
        return (
            <div className={`${pageLayout ? 'col-span-5' : 'col-span-17 xl:col-start-2'} col-start-2 flex items-center justify-center w-full h-full`}>
                <p className="text-lg">Loading attendance requests...</p>
            </div>
        )
    }

    const getCurrentRequests = () => {
        switch(activeTab) {
            case 'checked_in': return approvedRequests
            case 'checked_out': return rejectedRequests
            default: return pendingRequests
        }
    }

    return (
        <>
            <div className={`${pageLayout ? 'col-span-5' : 'col-span-17 xl:col-start-2'} col-start-2 flex flex-col w-full min-h-full`}>
                <Header pageLayout={pageLayout} pageTitle="Attendance Management" pageDescription="Review and manage employee attendance requests" currentUser={currentUser} />
                <div className="flex flex-col items-center justify-start h-9/10 w-full p-5 gap-5 overflow-y-scroll">
                    <div className="flex flex-row items-center justify-between w-full h-auto">
                        <div className="flex flex-col items-start justify-start w-full h-auto">
                            <h2 className="text-md font-medium">Attendance Requests</h2>
                            <p className="font-sans text-sm text-[rgba(0,0,0,0.6)]">Approve or reject employee attendance submissions</p>
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                        <div className="relative flex flex-col items-start justify-between h-30 w-full bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5">
                            <div className="flex flex-col items-start justify-center">
                                <p className="text-2xl font-semibold">{approvedRequests.length}</p>
                                <p className="text-sm font-medium text-[rgba(0,0,0,0.6)]">On Duty</p>
                                <p className="text-sm font-medium text-green-600">Current Shifts</p>
                            </div>
                        </div>
                        <div className="relative flex flex-col items-start justify-between h-30 w-full bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5">
                            <div className="flex flex-col items-start justify-center">
                                <p className="text-2xl font-semibold">{rejectedRequests.length}</p>
                                <p className="text-sm font-medium text-[rgba(0,0,0,0.6)]">Past Duties</p>
                                <p className="text-sm font-medium text-blue-600">Completed Shifts</p>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex flex-row gap-2 w-full border-b border-[rgba(0,0,0,0.2)]">
                        <button
                            onClick={() => setActiveTab('checked_in')}
                            className={`px-4 py-2 font-medium text-sm transition-all ${
                                activeTab === 'approved' 
                                    ? 'border-b-2 border-black text-black' 
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Checked In ({approvedRequests.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('checked_out')}
                            className={`px-4 py-2 font-medium text-sm transition-all ${
                                activeTab === 'rejected' 
                                    ? 'border-b-2 border-black text-black' 
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Checked Out ({rejectedRequests.length})
                        </button>
                    </div>

                    {/* Requests Table */}
                    <div className="w-full h-auto flex flex-col items-start justify-between rounded-2xl border border-[rgba(0,0,0,0.2)] p-5">
                        <div className="flex flex-row items-center justify-start w-full h-15 gap-2 mb-3">
                            <img src={clockIcon} className="h-5" alt="attendance" />
                            <h2 className="font-medium">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Panel</h2>
                        </div>
                        <div className="flex flex-col items-center justify-start w-full gap-3">
                            <div className="w-full overflow-x-auto">
                                <div className="flex flex-col min-w-[800px]">
                                    <div className="grid grid-cols-7 gap-4 w-full items-center justify-center h-10 px-2 bg-gray-50">
                                        <p className="col-span-1 font-medium text-sm">Employee</p>
                                        <p className="col-span-1 font-medium text-sm">Date</p>
                                        <p className="col-span-1 font-medium text-sm">Check In</p>
                                        <p className="col-span-1 font-medium text-sm">Check Out</p>
                                        <p className="col-span-1 font-medium text-sm">Total Hours</p>
                                        <p className="col-span-1 font-medium text-sm">Status</p>
                                        <p className="col-span-1 font-medium text-sm">Actions</p>
                                    </div>
                                    {getCurrentRequests().length > 0 ? (
                                        getCurrentRequests().map((request) => 
                                            renderRequestRow(request, activeTab === 'Checked In')
                                        )
                                    ) : (
                                        <div className="col-span-7 text-center py-8 text-gray-400 text-sm">
                                            No {activeTab} requests
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showDetailModal && selectedRequest && (
                <div 
                    className="fixed inset-0 bg-[rgba(0,0,0,0.3)] flex items-center justify-center z-50"
                    onClick={() => setShowDetailModal(false)}
                >
                    <div 
                        className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-semibold">Attendance Details</h3>
                            <button 
                                onClick={() => setShowDetailModal(false)}
                                className="text-3xl hover:text-gray-600 leading-none"
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Employee</p>
                                    <p className="font-medium">{selectedRequest.first_name} {selectedRequest.last_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Date</p>
                                    <p className="font-medium">{formatDate(selectedRequest.date)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Check In</p>
                                    <p className="font-medium">{formatTime(selectedRequest.check_in_time)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Check Out</p>
                                    <p className="font-medium">{formatTime(selectedRequest.check_out_time)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Hours</p>
                                    <p className="font-medium">{calculateHours(selectedRequest.check_in_time, selectedRequest.check_out_time)} hours</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                                        selectedRequest.status === 'checked_in' ? 'bg-yellow-100 text-yellow-700' :
                                        selectedRequest.status === 'checked_in' ? 'bg-green-100 text-green-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                        {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                                    </span>
                                </div>
                            </div>
                            
                            {selectedRequest.notes && (
                                <div>
                                    <p className="text-sm text-gray-500">Notes</p>
                                    <p className="font-medium">{selectedRequest.notes}</p>
                                </div>
                            )}
                            
                            {selectedRequest.status === 'pending' && (
                                <div className="flex gap-3 pt-4 border-t">
                                    <button
                                        onClick={() => {
                                            handleApprove(selectedRequest.attendance_id, selectedRequest.user_id)
                                            setShowDetailModal(false)
                                        }}
                                        className="flex-1 px-5 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleReject(selectedRequest.attendance_id, selectedRequest.user_id)
                                            setShowDetailModal(false)
                                        }}
                                        className="flex-1 px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
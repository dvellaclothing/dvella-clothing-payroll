import { useState, useEffect } from "react";
import { API_URL } from "../../../config";
import Header from "../../Main/Header";
import Swal from "sweetalert2";

const attendanceIcon = "/images/performance.png";
const calendarIcon = "/images/dashboard.png";
const clockIcon = "/images/kpi.png";

export default function EmployeeAttendance({ pageLayout, currentUser }) {
    const [attendanceData, setAttendanceData] = useState(null);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [todayAttendance, setTodayAttendance] = useState(null);
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [checkInTime, setCheckInTime] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        fetchAttendance();
        fetchAttendanceRecords();
        checkTodayAttendance();
    }, [selectedMonth, selectedYear]);

    const checkTodayAttendance = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await fetch(`${API_URL}/api/attendance/today/${currentUser?.user_id}?date=${today}`);
            const data = await response.json();
            
            if (data.attendance) {
                setTodayAttendance(data.attendance);
                setIsCheckedIn(data.attendance.status === 'checked_in');
                setCheckInTime(data.attendance.check_in_time);
            }
        } catch (error) {
            console.error('Error checking today attendance:', error);
        }
    };

    const fetchAttendance = async () => {
        try {
            const response = await fetch(`${API_URL}/api/attendance/summary/${currentUser?.user_id || 1}`);
            const data = await response.json();
            setAttendanceData(data);
        } catch (error) {
            console.error('Error fetching attendance:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load attendance data',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendanceRecords = async () => {
        try {
            const response = await fetch(
                `${API_URL}/api/attendance/records/${currentUser?.user_id || 1}?month=${selectedMonth}&year=${selectedYear}`
            );
            const data = await response.json();
            if (Array.isArray(data.records)) {
                setAttendanceRecords(data.records);
            }
        } catch (error) {
            console.error('Error fetching attendance records:', error);
        }
    };

    const handleCheckIn = async () => {
        setProcessing(true);
        try {
            const now = new Date();
            const timeString = now.toTimeString().split(' ')[0];
            
            const response = await fetch(`${API_URL}/api/attendance/check-in`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: currentUser?.user_id || 1,
                    date: now.toISOString().split('T')[0],
                    check_in_time: timeString
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setTodayAttendance(data.attendance);
                setIsCheckedIn(true);
                setCheckInTime(timeString);
                Swal.fire({
                    toast: true,
                    position: "top-end",
                    icon: "success",
                    title: "Checked in successfully",
                    showConfirmButton: false,
                    timer: 2000
                });
                await fetchAttendance();
                await fetchAttendanceRecords();
            } else {
                throw new Error(data.message || 'Failed to check in');
            }
        } catch (error) {
            console.error('Error checking in:', error);
            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "error",
                title: error.message || "Error checking in. Please try again",
                showConfirmButton: false,
                timer: 3000
            });
        } finally {
            setProcessing(false);
        }
    };

    const calculateWorkingHours = () => {
        if (!isCheckedIn || !checkInTime) return '0:00:00';
        
        const now = new Date();
        const [hours, minutes, seconds] = checkInTime.split(':').map(Number);
        const checkIn = new Date(now);
        checkIn.setHours(hours, minutes, seconds, 0);
        
        let diff = (now - checkIn) / 1000;
        
        if (diff < 0) {
            diff += 24 * 60 * 60;
        }
        
        const hoursWorked = Math.floor(diff / 3600);
        const minutesWorked = Math.floor((diff % 3600) / 60);
        const secondsWorked = Math.floor(diff % 60);
        
        return `${hoursWorked}:${String(minutesWorked).padStart(2, '0')}:${String(secondsWorked).padStart(2, '0')}`;
    };

    const handleCheckOut = async () => {
        setProcessing(true);
        try {
            const now = new Date();
            const timeString = now.toTimeString().split(' ')[0];
            
            let totalHours;
            if (checkInTime) {
                const checkIn = new Date(`${todayAttendance.date}T${checkInTime}`);
                let checkOut = new Date(now);
                
                if (checkOut < checkIn) {
                    checkOut.setDate(checkOut.getDate() + 1);
                }
                
                totalHours = ((checkOut - checkIn) / (1000 * 60 * 60)).toFixed(2);
            }

            const response = await fetch(`${API_URL}/api/attendance/check-out`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    attendance_id: todayAttendance.attendance_id,
                    check_out_time: timeString,
                    total_hours: totalHours
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setTodayAttendance(data.attendance);
                setIsCheckedIn(false);
                setCheckInTime(null);
                Swal.fire({
                    toast: true,
                    position: "top-end",
                    icon: "success",
                    title: "Checked out successfully",
                    showConfirmButton: false,
                    timer: 2000
                });
                await fetchAttendance();
                await fetchAttendanceRecords();
            } else {
                throw new Error(data.message || 'Failed to check out');
            }
        } catch (error) {
            console.error('Error checking out:', error);
            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "error",
                title: error.message || "Error checking out. Please try again",
                showConfirmButton: false,
                timer: 3000
            });
        } finally {
            setProcessing(false);
        }
    };

    const formatTime = (timeString) => {
        if (!timeString) return '-';
        const [hours, minutes] = timeString.split(':');
        return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className={`${pageLayout ? 'col-span-5' : 'col-span-17 xl:col-start-2'} col-start-2 flex flex-col w-full min-h-full`}>
            <Header 
                pageLayout={pageLayout} 
                pageTitle="Attendance Management" 
                pageDescription="Review and manage your attendance" 
                currentUser={currentUser} 
            />
            
            <div className="flex flex-col items-center justify-start w-full p-5 gap-5 overflow-y-auto">
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

                <div className="grid grid-cols-1 md:grid-cols-4 gap-5 w-full">
                    <div className="flex flex-col items-start justify-between h-32 w-full bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all">
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

                    <div className="flex flex-col items-start justify-between h-32 w-full bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all">
                        <p className="text-sm text-gray-600">Total Hours</p>
                        {loading ? (
                            <p className="text-sm">Loading...</p>
                        ) : (
                            <>
                                <p className="text-3xl font-bold text-gray-900">
                                    {parseFloat(attendanceData?.currentMonth?.total_hours || 0).toFixed(1)}
                                </p>
                                <p className="text-sm text-gray-600">hours worked</p>
                            </>
                        )}
                    </div>

                    <div className="flex flex-col items-start justify-between h-32 w-full bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all">
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

                    <div className="flex flex-col items-start justify-between h-32 w-full bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all">
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

                <div className="w-full bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-800">Attendance History</h3>
                        <div className="flex gap-4 mt-4 md:mt-0">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {Array.from({ length: 5 }, (_, i) => {
                                    const year = new Date().getFullYear() - 2 + i;
                                    return (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                            Loading...
                                        </td>
                                    </tr>
                                ) : attendanceRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                            No attendance records found
                                        </td>
                                    </tr>
                                ) : (
                                    attendanceRecords.map((record) => (
                                        <tr key={record.attendance_id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDate(record.date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {record.check_in_time ? formatTime(record.check_in_time) : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {record.check_out_time ? formatTime(record.check_out_time) : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {record.total_hours ? `${record.total_hours} hrs` : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                                                        record.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                        record.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                        record.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}
                                                >
                                                    {record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1) : '-'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
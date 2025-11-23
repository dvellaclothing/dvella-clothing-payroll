
import { useState, useEffect } from "react"
import { API_URL } from "../../../../config"

export default function AttendanceRecords({ employee }) {
    const [attendance, setAttendance] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                const response = await fetch(`${API_URL}/api/attendance/${employee.user_id}`)
                const data = await response.json()
                setAttendance(data)
            } catch (error) {
                console.error('Error fetching attendance:', error)
            } finally {
                setLoading(false)
            }
        }

        if (employee?.user_id) {
            fetchAttendance()
        }
    }, [employee])

    if (loading) return <div className="col-span-2 py-10 px-5">Loading...</div>

    return (
        <div className="col-span-2 py-10 px-5 flex flex-col items-start justify-start gap-5">
            <h2 className="text-lg font-medium">Attendance Records</h2>
            <div className="flex flex-row items-center justify-between h-auto w-full">
                <p className="text-md font-medium text-[rgba(0,0,0,0.6)]">This Month:</p>
                <p className="text-md font-medium text-black">
                    {attendance?.currentMonth.present_days || 0} / {attendance?.currentMonth.total_days || 0} Days
                </p>
            </div>
            <div className="flex flex-row items-center justify-between h-auto w-full">
                <p className="text-md font-medium text-[rgba(0,0,0,0.6)]">Last Month:</p>
                <p className="text-md font-medium text-black">
                    {attendance?.lastMonth.present_days || 0} / {attendance?.lastMonth.total_days || 0} Days
                </p>
            </div>
            <div className="flex flex-row items-center justify-between h-auto w-full">
                <p className="text-md font-medium text-[rgba(0,0,0,0.6)]">Total Hours This Month:</p>
                <p className="text-md font-medium text-black">
                    {parseFloat(attendance?.currentMonth.total_hours || 0).toFixed(1)} hrs
                </p>
            </div>
        </div>
    )
}
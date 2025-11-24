export default function PendingRequestsCard({ pendingData, loading }) {
    if (loading) {
        return (
            <div className="flex flex-col w-full bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5">
                <p className="text-sm text-gray-500">Loading...</p>
            </div>
        )
    }
    
    const totalPending = (pendingData?.pending_attendance || 0) + (pendingData?.pending_leave || 0)
    
    return (
        <div className="flex flex-col w-full bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5 gap-3">
            <h3 className="text-lg font-medium">Pending Requests</h3>
            
            {totalPending === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 gap-2">
                    <span className="text-4xl">✓</span>
                    <p className="text-sm text-gray-600">All caught up!</p>
                    <p className="text-xs text-gray-500">No pending requests</p>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    <div className="flex flex-row items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex flex-row items-center gap-2">
                            <span className="text-2xl">📅</span>
                            <p className="text-sm font-medium">Attendance Requests</p>
                        </div>
                        <span className="text-lg font-bold text-yellow-700">
                            {pendingData?.pending_attendance || 0}
                        </span>
                    </div>
                    
                    <div className="flex flex-row items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex flex-row items-center gap-2">
                            <span className="text-2xl">🏖️</span>
                            <p className="text-sm font-medium">Leave Requests</p>
                        </div>
                        <span className="text-lg font-bold text-blue-700">
                            {pendingData?.pending_leave || 0}
                        </span>
                    </div>
                    
                    <div className="flex items-center justify-center mt-2">
                        <p className="text-xs text-gray-500">
                            Waiting for manager approval
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
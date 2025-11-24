export default function EmployeeActivityCard({ activities, loading }) {
    const getActivityIcon = (type) => {
        switch(type) {
            case 'attendance': return '📅'
            case 'leave': return '🏖️'
            default: return '📌'
        }
    }
    
    const getStatusColor = (status) => {
        switch(status) {
            case 'approved': return 'bg-green-100 text-green-700'
            case 'pending': return 'bg-yellow-100 text-yellow-700'
            case 'rejected': return 'bg-red-100 text-red-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }
    
    const formatDate = (date) => {
        const d = new Date(date)
        const now = new Date()
        const diffTime = Math.abs(now - d)
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        
        if (diffDays === 0) return 'Today'
        if (diffDays === 1) return 'Yesterday'
        if (diffDays < 7) return `${diffDays} days ago`
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    
    return (
        <div className="flex flex-col w-full bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5 gap-3">
            <h3 className="text-lg font-medium">Recent Activity</h3>
            
            {loading ? (
                <div className="flex items-center justify-center h-40">
                    <p className="text-sm text-gray-500">Loading...</p>
                </div>
            ) : activities && activities.length > 0 ? (
                <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
                    {activities.map((activity, index) => (
                        <div key={index} className="flex flex-row items-center justify-between p-3 border border-[rgba(0,0,0,0.1)] rounded-lg hover:bg-gray-50 transition">
                            <div className="flex flex-row items-center gap-3">
                                <span className="text-2xl">{getActivityIcon(activity.activity_type)}</span>
                                <div className="flex flex-col">
                                    <p className="text-sm font-medium">{activity.description}</p>
                                    {activity.total_hours && (
                                        <p className="text-xs text-gray-600">{activity.total_hours} hours</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(activity.status)}`}>
                                    {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {formatDate(activity.created_at)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex items-center justify-center h-40">
                    <p className="text-sm text-gray-500">No recent activity</p>
                </div>
            )}
        </div>
    )
}
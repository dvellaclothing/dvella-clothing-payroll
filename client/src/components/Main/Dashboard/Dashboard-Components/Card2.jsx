export default function CardTwo({ activities, loading }) {
    const getActivityIcon = (type) => {
        switch(type) {
            case 'attendance': return '📅'
            case 'user': return '👤'
            default: return '📌'
        }
    }
    
    const getStatusColor = (status) => {
        switch(status) {
            case 'approved': return 'text-green-600'
            case 'pending': return 'text-yellow-600'
            case 'rejected': return 'text-red-600'
            default: return 'text-gray-600'
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
        <div className="flex flex-col w-full justify-start items-start min-h-60 bg-white rounded-2xl border border-[rgba(0,0,0,0.3)] px-5 py-4 gap-3">
            <h3 className="text-black text-md font-semibold">Recent Activity</h3>
            
            {loading ? (
                <div className="flex items-center justify-center w-full h-40">
                    <p className="text-sm text-gray-500">Loading...</p>
                </div>
            ) : activities && activities.length > 0 ? (
                <div className="flex flex-col w-full gap-2 overflow-y-auto max-h-80">
                    {activities.map((activity, index) => (
                        <div key={index} className="flex flex-row items-start justify-between p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <div className="flex flex-row items-start gap-3 flex-1">
                                <span className="text-xl">{getActivityIcon(activity.activity_type)}</span>
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm font-medium text-gray-900">{activity.user_name}</p>
                                    <p className="text-xs text-gray-600">{activity.description}</p>
                                    {activity.activity_type === 'attendance' && (
                                        <span className={`text-xs font-medium ${getStatusColor(activity.status)}`}>
                                            {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                {formatDate(activity.created_at)}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex items-center justify-center w-full h-40">
                    <p className="text-sm text-gray-500">No recent activities</p>
                </div>
            )}
        </div>
    )
}
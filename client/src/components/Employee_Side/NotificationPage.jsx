import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { API_URL } from "../../config"
import Header from "../Main/Header"

const notificationIcon = "/images/notification.png"

export default function NotificationsPage({ pageLayout, currentUser }) {
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')
    const navigate = useNavigate()

    useEffect(() => {
        fetchNotifications()
    }, [])

    const fetchNotifications = async () => {
        try {
            const response = await fetch(`${API_URL}/api/notifications/${currentUser.user_id}/all`)
            const data = await response.json()
            
            if (response.ok) {
                setNotifications(data.notifications || [])
            }
        } catch (error) {
            console.error('Error fetching notifications:', error)
        } finally {
            setLoading(false)
        }
    }

    const markAsRead = async (notificationId) => {
        try {
            const response = await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            })

            if (response.ok) {
                setNotifications(notifications.map(n => 
                    n.notification_id === notificationId 
                        ? { ...n, is_read: true } 
                        : n
                ))
            }
        } catch (error) {
            console.error('Error marking notification as read:', error)
        }
    }

    const markAllAsRead = async () => {
        try {
            const response = await fetch(`${API_URL}/api/notifications/${currentUser.user_id}/read-all`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            })

            if (response.ok) {
                setNotifications(notifications.map(n => ({ ...n, is_read: true })))
            }
        } catch (error) {
            console.error('Error marking all as read:', error)
        }
    }

    const deleteNotification = async (notificationId) => {
        try {
            const response = await fetch(`${API_URL}/api/notifications/${notificationId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                setNotifications(notifications.filter(n => n.notification_id !== notificationId))
            }
        } catch (error) {
            console.error('Error deleting notification:', error)
        }
    }

    // Add this function to handle navigation with proper role-based paths
    const handleNotificationNavigation = (notification) => {
        if (notification.link_url) {
            // If link_url doesn't already include /admin or /employee, prepend it
            let targetUrl = notification.link_url
            
            if (!targetUrl.startsWith('/admin') && !targetUrl.startsWith('/employee')) {
                // Prepend the role-based path
                const basePath = currentUser.role === 'admin' ? '/admin' : '/employee'
                targetUrl = basePath + targetUrl
            }
            
            navigate(targetUrl)
        }
    }

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString)
        const now = new Date()
        const seconds = Math.floor((now - date) / 1000)

        if (seconds < 60) return 'Just now'
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
        return date.toLocaleDateString()
    }

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'attendance_approved':
            case 'leave_approved':
                return '✓'
            case 'attendance_rejected':
            case 'leave_rejected':
                return '✕'
            case 'attendance_request':
                return '📋'
            case 'employee_edited':
                return '✏️'
            default:
                return '•'
        }
    }

    const getNotificationColor = (type) => {
        switch (type) {
            case 'attendance_approved':
            case 'leave_approved':
                return 'bg-green-100 text-green-600'
            case 'attendance_rejected':
            case 'leave_rejected':
                return 'bg-red-100 text-red-600'
            case 'attendance_request':
                return 'bg-blue-100 text-blue-600'
            case 'employee_edited':
                return 'bg-orange-100 text-orange-600'
            default:
                return 'bg-gray-100 text-gray-600'
        }
    }

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.is_read
        if (filter === 'read') return n.is_read
        return true
    })

    const unreadCount = notifications.filter(n => !n.is_read).length

    return (
        <div className={`${pageLayout ? 'col-span-5' : 'col-span-17 xl:col-start-2'} col-start-2 flex flex-col w-full min-h-full`}>
            <Header 
                pageLayout={pageLayout} 
                pageTitle="Notifications" 
                pageDescription="View and manage all your notifications" 
                currentUser={currentUser} 
            />
            
            <div className="flex flex-col items-center justify-start h-9/10 w-full p-5 gap-5 overflow-y-scroll">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4">
                    <div className="flex items-center gap-3">
                        <img src={notificationIcon} className="h-6" alt="notifications" />
                        <div>
                            <h2 className="text-lg font-semibold">All Notifications</h2>
                            <p className="text-sm text-gray-500">
                                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                            </p>
                        </div>
                    </div>
                    
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition"
                        >
                            Mark all as read
                        </button>
                    )}
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 w-full border-b border-gray-200">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                            filter === 'all' 
                                ? 'border-black text-black' 
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        All ({notifications.length})
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                            filter === 'unread' 
                                ? 'border-black text-black' 
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Unread ({unreadCount})
                    </button>
                    <button
                        onClick={() => setFilter('read')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                            filter === 'read' 
                                ? 'border-black text-black' 
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Read ({notifications.length - unreadCount})
                    </button>
                </div>

                {/* Notifications List */}
                <div className="w-full bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <p className="text-gray-400">Loading notifications...</p>
                        </div>
                    ) : filteredNotifications.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {filteredNotifications.map((notification) => (
                                <div
                                    key={notification.notification_id}
                                    className={`flex gap-4 p-4 hover:bg-gray-50 transition ${
                                        !notification.is_read ? 'bg-blue-50' : ''
                                    }`}
                                >
                                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-base font-bold ${getNotificationColor(notification.type)}`}>
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {notification.title}
                                                </p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-2">
                                                    {formatTimeAgo(notification.created_at)}
                                                </p>
                                            </div>
                                            {!notification.is_read && (
                                                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                                            )}
                                        </div>
                                        
                                        {/* Actions */}
                                        <div className="flex gap-3 mt-3">
                                            {!notification.is_read && (
                                                <button
                                                    onClick={() => markAsRead(notification.notification_id)}
                                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                                >
                                                    Mark as read
                                                </button>
                                            )}
                                            {notification.link_url && (
                                                <button
                                                    onClick={() => handleNotificationNavigation(notification)}
                                                    className="text-xs text-gray-600 hover:text-gray-800 font-medium"
                                                >
                                                    View details →
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteNotification(notification.notification_id)}
                                                className="text-xs text-red-600 hover:text-red-800 font-medium"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20">
                            <p className="text-gray-400 text-lg">No notifications</p>
                            <p className="text-gray-300 text-sm mt-1">
                                {filter === 'unread' && 'All caught up!'}
                                {filter === 'read' && 'No read notifications'}
                                {filter === 'all' && "You're all caught up!"}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
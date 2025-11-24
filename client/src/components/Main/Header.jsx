import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"  // Add this import
import { API_URL } from "../../config"

const notificationIcon = "/images/notification.png"

export default function Header({ pageLayout, pageTitle, pageDescription, currentUser }) {
    const navigate = useNavigate()  // Add this
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [showNotifications, setShowNotifications] = useState(false)
    const [loading, setLoading] = useState(false)
    const dropdownRef = useRef(null)

    const firstLetter = currentUser?.first_name?.[0]?.toUpperCase() || 'U'
    const secondLetter = currentUser?.last_name?.[0]?.toUpperCase() || 'S'
    const initials = firstLetter + secondLetter
    const profilePictureUrl = currentUser?.profile_picture_url ? `${API_URL}${currentUser.profile_picture_url}` : null

    useEffect(() => {
        if (currentUser?.user_id) {
            fetchNotifications()
            const interval = setInterval(() => {
                fetchNotifications()
            }, 30000)
            return () => clearInterval(interval)
        }
    }, [currentUser?.user_id])

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowNotifications(false)
            }
        }

        if (showNotifications) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showNotifications])

    const fetchNotifications = async () => {
        try {
            const response = await fetch(`${API_URL}/api/notifications/${currentUser.user_id}`)
            const data = await response.json()
            
            if (response.ok) {
                setNotifications(data.notifications || [])
                setUnreadCount(data.unread_count || 0)
            }
        } catch (error) {
            console.error('Error fetching notifications:', error)
        }
    }

    const handleNotificationClick = () => {
        setShowNotifications(!showNotifications)
        if (!showNotifications) {
            setLoading(true)
            fetchNotifications().finally(() => setLoading(false))
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
                setUnreadCount(Math.max(0, unreadCount - 1))
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
                setUnreadCount(0)
            }
        } catch (error) {
            console.error('Error marking all as read:', error)
        }
    }

    // Add this function to handle notification click with navigation
    const handleNotificationItemClick = (notification) => {
        // Mark as read if unread
        if (!notification.is_read) {
            markAsRead(notification.notification_id)
        }
        
        // Navigate to link_url if it exists
        if (notification.link_url) {
            setShowNotifications(false)
            navigate(`/employee${notification.link_url}`)
        }
    }

    // Add this function to navigate to notifications page
    const goToNotificationsPage = () => {
        setShowNotifications(false)
        const notificationsPath = currentUser?.role === 'admin' 
            ? '/admin/notifications' 
            : '/employee/notifications'
        navigate(notificationsPath)
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

    return (
        <div className="flex flex-row items-center justify-between h-20 w-full border-b border-gray-200 px-5">
            <div className="flex flex-col items-start justify-center">
                <h2 className="font-medium text-lg">{pageTitle}</h2>
                <p className="text-sm text-gray-500">{pageDescription}</p>
            </div>
            <div className="flex flex-row items-center justify-end h-full w-auto gap-2">
                {/* Notification Button */}
                <div className="relative" ref={dropdownRef}>
                    <button 
                        onClick={handleNotificationClick}
                        className="relative flex flex-row h-10 w-auto items-center justify-start gap-1 cursor-pointer hover:bg-gray-100 transition duration-200 px-2 rounded-lg"
                    >
                        <img src={notificationIcon} alt="notification icon" className="h-5 w-auto" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-96 max-h-[500px] bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
                                <h3 className="font-semibold text-sm">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </div>

                            <div className="overflow-y-auto max-h-[400px]">
                                {loading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <p className="text-sm text-gray-400">Loading...</p>
                                    </div>
                                ) : notifications.length > 0 ? (
                                    notifications.map((notification) => (
                                        <div
                                            key={notification.notification_id}
                                            onClick={() => handleNotificationItemClick(notification)}
                                            className={`flex gap-3 px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition ${
                                                !notification.is_read ? 'bg-blue-50' : ''
                                            }`}
                                        >
                                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getNotificationColor(notification.type)}`}>
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {notification.title}
                                                </p>
                                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {formatTimeAgo(notification.created_at)}
                                                </p>
                                            </div>
                                            {!notification.is_read && (
                                                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 px-4">
                                        <p className="text-sm text-gray-400">No notifications</p>
                                        <p className="text-xs text-gray-300 mt-1">You're all caught up!</p>
                                    </div>
                                )}
                            </div>

                            {notifications.length > 0 && (
                                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                                    <button
                                        onClick={goToNotificationsPage}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium w-full text-center"
                                    >
                                        View all notifications
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Profile Button */}
                <button className={`${pageLayout ? 'hidden xl:flex' : 'hidden'} flex-row h-10 w-auto items-center justify-start gap-3 cursor-pointer hover:bg-gray-100 transition duration-200 px-2 rounded-lg`}>
                    <div className="flex flex-col items-center justify-center w-6 h-6 rounded-full bg-gradient-to-tl from-blue-500 to-purple-500">
                        {profilePictureUrl ? (
                            <img src={profilePictureUrl} className="h-6 w-6 rounded-full object-cover" alt="profile" />
                        ) : (
                            <p className="font-medium text-xs text-white">{initials}</p>
                        )}
                    </div>
                    <h2 className="font-normal text-sm truncate">{currentUser?.first_name} {currentUser?.last_name}</h2>
                </button>
            </div>
        </div>
    )
}
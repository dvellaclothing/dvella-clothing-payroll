
import { useState } from "react"
import { API_URL } from "../../../config"
import Header from "../../Main/Header"

const settingsIcon = "/images/settings.png"
const lockIcon = "/images/help.png"

export default function EmployeeSettings({ pageLayout, currentUser }) {
    const [activeTab, setActiveTab] = useState('password')
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [notificationSettings, setNotificationSettings] = useState({
        emailNotifications: true,
        payslipAlerts: true,
        attendanceReminders: true,
        kpiUpdates: false
    })
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState(null)

    const handlePasswordChange = async (e) => {
        e.preventDefault()
        setMessage(null)

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' })
            return
        }

        if (passwordData.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters long' })
            return
        }

        setSaving(true)
        try {
            const response = await fetch(`${API_URL}/api/employee/change-password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUser.user_id,
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            })

            const data = await response.json()

            if (response.ok) {
                setMessage({ type: 'success', text: 'Password changed successfully' })
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to change password' })
            }
        } catch (error) {
            console.error('Error changing password:', error)
            setMessage({ type: 'error', text: 'An error occurred' })
        } finally {
            setSaving(false)
        }
    }

    const handleNotificationUpdate = async () => {
        setSaving(true)
        setMessage(null)
        try {
            const response = await fetch(`${API_URL}/api/employee/update-notifications`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUser.user_id,
                    settings: notificationSettings
                })
            })

            const data = await response.json()

            if (response.ok) {
                setMessage({ type: 'success', text: 'Notification settings updated' })
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to update settings' })
            }
        } catch (error) {
            console.error('Error updating notifications:', error)
            setMessage({ type: 'error', text: 'An error occurred' })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className={`${pageLayout ? 'col-span-5' : 'col-span-17 xl:col-start-2'} col-start-2 flex flex-col w-full min-h-full`}>
            <Header pageLayout={pageLayout} pageTitle="Settings" pageDescription="Manage your account settings" currentUser={currentUser} />
            
            <div className="flex flex-col items-center justify-start h-9/10 w-full p-5 gap-5 overflow-y-scroll">
                {message && (
                    <div className={`w-full p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700 border border-green-400' : 'bg-red-100 text-red-700 border border-red-400'}`}>
                        {message.text}
                    </div>
                )}

                <div className="flex flex-col w-full bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] overflow-hidden">
                    {/* Tabs */}
                    <div className="flex flex-row border-b border-[rgba(0,0,0,0.1)]">
                        <button
                            onClick={() => setActiveTab('password')}
                            className={`flex-1 py-4 px-6 font-medium transition ${activeTab === 'password' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-50'}`}
                        >
                            Change Password
                        </button>
                        <button
                            onClick={() => setActiveTab('notifications')}
                            className={`flex-1 py-4 px-6 font-medium transition ${activeTab === 'notifications' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-50'}`}
                        >
                            Notifications
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {activeTab === 'password' && (
                            <form onSubmit={handlePasswordChange} className="flex flex-col gap-4 max-w-md">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium">Current Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        className="border border-[rgba(0,0,0,0.2)] rounded-lg px-3 py-2 focus:outline-none focus:border-black"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium">New Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        className="border border-[rgba(0,0,0,0.2)] rounded-lg px-3 py-2 focus:outline-none focus:border-black"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        className="border border-[rgba(0,0,0,0.2)] rounded-lg px-3 py-2 focus:outline-none focus:border-black"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                                >
                                    {saving ? 'Saving...' : 'Change Password'}
                                </button>
                            </form>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="flex flex-col gap-4 max-w-md">
                                <div className="flex flex-row items-center justify-between py-3 border-b border-[rgba(0,0,0,0.1)]">
                                    <div>
                                        <p className="font-medium">Email Notifications</p>
                                        <p className="text-xs text-[rgba(0,0,0,0.6)]">Receive email updates</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={notificationSettings.emailNotifications}
                                            onChange={(e) => setNotificationSettings({ ...notificationSettings, emailNotifications: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                                    </label>
                                </div>

                                <div className="flex flex-row items-center justify-between py-3 border-b border-[rgba(0,0,0,0.1)]">
                                    <div>
                                        <p className="font-medium">Payslip Alerts</p>
                                        <p className="text-xs text-[rgba(0,0,0,0.6)]">Get notified when payslips are ready</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={notificationSettings.payslipAlerts}
                                            onChange={(e) => setNotificationSettings({ ...notificationSettings, payslipAlerts: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                                    </label>
                                </div>

                                <div className="flex flex-row items-center justify-between py-3 border-b border-[rgba(0,0,0,0.1)]">
                                    <div>
                                        <p className="font-medium">Attendance Reminders</p>
                                        <p className="text-xs text-[rgba(0,0,0,0.6)]">Reminders to clock in/out</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={notificationSettings.attendanceReminders}
                                            onChange={(e) => setNotificationSettings({ ...notificationSettings, attendanceReminders: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                                    </label>
                                </div>

                                <div className="flex flex-row items-center justify-between py-3 border-b border-[rgba(0,0,0,0.1)]">
                                    <div>
                                        <p className="font-medium">KPI Updates</p>
                                        <p className="text-xs text-[rgba(0,0,0,0.6)]">Performance score notifications</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={notificationSettings.kpiUpdates}
                                            onChange={(e) => setNotificationSettings({ ...notificationSettings, kpiUpdates: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                                    </label>
                                </div>

                                <button
                                    onClick={handleNotificationUpdate}
                                    disabled={saving}
                                    className="w-full py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                                >
                                    {saving ? 'Saving...' : 'Save Preferences'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
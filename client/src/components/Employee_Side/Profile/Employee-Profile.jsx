import { useState, useEffect } from "react"
import { API_URL } from "../../../config"
import Header from "../../Main/Header"

const profileIcon = "/images/employees.png"
const uploadIcon = "/images/download.png"

export default function EmployeeProfile({ pageLayout, currentUser }) {
    const [formData, setFormData] = useState({
        first_name: currentUser.first_name || '',
        last_name: currentUser.last_name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',  // This ensures it's never null
        address: currentUser.address || '', // This ensures it's never null
    })
    const [profilePicture, setProfilePicture] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(currentUser.profile_picture_url || null)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState(null)
    
    const firstLetter = currentUser.first_name ? currentUser.first_name[0].toUpperCase() : 'U'
    const secondLetter = currentUser.last_name ? currentUser.last_name[0].toUpperCase() : 'U'
    const initials = firstLetter + secondLetter
    const profilePictureUrl = currentUser.profile_picture_url ? `${API_URL}${currentUser.profile_picture_url}` : null

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                setMessage({ type: 'error', text: 'File size must be less than 5MB' })
                return
            }
            
            setProfilePicture(file)
            setPreviewUrl(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        setMessage(null)

        try {
            const formDataToSend = new FormData()
            Object.keys(formData).forEach(key => {
                formDataToSend.append(key, formData[key])
            })
            if (profilePicture) {
                formDataToSend.append('profilePicture', profilePicture)
            }
            formDataToSend.append('userId', currentUser.user_id)

            const response = await fetch(`${API_URL}/api/employee/update-profile`, {
                method: 'PATCH',
                body: formDataToSend
            })

            const data = await response.json()

            if (response.ok) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' })
                // Update localStorage
                const updatedUser = { ...currentUser, ...data.user }
                localStorage.setItem('user', JSON.stringify(updatedUser))
                setTimeout(() => window.location.reload(), 1500)
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to update profile' })
            }
        } catch (error) {
            console.error('Error updating profile:', error)
            setMessage({ type: 'error', text: 'An error occurred while updating profile' })
        } finally {
            setSaving(false)
        }
    }

    // Clean up preview URL on unmount
    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl)
            }
        }
    }, [previewUrl])

    return (
        <div className={`${pageLayout ? 'col-span-5' : 'col-span-17 xl:col-start-2'} col-start-2 flex flex-col w-full min-h-full`}>
            <Header pageLayout={pageLayout} pageTitle="Profile" pageDescription="Manage your personal information" currentUser={currentUser} />
            
            <div className="flex flex-col items-center justify-start h-9/10 w-full p-5 gap-5 overflow-y-scroll">
                {message && (
                    <div className={`w-full p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700 border border-green-400' : 'bg-red-100 text-red-700 border border-red-400'}`}>
                        {message.text}
                    </div>
                )}

                <div className="flex flex-col w-full bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5 gap-5">
                    <div className="flex flex-row items-center justify-start gap-3">
                        <img src={profileIcon} className="h-6 w-auto" alt="Profile" />
                        <h2 className="text-lg font-medium">Personal Information</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        {/* Profile Picture */}
                        <div className="flex flex-col items-center justify-center gap-3 py-5 border-b border-[rgba(0,0,0,0.1)]">
                            <div className="relative">
                                <div className="h-32 w-32 rounded-full overflow-hidden bg-gradient-to-tl from-blue-500 to-purple-500 flex items-center justify-center">
                                    {previewUrl ? (
                                        <img src={previewUrl.startsWith('blob:') ? previewUrl : profilePictureUrl} className="h-32 w-32 rounded-full object-cover" alt="Profile" />
                                    ) : profilePictureUrl ? (
                                        <img src={profilePictureUrl} className="h-32 w-32 rounded-full object-cover" alt="Profile" />
                                    ) : (
                                        <p className="text-sans font-medium text-2xl text-white">{initials}</p>
                                    )}
                                </div>
                            </div>
                            <label className="flex flex-row items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-lg cursor-pointer hover:bg-gray-800 transition">
                                <img src={uploadIcon} className="h-4 w-auto invert" alt="Upload" />
                                <span className="text-sm font-medium">Change Photo</span>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>
                            <p className="text-xs text-gray-500">Max file size: 5MB</p>
                        </div>

                        {/* Form Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">First Name</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleInputChange}
                                    className="border border-[rgba(0,0,0,0.2)] rounded-lg px-3 py-2 focus:outline-none focus:border-black"
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">Last Name</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleInputChange}
                                    className="border border-[rgba(0,0,0,0.2)] rounded-lg px-3 py-2 focus:outline-none focus:border-black"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="border border-[rgba(0,0,0,0.2)] rounded-lg px-3 py-2 focus:outline-none focus:border-black"
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">Phone</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="border border-[rgba(0,0,0,0.2)] rounded-lg px-3 py-2 focus:outline-none focus:border-black"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Address</label>
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                rows="3"
                                className="border border-[rgba(0,0,0,0.2)] rounded-lg px-3 py-2 focus:outline-none focus:border-black resize-none"
                            />
                        </div>

                        {/* Read-only fields */}
                        <div className="border-t border-[rgba(0,0,0,0.1)] pt-5">
                            <h3 className="text-md font-medium mb-3 text-[rgba(0,0,0,0.6)]">Employment Information (Read Only)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium">Employee ID</label>
                                    <input
                                        type="text"
                                        value={currentUser.employee_id || ''}
                                        disabled
                                        className="border border-[rgba(0,0,0,0.2)] rounded-lg px-3 py-2 bg-gray-100 text-gray-600"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium">Position</label>
                                    <input
                                        type="text"
                                        value={currentUser.position || ''}
                                        disabled
                                        className="border border-[rgba(0,0,0,0.2)] rounded-lg px-3 py-2 bg-gray-100 text-gray-600"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium">Role</label>
                                    <input
                                        type="text"
                                        value={currentUser.role || ''}
                                        disabled
                                        className="border border-[rgba(0,0,0,0.2)] rounded-lg px-3 py-2 bg-gray-100 text-gray-600"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium">Hourly Rate</label>
                                    <input
                                        type="text"
                                        value={currentUser.hourly_rate ? `₱ ${currentUser.hourly_rate}` : ''}
                                        disabled
                                        className="border border-[rgba(0,0,0,0.2)] rounded-lg px-3 py-2 bg-gray-100 text-gray-600"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
import { useState, useRef } from 'react'
import { API_URL } from '../../../../config'

const addEmployeeIcon = '/images/add-employee.png'
const hiddenIcon = "/images/hide-password.png"
const visibleIcon = "/images/show-password.png"
const closeIcon = "/images/close.png"

export default function AddEmployee({ setAddEmployeeModal }) {
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [responseBox, setResponseBox] = useState(false)
    const [responseMessage, setResponseMessage] = useState("")
    const [responseStatus, setResponseStatus] = useState(true)
    const [passwordsMatched, setPasswordsMatched] = useState(true)
    const [profilePicture, setProfilePicture] = useState(null)
    const [profilePicturePreview, setProfilePicturePreview] = useState(null)
    const fileInputRef = useRef(null)

    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [employeeId, setEmployeeId] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [role, setRole] = useState("")
    const [salary, setSalary] = useState("")
    const [phone, setPhone] = useState("")
    const [position, setPosition] = useState("")
    const [hireDate, setHireDate] = useState(new Date().toISOString().split('T')[0])

    const handleBackdropClick = () => {
        setAddEmployeeModal(false)
    }

    const handleModalClick = (e) => {
        e.stopPropagation()
    }

    const handleProfilePictureChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                setResponseMessage("File size must be less than 5MB")
                setResponseStatus(false)
                setResponseBox(true)
                return
            }
            
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
            if (!allowedTypes.includes(file.type)) {
                setResponseMessage("Only image files are allowed (JPEG, PNG, GIF, WebP)")
                setResponseStatus(false)
                setResponseBox(true)
                return
            }
            
            setProfilePicture(file)
            
            // Create preview
            const reader = new FileReader()
            reader.onloadend = () => {
                setProfilePicturePreview(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const removeProfilePicture = () => {
        setProfilePicture(null)
        setProfilePicturePreview(null)
        // Reset the file input
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const capitalizeWords = (word) => word.replace(/\b\w/g, char => char.toUpperCase())

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        try {
            // Validate passwords match
            if (password !== confirmPassword) {
                setPasswordsMatched(false)
                return
            }
            setPasswordsMatched(true)
            
            const formData = new FormData()
            formData.append('firstName', capitalizeWords(firstName))
            formData.append('lastName', capitalizeWords(lastName))
            formData.append('email', email.toLowerCase().trim())
            formData.append('employeeId', employeeId.trim())
            formData.append('password', password)
            formData.append('role', role)
            formData.append('salary', salary)
            formData.append('phone', phone)
            formData.append('position', position)
            formData.append('hireDate', hireDate)
            
            // Add profile picture if selected
            if (profilePicture) {
                formData.append('profilePicture', profilePicture)
            }
            
            const response = await fetch(`${API_URL}/api/create-account`, {
                method: "POST",
                body: formData
            })
            
            const data = await response.json()
            
            if (response.ok) {
                setResponseMessage(data.message)
                setResponseStatus(true)
                setResponseBox(true)
                
                setTimeout(() => {
                    setAddEmployeeModal(false)
                    window.location.reload()
                }, 2000)
            } else {
                setResponseMessage(data.message)
                setResponseStatus(false)
                setResponseBox(true)
            }
        } catch (err) {
            console.error(err)
            setResponseMessage("Error creating account. Please try again.")
            setResponseStatus(false)
            setResponseBox(true)
        }
    }

    return(
        <>
            <div
                onClick={handleBackdropClick}
                className="absolute flex flex-row items-center justify-center h-screen w-screen top-0 left-0 bg-[rgba(0,0,0,0.3)] z-100"
            >
                <div 
                    onClick={handleModalClick}
                    className="flex flex-col items-start justify-start w-full m-10 xl:w-2/5 max-h-[90vh] bg-white rounded-lg overflow-hidden"
                >
                    <div className="flex flex-row items-center justify-between gap-2 h-16 w-full bg-black px-6">
                        <div className="flex flex-row items-center gap-3">
                            <img src={addEmployeeIcon} alt="add employee icon" className="h-5 w-auto invert-100" />
                            <h2 className="text-xl text-white font-medium">Add Employee</h2>
                        </div>
                        <button 
                            onClick={handleBackdropClick}
                            className="text-white hover:text-gray-300 text-2xl cursor-pointer"
                        >
                            <img src={ closeIcon } className='h-3 w-auto invert-100' />
                        </button>
                    </div>
                    
                    {/* Response Box */}
                    {responseBox && (
                        <div className={`w-full px-6 py-3 ${responseStatus ? 'bg-green-100 border-green-500 text-green-700' : 'bg-red-100 border-red-500 text-red-700'} border-2`}>
                            {responseMessage}
                        </div>
                    )}
                    
                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-col w-full h-full px-6 py-5 gap-4 overflow-y-auto"
                    >
                        {/* Profile Picture Upload */}
                        <div className="flex flex-col gap-2 items-center">
                            <label className="text-sm text-gray-700 self-start font-medium">Profile Picture (Optional)</label>
                            <div className="flex flex-col items-center gap-3 w-full">
                                {profilePicturePreview ? (
                                    <div className="relative">
                                        <img
                                            src={profilePicturePreview} 
                                            alt="Profile preview" 
                                            className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-md"
                                        />
                                        <button
                                            type="button"
                                            onClick={removeProfilePicture}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 cursor-pointer shadow-lg transition-colors"
                                        >
                                            <img src={ closeIcon } className='h-3 w-auto invert-100' />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-4 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
                                        <span className="text-gray-400 text-4xl font-light">+</span>
                                    </div>
                                )}
                                <label className="relative cursor-pointer group">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleProfilePictureChange}
                                        className="hidden"
                                    />
                                    <span className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {profilePicturePreview ? 'Change Photo' : 'Upload Photo'}
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-gray-700">First Name *</label>
                                <input
                                    onChange={(e) => setFirstName(e.target.value)}
                                    type="text"
                                    required 
                                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-gray-700">Last Name *</label>
                                <input 
                                    onChange={(e) => setLastName(e.target.value)}
                                    type="text" 
                                    required 
                                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-sm text-gray-700">Email *</label>
                            <input
                                onChange={(e) => setEmail(e.target.value)}
                                type="email" 
                                required 
                                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-sm text-gray-700">Employee ID *</label>
                            <input
                                onChange={(e) => setEmployeeId(e.target.value)}
                                type="text" 
                                required 
                                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
                            />
                        </div>

                        <div className='flex flex-col w-full h-auto gap-2'>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm text-gray-700">Password *</label>
                                    <div className="flex flex-row w-full border border-gray-300 rounded px-3 py-2">
                                        <input
                                            onChange={(e) => setPassword(e.target.value)}
                                            type={showPassword ? "text" : "password"}
                                            required 
                                            className="text-sm w-full focus:outline-none focus:border-black pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="text-gray-500 hover:text-black text-sm cursor-pointer"
                                        >
                                            <img src={showPassword ? visibleIcon : hiddenIcon} className="h-4 w-auto" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm text-gray-700">Confirm Password *</label>
                                    <div className="flex flex-row w-full border border-gray-300 rounded px-3 py-2">
                                        <input
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            type={showConfirmPassword ? "text" : "password"}
                                            required 
                                            className="text-sm w-full focus:outline-none focus:border-black pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="text-gray-500 hover:text-black text-sm cursor-pointer"
                                        >
                                            <img src={showConfirmPassword ? visibleIcon : hiddenIcon} className="h-4 w-auto" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <p className={`text-red-500 w-full text-center rounded-sm border-2 border-red-500 bg-red-100 ${passwordsMatched ? 'hidden' : 'block'}`}>Passwords did not match *</p>
                        </div>

                        <div className='grid grid-cols-2 gap-3'>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-gray-700">Role *</label>
                                <select
                                    onChange={(e) => setRole(e.target.value)}
                                    required 
                                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black bg-white cursor-pointer"
                                >
                                    <option value="">Select Role</option>
                                    <option value="admin">Admin</option>
                                    <option value="employee">Employee</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-gray-700">Hourly Rate *</label>
                                <input
                                    onChange={(e) => setSalary(e.target.value)}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    required 
                                    placeholder="0.00"
                                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-gray-700">Phone</label>
                                <input 
                                    onChange={(e) => setPhone(e.target.value)}
                                    type="tel"
                                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-gray-700">Position</label>
                                <input
                                    onChange={(e) => setPosition(e.target.value)}
                                    type="text" 
                                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-sm text-gray-700">Hire Date *</label>
                            <input
                                onChange={(e) => setHireDate(e.target.value)}
                                type="date"
                                value={hireDate}
                                required
                                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black cursor-pointer"
                            />
                        </div>

                        <div className="flex flex-row gap-2 justify-end pt-3 mt-2 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={handleBackdropClick}
                                className="px-5 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 bg-black text-white rounded text-sm hover:bg-gray-800 cursor-pointer"
                            >
                                Add Employee
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}
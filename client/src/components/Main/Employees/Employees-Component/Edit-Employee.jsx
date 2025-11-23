import { useState, useRef } from "react"
import { API_URL } from "../../../../config"

const addEmployeeIcon = '/images/add-employee.png'
const closeIcon = "/images/close.png"

export default function EditEmployee({ employee, toggleModal }) {
    const [responseBox, setResponseBox] = useState(false)
    const [responseMessage, setResponseMessage] = useState("")
    const [responseStatus, setResponseStatus] = useState(true)

    const [firstName, setFirstName] = useState(employee.first_name)
    const [lastName, setLastName] = useState(employee.last_name)
    const [email, setEmail] = useState(employee.email)
    const [role, setRole] = useState(employee.role)
    const [hourlyRate, setHourlyRate] = useState(employee.hourly_rate || 0)
    const [phone, setPhone] = useState(employee.phone)
    const [position, setPosition] = useState(employee.position)
    const formattedDate = new Date(employee.hire_date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });

    // Calculate estimated monthly salary based on 160 hours
    const estimatedMonthlySalary = (hourlyRate * 160).toFixed(2)

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const body = { 
                user_id: employee.user_id, 
                firstName, 
                lastName, 
                email, 
                role, 
                hourlyRate: parseFloat(hourlyRate),
                phone, 
                position 
            }
            const response = await fetch(`${API_URL}/api/edit-employee`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            })

            const data = await response.json()

            if (!response.ok) {
                setResponseMessage(data.message)
                setResponseStatus(false)
                setResponseBox(true)
                return
            }
            setResponseMessage(data.message)
            setResponseStatus(true)
            setResponseBox(true)
            setTimeout(() => {
                window.location.reload()
            }, 2000)
        } catch (err) {
            console.error(err)
            setResponseMessage("Error editing employee. Please try again.")
            setResponseStatus(false)
            setResponseBox(true)
        }
    } 

    return (
        <>
            <div
                className="fixed flex flex-row items-center justify-center h-screen w-screen top-0 left-0 bg-[rgba(0,0,0,0.3)] z-100"
            >
                <div
                    className="flex flex-col items-start justify-start w-full m-10 xl:w-2/5 max-h-[90vh] bg-white rounded-lg overflow-hidden"
                >
                    <div className="flex flex-row items-center justify-between gap-2 h-16 w-full bg-black px-6">
                        <div className="flex flex-row items-center gap-3">
                            <img src={addEmployeeIcon} alt="add employee icon" className="h-5 w-auto invert-100" />
                            <h2 className="text-xl text-white font-medium">Edit Employee</h2>
                        </div>
                        <button 
                            onClick={() => toggleModal(false)}
                            className="text-white hover:text-gray-300 text-2xl cursor-pointer"
                        >
                            <img src={ closeIcon } className='h-3 w-auto invert-100' />
                        </button>
                    </div>
                    {responseBox && (
                        <div className={`w-full px-6 py-3 ${responseStatus ? 'bg-green-100 border-green-500 text-green-700' : 'bg-red-100 border-red-500 text-red-700'} border-2`}>
                            {responseMessage}
                        </div>
                    )}
                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-col w-full h-full px-6 py-5 gap-4 overflow-y-auto"
                    >
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-gray-700">First Name</label>
                                <input
                                    onChange={(e) => setFirstName(e.target.value)}
                                    value={ firstName }
                                    type="text"
                                    required 
                                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-gray-700">Last Name</label>
                                <input 
                                    onChange={(e) => setLastName(e.target.value)}
                                    value={lastName}
                                    type="text" 
                                    required 
                                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-sm text-gray-700">Email</label>
                            <input
                                onChange={(e) => setEmail(e.target.value)}
                                value={email}
                                type="email" 
                                required 
                                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-sm text-gray-700">Employee ID</label>
                            <p className="border border-gray-300 rounded px-3 py-2 text-sm cursor-not-allowed">{employee.employee_id}</p>
                        </div>
                        
                        <div className='grid grid-cols-2 gap-3'>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-gray-700">Role</label>
                                <select
                                    onChange={(e) => setRole(e.target.value)}
                                    value={role}
                                    required 
                                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black bg-white cursor-pointer"
                                >
                                    <option value="">Select Role</option>
                                    <option value="admin">Admin</option>
                                    <option value="employee">Employee</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-gray-700">Hourly Rate</label>
                                <div className="flex flex-row items-center justify-start border border-gray-300 rounded px-3 py-2 gap-2">
                                    <p>₱</p>
                                    <input
                                        onChange={(e) => setHourlyRate(e.target.value)}
                                        value={hourlyRate}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        required 
                                        placeholder="0.00"
                                        className="text-sm focus:outline-none focus:border-black w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Estimated Monthly Salary Info */}
                        <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2">
                            <p className="text-xs text-blue-800">
                                <strong>Estimated Monthly Salary (160 hrs):</strong> ₱{parseFloat(estimatedMonthlySalary).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-gray-700">Phone</label>
                                <input 
                                    onChange={(e) => setPhone(e.target.value)}
                                    value={phone ? phone : ""}
                                    type="tel"
                                    placeholder="N/A"
                                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-gray-700">Position</label>
                                <input
                                    onChange={(e) => setPosition(e.target.value)}
                                    value={position ? position : ""}
                                    type="text"
                                    placeholder="N/A"
                                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-sm text-gray-700">Hire Date</label>
                            <p className="border border-gray-300 rounded px-3 py-2 text-sm cursor-not-allowed">{formattedDate}</p>
                        </div>

                        <div className="flex flex-row gap-2 justify-end pt-3 mt-2 border-t border-gray-200">
                            <button
                                onClick={() => toggleModal(false)}
                                type="button"
                                className="px-5 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 bg-black text-white rounded text-sm hover:bg-gray-800 cursor-pointer"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}
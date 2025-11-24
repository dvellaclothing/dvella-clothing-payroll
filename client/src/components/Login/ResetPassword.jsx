import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import Swal from "sweetalert2"
import { API_URL } from "../../config"

const backIcon = "/images/back.png"
const emailIcon = "/images/email.png"
const lockIcon = "/images/lock.png"
const codeIcon = "/images/code.png"

export default function ResetPassword() {
    const [email, setEmail] = useState("")
    const [code, setCode] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [step, setStep] = useState(1) // 1 = request code, 2 = reset password
    const [loading, setLoading] = useState(false)
    const [resendTimer, setResendTimer] = useState(0)
    const navigate = useNavigate()

    // Countdown timer for resend
    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [resendTimer])

    const handleRequestCode = async (e) => {
        e.preventDefault()
        if (!email) return Swal.fire("Error", "Please enter your email", "error")
        
        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/api/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            })

            const data = await res.json()
            if (!res.ok) {
                setLoading(false)
                return Swal.fire("Error", data.message || "Failed to send code", "error")
            }

            Swal.fire("Success", "Verification code sent! Check your email.", "success")
            setStep(2)
            setResendTimer(60) // 60 second cooldown
            setLoading(false)
        } catch (err) {
            console.error(err)
            setLoading(false)
            Swal.fire("Error", "Something went wrong. Please try again.", "error")
        }
    }

    const handleResendCode = async () => {
        if (resendTimer > 0) return
        
        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/api/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            })

            const data = await res.json()
            if (!res.ok) {
                setLoading(false)
                return Swal.fire("Error", data.message || "Failed to resend code", "error")
            }

            Swal.fire("Success", "New verification code sent!", "success")
            setResendTimer(60)
            setLoading(false)
        } catch (err) {
            console.error(err)
            setLoading(false)
            Swal.fire("Error", "Something went wrong. Please try again.", "error")
        }
    }

    const handleResetPassword = async (e) => {
        e.preventDefault()
        
        if (!email || !code || !newPassword || !confirmPassword) {
            return Swal.fire("Error", "All fields are required", "error")
        }
        
        if (newPassword !== confirmPassword) {
            return Swal.fire("Error", "Passwords do not match", "error")
        }
        
        if (newPassword.length < 6) {
            return Swal.fire("Error", "Password must be at least 6 characters", "error")
        }

        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/api/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code, newPassword }),
            })

            const data = await res.json()
            if (!res.ok) {
                setLoading(false)
                return Swal.fire("Error", data.message || "Failed to reset password", "error")
            }

            await Swal.fire("Success", data.message, "success")
            setEmail("")
            setCode("")
            setNewPassword("")
            setConfirmPassword("")
            setLoading(false)
            navigate("/")
        } catch (err) {
            console.error(err)
            setLoading(false)
            Swal.fire("Error", "Something went wrong. Please try again.", "error")
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-gray-200">
                {/* Back Button */}
                <button
                    onClick={() => navigate("/")}
                    className="mb-6 text-gray-600 hover:text-gray-900 transition duration-200 flex items-center gap-2 text-sm font-medium cursor-pointer"
                >
                    <img src={backIcon} alt="back" className="h-4 w-auto" />
                    Back to Login
                </button>

                {/* Step 1: Request Code */}
                {step === 1 && (
                    <div>
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
                            <p className="text-gray-600 text-sm">
                                Enter your email address and we'll send you a verification code
                            </p>
                        </div>

                        <form onSubmit={handleRequestCode} className="space-y-4">
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        placeholder="your.email@example.com"
                                        className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={loading}
                                    />
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                        <img src={emailIcon} className="h-5 w-auto invert-50" />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-black text-white p-3 rounded-lg font-medium hover:bg-gray-800 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {loading ? "Sending..." : "Send Verification Code"}
                            </button>
                        </form>
                    </div>
                )}

                {/* Step 2: Reset Password */}
                {step === 2 && (
                    <div>
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Enter Code</h2>
                            <p className="text-gray-600 text-sm">
                                We sent a 6-digit code to <strong>{email}</strong>
                            </p>
                        </div>

                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Verification Code
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Enter 6-digit code"
                                        className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition text-center text-2xl tracking-widest font-mono"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        maxLength={6}
                                        disabled={loading}
                                    />
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                        🔑
                                    </div>
                                </div>
                            </div>

                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        placeholder="Enter new password"
                                        className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        disabled={loading}
                                    />
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                        🔒
                                    </div>
                                </div>
                            </div>

                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        placeholder="Confirm new password"
                                        className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        disabled={loading}
                                    />
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                        🔒
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-black text-white p-3 rounded-lg font-medium hover:bg-gray-800 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {loading ? "Resetting..." : "Reset Password"}
                            </button>
                        </form>

                        {/* Resend Code */}
                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                                Didn't receive the code?{" "}
                                {resendTimer > 0 ? (
                                    <span className="text-gray-400">
                                        Resend in {resendTimer}s
                                    </span>
                                ) : (
                                    <button
                                        onClick={handleResendCode}
                                        disabled={loading}
                                        className="text-black font-medium hover:underline disabled:text-gray-400 disabled:no-underline"
                                    >
                                        Resend Code
                                    </button>
                                )}
                            </p>
                        </div>

                        {/* Back to Email */}
                        <div className="mt-4 text-center">
                            <button
                                onClick={() => {
                                    setStep(1)
                                    setCode("")
                                    setNewPassword("")
                                    setConfirmPassword("")
                                }}
                                className="text-sm text-gray-600 hover:text-gray-900 transition"
                            >
                                Change email address
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
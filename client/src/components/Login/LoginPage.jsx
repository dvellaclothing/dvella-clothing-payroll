import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import { API_URL } from "../../config"

const emailIcon = "/images/email.png"
const passwordIcon = "/images/password.png"
const companyLogo = "images/logo.jpg"
const hiddenIcon = "/images/hide-password.png"
const visibleIcon = "/images/show-password.png"

function LoginForm() {
    const navigate = useNavigate()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e) => {
        e.preventDefault()
        if (!email || !password) return setErrorMessage("Please fill in all fields")
        
        setLoading(true)
        try {
            const body = { email, password }
            const response = await fetch(`${API_URL}/api/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            })
            const data = await response.json()
            
            if (!response.ok) {
                setErrorMessage(data.message)
                setLoading(false)
            } else {
                localStorage.setItem("user", JSON.stringify(data.user))
                const user = JSON.parse(localStorage.getItem('user'))
                if (user.role === 'admin') {
                    navigate("/admin")
                } else {
                    navigate("/employee")
                }
            }
        } catch (err) {
            console.error(err.message)
            setErrorMessage("Internal server error")
            setLoading(false)
        }
    }

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            setLoading(true)
            setErrorMessage("")
            
            // Decode the JWT token from Google
            const decoded = jwtDecode(credentialResponse.credential)
            
            // Send to your backend
            const response = await fetch(`${API_URL}/api/google-login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: decoded.email,
                    name: decoded.name,
                    googleId: decoded.sub,
                    picture: decoded.picture
                })
            })
            
            const data = await response.json()
            
            if (!response.ok) {
                setErrorMessage(data.message || "Google login failed")
                setLoading(false)
            } else {
                localStorage.setItem("user", JSON.stringify(data.user))
                const user = data.user
                if (user.role === 'admin') {
                    navigate("/admin")
                } else {
                    navigate("/employee")
                }
            }
        } catch (err) {
            console.error("Google login error:", err)
            setErrorMessage("Failed to login with Google")
            setLoading(false)
        }
    }

    const handleGoogleError = () => {
        setErrorMessage("Google login failed. Please try again.")
    }
    
    return(
        <div className="h-full w-full flex flex-col items-center justify-center">
            <div className="flex flex-col items-center justify-between w-full max-w-md bg-white shadow-[0_0_20px_rgba(0,0,0,0.1)] rounded-2xl py-8 px-10 gap-5 mx-4">
                {/* Header */}
                <div className="flex flex-col items-center justify-center w-full h-auto">
                    <img src={companyLogo} className="bg-gray-300 h-16 w-16 rounded-xl mb-3" alt="logo" />
                    <h1 className="font-bold text-2xl text-gray-900">Welcome Back</h1>
                    <p className="text-gray-500 text-sm">Sign in to access your workspace</p>
                </div>

                {/* Error Message */}
                {errorMessage && (
                    <div className="w-full bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {errorMessage}
                    </div>
                )}

                {/* Login Form */}
                <form
                    onSubmit={handleLogin}
                    className="flex flex-col items-center justify-center w-full gap-4"
                >
                    <div className="flex flex-col items-start justify-center w-full">
                        <label className="font-medium text-sm text-gray-700 mb-1">Email</label>
                        <div className="flex flex-row items-center justify-start border border-gray-300 w-full px-3 py-2 gap-2 rounded-lg focus-within:ring-2 focus-within:ring-black focus-within:border-transparent transition">
                            <img src={emailIcon} alt="email icon" className="h-4 w-auto opacity-50" />
                            <input
                                type="email"
                                className="outline-none w-full text-sm"
                                placeholder="your.email@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col items-start justify-center w-full">
                        <label className="font-medium text-sm text-gray-700 mb-1">Password</label>
                        <div className="flex flex-row items-center justify-start border border-gray-300 w-full px-3 py-2 gap-2 rounded-lg focus-within:ring-2 focus-within:ring-black focus-within:border-transparent transition">
                            <img src={passwordIcon} alt="password icon" className="h-4 w-auto opacity-50" />
                            <div className="flex flex-row w-full items-center gap-2">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="outline-none w-full text-sm"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-gray-400 hover:text-gray-600 transition"
                                >
                                    <img src={showPassword ? visibleIcon : hiddenIcon} className="h-4 w-auto" alt="toggle" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-row items-center justify-between w-full text-sm">
                        <label className="flex flex-row items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="cursor-pointer w-4 h-4" />
                            <span className="text-gray-600">Remember me</span>
                        </label>
                        <a href="/reset-password" className="font-medium text-black hover:underline">
                            Forgot Password?
                        </a>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                {/* Divider */}
                <div className="flex items-center w-full gap-4">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="text-xs text-gray-500 font-medium">OR CONTINUE WITH</span>
                    <div className="flex-1 border-t border-gray-300"></div>
                </div>

                {/* Google Login Button */}
                <div className="w-full">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        // useOneTap
                        theme="outline"
                        size="large"
                        text="continue_with"
                        shape="rectangular"
                        width="100%"
                    />
                </div>

                {/* Footer */}
                <div className="flex flex-row items-center justify-center gap-1 text-sm">
                    <p className="text-gray-600">Don't have an account? Contact your administrator</p>
                </div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
    console.log("Google Client ID:", GOOGLE_CLIENT_ID)
    if (!GOOGLE_CLIENT_ID) {
        return <div className="p-4 text-red-600">Error: Google Client ID not found in environment variables</div>
    }
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <LoginForm />
        </GoogleOAuthProvider>
    )
}
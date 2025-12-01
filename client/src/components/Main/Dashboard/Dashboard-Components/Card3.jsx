export default function CardThree({ payroll, loading }) {
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString)
            return date.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
            })
        } catch (error) {
            console.error("Error formatting date:", error)
            return "Invalid date"
        }
    }
    
    const getDaysUntil = (dateString) => {
        if (!dateString) return 0;
        try {
            const targetDate = new Date(dateString)
            const today = new Date()
            today.setHours(0, 0, 0, 0) // Reset time part to ensure accurate day difference
            const diffTime = targetDate - today
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            return diffDays
        } catch (error) {
            console.error("Error calculating days until:", error)
            return 0
        }
    }
    
    if (loading) {
        return (
            <div className="flex flex-col w-full justify-center items-center min-h-60 bg-white rounded-2xl border border-[rgba(0,0,0,0.3)] px-5 py-4">
                <p className="text-sm text-gray-500">Loading payroll data...</p>
            </div>
        )
    }
    
    // More robust check for payroll data
    if (!payroll || typeof payroll !== 'object' || !payroll.period) {
        return (
            <div className="flex flex-col w-full justify-center items-center min-h-60 bg-white rounded-2xl border border-[rgba(0,0,0,0.3)] px-5 py-4">
                <p className="text-sm text-gray-500">No upcoming payroll periods found</p>
                <pre className="text-xs mt-2 text-gray-400 bg-gray-50 p-2 rounded hidden">
                    {JSON.stringify({ hasPayroll: !!payroll, hasPeriod: !!(payroll && payroll.period) }, null, 2)}
                </pre>
            </div>
        )
    }
    
    const daysUntil = getDaysUntil(payroll.period.pay_date)
    const status = payroll.period.status || 'open'
    
    return (
        <div className="flex flex-col w-full justify-start items-start min-h-60 overflow-y-scroll bg-white rounded-2xl border border-[rgba(0,0,0,0.3)] px-5 py-4 gap-4">
            <h3 className="text-black text-md font-semibold">Upcoming Payroll</h3>
            
            <div className="flex flex-col w-full gap-3">
                <div className="flex flex-row items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex flex-col gap-1">
                        <p className="text-sm font-semibold text-blue-900">
                            {payroll.period.period_name || "Current Pay Period"}
                        </p>
                        <p className="text-xs text-blue-700">
                            {formatDate(payroll.period.start_date)} - {formatDate(payroll.period.end_date)}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            daysUntil <= 3 ? 'bg-red-100 text-red-700' :
                            daysUntil <= 7 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                        }`}>
                            {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                        </span>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600">Pay Date</p>
                        <p className="text-sm font-semibold text-gray-900">
                            {formatDate(payroll.period.pay_date)}
                        </p>
                    </div>
                    
                    <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600">Employees</p>
                        <p className="text-sm font-semibold text-gray-900">
                            {payroll.period.employee_count || 0}
                        </p>
                    </div>
                    
                    <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded-lg col-span-2">
                        <p className="text-xs text-gray-600">Estimated Amount</p>
                        <p className="text-lg font-bold text-gray-900">
                            ₱{parseFloat(payroll.period.estimated_amount || 0).toLocaleString('en-US', { 
                                minimumFractionDigits: 2, 
                                maximumFractionDigits: 2 
                            })}
                        </p>
                    </div>
                </div>
                
                <div className="flex flex-row items-center justify-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <span className={`h-2 w-2 rounded-full ${
                        status === 'open' ? 'bg-green-500' :
                        status === 'processing' ? 'bg-yellow-500' :
                        'bg-gray-500'
                    }`}></span>
                    <p className="text-xs text-gray-700">
                        Status: <span className="font-semibold">
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    )
}
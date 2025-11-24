export default function EmployeePayrollCard({ payroll, loading }) {
    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
        })
    }
    
    const getDaysUntil = (dateString) => {
        const targetDate = new Date(dateString)
        const today = new Date()
        const diffTime = targetDate - today
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
    }
    
    if (loading) {
        return (
            <div className="flex flex-col w-full bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5">
                <p className="text-sm text-gray-500">Loading payroll information...</p>
            </div>
        )
    }
    
    if (!payroll || !payroll.period) {
        return (
            <div className="flex flex-col w-full bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5">
                <p className="text-sm text-gray-500">No upcoming payroll information</p>
            </div>
        )
    }
    
    const daysUntil = getDaysUntil(payroll.period.pay_date)
    
    return (
        <div className="flex flex-col w-full bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5 gap-4">
            <h3 className="text-lg font-medium">Next Payroll</h3>
            
            <div className="flex flex-col gap-3">
                {/* Pay Date Banner */}
                <div className="flex flex-row items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white">
                    <div className="flex flex-col gap-1">
                        <p className="text-xs opacity-90">Pay Date</p>
                        <p className="text-xl font-bold">{formatDate(payroll.period.pay_date)}</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            daysUntil <= 3 ? 'bg-white/20' :
                            daysUntil <= 7 ? 'bg-white/30' :
                            'bg-white/40'
                        }`}>
                            {daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                        </span>
                    </div>
                </div>
                
                {/* Period Info */}
                <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg">
                    <div className="flex flex-row justify-between">
                        <span className="text-xs text-gray-600">Period</span>
                        <span className="text-xs font-medium">{payroll.period.period_name}</span>
                    </div>
                    <div className="flex flex-row justify-between">
                        <span className="text-xs text-gray-600">Duration</span>
                        <span className="text-xs font-medium">
                            {formatDate(payroll.period.start_date)} - {formatDate(payroll.period.end_date)}
                        </span>
                    </div>
                </div>
                
                {/* Hours Summary */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600">Hours Worked</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {payroll.period.hours_worked?.toFixed(1) || '0.0'}
                        </p>
                    </div>
                    
                    <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600">Overtime</p>
                        <p className="text-2xl font-bold text-orange-600">
                            {payroll.period.overtime_hours?.toFixed(1) || '0.0'}
                        </p>
                    </div>
                </div>
                
                {/* Estimated Pay */}
                <div className="flex flex-col gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs text-green-700 font-medium">Estimated Net Pay</p>
                    <p className="text-3xl font-bold text-green-700">
                        ₱{parseFloat(payroll.period.estimated_net || 0).toLocaleString('en-US', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                        })}
                    </p>
                    <p className="text-xs text-green-600">
                        Gross: ₱{parseFloat(payroll.period.estimated_gross || 0).toLocaleString('en-US', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                        })}
                    </p>
                </div>
                
                {/* Note */}
                <p className="text-xs text-gray-500 text-center">
                    * Estimated amount based on current attendance
                </p>
            </div>
        </div>
    )
}
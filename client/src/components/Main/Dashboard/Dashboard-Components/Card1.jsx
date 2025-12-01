export default function CardOne({ 
    cardTitle = "", 
    cardValue = "0", 
    cardImage = "", 
    changes = "", 
    cardDescription = "",
    loading = false
}) {
    // Format large numbers with commas
    const formatValue = (value) => {
        if (isNaN(Number(value.replace(/[^0-9.]/g, '')))) {
            return value; // Return as is if not a number
        }
        const num = parseFloat(value.replace(/[^0-9.]/g, ''));
        return isNaN(num) ? value : num.toLocaleString('en-US');
    };

    // Handle loading state
    if (loading) {
        return (
            <div className="flex flex-col w-full justify-center items-start min-h-30 bg-white rounded-2xl border border-[rgba(0,0,0,0.1)] p-5 gap-3 animate-pulse">
                <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
                <div className="h-6 w-1/2 bg-gray-200 rounded"></div>
                <div className="h-3 w-3/4 bg-gray-100 rounded"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full justify-center items-start min-h-30 bg-white rounded-2xl border border-[rgba(0,0,0,0.1)] p-5 gap-2 hover:shadow-md transition-all duration-200">
            <p className="text-gray-600 text-sm font-medium">{cardTitle}</p>
            <div className="flex flex-row items-center justify-start gap-2">
                <p className="text-2xl font-semibold text-gray-900">
                    {cardValue.includes('₱') 
                        ? `₱${formatValue(cardValue.replace('₱', ''))}`
                        : formatValue(cardValue)
                    }
                </p>
                {changes && (
                    <div className={`flex flex-row items-center justify-center py-1 px-2 rounded-lg gap-1 ${
                        changes.startsWith('+') 
                            ? 'bg-green-50 text-green-700 border border-green-100' 
                            : changes.startsWith('-')
                                ? 'bg-red-50 text-red-700 border border-red-100'
                                : 'bg-gray-50 text-gray-700 border border-gray-100'
                    }`}>
                        {cardImage && (
                            <img 
                                src={cardImage} 
                                alt={changes.startsWith('+') ? "increase" : "decrease"} 
                                className={`h-2.5 w-auto ${
                                    changes.startsWith('-') ? 'transform rotate-180' : ''
                                }`} 
                            />
                        )}
                        <span className="text-xs font-medium whitespace-nowrap">
                            {changes}
                        </span>
                    </div>
                )}
            </div>
            <p className="text-sm text-gray-500 mt-1">{cardDescription}</p>
        </div>
    );
}


export default function SalaryInformation({ employee }) {
    return (
        <>
            <div className="col-span-2 py-10 px-5 flex flex-col items-start justify-start gap-5">
                <h2 className="text-lg font-medium">Salary Information</h2>
                <div className="flex flex-col items-start justify-center h-auto">
                    <p className="text-md font-medium text-[rgba(0,0,0,0.6)]">Hourly Rate:</p>
                    <p className="text-xl font-normal text-black">₱ { Number(employee.hourly_rate).toLocaleString() }</p>
                </div>
            </div>
        </>
    )
}
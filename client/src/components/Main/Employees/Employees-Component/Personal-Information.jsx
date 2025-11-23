
import { API_URL } from "../../../../config"

export default function PersonalInformation({ employee }) {
    const firstLetter = employee.first_name[0].toUpperCase()
    const secondLetter = employee.last_name[0].toUpperCase()
    const initials = firstLetter + secondLetter
    const profilePictureUrl = employee.profile_picture_url ? `${API_URL}${employee.profile_picture_url}` : null

    return (
        <>
            <div className="col-span-2 py-10 px-5 flex flex-col items-start justify-start gap-5">
                <h2 className="text-lg font-medium">Personal Information</h2>
                <div className="flex flex-row items-start justify-center gap-5">
                    <div className="flex flex-col items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tl from-blue-500 to-purple-500">
                        { profilePictureUrl ?
                            <img src={profilePictureUrl} className="h-20 w-auto rounded-full object-cover" />
                            : <p className="text-sans font-medium text-2xl text-white">{initials}</p>
                        }
                    </div>
                    <div className="flex flex-col items-start justify-center h-full">
                        <p className="text-md font-medium text-[rgba(0,0,0,0.6)]">Full Name:</p>
                        <p className="text-xl font-normal text-black">{employee.first_name + " " + employee.last_name}</p>
                    </div>
                </div>
                <div className="flex flex-col items-start justify-center h-auto">
                    <p className="text-md font-medium text-[rgba(0,0,0,0.6)]">Email:</p>
                    <p className="text-xl font-normal text-black">{employee.email}</p>
                </div>
                <div className="flex flex-col items-start justify-center h-auto">
                    <p className="text-md font-medium text-[rgba(0,0,0,0.6)]">Phone:</p>
                    <p className="text-xl font-normal text-black">{ employee.phone === "" || null ? "N/A" : employee.phone }</p>
                </div>
            </div>
        </>
    )
}
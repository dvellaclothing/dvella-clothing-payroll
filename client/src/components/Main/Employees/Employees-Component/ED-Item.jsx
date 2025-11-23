
import { useState } from "react"
import Swal from "sweetalert2"
import EmployeeDetails from "./Employee-Details"
import EditEmployee from "./Edit-Employee"
import { API_URL } from "../../../../config"

const viewIcon = "/images/eye.png"
const editIcon = "/images/edit.png"
const deleteIcon = "/images/trashcan.png"

export default function EDItem(props) {
    const [viewUser, setViewUser] = useState(false)
    const [editUser, setEditUser] = useState(false)

    const handleDelete = async () => {
        try {
            const { value: password } = await Swal.fire({
                title: 'Confirm Delete',
                text: 'Enter your password to confirm',
                input: 'password',
                inputPlaceholder: 'Your Password',
                showCancelButton: true,
                confirmButtonText: 'Confirm',
                cancelButtonText: 'Cancel',
            })

            if (!password) return

            const user = JSON.parse(localStorage.getItem("user"))
            const body = { current_user_ID: user.user_id, target_ID: props.employee.user_id, password }

            const response = await fetch(`${API_URL}/api/delete-employee`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            })

            const data = await response.json()

            if (data.valid) {
                Swal.fire('Deleted!', data.message, 'success')
                setTimeout(() => {
                    window.location.reload()
                }, 2000)
            } else {
                Swal.fire('Error', data.message, 'error')
            }
        } catch (err) {
            console.error(err)
            Swal.fire('Error', 'Something went wrong', 'error')
        }
    }

    return(
        <>
            { viewUser ? <EmployeeDetails employee = {props.employee} toggleModal = { () => setViewUser() } /> : null }
            { editUser ? <EditEmployee employee = { props.employee } toggleModal = { () => setEditUser() } /> : null }
            <div className="grid grid-cols-9 gap-4 w-full border-t border-[rgba(0,0,0,0.1)] items-center justify-center h-10 px-2">
                <p className="col-span-2 font-normal text-sm">{props.employee.first_name} {props.employee.last_name}</p>
                <div className="col-span-1 flex flex-row items-center justify-start w-full h-full">
                    <p className="font-normal text-sm border border-[rgba(0,0,0,0.2)] px-2 rounded-lg">{props.employee.employee_id}</p>
                </div>
                <p className="col-span-2 font-normal text-sm">{props.employee.position}</p>
                <p className="col-span-1 font-normal text-sm">₱{Number(props.employee.hourly_rate).toLocaleString()}</p>
                <p className="col-span-1 font-normal text-sm">{props.employee.status}</p>
                <div className="col-span-2 flex flex-row items-center justify-start gap-2">
                    <button
                        onClick={() => setViewUser(true)}
                        className="h-auto w-auto cursor-pointer p-1 border border-[rgba(0,0,0,0.2)] rounded-lg hover:bg-[rgba(0,0,0,0.1)] transition duration-200"
                    >
                        <img src={viewIcon} alt="View Icon" className="h-4" />
                    </button>
                    <button
                        onClick={ () => setEditUser(true) }
                        className="h-auto w-auto cursor-pointer p-1 border border-[rgba(0,0,0,0.2)] rounded-lg hover:bg-[rgba(0,0,0,0.1)] transition duration-200"
                    >
                        <img src={editIcon} alt="Edit Icon" className="h-4" />
                    </button>
                    <button
                        onClick={handleDelete}
                        className="h-auto w-auto cursor-pointer p-1 border border-[rgba(0,0,0,0.2)] rounded-lg hover:bg-[rgba(0,0,0,0.1)] transition duration-200"
                    >
                        <img src={deleteIcon} alt="Delete Icon" className="h-4" />
                    </button>
                </div>
            </div>
        </>
    )
}
import { Link, useLocation } from "react-router-dom"

export default function NavLink({ sidebarStatus, image, title, link }) {
    const location = useLocation()
    const isActive = location.pathname === link

    return(
        <>
            <Link to={link || "#"} className={`w-full h-10 flex flex-row items-center rounded-lg transition duration-200 cursor-pointer ${
                sidebarStatus ? 'xl:gap-4 xl:px-3 justify-center xl:justify-start' : 'justify-start xl:justify-center px-3 gap-4'
            } ${
                isActive
                    ? 'bg-black'
                    : 'bg-transparent text-black hover:bg-gray-100'
            }`}>
                <img src={image} className={`h-5 w-5 ${ isActive ? 'invert' : '' }`} />
                <p className={`${sidebarStatus ? 'hidden xl:block' : 'block xl:hidden'} font-medium ${ isActive ? 'text-white' : 'text-black' }`}>{ title }</p>
            </Link>
        </>
    )
}
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import useFetchUser from "../../utils/useFetchUser.js"
import { BusinessesContext } from '../../context/BusinessesProvider.js';
import "./Header.css"

import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../context/UserProvider';

const dayjs = require('dayjs')


const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useContext(UserContext);

    const { refreshBusinesses } = useContext(BusinessesContext);
    const { refreshUser } = useContext(UserContext);
    const [currentTime, setCurrentTime] = useState(dayjs());

    const logout = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/google/logoutCallback`, {
                method: "GET",
                credentials: "include", // Ensure cookies (session) are sent with the request
            });

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            // Redirect to the homepage after successful logout
            navigate("/");
        } catch (error) {
            console.error("Error:", error);
            // Handle error gracefully (e.g., show error message)
        }
        refreshBusinesses();
        refreshUser();
    }
    const loggedIn = (user) => {
        if (user) {
            return (
                <button onClick={logout} style={{ marginLeft: "auto" }} className="login-button">
                    Logout
                    {/* <a href="/logout" class="link">Logout</a> */}
                </button>
            )
        }
        else {
            return (
                <NavLink to={"/login"} className="login-button" >
                    Login
                </NavLink>)
        }
    }

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentTime(dayjs());
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <>
            <div className='site-header'>
                {
                    location.pathname !== '/businesses'
                    &&
                    <NavLink to={"/businesses"} className="login-button" style={{ margin: 10 }}>
                        Businesses
                    </NavLink>
                }
                <div style={{ height: "100%", alignContent: "center", padding: 10 }}>
                    {currentTime.format("ddd, MMMM D YYYY, hh:mm:ss A")}
                </div>
                {loggedIn(user)}
            </div >
            <Outlet />
        </>
    );
}

export default Header;
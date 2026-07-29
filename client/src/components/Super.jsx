import React, { useEffect } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import apis from '../utils/apis'


const Super = () => {

    const [isAuth, setIsAuth] = React.useState(false);
    const [loading, setLoading] = React.useState(true);


    useEffect(() => {
        const getRouteAccess = async () => {
            try {
                setLoading(true);
                const response = await fetch(apis().list.getAccess, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ token: localStorage.getItem('passToken') }),
                });

                const result = await response.json();
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                if (result?.status) {
                    setLoading(false);
                    setIsAuth(true);
                }

            } catch (error) {
                toast.error(error.message);
                setIsAuth(false);
            }
        }

        getRouteAccess();
    }, []);


    if (loading) {
        return <h2>Loading...</h2>;
    }

    if (isAuth) {
        return <Outlet />;
    } else {
        return <Navigate to="/login" />;
    }

}

export default Super

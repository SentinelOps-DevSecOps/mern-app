import React, { useState, useEffect } from 'react';
import apis from '../../utils/apis';

const OTPSection = ({ email }) => {
    const [counter, setCounter] = useState(60);
    const [resendDisabled, setResendDisabled] = useState(true);
    const [message, setMessage] = useState('');

    // Countdown timer effect
    useEffect(() => {
        let timer;
        if (resendDisabled && counter > 0) {
            timer = setInterval(() => {
                setCounter((prev) => prev - 1);
            }, 1000);
        } else if (counter === 0) {
            setResendDisabled(false);
        }
        return () => clearInterval(timer);
    }, [counter, resendDisabled]);

    const handleResendOTP = async () => {
        try {
            setResendDisabled(true);
            setCounter(60); // Restart countdown

            const response = await fetch(apis().forgetPassword, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: localStorage.getItem(email) }),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result?.message || 'Failed to resend OTP');
            }

            if (result?.status) {
                console.log(result);
            }

        } catch (error) {
            setMessage(error.response?.data?.message || 'Something went wrong');
            // If backend says "wait X seconds", you can extract that value and setCounter(X)
        }
    };

    return (
        <div>
            <p>{message}</p>
            <button
                onClick={handleResendOTP}
                disabled={resendDisabled}
                style={{
                    all: 'unset',
                    cursor: resendDisabled ? 'not-allowed' : 'pointer',
                    backgroundColor: resendDisabled ? 'none' : 'none',
                    color: '#8A0302',
                }}
            >
                {resendDisabled ? `Resend OTP in ${counter}s` : 'Resend OTP'}
            </button>
        </div>
    );
};

export default OTPSection;

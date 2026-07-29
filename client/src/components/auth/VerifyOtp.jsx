import React, { useEffect, useRef } from 'react'
import { useState } from 'react'
import Button from '../ui/Button'
import BackToLogin from '../ui/BackToLogin'
import { FaFingerprint } from "react-icons/fa";
import HomePage from './HomePage';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import apis from '../../utils/apis';
import LoadingButton from '../ui/LoadingButton';
import ResendButton from './ResendButton';
import '../../style/auth.css';
import Navbar from '../navbar/Navbar';
import Footer from '../navbar/Footer';


const VerifyOtp = () => {

    const ref1 = useRef(null);
    const ref2 = useRef(null);
    const ref3 = useRef(null);
    const ref4 = useRef(null);
    const ref5 = useRef(null);
    const ref6 = useRef(null);
    const navigate = useNavigate();

    const inputRef = [ref1, ref2, ref3, ref4, ref5, ref6];

    const [loading, setLoading] = React.useState(false);
    const [, setOtpTime] = useState(null);
    const [opt1, setOpt1] = useState('');
    const [opt2, setOpt2] = useState('');
    const [opt3, setOpt3] = useState('');
    const [opt4, setOpt4] = useState('');
    const [opt5, setOpt5] = useState('');
    const [opt6, setOpt6] = useState('');

    const otpArray = [setOpt1, setOpt2, setOpt3, setOpt4, setOpt5, setOpt6];

    const getTime = async () => {
        try {
            const response = await fetch(apis().list.getOtpTime, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: localStorage.getItem('passToken') })
            });

            const result = await response.json();
            console.log("API Response:", result); // Debug: log full response

            if (!response.ok) {
                throw new Error(result?.message || 'Failed to fetch OTP time');
            }

            const sendTimeStr = result?.sendTime;
            if (!sendTimeStr) {
                throw new Error('sendTime not found in response');
            }

            const sendTimeMs = new Date(sendTimeStr).getTime(); // parse to ms
            if (isNaN(sendTimeMs)) {
                throw new Error('Invalid sendTime format from server');
            }

            const otpValidityMs = 5 * 60 * 1000; // 5 minutes OTP validity
            const remainingTime = (sendTimeMs + otpValidityMs) - new Date().getTime();

            console.log("Remaining Time (ms):", remainingTime); // Debug log

            if (remainingTime > 0) {
                setOtpTime(remainingTime);
            } else {
                console.log("OTP already expired");
            }

        } catch (error) {
            toast.error(error.message || 'Something went wrong');
            console.error("Error in getTime:", error);
        }
    };



    useEffect(() => {

        if (ref1.current) {
            ref1.current.focus();
        }
        getTime();
    }, []);


    const inputChange = (e, location) => {
        if (location < 5 && e.target.value) {
            inputRef[location + 1].current.focus();
        }
        otpArray[location](e.target.value);
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        const finalotp = opt1 + opt2 + opt3 + opt4 + opt5 + opt6;
        console.log(finalotp);

        // Handle OTP verification logic here
        try {
            setLoading(true);
            const response = await fetch(apis().list.otpVerify, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ otp: finalotp })
            });

            const result = await response.json();
            setLoading(false);
            if (!response.ok) {
                throw new Error(result?.message);
            }
            if (result?.status) {
                toast.success(result?.message);
                console.log(result);
                localStorage.setItem('passToken', result.token); // Make sure your backend returns token in response

                navigate('/password/update'); // Redirect to password update page after successful verification
            } else {
                throw new Error(result?.message || 'OTP verification failed');
            }
        } catch (error) {
            toast.error(error.message);
        }

    };

    return (
        <div> <Navbar />
            <div className='auth_main'>

                <div className='auth_left'>
                    <HomePage />
                </div>
                <div className='auth_right'>
                    <div className='auth_card'>
                        <form onSubmit={submitHandler}>
                            <div className="auth_container">
                                <div className='auth_header'>
                                    <FaFingerprint />
                                    <p className='auth_heading'>Verify OTP</p>
                                    <p className='auth_title'>Enter the OTP sent to your email</p>
                                </div>
                                <div className='auth_item'>
                                    <label> OTP *</label>
                                    <div className='otp_input_container'>
                                        {inputRef.map((item, index) => {
                                            return (
                                                <input
                                                    required
                                                    key={index}
                                                    onChange={(e) => { inputChange(e, index) }}
                                                    ref={item}
                                                    onInput={(e) => {
                                                        if (e.target.value.length > 1) {
                                                            e.target.value = e.target.value.slice(0, 1);
                                                        }
                                                    }}
                                                    type='number'
                                                    className='ui_input otp_input' />
                                            )
                                        })}

                                    </div>
                                </div>
                                <div className='timer_container'>
                                    <ResendButton />
                                </div>
                                <div className='auth_action'>
                                    <Button>
                                        <LoadingButton loading={loading} title="Verify" />
                                    </Button>
                                </div>
                                <div>
                                    <BackToLogin />
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    )
}

export default VerifyOtp

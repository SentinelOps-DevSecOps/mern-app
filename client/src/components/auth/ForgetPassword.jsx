import React from 'react'
import Input from '../ui/Input'
import BackToLogin from '../ui/BackToLogin'
import Button from '../ui/Button'
import { useNavigate } from 'react-router-dom'
import HomePage from './HomePage'
import toast from 'react-hot-toast';
import apis from '../../utils/apis';
import LoadingButton from '../ui/LoadingButton';
import Navbar from '../navbar/Navbar'
import Footer from '../navbar/Footer'


const ForgetPassword = () => {

    const [email, setEmail] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const navigate = useNavigate();
    const emailChange = (e) => {
        setEmail(e.target.value);
    }

    const submitHandler = async (e) => {
        e.preventDefault();
        // Handle registration logic here

        try {
            setLoading(true);
            const response = await fetch(apis().list.forgetPassword, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const result = await response.json();
            setLoading(false);
            if (!response.ok) {
                throw new Error(result?.message);
            }
            if (result?.status) {
                toast.success(result?.message);

                console.log(result)
                localStorage.setItem('token', result?.token);
                localStorage.setItem('email', email); // Store the email in local storage if needed
                // Store the token in local storage
                navigate('/otp/verify'); // Redirect to OTP verification page after successful request
            }

            console.log(result);

        } catch (error) {
            toast.error(error.message || 'Something went wrong');
        }

        // navigate('/otp/verify');
    };

    return (
        <div>
            <Navbar />

            <div className='auth_main'>
                <div className='auth_left'>
                    <HomePage />
                </div>
                <div className='auth_right'>
                    <form onSubmit={submitHandler}>
                        <div className="auth_container">
                            <div className='auth_header'>
                                <p className='auth_heading'>Forget Password</p>
                                <p className='auth_title'>Enter your email to reset password</p>
                            </div>
                            <div className='auth_item'>
                                <label> Email *</label>
                                <Input onChange={emailChange} type='email' required placeholder='enter your email' />
                            </div>
                            <div className='auth_action'>
                                <Button>
                                    <LoadingButton loading={loading} title="Sent OTP" />
                                </Button>
                            </div>
                            <div>
                                <BackToLogin />
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            <Footer />
        </div>
    )
}

export default ForgetPassword

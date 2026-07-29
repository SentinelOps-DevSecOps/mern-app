import React from 'react'
import Input from '../ui/Input';
import Button from '../ui/Button';
import BackToLogin from '../ui/BackToLogin';
import { GrUpdate } from "react-icons/gr";
import { useNavigate } from 'react-router-dom';
import HomePage from './HomePage';
import { toast } from 'react-hot-toast';
import apis from '../../utils/apis'; // Adjust the import path as necessary
import LoadingButton from '../ui/LoadingButton';
import Navbar from '../navbar/Navbar';
import Footer from '../navbar/Footer';

const UpdatePassword = () => {

    const [loading, setLoading] = React.useState(false);
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const navigate = useNavigate();

    const passwordChange = (e) => {
        setPassword(e.target.value);
    }

    const confirmPasswordChange = (e) => {
        setConfirmPassword(e.target.value);
    }


    const submitHandler = async (e) => {
        e.preventDefault();

        try {
            if (password !== confirmPassword) {
                throw new Error("Passwords do not match");
            }

            const token = localStorage.getItem('passToken');
            if (!token) {
                toast.error('Token missing. Please restart the password reset process.');
                return;
            }
            setLoading(true);
            const response = await fetch(apis().list.updatePassword, { // Adjust the endpoint as needed
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, password, confirmPassword }) // Assuming you have a token for authentication
            });

            const result = await response.json();
            setLoading(false);
            if (!response.ok) {
                throw new Error(result?.message || 'Failed to update password');
            }

            if (result?.status) {
                toast.success(result?.message);
                localStorage.removeItem('passToken');
                navigate('/login'); // Redirect to login page after successful update
                // Clear any existing access token
            }
        } catch (error) {
            toast.error(error.message || 'Something went wrong');
        }
    }


    return (
        <div>
            <Navbar />

            <div className='auth_main'>
                <div className='auth_left'>
                    <HomePage />
                </div>
                <div className='auth_right'>
                    <div className='auth_card'>
                        <form onSubmit={submitHandler}>
                            <div className="auth_container">
                                <div className='auth_header'>
                                    <GrUpdate />
                                    <p className='auth_heading'>Update Password</p>
                                    <p className='auth_title'>Enter your new password</p>
                                </div>
                                <div className='auth_item'>
                                    <label> New Password *</label>
                                    <Input onChange={passwordChange} type='password' required placeholder='enter your new password' />
                                </div>
                                <div className='auth_item'>
                                    <label> Confirm Password *</label>
                                    <Input onChange={confirmPasswordChange} type='password' required placeholder='confirm your new password' />
                                </div>
                                <div className='auth_action'>
                                    <Button>
                                        <LoadingButton loading={loading} title="Update Password" />
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

export default UpdatePassword;

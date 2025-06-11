import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        password2: '',
        role: 'merchandiser',
        firstName: '',
        lastName: ''
    });
    const [message, setMessage] = useState('');
    const {register, user} = useAuth(); // Get user state from context
    const navigate = useNavigate();

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);


    const handleChange = (e) => {
        setFormData({...formData, [e.target.name]: e.target.value});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        if (formData.password !== formData.password2) {
            setMessage('Passwords do not match!');
            return;
        }

        try {
            await register(
                formData.username,
                formData.email,
                formData.password,
                formData.password2,
                formData.role,
                formData.firstName,
                formData.lastName
            );
            setMessage('Registration successful! Please log in.');
            navigate('login/');
        } catch (error) {
            console.error('Registration error:', error.response?.data || error);
            const errorMessages = error.response?.data
                ? Object.values(error.response.data).flat().join(' ')
                : 'Registration failed.';
            setMessage(errorMessages);
        }
    };

    return (
        <div>
            <h2>Register</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="username">Username:</label>
                    <input type="text" id="username" name="username" value={formData.username} onChange={handleChange}
                           required/>
                </div>
                <div>
                    <label htmlFor="email">Email:</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange}
                           required/>
                </div>
                {/*<div>*/}
                {/*    <label htmlFor="firstName">First Name:</label>*/}
                {/*    <input type="text" id="firstName" name="firstName" value={formData.firstName}*/}
                {/*           onChange={handleChange}/>*/}
                {/*</div>*/}
                {/*<div>*/}
                {/*    <label htmlFor="lastName">Last Name:</label>*/}
                {/*    <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange}/>*/}
                {/*</div>*/}
                <div>
                    <label htmlFor="password">Password:</label>
                    <input type="password" id="password" name="password" value={formData.password}
                           onChange={handleChange} required/>
                </div>
                <div>
                    <label htmlFor="password2">Confirm Password:</label>
                    <input type="password" id="password2" name="password2" value={formData.password2}
                           onChange={handleChange} required/>
                </div>
                {/*<div>*/}
                {/*    <label htmlFor="role">Role:</label>*/}
                {/*    <select id="role" name="role" value={formData.role} onChange={handleChange}>*/}
                {/*        <option value="merchandiser">Merchandiser</option>*/}
                {/*        <option value="manager">Manager</option>*/}
                {/*    </select>*/}
                {/*</div>*/}
                <button type="submit">Register</button>
                {message && <p style={{color: message.includes('successful') ? 'green' : 'red'}}>{message}</p>}
            </form>
        </div>
    );
};

export default Register;
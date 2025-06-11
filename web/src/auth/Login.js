import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';

const Login = () => {
    const [usernameOrEmail, setUsernameOrEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const {login, isAuthenticated} = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) { // Redirect if already logged in
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            await login(usernameOrEmail, password);
        } catch (error) {
            console.error('Login error:', error.response?.data || error);
            setMessage(error.response?.data?.detail || 'Login failed. Please check your credentials.');
        }
    };

    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="usernameOrEmail">Username or Email:</label>
                    <input
                        type="text"
                        id="usernameOrEmail"
                        value={usernameOrEmail}
                        onChange={(e) => setUsernameOrEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Login</button>
                {message && <p style={{color: 'red'}}>{message}</p>}
            </form>
        </div>
    );
};

export default Login;
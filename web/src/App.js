import React from 'react';
import {Routes, Route, Link, useNavigate, Navigate} from 'react-router-dom';
import Login from './auth/Login';
import Register from './auth/Register';

import Dashboard from './pages/Dashboard';
import {useAuth} from './context/AuthContext';

// PrivateRoute component for protected routes (as discussed before)
const PrivateRoute = ({children, allowedRoles}) => {
    const {user} = useAuth(); // User data from context
    if (!user) {
        return <Navigate to="/login" replace/>;
    }
    // Check if user object exists and has the nested 'role' property
    if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
        return <Navigate to="/dashboard" replace/>;
    }
    return children;
};

function App() {
    const {user, logout} = useAuth(); // Get tokens from context
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout(); // Context's logout function
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            alert(error.response?.data?.detail || 'Logout failed. Please try again.');
        }
    };

    return (
        <div className="App">
            <nav style={{
                marginBottom: '20px',
                padding: '10px',
                backgroundColor: '#f0f0f0',
                borderBottom: '1px solid #ddd'
            }}>
                <Link to="/stores" style={{marginRight: '15px'}}>See Stores</Link>
                {user && <Link to="/map" style={{marginRight: '15px'}}>Map</Link>}

                <div style={{float: 'right'}}>
                    {user ? (
                        <span style={{marginRight: '10px'}}>
                            Welcome, {user.first_name || user.username} ({user.role})!
                            <button onClick={handleLogout}
                                    style={{marginLeft: '10px', padding: '5px 10px'}}>Logout</button>
                        </span>
                    ) : (
                        <>
                            <Link to="/login" style={{marginRight: '15px'}}>Login</Link>
                            <Link to="/register">Register</Link>
                        </>
                    )}
                </div>
            </nav>

            <div style={{padding: '20px'}}>
                <Routes>
                    <Route path="/login" element={<Login/>}/>
                    <Route path="/register" element={<Register/>}/>
                    <Route path="/dashboard" element={
                        <PrivateRoute>
                            <Dashboard/>
                        </PrivateRoute>
                    }/>
                    <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace/>}/>
                </Routes>
            </div>
        </div>
    );
}

export default App;
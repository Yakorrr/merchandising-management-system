import React from 'react';
import {Link} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';


const Welcome = () => {
    const {user, currentUserRole} = useAuth(); // Check if user is logged in

    return (
        <div style={{textAlign: 'center', marginTop: '50px'}}>
            <h1>Welcome to Merchandising Management System!</h1>
            <p>Your one-stop solution for confectionery factory merchandising operations.</p>

            <div style={{marginTop: '30px'}}>
                {user ? (
                    <>
                        <p>You are already logged in as {currentUserRole}.</p>
                        <Link to="/dashboard" style={{
                            marginRight: '15px',
                            padding: '10px 20px',
                            border: '1px solid #007bff',
                            borderRadius: '5px',
                            textDecoration: 'none',
                            color: '#007bff'
                        }}>Go to Dashboard</Link>
                    </>
                ) : (
                    <>
                        <p>Please log in or register to get started.</p>
                        <Link to="/login" style={{
                            marginRight: '15px',
                            padding: '10px 20px',
                            border: '1px solid #007bff',
                            borderRadius: '5px',
                            textDecoration: 'none',
                            color: '#007bff'
                        }}>Login</Link>
                        <Link to="/register" style={{
                            padding: '10px 20px',
                            border: '1px solid #28a745',
                            borderRadius: '5px',
                            textDecoration: 'none',
                            color: '#28a745'
                        }}>Register</Link>
                    </>
                )}
            </div>

            <p style={{marginTop: '50px', fontSize: '0.9em', color: '#666'}}>
                This system helps merchandisers manage daily plans, place orders, and track store performance.
            </p>
        </div>
    );
};

export default Welcome;
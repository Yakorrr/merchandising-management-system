import React from 'react';
import {useAuth} from '../context/AuthContext';

const Dashboard = () => {
    const {user} = useAuth();

    return (
        <div>
            <h2>Dashboard</h2>
            {user ? (
                <>
                    <p>Welcome, {user?.first_name || user?.username}!</p>
                    <p>Your role: {user?.role}</p>
                    {/* Add more dashboard content here */}
                </>
            ) : (
                <p>Please log in to view the dashboard.</p>
            )}
        </div>
    );
};

export default Dashboard;
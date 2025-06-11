import React from 'react';
import {useAuth} from '../context/AuthContext';

const Dashboard = () => {
    const {user, isAuthReady, currentUserName, currentUserRole} = useAuth();

    if (!isAuthReady) {
        return <div>Initializing authentication...</div>;
    }

    if (!user) { // Should be protected by PrivateRoute, but good fallback
        return <p>Please log in to view the dashboard.</p>;
    }

    return (
        <div>
            <h2>Dashboard</h2>
            <p>Welcome, {currentUserName}!</p>
            <p>Your role: {currentUserRole}</p>
            {/* Add more dashboard content here */}
        </div>
    );
};

export default Dashboard;
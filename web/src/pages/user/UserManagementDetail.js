import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import axios from 'axios';
import {useAuth} from '../../context/AuthContext';

const UserManagementDetail = () => {
    const {id} = useParams();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const {isAuthenticated, isManager, isAuthReady, getAuthHeaders} = useAuth();

    useEffect(() => {
        const fetchUser = async () => {
            if (!isAuthReady) {
                return;
            }
            if (!isAuthenticated || !isManager) { // Only managers can view user details
                setError('You are not authorized to view user details.');
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const response = await axios.get(`/api/auth/users/${id}/`, {headers: getAuthHeaders()});
                setUser(response.data);
                setError(null);
            } catch (err) {
                console.error('Error fetching user details:', err);
                setError(err.response?.data?.detail || 'Failed to fetch user details.');
                if (err.response?.status === 404 || err.response?.status === 403) {
                    navigate('/users'); // Redirect to user list if not found or unauthorized
                }
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [id, isAuthenticated, isManager, isAuthReady, getAuthHeaders, navigate]);


    if (loading && !isAuthReady) {
        return <div>Initializing authentication...</div>;
    }
    if (loading) {
        return <div>Loading user details...</div>;
    }
    if (error) {
        return <div style={{color: 'red'}}>Error: {error}</div>;
    }
    if (!user) {
        return <div>User not found.</div>;
    }

    return (
        <div>
            <h2>{user.username} Details</h2>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p><strong>First Name:</strong> {user.first_name}</p>
            <p><strong>Last Name:</strong> {user.last_name}</p>
            <p><strong>Joined:</strong> {new Date(user.date_joined).toLocaleString()}</p>
            <button onClick={() => navigate('/users')}>Back to User Management</button>
        </div>
    );
};

export default UserManagementDetail;
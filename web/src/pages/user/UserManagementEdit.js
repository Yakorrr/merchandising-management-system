import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import axios from 'axios';
import {useAuth} from '../../context/AuthContext';
import UserForm from '../../components/UserForm';

const UserManagementEdit = () => {
    const {id} = useParams();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const {getAuthHeaders} = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                setLoading(true);
                // Fetch user details for pre-filling the form
                const response = await axios.get(`/api/auth/users/${id}/`, {headers: getAuthHeaders()});
                setUser(response.data);
                setError(null);
            } catch (err) {
                console.error('Error fetching user for edit:', err);
                setError(err.response?.data?.detail || 'Failed to load user for editing.');
                if (err.response?.status === 404 || err.response?.status === 403) {
                    navigate('/users');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [id, getAuthHeaders, navigate]);


    const handleSubmit = async (formData) => {
        setMessage('');

        try {
            // PATCH request to update user
            await axios.patch(`/api/auth/users/${id}/update/`, formData, {headers: getAuthHeaders()});
            setMessage('User updated successfully!');
            alert('User updated successfully!');
            navigate('/users'); // Redirect to user list
        } catch (err) {
            console.error('Error updating user:', err.response?.data || err);
            const errorMessages = err.response?.data
                ? Object.values(err.response.data).flat().join(' ')
                : 'Failed to update user.';
            setMessage(errorMessages);
        }
    };

    if (loading) {
        return <div>Loading user data for editing...</div>;
    }

    if (error) {
        return <div style={{color: 'red'}}>Error: {error}</div>;
    }

    if (!user) {
        return <div>User not found for editing.</div>;
    }

    return (
        <div>
            <h2>Edit User: {user.username}</h2>
            {/* Pass initialData for form pre-filling */}
            <UserForm initialData={user} onSubmit={handleSubmit} isEditMode={true} submitButtonText="Update User"/>
            {message && <p style={{color: message.includes('successfully') ? 'green' : 'red'}}>{message}</p>}
        </div>
    );
};

export default UserManagementEdit;
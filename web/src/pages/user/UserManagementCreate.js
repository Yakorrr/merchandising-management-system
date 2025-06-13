import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';
import {useAuth} from '../../context/AuthContext';
import UserForm from '../../components/UserForm';

const UserManagementCreate = () => {
    const [message, setMessage] = useState('');
    const {getAuthHeaders} = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (formData) => {
        setMessage('');

        try {
            await axios.post('/api/auth/users/create/', formData, {headers: getAuthHeaders()});
            setMessage('User created successfully!');
            alert('User created successfully!');
            navigate('/users'); // Redirect to user list
        } catch (err) {
            console.error('Error creating user:', err.response?.data || err);
            const errorMessages = err.response?.data
                ? Object.values(err.response.data).flat().join(' ')
                : 'Failed to create user.';
            setMessage(errorMessages);
        }
    };

    return (
        <div>
            <h2>Create New User</h2>
            <UserForm onSubmit={handleSubmit} submitButtonText="Create User"/>
            {message && <p style={{color: message.includes('successfully') ? 'green' : 'red'}}>{message}</p>}
        </div>
    );
};

export default UserManagementCreate;
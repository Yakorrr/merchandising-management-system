import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';
import {useAuth} from '../../context/AuthContext';
import StoreForm from '../../components/StoreForm';

const StoreCreate = () => {
    const [message, setMessage] = useState('');
    const {getAuthHeaders} = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (formData) => {
        setMessage('');
        try {
            await axios.post('/api/auth/stores/create/', formData, {headers: getAuthHeaders()});
            setMessage('Store created successfully!');
            alert('Store created successfully!');
            navigate('/stores'); // Redirect to stores list
        } catch (err) {
            console.error('Error creating store:', err.response?.data || err);
            const errorMessages = err.response?.data
                ? Object.values(err.response.data).flat().join(' ')
                : 'Failed to create store.';
            setMessage(errorMessages);
        }
    };

    return (
        <div>
            <h2>Create New Store</h2>
            <StoreForm onSubmit={handleSubmit} submitButtonText="Create Store"/>
            {message && <p style={{color: message.includes('successfully') ? 'green' : 'red'}}>{message}</p>}
        </div>
    );
};

export default StoreCreate;
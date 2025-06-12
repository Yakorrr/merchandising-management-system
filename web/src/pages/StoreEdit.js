import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import axios from 'axios';
import {useAuth} from '../context/AuthContext';
import StoreForm from '../components/StoreForm';

const StoreEdit = () => {
    const {id} = useParams(); // Get store ID from URL
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const {getAuthHeaders} = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStore = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`/api/auth/stores/${id}/`, {headers: getAuthHeaders()});
                setStore(response.data);
                setError(null);
            } catch (err) {
                console.error('Error fetching store for edit:', err);
                setError(err.response?.data?.detail || 'Failed to load store for editing.');
                // Redirect if store not found or no permission
                if (err.response?.status === 404 || err.response?.status === 403) {
                    navigate('/stores');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchStore();
    }, [id, getAuthHeaders, navigate]);


    const handleSubmit = async (formData) => {
        setMessage('');
        try {
            // PATCH request to update store
            await axios.patch(`/api/auth/stores/${id}/update/`, formData, {headers: getAuthHeaders()});
            setMessage('Store updated successfully!');
            alert('Store updated successfully!');
            navigate('/stores'); // Redirect to stores list
        } catch (err) {
            console.error('Error updating store:', err.response?.data || err);
            const errorMessages = err.response?.data ? Object.values(err.response.data).flat().join(' ') : 'Failed to update store.';
            setMessage(errorMessages);
        }
    };

    if (loading) {
        return <div>Loading store data for editing...</div>;
    }

    if (error) {
        return <div style={{color: 'red'}}>Error: {error}</div>;
    }

    if (!store) {
        return <div>Store not found for editing.</div>;
    }

    return (<div>
            <h2>Edit Store: {store.name}</h2>
            <StoreForm initialData={store} onSubmit={handleSubmit} isEditMode={true} submitButtonText="Update Store"/>
            {message && <p style={{color: message.includes('successfully') ? 'green' : 'red'}}>{message}</p>}
        </div>);
};

export default StoreEdit;
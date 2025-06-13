import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import axios from 'axios';
import {useAuth} from '../../context/AuthContext';
import OrderForm from '../../components/OrderForm';

const OrderEdit = () => {
    const {id} = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const {getAuthHeaders} = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`/api/auth/orders/${id}/`, {headers: getAuthHeaders()});
                setOrder(response.data);
                setError(null);
            } catch (err) {
                console.error('Error fetching order for edit:', err);
                setError(err.response?.data?.detail || 'Failed to load order for editing.');
                if (err.response?.status === 404 || err.response?.status === 403) {
                    navigate('/orders');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id, getAuthHeaders, navigate]);


    const handleSubmit = async (formData) => {
        setMessage('');
        try {
            // PATCH request to update order
            await axios.patch(`/api/auth/orders/${id}/update/`, formData, {headers: getAuthHeaders()});
            setMessage('Order updated successfully!');
            alert('Order updated successfully!');
            navigate('/orders');
        } catch (err) {
            console.error('Error updating order:', err.response?.data || err);
            const errorMessages = err.response?.data
                ? Object.values(err.response.data).flat().join(' ')
                : 'Failed to update order.';
            setMessage(errorMessages);
        }
    };

    if (loading) {
        return <div>Loading order data for editing...</div>;
    }

    if (error) {
        return <div style={{color: 'red'}}>Error: {error}</div>;
    }

    if (!order) {
        return <div>Order not found for editing.</div>;
    }

    return (
        <div>
            <h2>Edit Order: #{order.id}</h2>
            <OrderForm initialData={order} onSubmit={handleSubmit} isEditMode={true} submitButtonText="Update Order"/>
            {message && <p style={{color: message.includes('successfully') ? 'green' : 'red'}}>{message}</p>}
        </div>
    );
};

export default OrderEdit;
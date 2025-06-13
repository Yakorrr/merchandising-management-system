import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';
import {useAuth} from '../../context/AuthContext';
import OrderForm from '../../components/OrderForm';

const OrderCreate = () => {
    const [message, setMessage] = useState('');
    const {getAuthHeaders} = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (formData) => {
        setMessage('');
        try {
            await axios.post('/api/auth/orders/create/', formData, {headers: getAuthHeaders()});
            setMessage('Order created successfully!');
            alert('Order created successfully!');
            navigate('/orders');
        } catch (err) {
            console.error('Error creating order:', err.response?.data || err);
            const errorMessages = err.response?.data
                ? Object.values(err.response.data).flat().join(' ')
                : 'Failed to create order.';
            setMessage(errorMessages);
        }
    };

    return (
        <div>
            <h2>Create New Order</h2>
            <OrderForm onSubmit={handleSubmit} submitButtonText="Create Order"/>
            {message && <p style={{color: message.includes('successfully') ? 'green' : 'red'}}>{message}</p>}
        </div>
    );
};

export default OrderCreate;
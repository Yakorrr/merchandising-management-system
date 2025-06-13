import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';
import {useAuth} from '../../context/AuthContext';
import ProductForm from '../../components/ProductForm';

const ProductCreate = () => {
    const [message, setMessage] = useState('');
    const {getAuthHeaders} = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (formData) => {
        setMessage('');
        try {
            await axios.post('/api/auth/products/create/', formData, {headers: getAuthHeaders()});
            setMessage('Product created successfully!');
            alert('Product created successfully!');
            navigate('/products'); // Redirect to products list
        } catch (err) {
            console.error('Error creating product:', err.response?.data || err);
            const errorMessages = err.response?.data
                ? Object.values(err.response.data).flat().join(' ')
                : 'Failed to create product.';
            setMessage(errorMessages);
        }
    };

    return (
        <div>
            <h2>Create New Product</h2>
            <ProductForm onSubmit={handleSubmit} submitButtonText="Create Product"/>
            {message && <p style={{color: message.includes('successfully') ? 'green' : 'red'}}>{message}</p>}
        </div>
    );
};

export default ProductCreate;
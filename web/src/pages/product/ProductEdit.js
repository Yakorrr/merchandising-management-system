import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import axios from 'axios';
import {useAuth} from '../../context/AuthContext';
import ProductForm from '../../components/ProductForm';

const ProductEdit = () => {
    const {id} = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const {getAuthHeaders} = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`/api/auth/products/${id}/`, {headers: getAuthHeaders()});
                setProduct(response.data);
                setError(null);
            } catch (err) {
                console.error('Error fetching product for edit:', err);
                setError(err.response?.data?.detail || 'Failed to load product for editing.');
                if (err.response?.status === 404 || err.response?.status === 403) {
                    navigate('/products');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id, getAuthHeaders, navigate]);


    const handleSubmit = async (formData) => {
        setMessage('');
        try {
            // PATCH request to update product
            await axios.patch(`/api/auth/products/${id}/update/`, formData, {headers: getAuthHeaders()});
            setMessage('Product updated successfully!');
            alert('Product updated successfully!');
            navigate('/products'); // Redirect to products list
        } catch (err) {
            console.error('Error updating product:', err.response?.data || err);
            const errorMessages = err.response?.data
                ? Object.values(err.response.data).flat().join(' ')
                : 'Failed to update product.';
            setMessage(errorMessages);
        }
    };

    if (loading) {
        return <div>Loading product data for editing...</div>;
    }

    if (error) {
        return <div style={{color: 'red'}}>Error: {error}</div>;
    }

    if (!product) {
        return <div>Product not found for editing.</div>;
    }

    return (
        <div>
            <h2>Edit Product: {product.name}</h2>
            <ProductForm initialData={product} onSubmit={handleSubmit} isEditMode={true}
                         submitButtonText="Update Product"/>
            {message && <p style={{color: message.includes('successfully') ? 'green' : 'red'}}>{message}</p>}
        </div>
    );
};

export default ProductEdit;
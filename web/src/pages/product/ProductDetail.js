import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import axios from 'axios';
import {useAuth} from '../../context/AuthContext';

const ProductDetail = () => {
    const {id} = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const {isAuthenticated, isAuthReady, getAuthHeaders} = useAuth();

    useEffect(() => {
        const fetchProduct = async () => {
            if (!isAuthReady) {
                return;
            }
            if (!isAuthenticated) {
                setError('You must be logged in to view product details.');
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const response = await axios.get(
                    `/api/auth/products/${id}/`,
                    {headers: getAuthHeaders()}
                );
                setProduct(response.data);
                setError(null);
            } catch (err) {
                console.error('Error fetching product details:', err);
                setError(err.response?.data?.detail || 'Failed to fetch product details.');
                if (err.response?.status === 404 || err.response?.status === 403) {
                    navigate('/products');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id, isAuthenticated, isAuthReady, getAuthHeaders, navigate]);


    if (loading && !isAuthReady) {
        return <div>Initializing authentication...</div>;
    }
    if (loading) {
        return <div>Loading product details...</div>;
    }
    if (error) {
        return <div style={{color: 'red'}}>Error: {error}</div>;
    }
    if (!product) {
        return <div>Product not found.</div>;
    }

    return (
        <div>
            <h2>{product.name} Details</h2>
            <p><strong>Price:</strong> ${product.price}</p>
            <p><strong>Description:</strong> {product.description || 'N/A'}</p>
            <p><strong>Created At:</strong> {new Date(product.created_at).toLocaleString()}</p>
            <p><strong>Last Updated:</strong> {new Date(product.updated_at).toLocaleString()}</p>
            <button onClick={() => navigate('/products')}>Back to Products</button>
        </div>
    );
};

export default ProductDetail;
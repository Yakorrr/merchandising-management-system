import React, {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import axios from 'axios';
import {useAuth} from '../../context/AuthContext';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const {isAuthenticated, isAuthReady, isManager, getAuthHeaders} = useAuth();

    const fetchProducts = async () => {
        if (!isAuthReady) {
            return;
        }
        if (!isAuthenticated) {
            setError('You must be logged in to view products.');
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const response = await axios.get(
                '/api/auth/products/',
                {headers: getAuthHeaders()}
            );
            setProducts(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching products:', err);
            if (err.response?.status === 401 || err.response?.status === 403) {
                setError('Authentication required or not authorized.');
            } else {
                setError(err.response?.data?.detail || 'Failed to fetch products.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [isAuthenticated, isAuthReady, getAuthHeaders]);


    const handleDeleteProduct = async (productId, productName) => {
        if (!window.confirm(`Are you sure you want to delete product "${productName}"? This action cannot be undone.`)) {
            return;
        }
        try {
            await axios.delete(`/api/auth/products/${productId}/delete/`, {headers: getAuthHeaders()});
            alert(`Product "${productName}" deleted successfully!`);
            fetchProducts(); // Re-fetch products to update the list
        } catch (err) {
            console.error('Error deleting product:', err);
            alert(err.response?.data?.detail || 'Failed to delete product. You might not have permissions.');
        }
    };


    if (loading && !isAuthReady) {
        return <div>Initializing authentication...</div>;
    }
    if (loading) {
        return <div>Loading products...</div>;
    }
    if (error) {
        return <div style={{color: 'red'}}>Error: {error}</div>;
    }

    return (
        <div>
            <h2>Our Products</h2>
            {isManager && (
                <Link to="/products/create" style={{
                    textDecoration: 'none',
                    padding: '8px 15px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    borderRadius: '5px',
                    marginBottom: '20px',
                    display: 'inline-block'
                }}>
                    + Add New Product
                </Link>
            )}
            {products.length === 0 ? (
                <p>No products found.</p>
            ) : (
                <ul style={{listStyleType: 'none', padding: 0}}>
                    {products.map(product => (
                        <li key={product.id} style={{
                            border: '1px solid #ddd',
                            padding: '10px',
                            marginBottom: '10px',
                            borderRadius: '5px'
                        }}>
                            <h3>{product.name} (Price: ${product.price})</h3>
                            <p>Description: {product.description || 'N/A'}</p>
                            <div style={{marginTop: '10px'}}>
                                <Link to={`/products/${product.id}`}
                                      style={{textDecoration: 'none', color: '#007bff', marginRight: '10px'}}>View
                                    Details</Link>
                                {isManager && (
                                    <>
                                        <Link to={`/products/${product.id}/edit`} style={{
                                            textDecoration: 'none',
                                            color: '#ffc107',
                                            marginRight: '10px'
                                        }}>Edit</Link>
                                        <button onClick={() =>
                                            handleDeleteProduct(product.id, product.name)} style={{
                                            padding: '5px 10px',
                                            backgroundColor: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '3px',
                                            cursor: 'pointer'
                                        }}>Delete
                                        </button>
                                    </>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ProductList;
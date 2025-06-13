import React, {useState, useEffect} from 'react';
import axios from 'axios';
import {useAuth} from '../context/AuthContext';
import {format} from 'date-fns';

const OrderForm = ({initialData = {}, onSubmit, isEditMode = false, submitButtonText}) => {
    const {getAuthHeaders, currentUserRole} = useAuth();
    const [products, setProducts] = useState([]); // List of available products
    const [stores, setStores] = useState([]);     // List of available stores
    const [message, setMessage] = useState('');

    const [formData, setFormData] = useState(() => {
        // Initialize with default values or initialData
        const today = format(new Date(), 'yyyy-MM-dd');
        return {
            store: initialData.store || '',
            order_date: initialData.order_date ? format(new Date(initialData.order_date), 'yyyy-MM-dd') : today,
            status: initialData.status || 'created',
            items: initialData.items && initialData.items.length > 0
                ? initialData.items.map(item => ({
                    id: item.id, // Keep item ID for updates
                    product: item.product,
                    quantity: item.quantity,
                    price_per_unit: item.price_per_unit
                }))
                : [{
                    product: '',
                    quantity: 1,
                    price_per_unit: ''
                }],
        };
    });

    // Fetch products and stores on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const productsResponse = await axios.get(
                    '/api/auth/products/',
                    {headers: getAuthHeaders()}
                );
                setProducts(productsResponse.data);

                const storesResponse = await axios.get(
                    '/api/auth/stores/',
                    {headers: getAuthHeaders()}
                );
                setStores(storesResponse.data);
            } catch (err) {
                console.error('Error fetching products/stores for order form:', err);
                setMessage('Failed to load necessary data for form.');
            }
        };
        fetchData();
    }, [getAuthHeaders]);


    const handleOrderChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleItemChange = (index, e) => {
        const {name, value} = e.target;
        const newItems = formData.items.map((item, i) => {
            if (i === index) {
                // If product changes, try to set default price
                if (name === 'product' && products.length > 0) {
                    const selectedProduct = products.find(p => p.id === parseInt(value));
                    let quantity = selectedProduct ? 1 : '';
                    let price_per_unit = selectedProduct ? selectedProduct.price : '';

                    return {
                        ...item, [name]: value, quantity: quantity, price_per_unit: price_per_unit
                    };
                }
                return {...item, [name]: value};
            }
            return item;
        });
        setFormData(prev => ({...prev, items: newItems}));
    };

    const handleAddItem = () => {
        setFormData(prev => ({...prev, items: [...prev.items, {product: '', quantity: 1, price_per_unit: ''}]}));
    };

    const handleRemoveItem = (index) => {
        setFormData(prev => ({...prev, items: prev.items.filter((_, i) => i !== index)}));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setMessage('');

        // Basic client-side validation
        if (!formData.store || !formData.order_date || formData.items.length === 0) {
            setMessage('Please fill all required fields for the order and add at least one item.');
            return;
        }
        // Validate each item
        for (const item of formData.items) {
            if (!item.product || item.quantity <= 0 || item.price_per_unit <= 0) {
                setMessage('Each order item must have a selected product, quantity > 0, and price > 0.');
                return;
            }
        }

        // Convert item product IDs to numbers and price_per_unit/quantity to correct types
        const itemsToSend = formData.items.map(item => ({
            id: item.id || undefined, // Keep ID for update, remove for create
            product: parseInt(item.product),
            quantity: parseInt(item.quantity),
            price_per_unit: parseFloat(item.price_per_unit)
        }));

        const dataToSend = {
            ...formData,
            items: itemsToSend,
            total_amount: undefined, // Total amount is calculated on backend
        };

        // Remove store_name, merchandiser_username etc. if they are part of formData
        const cleanDataToSend = {...dataToSend};
        Object.keys(cleanDataToSend).forEach(key => {
            if (key.includes('_name') || key.includes('_username')) {
                delete cleanDataToSend[key];
            }
        });


        onSubmit(cleanDataToSend); // Pass processed data up to the parent
    };


    return (
        <form onSubmit={handleSubmit}>
            {currentUserRole === 'manager' && isEditMode && ( // Only manager can change store in edit mode
                <div>
                    <label htmlFor="store">Store:</label>
                    <select id="store" name="store" value={formData.store} onChange={handleOrderChange} required
                            disabled={!isEditMode}>
                        <option value="">Select a store</option>
                        {stores.map(store => (
                            <option key={store.id} value={store.id}>{store.name}</option>
                        ))}
                    </select>
                </div>
            )}
            {/* For non-manager (merchandiser) or create mode, store is dropdown (not disabled) */}
            {(currentUserRole !== 'manager' || !isEditMode) && (
                <div>
                    <label htmlFor="store">Store:</label>
                    <select id="store" name="store" value={formData.store} onChange={handleOrderChange} required>
                        <option value="">Select a store</option>
                        {stores.map(store => (
                            <option key={store.id} value={store.id}>{store.name}</option>
                        ))}
                    </select>
                </div>
            )}

            <div>
                <label htmlFor="order_date">Order Date:</label>
                <input type="date" id="order_date" name="order_date" value={formData.order_date}
                       onChange={handleOrderChange} required/>
            </div>
            {currentUserRole === 'manager' && ( // Only manager can change status
                <div>
                    <label htmlFor="status">Status:</label>
                    <select id="status" name="status" value={formData.status} onChange={handleOrderChange}>
                        <option value="created">Created</option>
                        <option value="processed">Processed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            )}

            <h3>Order Items:</h3>
            {formData.items.map((item, index) => (
                <div key={index} style={{border: '1px dashed #ccc', padding: '10px', marginBottom: '10px'}}>
                    <div>
                        <label htmlFor={`product-${index}`}>Product:</label>
                        <select id={`product-${index}`} name="product" value={item.product}
                                onChange={(e) => handleItemChange(index, e)} required>
                            <option value="">Select a product</option>
                            {products.map(product => (
                                <option key={product.id} value={product.id}>{product.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor={`quantity-${index}`}>Quantity:</label>
                        <input type="number" id={`quantity-${index}`} name="quantity" value={item.quantity}
                               onChange={(e) => handleItemChange(index, e)} min="1" required/>
                    </div>
                    <div>
                        <label htmlFor={`price_per_unit-${index}`}>Price Per Unit:</label>
                        <input type="number" step="0.01" id={`price_per_unit-${index}`} name="price_per_unit"
                               value={item.price_per_unit} onChange={(e) => handleItemChange(index, e)} min="0.01"
                               required/>
                    </div>
                    {formData.items.length > 1 && (
                        <button type="button" onClick={() => handleRemoveItem(index)} style={{
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '3px',
                            cursor: 'pointer'
                        }}>Remove Item</button>
                    )}
                </div>
            ))}
            <button type="button" onClick={handleAddItem} style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '8px 15px',
                borderRadius: '5px',
                cursor: 'pointer',
                marginBottom: '20px'
            }}>Add Item
            </button>

            <button type="submit">{submitButtonText || (isEditMode ? 'Update Order' : 'Create Order')}</button>
            {message && <p style={{color: message.includes('successfully') ? 'green' : 'red'}}>{message}</p>}
        </form>
    );
};

export default OrderForm;
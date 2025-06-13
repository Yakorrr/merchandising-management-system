import React, {useState} from 'react';

const ProductForm = ({initialData = {}, onSubmit, isEditMode = false, submitButtonText}) => {
    const [formData, setFormData] = useState(() => {
        return {
            name: initialData.name || '',
            description: initialData.description || '',
            price: initialData.price || 0, // Price can be only number
        };
    });

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSend = {...formData};

        // Ensure price is a number or null/undefined
        if (dataToSend.price !== '' && dataToSend.price !== null) {
            dataToSend.price = parseFloat(dataToSend.price);
            if (isNaN(dataToSend.price)) {
                alert('Price must be a valid number.');
                return;
            }
        } else {
            dataToSend.price = null; // Send null if empty, or adjust based on backend requirement
        }

        onSubmit(dataToSend);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label htmlFor="name">Product Name:</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required/>
            </div>
            <div>
                <label htmlFor="description">Description:</label>
                <textarea id="description" name="description" value={formData.description} onChange={handleChange}
                          rows="4"></textarea>
            </div>
            <div>
                <label htmlFor="price">Price:</label>
                <input type="number" step="0.01" id="price" name="price" value={formData.price} onChange={handleChange}
                       required/>
            </div>
            <button type="submit">{submitButtonText || (isEditMode ? 'Update Product' : 'Create Product')}</button>
        </form>
    );
};

export default ProductForm;
import React, {useState, useEffect} from 'react';

const StoreForm = ({initialData = {}, onSubmit, isEditMode = false, submitButtonText}) => {
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        latitude: '',
        longitude: '',
        contact_person_name: '',
        contact_person_phone: '',
        ...initialData // Populate with initialData for edit mode
    });

    // Update form data if initialData changes (important for edit mode when navigated via link)
    useEffect(() => {
        setFormData(prev => ({...prev, ...initialData}));
    }, [initialData]);


    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData); // Pass current form data up to the parent component
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label htmlFor="name">Store Name:</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required/>
            </div>
            <div>
                <label htmlFor="address">Address:</label>
                <input type="text" id="address" name="address" value={formData.address} onChange={handleChange}
                       required/>
            </div>
            <div>
                <label htmlFor="latitude">Latitude:</label>
                <input type="number" step="any" id="latitude" name="latitude" value={formData.latitude}
                       onChange={handleChange}/>
            </div>
            <div>
                <label htmlFor="longitude">Longitude:</label>
                <input type="number" step="any" id="longitude" name="longitude" value={formData.longitude}
                       onChange={handleChange}/>
            </div>
            <div>
                <label htmlFor="contact_person_name">Contact Person:</label>
                <input type="text" id="contact_person_name" name="contact_person_name"
                       value={formData.contact_person_name} onChange={handleChange}/>
            </div>
            <div>
                <label htmlFor="contact_person_phone">Contact Phone:</label>
                <input type="text" id="contact_person_phone" name="contact_person_phone"
                       value={formData.contact_person_phone} onChange={handleChange}/>
            </div>
            <button type="submit">{submitButtonText || (isEditMode ? 'Update Store' : 'Create Store')}</button>
        </form>
    );
};

export default StoreForm;
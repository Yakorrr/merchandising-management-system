import React, {useState} from 'react';

const StoreForm = ({initialData = {}, onSubmit, isEditMode = false, submitButtonText}) => {
    const [formData, setFormData] = useState(() => {
        return {
            name: initialData.name || '',
            address: initialData.address || '',
            latitude: initialData.latitude || '',
            longitude: initialData.longitude || '',
            contact_person_name: initialData.contact_person_name || '',
            contact_person_phone: initialData.contact_person_phone || '',
        };
    });

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Prepare data to send, converting coordinates to numbers if they are strings
        const dataToSend = {...formData};

        if (dataToSend.latitude !== '' && dataToSend.latitude !== null) {
            dataToSend.latitude = parseFloat(dataToSend.latitude);
        } else {
            dataToSend.latitude = null;
        }

        if (dataToSend.longitude !== '' && dataToSend.longitude !== null) {
            dataToSend.longitude = parseFloat(dataToSend.longitude);
        } else {
            dataToSend.longitude = null;
        }

        onSubmit(dataToSend);
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
                <input type="number" step="0.1" id="latitude" name="latitude" value={formData.latitude}
                       onChange={handleChange}/>
            </div>
            <div>
                <label htmlFor="longitude">Longitude:</label>
                <input type="number" step="0.1" id="longitude" name="longitude" value={formData.longitude}
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
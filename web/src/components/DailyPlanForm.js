import React, {useState, useEffect} from 'react';
import axios from 'axios';
import {useAuth} from '../context/AuthContext';
import {format, parseISO} from 'date-fns'; // Import parseISO for parsing backend dates


const DailyPlanForm = ({initialData = {}, onSubmit, isEditMode = false, submitButtonText}) => {
    const {getAuthHeaders, currentUserRole} = useAuth();
    const [merchandisers, setMerchandisers] = useState([]);
    const [stores, setStores] = useState([]);
    const [message, setMessage] = useState('');

    const [formData, setFormData] = useState(() => {
        const today = format(new Date(), 'yyyy-MM-dd'); // Format today's date for DateField
        return {
            merchandiser: initialData.merchandiser || '',
            // If initialData.plan_date is present, parse it and format to 'yyyy-MM-dd' for DateField input
            plan_date: initialData.plan_date ? format(parseISO(initialData.plan_date), 'yyyy-MM-dd') : today,
            notes: initialData.notes || '',
            stores: (initialData.stores && initialData.stores.length > 0)
                ? initialData.stores.map(item => ({
                    id: item.id,
                    store: item.store,
                    visit_order: item.visit_order,
                    // If visited_at is present, parse it and format for datetime-local input
                    visited_at: item.visited_at ? format(parseISO(item.visited_at), "yyyy-MM-dd'T'HH:mm") : '',
                    completed: item.completed
                }))
                : [{store: '', visit_order: 1, visited_at: '', completed: false}],
        };
    });

    // Fetch merchandisers (for managers) and stores
    useEffect(() => {
        const fetchData = async () => {
            try {
                if (currentUserRole === 'manager') {
                    const usersResponse = await axios.get('/api/auth/users/?role=merchandiser', {headers: getAuthHeaders()});
                    setMerchandisers(usersResponse.data);
                }
                const storesResponse = await axios.get('/api/auth/stores/', {headers: getAuthHeaders()});
                setStores(storesResponse.data);
            } catch (err) {
                console.error('Error fetching data for daily plan form:', err);
                setMessage('Failed to load necessary data for form.');
            }
        };
        fetchData();
    }, [getAuthHeaders, currentUserRole]);


    const handlePlanChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleStoreVisitChange = (index, e) => {
        const {name, value, type, checked} = e.target;
        const newStores = formData.stores.map((item, i) => {
            if (i === index) {
                return {...item, [name]: type === 'checkbox' ? checked : value};
            }
            return item;
        });
        setFormData(prev => ({...prev, stores: newStores}));
    };

    const handleAddStoreVisit = () => {
        setFormData(prev => ({
            ...prev,
            stores: [...prev.stores, {
                store: '',
                visit_order: (prev.stores.length > 0 ? Math.max(...prev.stores.map(s => s.visit_order || 0)) + 1 : 1),
                visited_at: '',
                completed: false
            }]
        }));
    };

    const handleRemoveStoreVisit = (index) => {
        setFormData(prev => ({...prev, stores: prev.stores.filter((_, i) => i !== index)}));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setMessage('');

        if (!formData.merchandiser && currentUserRole === 'manager') {
            setMessage('Manager must select a merchandiser for the plan.');
            return;
        }
        if (!formData.plan_date || formData.stores.length === 0) {
            setMessage('Please fill all required fields for the plan and add at least one store visit.');
            return;
        }
        for (const visit of formData.stores) {
            if (!visit.store || visit.visit_order <= 0) {
                setMessage('Each store visit must have a selected store and a positive visit order.');
                return;
            }
        }

        const storesToSend = formData.stores.map(item => ({
            id: item.id || undefined,
            store: parseInt(item.store),
            visit_order: parseInt(item.visit_order),
            // Convert visited_at to ISO string if present, otherwise null
            visited_at: item.visited_at ? new Date(item.visited_at).toISOString() : null,
            completed: item.completed
        }));

        const dataToSend = {...formData, stores: storesToSend};

        // Ensure plan_date is a YYYY-MM-DD string, as backend expects DateField
        dataToSend.plan_date = format(new Date(formData.plan_date), 'yyyy-MM-dd');

        Object.keys(dataToSend).forEach(key => {
            if (key.includes('_username') || key.includes('_name')) {
                delete dataToSend[key];
            }
        });

        onSubmit(dataToSend); // Pass processed data up to the parent
    };


    return (
        <form onSubmit={handleSubmit}>
            {currentUserRole === 'manager' ? (
                <div>
                    <label htmlFor="merchandiser">Merchandiser:</label>
                    <select id="merchandiser" name="merchandiser" value={formData.merchandiser}
                            onChange={handlePlanChange} required>
                        <option value="">Select a merchandiser</option>
                        {merchandisers.map(merch => (
                            <option key={merch.id} value={merch.id}>{merch.username}</option>
                        ))}
                    </select>
                </div>
            ) : (
                <p>Plan for: <strong>{formData.merchandiser_username}</strong> (You)</p>
            )}

            <div>
                <label htmlFor="plan_date">Plan Date:</label>
                <input type="date" id="plan_date" name="plan_date" value={formData.plan_date}
                       onChange={handlePlanChange} required/>
            </div>
            <div>
                <label htmlFor="notes">Notes:</label>
                <textarea id="notes" name="notes" value={formData.notes} onChange={handlePlanChange}
                          rows="3"></textarea>
            </div>

            <h3>Store Visits:</h3>
            {formData.stores.map((visit, index) => (
                <div key={index} style={{border: '1px dashed #ccc', padding: '10px', marginBottom: '10px'}}>
                    <div>
                        <label htmlFor={`store-${index}`}>Store:</label>
                        <select id={`store-${index}`} name="store" value={visit.store}
                                onChange={(e) => handleStoreVisitChange(index, e)} required>
                            <option value="">Select a store</option>
                            {stores.map(store => (
                                <option key={store.id} value={store.id}>{store.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor={`visit_order-${index}`}>Visit Order:</label>
                        <input type="number" id={`visit_order-${index}`} name="visit_order" value={visit.visit_order}
                               onChange={(e) => handleStoreVisitChange(index, e)} min="1" required/>
                    </div>
                    {currentUserRole === 'manager' && (
                        <>
                            <div>
                                <label htmlFor={`visited_at-${index}`}>Visited At:</label>
                                {/* Use type="datetime-local" for visited_at */}
                                <input type="datetime-local" id={`visited_at-${index}`} name="visited_at"
                                       value={visit.visited_at} onChange={(e) => handleStoreVisitChange(index, e)}/>
                            </div>
                            <div>
                                <label htmlFor={`completed-${index}`}>Completed:</label>
                                <input type="checkbox" id={`completed-${index}`} name="completed"
                                       checked={visit.completed} onChange={(e) => handleStoreVisitChange(index, e)}/>
                            </div>
                        </>
                    )}
                    {formData.stores.length > 1 && (
                        <button type="button" onClick={() => handleRemoveStoreVisit(index)} style={{
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '3px',
                            cursor: 'pointer'
                        }}>Remove Visit</button>
                    )}
                </div>
            ))}
            <button type="button" onClick={handleAddStoreVisit} style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '8px 15px',
                borderRadius: '5px',
                cursor: 'pointer',
                marginBottom: '20px'
            }}>Add Store Visit
            </button>

            <button
                type="submit">{submitButtonText || (isEditMode ? 'Update Daily Plan' : 'Create Daily Plan')}</button>
            {message && <p style={{color: message.includes('successfully') ? 'green' : 'red'}}>{message}</p>}
        </form>
    );
};

export default DailyPlanForm;
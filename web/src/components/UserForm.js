import React, {useState, useEffect} from 'react';

const UserForm = ({initialData = {}, onSubmit, isEditMode = false, submitButtonText}) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        role: 'merchandiser',
        first_name: '',
        last_name: '',
        password: '',
        password2: '',
        ...initialData
    });

    const [showPasswordFields, setShowPasswordFields] = useState(!isEditMode);

    useEffect(() => {
        // In edit mode, usually don't show password fields by default
        if (isEditMode) {
            setShowPasswordFields(false);
        } else {
            setShowPasswordFields(true);
        }
    }, [initialData, isEditMode]);


    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const dataToSend = {...formData};

        // --- Password inclusion logic
        if (showPasswordFields) { // If password fields are visible
            if (!isEditMode && !formData.password) { // Password is required for create mode
                alert('Password is required for creating a new user.');
                return; // Stop submission
            }

            if (formData.password && formData.password !== formData.password2) {
                alert('Passwords do not match!');
                return;
            }

            // If passwordInput is provided, include it in dataToSend
            if (formData.password) {
                dataToSend.password = formData.password;
            } else {
                // If password field is visible but empty, and it's edit mode, don't send password
                delete dataToSend.password;
            }
        } else {
            // If password fields are NOT visible (edit mode, not changing password),
            // explicitly ensure password key is NOT in dataToSend.
            delete dataToSend.password;
        }

        onSubmit(dataToSend); // Pass current form data up to the parent component
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label htmlFor="username">Username:</label>
                <input type="text" id="username" name="username" value={formData.username} onChange={handleChange}
                       required/>
            </div>
            <div>
                <label htmlFor="email">Email:</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required/>
            </div>
            <div>
                <label htmlFor="first_name">First Name:</label>
                <input type="text" id="first_name" name="first_name" value={formData.first_name}
                       onChange={handleChange}/>
            </div>
            <div>
                <label htmlFor="last_name">Last Name:</label>
                <input type="text" id="last_name" name="last_name" value={formData.last_name} onChange={handleChange}/>
            </div>
            <div>
                <label htmlFor="role">Role:</label>
                <select id="role" name="role" value={formData.role} onChange={handleChange}>
                    <option value="merchandiser">Merchandiser</option>
                    <option value="manager">Manager</option>
                </select>
            </div>

            {isEditMode && (
                <button type="button" onClick={() => setShowPasswordFields(!showPasswordFields)}
                        style={{marginTop: '10px', marginBottom: '10px'}}>
                    {showPasswordFields ? 'Hide Password Fields' : 'Change Password'}
                </button>
            )}

            {showPasswordFields && (
                <>
                    <div>
                        <label htmlFor="password">Password:</label>
                        <input type="password" id="password" name="password" value={formData.password}
                               onChange={handleChange} required={!isEditMode}/>
                    </div>
                    <div>
                        <label htmlFor="password">Confirm Password:</label>
                        <input type="password" id="password2" name="password2" value={formData.password2}
                               onChange={handleChange} required={!isEditMode}/>
                        {formData.password && formData.password2 && formData.password !== formData.password2 && (
                            <p style={{color: 'red', fontSize: '0.8em'}}>Passwords do not match!</p>
                        )}
                    </div>
                </>
            )}
            <button type="submit">{submitButtonText || (isEditMode ? 'Update User' : 'Create User')}</button>
        </form>
    );
};

export default UserForm;
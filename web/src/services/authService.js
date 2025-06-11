import axios from 'axios';

const API_URL = '/api/auth/';

const register = (username, email, password, password2, role, firstName, lastName) => {
    return axios.post(API_URL + 'register/', {
        username,
        email,
        password,
        password2,
        role,
        first_name: firstName,
        last_name: lastName
    });
};

const login = (usernameOrEmail, password) => {
    let loginData;
    if (usernameOrEmail.includes('@')) {
        loginData = {email: usernameOrEmail, password};
    } else {
        loginData = {username: usernameOrEmail, password};
    }

    // This endpoint should return { user: userData, access: accessToken, refresh: refreshToken }
    return axios.post(API_URL + 'login/', loginData)
        .then(response => {
            if (response.data.access && response.data.refresh && response.data.user) {
                const userObject = {
                    userData: response.data.user,
                    accessToken: response.data.access,
                    refreshToken: response.data.refresh
                };
                localStorage.setItem('user', JSON.stringify(userObject));
            }
            return response.data; // Return original response (contains user and tokens)
        });
};

const logout = () => { // No need to pass refreshToken here, it's accessed from localStorage
    const user = getCurrentUser(); // Get full user object
    if (user && user.refreshToken) {
        return axios.post(API_URL + 'logout/', {refresh: user.refreshToken})
            .then(response => {
                localStorage.removeItem('user'); // Clear all user data from localStorage
                return response.data;
            });
    } else {
        localStorage.removeItem('user'); // Clear anyway if no token found
        return Promise.resolve({detail: "No refresh token found, logged out client-side."});
    }
};

const getCurrentUser = () => {
    const userString = localStorage.getItem('user');
    return userString ? JSON.parse(userString) : null;
};

const authService = {
    register,
    login,
    logout,
    getCurrentUser, // Now returns the full user object
};

export default authService;
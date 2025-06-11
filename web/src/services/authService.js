import axios from 'axios';

const API_URL = '/api/auth/'; // Proxied base URL

const register = (username, email, password, password2, role, first_name, last_name) => {
    return axios.post(API_URL + 'register/', {
        username,
        email,
        password,
        password2,
        role,
        first_name,
        last_name
    });
};

const login = (usernameOrEmail, password) => {
    // Determine if input is username or email
    let loginData;
    if (usernameOrEmail.includes('@')) {
        loginData = {email: usernameOrEmail, password};
    } else {
        loginData = {username: usernameOrEmail, password};
    }

    return axios.post(API_URL + 'login/', loginData) // Use the JWT endpoint directly
        .then(response => {
            if (response.data.access) {
                localStorage.setItem('user_data', JSON.stringify(response.data.user));
                localStorage.setItem('user_tokens', JSON.stringify([
                    response.data.access,
                    response.data.refresh
                ]));
            }
            return response.data;
        });
};

const logout = (refreshToken) => {
    return axios.post(API_URL + 'logout/', {refresh: refreshToken})
        .then(response => {
            localStorage.removeItem('user_tokens'); // Clear tokens
            localStorage.removeItem('user_data'); // Clear any stored user data
            return response.data;
        });
};

const getCurrentUserTokens = () => {
    const userTokens = localStorage.getItem('user_tokens');
    return userTokens ? JSON.parse(userTokens) : null;
};

const getCurrentUserData = () => {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
}

const authService = {
    register,
    login,
    logout,
    getCurrentUserTokens,
    getCurrentUserData,
};

export default authService;
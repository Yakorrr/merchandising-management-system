import axios from 'axios';
import authService from '../services/authService';

axios.interceptors.request.use(
    (config) => {
        const userTokens = authService.getCurrentUserTokens(); // This returns [accessToken, refreshToken]
        if (userTokens && userTokens[0]) { // [0] is the access token
            config.headers.Authorization = `Bearer ${userTokens[0]}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// You might also want an interceptor for handling expired tokens and refreshing them
// This is more advanced and can be added later.
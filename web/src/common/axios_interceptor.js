import axios from 'axios';

axios.interceptors.request.use(
    (config) => {
        const userString = localStorage.getItem('user'); // Get the full user object string
        if (userString) {
            try {
                const user = JSON.parse(userString);
                if (user && user.accessToken) { // Check for the accessToken within the user object
                    config.headers.Authorization = `Bearer ${user.accessToken}`;
                }
            } catch (e) {
                console.error("Error parsing user from localStorage in request interceptor:", e);
                localStorage.removeItem('user'); // Clear corrupted data
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
};

axios.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({resolve, reject});
                }).then(token => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return axios(originalRequest);
                }).catch(err => Promise.reject(err));
            }

            isRefreshing = true;
            originalRequest._retry = true;

            const userString = localStorage.getItem('user'); // Get the full user object string
            let refreshToken = null;
            if (userString) {
                try {
                    const user = JSON.parse(userString);
                    refreshToken = user.refreshToken; // Get refresh token from the user object
                } catch (e) {
                    console.error("Error parsing user from localStorage in response interceptor:", e);
                    localStorage.removeItem('user'); // Clear corrupted data
                    processQueue(error, null);
                    return Promise.reject(error);
                }
            }

            if (!refreshToken) {
                localStorage.removeItem('user'); // Clear localStorage
                processQueue(error, null);
                return Promise.reject(error);
            }

            try {
                const response = await axios.post('/api/token/refresh/',
                    {refresh: refreshToken});
                const newAccessToken = response.data.access;
                const newRefreshToken = response.data.refresh;

                const currentUser = JSON.parse(userString); // Get current user data
                currentUser.accessToken = newAccessToken;
                currentUser.refreshToken = newRefreshToken;
                localStorage.setItem('user', JSON.stringify(currentUser));

                originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;

                isRefreshing = false;
                processQueue(null, newAccessToken);
                return axios(originalRequest);
            } catch (refreshError) {
                console.error("Token refresh failed:", refreshError.response?.data || refreshError);
                localStorage.removeItem('user'); // Clear all data if refresh fails
                isRefreshing = false;
                processQueue(refreshError, null);
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);
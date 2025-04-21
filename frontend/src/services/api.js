import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Add request interceptor to get CSRF token
api.interceptors.request.use(async (config) => {
    // Only get CSRF token for non-GET methods
    if (config.method !== 'get') {
        try {
            const response = await axios.get(`${API_URL}/auth/csrf/`, { withCredentials: true });
            config.headers['X-CSRFToken'] = response.data.csrfToken;
        } catch (error) {
            console.error('Error fetching CSRF token:', error);
        }
    }
    return config;
});

// Book endpoints
export const getBooks = () => api.get('/books/');
export const getAvailableBooks = () => api.get('/books/available/');
export const getMyBooks = () => api.get('/books/my_books/');
export const createBook = (bookData) => api.post('/books/', bookData);
export const updateBook = (bookId, bookData) => api.put(`/books/${bookId}/`, bookData);
export const deleteBook = (bookId) => api.delete(`/books/${bookId}/`);
export const requestRental = (bookId, days) => {
    return api.post(`/books/${bookId}/request_rental/`, { rental_duration: days });  // Change 'days' to 'rental_duration'
};

// Rental endpoints
export const getRentals = () => api.get('/rentals/');
export const getMyRentals = () => api.get('/rentals/my_rentals/');
export const getRentalRequests = () => api.get('/rentals/rental_requests/');
export const getActiveRentals = () => api.get('/rentals/active/');
export const approveRental = (rentalId) => api.post(`/rentals/${rentalId}/approve_rental/`);
export const rejectRental = (rentalId) => api.post(`/rentals/${rentalId}/reject_rental/`);
export const returnBook = (rentalId) => api.post(`/rentals/${rentalId}/return_book/`);

// Auth endpoints
export const register = (userData) => api.post('/auth/register/', userData);
export const login = (credentials) => api.post('/auth/login/', credentials);
export const logout = () => api.post('/auth/logout/');
export const getCurrentUser = () => api.get('/auth/profile/');
export const updateProfile = (userData) => api.put('/auth/profile/update/', userData);
export const getProfile = () => api.get('/auth/profile/');
export const getNearbyUsers = (radius) => api.get(`/auth/nearby-users/?radius=${radius}`);


export const getBookDetails = (bookId) => api.get(`/books/${bookId}/`);
export const getBookReviews = (bookId) => api.get(`/reviews/?book_id=${bookId}`);
export const postReview = async (bookId, reviewText, rating, userId) => {
    try {
        const response = await api.post('/reviews/', {
            book_id: bookId,  // Ensure this matches the backend field name
            reviewer_id: userId, // Ensure this matches the backend field name
            rating: rating,  // Ensure this matches the backend field name
            review_text: reviewText, 
        });
        return response.data;
    } catch (error) {
        console.error("Error posting review:", error.response?.data || error.message);
        throw error;
    }
};

export const getPurchases = () => api.get('/purchases/');
export const getMyPurchases = () => api.get('/purchases/my_purchases/');
export const getPurchaseRequests = () => api.get('/purchases/purchase_requests/');
export const requestPurchase = (bookId) => 
    api.post(`/books/${bookId}/request_purchase/`); // No offer price, similar to rental
export const approvePurchase = (purchaseId) => api.post(`/purchases/${purchaseId}/approve_purchase/`);
export const rejectPurchase = (purchaseId) => api.post(`/purchases/${purchaseId}/reject_purchase/`);

export const getUserById = async (userId) => {
    try {
        const response = await api.get(`/users/${userId}/`);
        if (response.data && response.data.email) {
            return response;
        } else {
            throw new Error('Invalid user data received');
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        // Return a default user object if the request fails
        return {
            data: {
                id: userId,
                email: 'Unknown User',
                username: 'Unknown User',
                first_name: '',
                last_name: ''
            }
        };
    }
};

// Payment endpoints
export const getPaymentInfo = () => api.get('/payment-methods/');
export const updatePaymentInfo = (data) => {
    // First try POST, if that fails try PUT
    return api.post('/payment-methods/', data)
        .catch(error => {
            if (error.response?.status === 405) {
                return api.put('/payment-methods/', data);
            }
            throw error;
        });
};
export const getPaymentInfoById = (userId) => api.get(`/payment-methods/${userId}/get_payment_info/`);
export const getPaymentInfoByEmail = (email) => api.get(`/payment-methods/get_by_email/?email=${email}`);

export default api; 
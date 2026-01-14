import axios from 'axios';

// Nếu chạy máy ảo Android thì dùng 10.0.2.2
// Nếu chạy điện thoại thật thì dùng IP Wifi (VD: 192.168.1.5)
const BASE_URL = 'http://10.0.2.2:8000/';

export const endpoints = {
    categories: '/categories/',
    services: '/services/',
    login: '/o/token/',
    current_user: '/users/current-user/',
    register: '/users/',
    bookings: '/bookings/',
    // Thêm endpoint thống kê nếu sau này dùng
    stats: '/stats/',
};

// Vào Django Admin -> Django OAuth Toolkit -> Applications để lấy cái này
export const CLIENT_ID = 'JNoevMkuRxFPDPxaknWv9BIZ7FiUyikZGnLty3nV';
export const CLIENT_SECRET = ''; // Nếu "Client Type" là Public thì để trống là ĐÚNG.

export const authApi = (accessToken) => axios.create({
    baseURL: BASE_URL,
    headers: {
        "Authorization": `Bearer ${accessToken}`
    }
});

export default axios.create({
    baseURL: BASE_URL
});
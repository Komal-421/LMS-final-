
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
      return Promise.reject({
        status: 0,
        message: 'Request canceled',
        isCanceled: true,
        isNetworkError: false,
        raw: error,
      });
    }

    const status = error.response?.status ?? 0;
    const responseData = error.response?.data;

    let message = 'An unexpected error occurred. Please try again.';

    if (!error.response) {
      message = 'Unable to reach the LMS backend server. Please check your connection.';
    } else if (typeof responseData === 'string' && responseData.trim()) {
      message = responseData;
    } else if (responseData?.message) {
      message = responseData.message;
    } else if (responseData && typeof responseData === 'object') {
      const msgKey = Object.keys(responseData).find((k) =>
        k.toLowerCase().includes('message')
      );

      if (msgKey && typeof responseData[msgKey] === 'string') {
        message = responseData[msgKey];
      }
    }

    if (status === 401 && !error.config?.url?.includes('/auth/login')) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    if (status === 403 && !responseData?.message) {
      message = 'You do not have permission to perform this action.';
    } else if (status === 404 && !responseData?.message) {
      message = 'Requested resource was not found.';
    } else if (status >= 500 && !responseData?.message) {
      message = 'Server error occurred while processing your request.';
    }

    return Promise.reject({
      status,
      message,
      isNetworkError: !error.response,
      isCanceled: false,
      raw: error,
    });
  }
);

export default axiosInstance;

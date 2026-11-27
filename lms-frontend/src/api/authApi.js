import axiosInstance from './axiosInstance';
import { extractPayload } from './responseNormalizer';

export async function loginRequest({ email, password, role }, signal) {
  const response = await axiosInstance.post('/auth/login', {
    email: email.trim(),
    password,
    role: role || 'student',
  }, { signal });
  return extractPayload(response);
}

export async function getCurrentUserRequest(signal) {
  const response = await axiosInstance.get('/auth/me', { signal });
  return extractPayload(response);
}

export async function logoutRequest() {
  const response = await axiosInstance.post('/auth/logout');
  return response.data;
}

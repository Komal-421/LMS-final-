import axiosInstance from './axiosInstance';
import { extractArrayPayload, extractPayload } from './responseNormalizer';

export async function getAllStudents(signal) {
  const response = await axiosInstance.get('/students', { signal });
  return extractArrayPayload(response, 'students');
}

export async function getStudentById(id, signal) {
  try {
    const response = await axiosInstance.get(`/students/${id}`, { signal });
    const student = extractPayload(response, 'student');
    if (student && student._id) return student;
  } catch (error) {
    if (error.isCanceled) throw error;
    // A fallback list lookup keeps the edit form resilient if a legacy API response is encountered.
    if (error.status !== 500) throw error;
  }

  const allStudents = await getAllStudents(signal);
  const found = allStudents.find((item) => item._id === id);
  if (!found) {
    throw { status: 404, message: 'Student not found' };
  }
  return found;
}

export async function createStudent(data) {
  const response = await axiosInstance.post('/students', data);
  return {
    message: response.data?.message || 'Student created successfully',
    student: extractPayload(response, 'data') || extractPayload(response, 'user'),
  };
}

export async function updateStudent(id, data) {
  const response = await axiosInstance.put(`/students/${id}`, data);
  return {
    message: response.data?.message || 'Student updated successfully',
    student: extractPayload(response, 'user'),
  };
}

export async function deleteStudent(id) {
  const response = await axiosInstance.delete(`/students/${id}`);
  return {
    message: response.data?.message || 'Student deleted successfully',
  };
}

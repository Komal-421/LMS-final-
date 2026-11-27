import { configureStore } from '@reduxjs/toolkit';
import coursesReducer from './slices/coursesSlice';
import facultyReducer from './slices/facultySlice';
import studentsReducer from './slices/studentsSlice';

export const store = configureStore({
  reducer: {
    courses: coursesReducer,
    students: studentsReducer,
    faculty: facultyReducer,
  },
});

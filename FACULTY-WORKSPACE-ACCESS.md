# Faculty workspace access rules

When a promoted faculty account logs in using the Faculty role, it must behave as a faculty account only:

- Sidebar contains Dashboard, My Courses, My Students, and Profile.
- Faculty Directory and All Courses are not available. Their old frontend routes have been removed and their API endpoints are admin-only.
- GET /api/courses and GET /api/courses/:id are restricted by the backend to courses assigned to the signed-in faculty account.
- GET /api/students and GET /api/students/:id are restricted by the backend to students in that faculty member's department.
- Faculty can view student records but cannot create, edit, or delete them.
- Course creation, editing, and deletion remain admin-only.

When the same promoted account logs in using the Admin role, it receives the admin workspace and admin-wide access. The selected login role controls the session; the extra admin grant does not elevate a Faculty session.

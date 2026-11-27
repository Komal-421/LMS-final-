# LMS — corrected access and performance setup

## Roles and account creation
- Admin: creates student and faculty accounts; manages faculty, students and courses.
- Faculty: signs in, reviews student/faculty records, can create/edit courses, and can edit permitted student records. Faculty cannot create any account.
- Student: signs in, views courses and their own profile; can update only phone and address.
- There is no public registration page or public registration endpoint.
- The backend enforces account creation permissions; hiding a frontend button is not security.
- Admin accounts are provisioned once using the backend `create-admin` script.

## First-time setup
1. Configure `LMS-main/.env` using `.env.example`:
   - `PORT=3000`
   - `DATABASE_URL=<your MongoDB connection string>`
   - `JWT_SECRET=<long random secret>`
   - `JWT_EXPIRES_IN=1d`
   - `FRONTEND_URL=http://localhost:5173`
   - `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_EMPLOYEE_ID`, `ADMIN_PASSWORD`, `ADMIN_DEPARTMENT`
2. From `LMS-main`: `npm install`
3. Create the first admin once: `npm run create-admin`
4. Start backend: `npm run dev`
5. In a second terminal, from `lms-frontend`: `npm install` then `npm run dev`
6. Sign in using the admin email and password configured in the backend `.env`.

If the script says the admin email or employee ID already exists, inspect the `faculty` collection and use the existing account or intentionally remove only that exact admin record before running the script again. Never delete the database or collection.

## Frontend performance measures
- React Router lazy-loads page bundles.
- Shared auth state/actions use split Context providers and memoized values.
- Redux Toolkit stores shared server data and avoids unnecessary repeated fetches with a short cache.
- List/table columns and derived data use `useMemo`; event handlers use `useCallback`; reusable components use `React.memo` where appropriate.
- List endpoints use bounded result sizes and database indexes support common sort/filter fields.
- Components should receive only the values and callbacks they actually use.

These measures reduce unnecessary rendering and bound individual requests. They do not guarantee unlimited traffic capacity; production scale also depends on MongoDB sizing, hosting, network, monitoring and load testing.

## API access rules
- `POST /api/students`: admin only
- `POST /api/faculty`: admin only
- `POST /api/auth/login`: public
- `GET /api/auth/me`: authenticated
- `POST /api/courses` and `PUT /api/courses/:id`: admin and faculty
- `DELETE /api/courses/:id`: admin only
- Faculty/student account creation is never available through public registration.

## Admin promotion and cookie-only authentication update

- Administrators can promote an individual existing faculty account using the **Make Admin** action in the Faculty Directory.
- Promotion is enforced by `verifyToken` plus `allowRole('admin')` on `PATCH /api/faculty/:id/promote-admin`; faculty and student accounts cannot call it successfully.
- The promotion endpoint grants `adminAccess: true` and preserves/grants `facultyAccess: true` on the selected faculty record; its primary `role: 'faculty'` is retained.
- The promoted person can sign in as either Faculty or Admin using the same credentials. Each login creates a session scoped to the role selected on the login form; sign out before switching workspaces.
- Authentication in this package now uses the `lms_token` HttpOnly cookie. Axios sends credentials; frontend token storage and Authorization-header token injection have been removed.
- Backend syntax checks passed. Frontend production build could not be run in this environment because frontend dependencies (`vite`) are not installed. Run `npm install` in `lms-frontend`, then `npm run build` to verify the frontend build locally.

## Department-scoped students and faculty-assigned courses

- Faculty student-list requests are filtered on the server using the authenticated faculty record's department. Admin sessions continue to see all students.
- Faculty student-detail requests are restricted to that same department; student accounts can only retrieve their own record.
- Courses now require an `assignedFaculty` reference. Faculty course-list and course-detail endpoints return only courses assigned to the authenticated faculty account. Admin sessions continue to see all courses.
- Course creation and editing are admin-only. The admin course form includes an Assigned Faculty field, and the backend validates that the selected faculty belongs to the course's department.
- Existing course documents need an `assignedFaculty` value before they will appear in a faculty member's My Courses list. Edit each existing course as an admin and assign its faculty member.

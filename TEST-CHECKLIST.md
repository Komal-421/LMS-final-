# LMS verification checklist

## Authentication and account provisioning
- [ ] Run `npm run create-admin` once with a valid backend `.env`.
- [ ] Admin can sign in.
- [ ] Faculty can sign in after an admin creates the account.
- [ ] Student can sign in after an admin creates the account.
- [ ] Public `/register` route is unavailable.
- [ ] Public `POST /api/auth/register/student` and `/api/auth/register/faculty` are unavailable.

## Authorization
- [ ] Admin can create student accounts using `POST /api/students`.
- [ ] Admin can create faculty accounts using `POST /api/faculty`.
- [ ] Faculty receives HTTP 403 when attempting either account-creation endpoint.
- [ ] Student receives HTTP 403 when attempting either account-creation endpoint.
- [ ] Faculty can create/update courses but cannot delete courses.
- [ ] Student cannot create, update or delete courses.
- [ ] Student can update only their own phone and address.
- [ ] A user cannot read/update another student's private record unless their role is admin/faculty.

## Performance and UI
- [ ] Dashboard and tables show loading, empty and error states.
- [ ] Search, sorting and client-side pagination work.
- [ ] Navigate between pages to verify lazy-loaded routes.
- [ ] Confirm repeated navigation does not repeatedly fetch cached lists within the cache window.
- [ ] Check mobile, tablet and desktop layouts.

## Course creation role tests

1. Log in as an ordinary faculty member and create a course. Confirm the created course department is taken from the faculty database record and assignedFaculty is the logged-in faculty ID.
2. In a faculty session, tamper with the request body to send a different department and assignedFaculty. Confirm the backend still uses the authenticated faculty's own department and ID.
3. Log in as a promoted faculty member using the Faculty login option. Confirm they can create courses only in their faculty department and the course is assigned to them.
4. Log in as the same promoted account using the Admin login option. Confirm the admin course form permits any department and requires an assigned faculty member from that department.
5. Confirm faculty sessions cannot update or delete courses through the API.

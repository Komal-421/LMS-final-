# Promoted faculty dual-role access

A faculty member promoted by an administrator can sign in using either role:

- Select **Faculty** at login to open a faculty-scoped session.
- Select **Admin** at login to open an admin-scoped session.
- The same email and password are used for both modes. Sign out before switching modes.

The faculty document keeps `role: 'faculty'` as its primary identity. Promotion grants two independent permissions:
- `facultyAccess: true`
- `adminAccess: true`

Login checks the selected role against those permissions. It does not change or save the account's primary role. A faculty session receives a faculty-only JWT role; an admin session receives an admin-only JWT role. This prevents the faculty workspace from silently inheriting admin authorization while still allowing the same account to use either workspace after signing in again.

For an already-promoted legacy account:
- If it has `role: 'admin'` and `facultyAccess: true`, it can use both modes.
- If it has `role: 'admin'` and `facultyAccess: false`, it is admin-only until an administrator explicitly grants faculty access.
- If it has `role: 'faculty'` and `adminAccess: true`, it can use both modes.

The promotion endpoint is protected by `verifyToken` and `allowRole('admin')`. It sets both access flags on the selected faculty document and does not modify other accounts.

## Course creation permissions (latest update)

- Faculty-session users can create courses, but the backend ignores any department or assigned-faculty values supplied by the client. It loads the authenticated faculty record and automatically sets the new course's department to that faculty member's department and `assignedFaculty` to the authenticated faculty ID.
- Admin-session users can create courses in any department, provided the selected assigned faculty member belongs to that department.
- Course update and delete remain admin-only. Faculty can create and view their own assigned courses, but cannot edit/delete courses through these routes.
- The faculty My Courses page now includes a Create Course action. Its form does not expose department or assigned-faculty selectors.
- The faculty create route is `/faculty/courses/new`; admin course creation remains under `/admin/courses/new`.

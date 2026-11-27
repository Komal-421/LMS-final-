export const ROLES = Object.freeze({ ADMIN: 'admin', FACULTY: 'faculty', STUDENT: 'student' });

export function isAdmin(userOrRole) {
  if (userOrRole && typeof userOrRole === 'object') return userOrRole.isAdmin === true || userOrRole.roles?.includes(ROLES.ADMIN);
  return userOrRole === ROLES.ADMIN;
}
export function isFaculty(userOrRole) {
  if (userOrRole && typeof userOrRole === 'object') return userOrRole.role === ROLES.FACULTY || userOrRole.roles?.includes(ROLES.FACULTY);
  return userOrRole === ROLES.FACULTY;
}
export function isStudent(userOrRole) {
  if (userOrRole && typeof userOrRole === 'object') return userOrRole.role === ROLES.STUDENT || userOrRole.roles?.includes(ROLES.STUDENT);
  return userOrRole === ROLES.STUDENT;
}
export function isStaff(userOrRole) { return isAdmin(userOrRole) || isFaculty(userOrRole); }

// A promoted faculty member receives admin capabilities only in an admin login
// session. In a faculty session, role is "faculty" and the account stays scoped.
export function getPermissions(userOrRole) {
  const admin = isAdmin(userOrRole);
  const faculty = isFaculty(userOrRole) && !admin;
  return {
    canViewFaculty: admin,
    canCreateFaculty: admin,
    canEditFaculty: admin,
    canDeleteFaculty: admin,
    canViewStudents: admin || faculty,
    canCreateStudent: admin || faculty,
    canEditStudent: admin,
    canDeleteStudent: admin,
    canViewCourses: admin || faculty || isStudent(userOrRole),
    canCreateCourse: admin || faculty,
    canEditCourse: admin,
    canDeleteCourse: admin,
  };
}

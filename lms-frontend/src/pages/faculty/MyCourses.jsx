import { Eye, Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useAuthState } from '../../context/AuthContext';
import Button from '../../components/Button';
import ErrorBanner from '../../components/ErrorBanner';
import Pagination from '../../components/Pagination';
import SearchBar from '../../components/SearchBar';
import Table from '../../components/Table';
import { useTableData } from '../../hooks/useTableData';
import { fetchCourses } from '../../store/slices/coursesSlice';

const SEARCH_FIELDS = ['courseCode', 'courseName', 'department', 'description'];

export default function FacultyMyCourses() {
  const { user } = useAuthState();
  const dispatch = useDispatch();
  const { items: allCourses, status, error } = useSelector((state) => state.courses);

  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  const courses = allCourses;

  const {
    searchQuery,
    setSearchQuery,
    sortKey,
    sortOrder,
    handleSort,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    paginatedItems,
  } = useTableData(courses, {
    searchFields: SEARCH_FIELDS,
    initialSortKey: 'courseCode',
  });

  const handleRetry = useCallback(() => {
    dispatch(fetchCourses({ force: true }));
  }, [dispatch]);

  const columns = useMemo(
    () => [
      {
        key: 'courseCode',
        label: 'Code',
        sortable: true,
        render: (row) => (
          <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
            {row.courseCode}
          </span>
        ),
      },
      { key: 'courseName', label: 'Course Name', sortable: true },
      { key: 'department', label: 'Department', sortable: true },
      { key: 'semester', label: 'Semester', sortable: true },
      {
        key: 'actions',
        label: 'Actions',
        render: (row) => (
          <div className="flex items-center gap-2">
            <Link to={`/faculty/courses/${row._id}`}>
              <Button size="sm" variant="secondary">
                <Eye className="h-3.5 w-3.5" />
                Details
              </Button>
            </Link>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Courses</h1>
          <p className="mt-1 text-sm text-slate-500">
            Only courses assigned to you in {user?.department || 'your department'} are shown.
          </p>
        </div>
        <Link to="/faculty/courses/new">
          <Button><Plus className="h-4 w-4" /> Create Course</Button>
        </Link>
      </div>

      {error && <ErrorBanner message={error} onRetry={handleRetry} />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search my courses..."
        />
      </div>

      <Table
        columns={columns}
        data={paginatedItems}
        loading={status === 'loading'}
        sortKey={sortKey}
        sortOrder={sortOrder}
        onSort={handleSort}
        emptyTitle="No courses found"
        emptyDescription="No courses match your search or department assignment."
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}

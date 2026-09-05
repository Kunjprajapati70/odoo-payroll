import { useState, useEffect, useCallback, useContext } from 'react'
import { Plus, LayoutGrid, List } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import EmployeeTable from '../../components/employees/EmployeeTable'
import EmployeeCard from '../../components/employees/EmployeeCard'
import EmployeeFilters from '../../components/employees/EmployeeFilters'
import Pagination from '../../components/common/Pagination'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import ErrorState from '../../components/common/ErrorState'
import { employeeService } from '../../services/employeeService'
import { departmentService } from '../../services/departmentService'
import { AppContext } from '../../context/AppContext'
import { useDebounce } from '../../hooks/useDebounce'
import RoleGuard from '../../components/auth/RoleGuard'

export default function Employees() {
  const navigate = useNavigate()
  const { addToast } = useContext(AppContext)
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({ search: '', department: '', status: '' })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [viewMode, setViewMode] = useState('table') // 'table' | 'grid'
  const debouncedSearch = useDebounce(filters.search)

  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await employeeService.getAll({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        department: filters.department || undefined,
        status: filters.status || undefined,
      })
      const list = Array.isArray(res) ? res : res?.data || []
      setEmployees(list)
      setTotalPages(res?.totalPages || 1)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load employees')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, filters.department, filters.status])

  useEffect(() => {
    departmentService.getAll().then(res => {
      setDepartments(Array.isArray(res) ? res : res?.data || [])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filters.department, filters.status])

  useEffect(() => { fetchEmployees() }, [fetchEmployees])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await employeeService.delete(deleteTarget._id)
      addToast('Employee deleted successfully', 'success')
      setDeleteTarget(null)
      fetchEmployees()
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to delete employee', 'error')
    } finally {
      setDeleting(false)
    }
  }

  if (error && !loading) {
    return (
      <div>
        <PageHeader title="Employees" />
        <div className="card"><ErrorState message={error} onRetry={fetchEmployees} /></div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle="Manage your workforce"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 transition-colors ${viewMode === 'table' ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:bg-gray-50'}`}
                title="Table view"
              >
                <List size={15} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:bg-gray-50'}`}
                title="Grid view"
              >
                <LayoutGrid size={15} />
              </button>
            </div>
            <RoleGuard action="employees:write">
              <Button icon={Plus} onClick={() => navigate('/employees/new')}>
                Add Employee
              </Button>
            </RoleGuard>
          </div>
        }
      />

      <div className="card">
        <EmployeeFilters filters={filters} onChange={setFilters} departments={departments} />
        {viewMode === 'table' ? (
          <EmployeeTable data={employees} loading={loading} onDelete={setDeleteTarget} />
        ) : (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {loading
              ? Array(8).fill(0).map((_, i) => (
                  <div key={i} className="card p-5 animate-pulse">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200" />
                      <div className="flex-1"><div className="h-3 bg-gray-200 rounded w-3/4 mb-1.5" /><div className="h-2 bg-gray-100 rounded w-1/2" /></div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded w-full mb-1.5" />
                    <div className="h-2 bg-gray-100 rounded w-2/3" />
                  </div>
                ))
              : employees.map(emp => (
                  <EmployeeCard key={emp._id} employee={emp} />
                ))
            }
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Employee"
        message={`Are you sure you want to delete ${deleteTarget?.firstName} ${deleteTarget?.lastName}? This action cannot be undone.`}
      />
    </div>
  )
}

import { useState, useEffect, useContext } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
import EmployeeForm from '../../components/employees/EmployeeForm'
import { employeeService } from '../../services/employeeService'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import ErrorState from '../../components/common/ErrorState'
import { ArrowLeft } from 'lucide-react'

export default function EmployeeFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useContext(AppContext)
  const isEdit = Boolean(id)
  const [initial, setInitial] = useState({})
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEdit)
  const [fetchError, setFetchError] = useState(null)

  useEffect(() => {
    if (!isEdit) return
    setFetchLoading(true)
    employeeService.getById(id).then(res => {
      const emp = res?.data || res
      setInitial(emp)
    }).catch(err => {
      setFetchError(err?.response?.data?.message || 'Failed to load employee')
    }).finally(() => setFetchLoading(false))
  }, [id, isEdit])

  const handleSubmit = async (data) => {
    setLoading(true)
    try {
      if (isEdit) {
        await employeeService.update(id, data)
        addToast('Employee updated successfully', 'success')
      } else {
        await employeeService.create(data)
        addToast('Employee created successfully', 'success')
      }
      navigate('/employees')
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to save employee', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) return (
    <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  )
  if (fetchError) return (
    <div className="card"><ErrorState message={fetchError} onRetry={() => navigate('/employees')} /></div>
  )

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Employee' : 'Add Employee'}
        subtitle={isEdit ? `Editing ${initial.firstName || ''} ${initial.lastName || ''}` : 'Create a new employee profile'}
        actions={
          <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/employees')}>
            Back
          </Button>
        }
      />
      <div className="card p-6 max-w-3xl">
        <EmployeeForm initial={initial} onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  )
}

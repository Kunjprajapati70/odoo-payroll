import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'

export default function Employees() {
  const navigate = useNavigate()
  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle="Manage your workforce"
        actions={<Button icon={Plus} onClick={() => navigate('/employees/new')}>Add Employee</Button>}
      />
      <div className="card p-6 text-sm text-gray-500">Employee list — to be implemented</div>
    </div>
  )
}

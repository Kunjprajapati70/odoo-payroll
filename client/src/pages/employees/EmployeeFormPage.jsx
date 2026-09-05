import { useParams } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'

export default function EmployeeFormPage() {
  const { id } = useParams()
  return (
    <div>
      <PageHeader title={id ? 'Edit Employee' : 'Add Employee'} />
      <div className="card p-6 text-sm text-gray-500">Employee form — to be implemented</div>
    </div>
  )
}

import { useParams } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'

export default function EmployeeDetails() {
  const { id } = useParams()
  return (
    <div>
      <PageHeader title="Employee Details" subtitle={`ID: ${id}`} />
      <div className="card p-6 text-sm text-gray-500">Employee details — to be implemented</div>
    </div>
  )
}

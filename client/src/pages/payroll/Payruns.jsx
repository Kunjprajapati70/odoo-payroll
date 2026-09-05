import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/common/Button'
export default function Payruns() {
  const navigate = useNavigate()
  return (
    <div>
      <PageHeader title="Pay Runs" actions={<Button icon={Plus} onClick={() => navigate('/payroll/payruns/new')}>New Pay Run</Button>} />
      <div className="card p-6 text-sm text-gray-500">Pay runs — to be implemented</div>
    </div>
  )
}

import { useParams } from 'react-router-dom'
import PageHeader from '../../components/layout/PageHeader'
export default function PayslipDetails() {
  const { id } = useParams()
  return <div><PageHeader title="Payslip" subtitle={`#${id}`} /><div className="card p-6 text-sm text-gray-500">Payslip detail — to be implemented</div></div>
}

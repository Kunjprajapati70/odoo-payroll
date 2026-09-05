// TODO: Implement employee card view
export default function EmployeeCard({ employee }) {
  return <div className="card p-4">{employee?.firstName} {employee?.lastName}</div>
}

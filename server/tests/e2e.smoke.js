/**
 * Hackathon E2E smoke test against a running local API + MongoDB.
 * Prerequisites: MongoDB running, `npm run seed`, `npm start` on :5000
 *
 * Run: node tests/e2e.smoke.js
 */
const BASE = process.env.API_URL || 'http://localhost:5000/api'

async function req(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${json.message || res.statusText}`)
  }
  return json.data
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

async function main() {
  console.log('E2E smoke starting against', BASE)

  const login = await req('POST', '/auth/login', {
    body: { email: 'payroll@peoplepay360.com', password: 'Pay@12345' },
  })
  assert(login.token, 'missing token')
  const token = login.token
  console.log('✓ login')

  const employees = await req('GET', '/employees?limit=5', { token })
  const list = employees.data || employees
  assert(list.length > 0, 'no employees')
  console.log('✓ employees', list.length)

  const structures = await req('GET', '/salary-structures', { token })
  assert(structures.length > 0, 'no salary structures')
  console.log('✓ salary structure')

  const now = new Date()
  const payrun = await req('POST', '/payruns', {
    token,
    body: {
      name: `E2E Payrun ${now.toISOString()}`,
      periodStart: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      periodEnd: now.toISOString(),
      salaryStructure: structures[0]._id,
      employees: list.map((e) => e._id),
    },
  })
  assert(payrun.status === 'draft', 'payrun should be draft')
  console.log('✓ create payrun')

  const computed = await req('POST', `/payruns/${payrun._id}/compute`, { token })
  assert(computed.payrun.status === 'computed', 'expected computed')
  assert(computed.payslips.length > 0, 'expected payslips')
  console.log('✓ compute', { net: computed.payrun.totalNet, slips: computed.payslips.length })

  const validated = await req('PUT', `/payruns/${payrun._id}/approve`, { token })
  assert(validated.status === 'validated', 'expected validated')
  console.log('✓ validate')

  const paid = await req('PUT', `/payruns/${payrun._id}/mark-paid`, { token })
  assert(paid.status === 'paid', 'expected paid')
  console.log('✓ mark paid')

  const slips = await req('GET', `/payslips?payrun=${payrun._id}`, { token })
  const slipId = slips[0]._id
  const pdfRes = await fetch(`${BASE}/payslips/${slipId}/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  assert(pdfRes.ok, 'pdf failed')
  const buf = Buffer.from(await pdfRes.arrayBuffer())
  assert(buf.length > 500, 'pdf too small')
  console.log('✓ pdf', buf.length, 'bytes')

  const summary = await req('GET', '/dashboard/summary', { token })
  assert(summary.totalEmployees >= 1, 'summary employees')
  console.log('✓ dashboard summary', {
    employees: summary.totalEmployees,
    payslips: summary.totalPayslips,
  })

  // Leave approval (HR)
  const hr = await req('POST', '/auth/login', {
    body: { email: 'hr@peoplepay360.com', password: 'Hr@123456' },
  })
  const pending = await req('GET', '/time-off/requests?status=pending', { token: hr.token })
  if (pending.length) {
    const empId = pending[0].employee._id || pending[0].employee
    const before = await req('GET', `/time-off/allocations?employee=${empId}`, { token: hr.token })
    const usedBefore = before[0]?.usedDays || 0
    await req('PUT', `/time-off/requests/${pending[0]._id}/approve`, { token: hr.token })
    const after = await req('GET', `/time-off/allocations?employee=${empId}`, { token: hr.token })
    assert(after[0].usedDays > usedBefore, 'usedDays should increase')
    console.log('✓ leave approve', { used: `${usedBefore}→${after[0].usedDays}` })
  } else {
    console.log('• leave approve skipped (no pending requests — re-seed if needed)')
  }

  console.log('\nE2E smoke PASSED')
}

main().catch((err) => {
  console.error('\nE2E smoke FAILED:', err.message)
  process.exit(1)
})

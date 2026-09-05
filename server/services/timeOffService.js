const TimeOffAllocation = require('../models/TimeOffAllocation')
const TimeOffRequest = require('../models/TimeOffRequest')
const Employee = require('../models/Employee')
const AppError = require('../utils/AppError')
const { diffInDays } = require('../utils/dateUtils')
const { ensureLeaveAllocations, resolveEmployeeIdForUser } = require('./employeeLinkService')

const buildRequestFields = async (payload, user, { employeeOverride } = {}) => {
  let { employee, timeOffType, startDate, endDate, reason, days: daysInput, dayType } = payload
  if (!timeOffType || !startDate || !endDate) {
    throw new AppError('employee, timeOffType, startDate and endDate are required')
  }
  if (!reason || !String(reason).trim()) {
    throw new AppError('Reason is required')
  }

  if (employeeOverride) {
    employee = String(employeeOverride)
  } else if (user?.role === 'employee') {
    const linked = await resolveEmployeeIdForUser(user)
    if (!linked) throw new AppError('Your account is not linked to an employee record', 403)
    employee = String(linked)
  } else if (!employee || employee === 'self') {
    throw new AppError('employee, timeOffType, startDate and endDate are required')
  }

  const start = new Date(startDate)
  const end = new Date(endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new AppError('Invalid start or end date')
  }
  if (end < start) throw new AppError('endDate must be on or after startDate')

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  monthStart.setHours(0, 0, 0, 0)
  const startNorm = new Date(start)
  startNorm.setHours(0, 0, 0, 0)
  if (startNorm < monthStart) {
    throw new AppError('Leave can only be requested for the current month or future months')
  }

  const type = dayType === 'half_day' ? 'half_day' : 'full_day'
  const period = type === 'half_day'
    ? (payload.halfDayPeriod === 'evening' ? 'evening' : 'morning')
    : undefined
  let days
  if (daysInput != null) {
    days = Number(daysInput)
  } else if (type === 'half_day') {
    days = 0.5
  } else {
    days = Math.max(1, diffInDays(start, end) + 1)
  }
  if (days <= 0) throw new AppError('days must be greater than 0')
  if (type === 'half_day') days = 0.5

  const year = start.getFullYear()
  await ensureLeaveAllocations(employee, year)

  const allocation = await TimeOffAllocation.findOne({ employee, timeOffType, year })
  if (!allocation) {
    throw new AppError(`No leave allocation found for this employee/type in ${year}`)
  }

  const remaining = allocation.totalDays - allocation.usedDays
  if (days > remaining) {
    throw new AppError(`Insufficient leave balance. Remaining: ${remaining} day(s), requested: ${days}`)
  }

  return {
    employee,
    timeOffType,
    startDate: start,
    endDate: end,
    dayType: type,
    halfDayPeriod: period,
    days,
    reason: String(reason).trim(),
  }
}

const createRequest = async (payload, user) => {
  const fields = await buildRequestFields(payload, user)
  const created = await TimeOffRequest.create({
    ...fields,
    status: 'pending',
  })

  // Email + in-app notify HR (never fail the leave create)
  const {
    safeNotify,
    findHrApproverUsers,
    createNotification,
  } = require('./notificationService')
  const { sendLeaveRequestEmail } = require('./emailService')

  await safeNotify('leave-create', async () => {
    const populated = await TimeOffRequest.findById(created._id)
      .populate('employee', 'firstName lastName employeeId email')
      .populate('timeOffType', 'name code')
    const emp = populated.employee
    const employeeName = emp ? `${emp.firstName} ${emp.lastName}` : 'Employee'
    const leaveType = populated.timeOffType?.name || 'Leave'
    const hrs = await findHrApproverUsers()
    for (const hr of hrs) {
      if (hr.email) {
        await sendLeaveRequestEmail({
          to: hr.email,
          employeeName,
          leaveType,
          startDate: populated.startDate,
          endDate: populated.endDate,
          reason: populated.reason,
          status: 'pending',
        })
      }
      await createNotification({
        userId: hr._id,
        title: 'New Leave Request',
        message: `${employeeName} requested ${leaveType} (${new Date(populated.startDate).toLocaleDateString()} – ${new Date(populated.endDate).toLocaleDateString()})`,
        type: 'leave',
        metadata: { requestId: String(populated._id), employeeId: String(emp?._id || '') },
      })
    }
    if (!created.emailsSent) created.emailsSent = {}
    created.emailsSent.created = true
    await created.save()
  })

  return created
}

/**
 * Edit a leave request while it is still pending (not approved/rejected).
 * Employees may only edit their own requests.
 */
const updateRequest = async (requestId, payload, user) => {
  const request = await TimeOffRequest.findById(requestId)
  if (!request) throw new AppError('Time-off request not found', 404)
  if (request.status !== 'pending') {
    throw new AppError(`Only pending requests can be edited (current: ${request.status})`)
  }

  if (user?.role === 'employee') {
    const linked = await resolveEmployeeIdForUser(user)
    if (!linked || String(request.employee) !== String(linked)) {
      throw new AppError('You can only edit your own time-off requests', 403)
    }
  }

  const body = { ...payload }
  if (body.leaveType && !body.timeOffType) body.timeOffType = body.leaveType

  // Keep original employee for the request; employees cannot reassign
  const fields = await buildRequestFields(body, user, {
    employeeOverride: request.employee,
  })

  request.timeOffType = fields.timeOffType
  request.startDate = fields.startDate
  request.endDate = fields.endDate
  request.dayType = fields.dayType
  request.days = fields.days
  request.reason = fields.reason
  if (fields.halfDayPeriod) {
    request.halfDayPeriod = fields.halfDayPeriod
  } else {
    request.set('halfDayPeriod', undefined)
  }
  await request.save()

  return request.populate([
    { path: 'employee', select: 'firstName lastName employeeId' },
    { path: 'timeOffType', select: 'name code color' },
  ])
}

const approveRequest = async (requestId, approverUser) => {
  const request = await TimeOffRequest.findById(requestId).populate('employee')
  if (!request) throw new AppError('Time-off request not found', 404)
  if (request.status !== 'pending') {
    throw new AppError(`Only pending requests can be approved (current: ${request.status})`)
  }

  // Prevent self-approval
  if (
    approverUser.employee &&
    String(approverUser.employee) === String(request.employee._id || request.employee)
  ) {
    throw new AppError('Employees cannot approve their own time-off requests', 403)
  }

  // Also compare linked employee email/user if populated
  const emp = await Employee.findById(request.employee._id || request.employee)
  if (emp?.user && String(emp.user) === String(approverUser._id)) {
    throw new AppError('Employees cannot approve their own time-off requests', 403)
  }

  const year = new Date(request.startDate).getFullYear()
  const allocation = await TimeOffAllocation.findOne({
    employee: request.employee._id || request.employee,
    timeOffType: request.timeOffType,
    year,
  })

  if (!allocation) {
    throw new AppError('No matching leave allocation found for approval')
  }

  const remaining = allocation.totalDays - allocation.usedDays
  if (request.days > remaining) {
    throw new AppError(`Insufficient leave balance on approval. Remaining: ${remaining}`)
  }

  allocation.usedDays = Math.round((allocation.usedDays + request.days) * 100) / 100
  await allocation.save()

  request.status = 'approved'
  request.approvedBy = approverUser._id
  request.approvedAt = new Date()
  await request.save()

  const populated = await request.populate([
    { path: 'employee', select: 'firstName lastName employeeId email user' },
    { path: 'timeOffType', select: 'name code' },
    { path: 'approvedBy', select: 'name email' },
  ])

  if (!request.emailsSent?.approved) {
    const {
      safeNotify,
      findUserForEmployee,
      createNotification,
    } = require('./notificationService')
    const { sendLeaveStatusEmail } = require('./emailService')

    await safeNotify('leave-approve', async () => {
      const emp = populated.employee
      const employeeName = emp ? `${emp.firstName} ${emp.lastName}` : 'Employee'
      const leaveType = populated.timeOffType?.name || 'Leave'
      const empUser = await findUserForEmployee(emp?._id)
      const to = emp?.email || empUser?.email
      if (to) {
        await sendLeaveStatusEmail({
          to,
          approved: true,
          employeeName,
          leaveType,
          startDate: populated.startDate,
          endDate: populated.endDate,
          comment: '',
        })
      }
      if (empUser?._id) {
        await createNotification({
          userId: empUser._id,
          title: 'Leave Approved',
          message: `Your ${leaveType} request was approved.`,
          type: 'leave',
          metadata: { requestId: String(populated._id) },
        })
      }
      request.emailsSent = request.emailsSent || {}
      request.emailsSent.approved = true
      await request.save()
    })
  }

  return populated
}

const rejectRequest = async (requestId, reason, approverUser) => {
  const request = await TimeOffRequest.findById(requestId)
  if (!request) throw new AppError('Time-off request not found', 404)
  if (request.status !== 'pending') {
    throw new AppError(`Only pending requests can be rejected (current: ${request.status})`)
  }

  if (
    approverUser.employee &&
    String(approverUser.employee) === String(request.employee)
  ) {
    throw new AppError('Employees cannot reject their own time-off requests', 403)
  }

  request.status = 'rejected'
  request.rejectionReason = reason || ''
  request.approvedBy = approverUser._id
  request.approvedAt = new Date()
  await request.save()

  const populated = await TimeOffRequest.findById(request._id)
    .populate('employee', 'firstName lastName employeeId email user')
    .populate('timeOffType', 'name code')

  if (!request.emailsSent?.rejected) {
    const {
      safeNotify,
      findUserForEmployee,
      createNotification,
    } = require('./notificationService')
    const { sendLeaveStatusEmail } = require('./emailService')

    await safeNotify('leave-reject', async () => {
      const emp = populated.employee
      const employeeName = emp ? `${emp.firstName} ${emp.lastName}` : 'Employee'
      const leaveType = populated.timeOffType?.name || 'Leave'
      const empUser = await findUserForEmployee(emp?._id)
      const to = emp?.email || empUser?.email
      if (to) {
        await sendLeaveStatusEmail({
          to,
          approved: false,
          employeeName,
          leaveType,
          startDate: populated.startDate,
          endDate: populated.endDate,
          reason: request.rejectionReason,
        })
      }
      if (empUser?._id) {
        await createNotification({
          userId: empUser._id,
          title: 'Leave Rejected',
          message: `Your ${leaveType} request was rejected.${request.rejectionReason ? ` Reason: ${request.rejectionReason}` : ''}`,
          type: 'leave',
          metadata: { requestId: String(populated._id) },
        })
      }
      request.emailsSent = request.emailsSent || {}
      request.emailsSent.rejected = true
      await request.save()
    })
  }

  return populated
}

module.exports = {
  createRequest,
  updateRequest,
  approveRequest,
  rejectRequest,
}

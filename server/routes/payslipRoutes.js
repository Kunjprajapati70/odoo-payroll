const router = require('express').Router()
const { getAll, getById, downloadPdf, sendEmail } = require('../controllers/payslipController')
const { protect } = require('../middleware/authMiddleware')

router.use(protect)
router.get('/', getAll)
router.get('/:id', getById)
router.get('/:id/pdf', downloadPdf)
router.post('/:id/send-email', sendEmail)

module.exports = router

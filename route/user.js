const express = require('express')
const router = express.Router();
const isAuth = require('../middleware/is-auth')
const BillController = require('../controller/User/BillController')
const ComplainController = require('../controller/User/MyComplainController')
const visitorController = require('../controller/User/VisitorController')
const complainResolvedController = require('../controller/User/ComplainResolvedController')

//This route is for bill
router.get('/my-bill/:type/:status', isAuth, BillController.getBillController)

// This route is for complain
router.get('/my-complain', isAuth, ComplainController.getMyComplainController)
router.post('/my-complain', isAuth, ComplainController.postComplainController)
router.delete('/my-complain/:id', isAuth, ComplainController.deleteComplainController)

//This route is for complain resolved
router.get('/complain/data/resolve', isAuth, complainResolvedController.getComplainResolvedController)
router.post('/complain/data/resolve', isAuth, complainResolvedController.postCompanyResolvedController)

//This route is for visitor
router.get('/visitor', isAuth, visitorController.getVisitorController)
router.post('/visitor', isAuth, visitorController.postVisitorController)
router.get('/visitor/create/data', isAuth, visitorController.createVisitorController)
router.put('/visitor/update/:id', isAuth, visitorController.putVisitiorController)
router.get('/visitor/allow/gateIn/:id', isAuth, visitorController.allowGateInFunc)

module.exports = router;
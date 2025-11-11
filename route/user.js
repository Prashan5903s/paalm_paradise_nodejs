const express = require("express");
const router = express.Router();

// 🧩 Middleware
const isAuth = require("../middleware/is-auth");

// 🧭 Controllers
const BillController = require("../controller/User/BillController");
const ComplainController = require("../controller/User/MyComplainController");
const complainResolvedController = require("../controller/User/ComplainResolvedController");
const visitorController = require("../controller/User/VisitorController");
const dashboardController = require("../controller/User/DashboardController");
const noticeController = require("../controller/User/NoticeController");
const eventController = require("../controller/User/EventController");
const appConfigController = require('../controller/User/AppConfigAPIController')
const profileController = require('../controller/User/profileAPIController')
const authController = require('../controller/User/AuthController')
const termsPolicyController = require('../controller/User/TermsPolicyController')
const panicController = require('../controller/User/PanicAPIController')

const createUpload = require('../util/upload');

const {
    middleware: imageUpload
} = createUpload(
    ['image/jpeg', 'image/png', 'image/jpg'], // allowed types
    'uploads/images' // directory inside /public/
);

const {
    middleware: imageVisitorUpload
} = createUpload(
    ['image/jpeg', 'image/png', 'image/jpg'], // allowed types
    'uploads/visitor' // directory inside /public/
);

// ==================== 💰 BILL ROUTES ====================
router.get("/my-bill/:type/:status", isAuth, BillController.getBillController);
router.get('/bill/maintenance/data/:status', isAuth, BillController.getMaintenanceBill)

// ✅ Generate or Download Invoice PDF
router.get("/invoice/pdf/page/:invoiceNo", isAuth, BillController.downloadInvoicePDF);

// ==================== 📢 COMPLAIN ROUTES ====================
router.get("/my-complain", isAuth, ComplainController.getMyComplainController);

router.get("/my-user-complain/:status/:start/:end", isAuth, ComplainController.getMyComplainFilterController);

router.post("/my-complain", isAuth, ComplainController.postComplainController);
router.get("/my-complain/data/create", isAuth, ComplainController.getCreateComplainController);
router.delete("/my-complain/:id", isAuth, ComplainController.deleteComplainController);

// ==================== ✅ RESOLVED COMPLAIN ====================
router.get("/complain/data/resolve", isAuth, complainResolvedController.getComplainResolvedController);
router.post("/complain/data/resolve", isAuth, complainResolvedController.postCompanyResolvedController);

// ==================== 🚪 VISITOR ROUTES ====================
router.get("/visitor", isAuth, visitorController.getVisitorController);

router.get("/visitor/datass/exit/:id", isAuth, visitorController.getVisitorExitData);

router.get("/user-visitor/:start/:end", isAuth, visitorController.getVisitorFilterController);

router.get('/visitor/otp/code/:otp', isAuth, visitorController.getVisitorHappyCode)

router.post("/visitor", isAuth, imageVisitorUpload("photo"), visitorController.postVisitorController);
router.get("/visitor/create/data", isAuth, visitorController.createVisitorController);
router.put("/visitor/update/:id", isAuth, imageVisitorUpload("photo"), visitorController.putVisitiorController);
router.get("/visitor/allow/gateIn/:status/:id", isAuth, visitorController.allowGateInFunc);

// ==================== 📊 DASHBOARD ====================
router.get("/dashboard", isAuth, dashboardController.getDashboardDataAPI);

// ==================== 📜 NOTICE ====================
router.get("/notice", isAuth, noticeController.getNoticeController);

// ==================== 🎉 EVENT ====================
router.get("/event", isAuth, eventController.getEventListAPIController);

// This route is for app config data
router.get('/app/config/data', isAuth, appConfigController.getConfigAPIController)

//This route is for profile
router.post('/profile/user/data', isAuth, imageUpload('photo'), profileController.postProfileAPIController)

//This route is for logout
router.get('/logout/data', isAuth, authController.getLogOutController)

//This route is for change password
router.post('/change/password/data', isAuth, authController.changePasswordController)

//This route is for profile
router.get('/profile/data', isAuth, authController.getUserProfileData)

//This route is for terms and policy
router.get("/terms/policy/data", isAuth, termsPolicyController.getTermsPolicyController)

router.post('/change/profile/data/:status', isAuth, profileController.postProfileChangeDataController)

router.get('/panic/notify/data', isAuth, panicController.getPanicNotify)

module.exports = router;
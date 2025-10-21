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

// ==================== 💰 BILL ROUTES ====================
router.get("/my-bill/:type/:status", isAuth, BillController.getBillController);

// ✅ Generate or Download Invoice PDF
router.get("/invoice/pdf/page/:invoiceNo", isAuth, BillController.downloadInvoicePDF);

// ==================== 📢 COMPLAIN ROUTES ====================
router.get("/my-complain", isAuth, ComplainController.getMyComplainController);

router.get("/my-user-complain/:start/:end", isAuth, ComplainController.getMyComplainFilterController);

router.post("/my-complain", isAuth, ComplainController.postComplainController);
router.get("/my-complain/data/create", isAuth, ComplainController.getCreateComplainController);
router.delete("/my-complain/:id", isAuth, ComplainController.deleteComplainController);

// ==================== ✅ RESOLVED COMPLAIN ====================
router.get("/complain/data/resolve", isAuth, complainResolvedController.getComplainResolvedController);
router.post("/complain/data/resolve", isAuth, complainResolvedController.postCompanyResolvedController);

// ==================== 🚪 VISITOR ROUTES ====================
router.get("/visitor", isAuth, visitorController.getVisitorController);
router.get("/user-visitor/:start/:end", isAuth, visitorController.getVisitorFilterController);
router.post("/visitor", isAuth, visitorController.postVisitorController);
router.get("/visitor/create/data", isAuth, visitorController.createVisitorController);
router.put("/visitor/update/:id", isAuth, visitorController.putVisitiorController);
router.get("/visitor/allow/gateIn/:id", isAuth, visitorController.allowGateInFunc);

// ==================== 📊 DASHBOARD ====================
router.get("/dashboard", isAuth, dashboardController.getDashboardDataAPI);

// ==================== 📜 NOTICE ====================
router.get("/notice", isAuth, noticeController.getNoticeController);

// ==================== 🎉 EVENT ====================
router.get("/event", isAuth, eventController.getEventListAPIController);

router.get('/bill/maintenance/data/:status', isAuth, BillController.getMaintenanceBill)

module.exports = router;
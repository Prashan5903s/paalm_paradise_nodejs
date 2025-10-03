const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/is-auth');
const appMenuController = require('../controller/Company/AppMenuController');
const roleController = require('../controller/Company/RoleAPIController')
const towerController = require('../controller/Company/TowerController');
const floorController = require('../controller/Company/FloorController')
const apartmentController = require('../controller/Company/ApartmentController')
const cameraController = require('../controller/Company/CameraController')
const billController = require('../controller/Company/BillController')
const paymentController = require('../controller/Company/PaymentController')
const userBillController = require('../controller/Company/UserBillController')
const complainController = require('../controller/Company/ComplainController')
const dashboardController = require('../controller/Company/DashboardController')
const noticeController = require('../controller/Company/NoticeController')
const eventController = require('../controller/Company/EventController')
const maintenanceController = require('../controller/Company/MaintenanceController')
const apartmentTypeController = require('../controller/Company/ApartmentTypeController')
const ticketTypeController = require('../controller/Company/TicketTypeController')
const visitorTypeController = require('../controller/Company/VisitorTypeController')
const reportController = require('../controller/Company/ReportController')

const createUpload = require('../util/upload');

const activityUpload = createUpload(
    [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'image/svg+xml', 'image/bmp', 'image/tiff', 'image/x-icon',
        'application/pdf', 'application/zip',
        'application/x-zip-compressed',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'video/mp4'
    ],
    'bills', // Folder inside /public
    500 // Max size in MB
);

router.get('/app/menu/label/listing/:sn', isAuth, appMenuController.getAppMenuCompanyListAPI);
router.post('/app/menu/label/listing/:sn', isAuth, appMenuController.postCompanyMenuListAPI);

//This route is for role
router.get('/role', isAuth, roleController.getRoleAPI)
router.get('/role/create', isAuth, roleController.createRoleAPI);
router.post('/role', isAuth, roleController.postRoleAPI)
router.put('/role/:roleId', isAuth, roleController.putRoleAPI)

//This route is for tower
router.get('/tower', isAuth, towerController.getTowerAPI)
router.post('/tower', isAuth, towerController.postTowerAPI)
router.put('/tower/:towerId', isAuth, towerController.putTowerAPI)

//This route is for floor
router.get('/floor', isAuth, floorController.getFloorAPI)
router.get('/floor/create', isAuth, floorController.getCreateAPI)
router.post('/floor', isAuth, floorController.postFloorController)
router.put('/floor/:floorId', isAuth, floorController.updateFloorAPI)

//This route is for Apartment
router.get('/apartment', isAuth, apartmentController.getApartmentAPI)
router.get('/apartment/create', isAuth, apartmentController.createApartmentAPI)
router.post('/apartment', isAuth, apartmentController.postApartmentAPI)
router.put('/apartment/:apartmentId', isAuth, apartmentController.updateApartmentAPI)

//This route is for camera
router.get('/camera', isAuth, cameraController.getCameraController)

//This route is for Bill
router.get('/bill/data/:type', isAuth, billController.getBillData)
router.get('/bill/create', isAuth, billController.getCreateBill)
router.post('/bill', isAuth, ...activityUpload.middleware('image'), billController.postBillController)
router.put('/bill/update/:billId', isAuth, ...activityUpload.middleware('image'), billController.putBillController)

//This route is for payment
router.get("/payment", isAuth, paymentController.getPaymentController)
router.post('/payment', isAuth, paymentController.postPaymentController)

//This route is for User Bill
router.get('/user/bill/:billId', isAuth, userBillController.getUserBillController)
router.post('/user/bill/data/payment', isAuth, userBillController.postUserBillController)

//This route is for company
router.get('/complain', isAuth, complainController.getComplainController)
router.get('/complain/create', isAuth, complainController.createComplainController)
router.post('/complain/data/:id/:code', isAuth, complainController.postComplainController)

//This route is for dashboard
router.get('/dashboard', isAuth, dashboardController.getDashboardDataAPI)

//This route is for notice
router.get('/notice', isAuth, noticeController.getNoticeAPIController)
router.get('/notice/create', isAuth, noticeController.createNoticeAPI)
router.post('/notice', isAuth, noticeController.postNoticeController)
router.put('/notice/update/:id', isAuth, noticeController.updateNoticeAPIController)

//This route is for event
router.get('/event', isAuth, eventController.getEventAPIController)
router.get('/event/create', isAuth, eventController.createEventController)
router.post('/event', isAuth, eventController.postEventControllerAPI)
router.put('/event/update/:id', isAuth, eventController.updateEventControllerAPI)

//This route is for maintenance
router.get("/maintenance-setting/:type", isAuth, maintenanceController.getMaintenanceAPIController)
router.get('/maintenance-setting/data/create', isAuth, maintenanceController.createApartmentTypeController)
router.post('/maintenance-setting/:type', isAuth, maintenanceController.postMaintenanceAPIController)

//This route is for apartment type
router.get('/apartment-type', isAuth, apartmentTypeController.getApartmentType)
router.post('/apartment-type', isAuth, apartmentTypeController.postType)
router.put('/apartment-type/:id', isAuth, apartmentTypeController.updateType)

//This route is for ticket type
router.get('/ticket-type', isAuth, ticketTypeController.getTicketType)
router.post('/ticket-type', isAuth, ticketTypeController.postType)
router.put('/ticket-type/:id', isAuth, ticketTypeController.updateType)

//This route is for visitor type
router.get('/visitor-type', isAuth, visitorTypeController.getVisitorType)
router.post('/visitor-type', isAuth, visitorTypeController.postType)
router.put('/visitor-type/:id', isAuth, visitorTypeController.updateType)

//This route is for payment report
router.get('/graph/payment/report/:type', isAuth, reportController.getGraphPaymentReport)
router.get('/table/payment/report/:start/:end/:type', isAuth, reportController.getTablePaymentReport)

//This route is for financial report
router.get("/table/financial/report/:start/:end/:type", isAuth, reportController.getFinancialReport)

module.exports = router;
const { response } = require('express')
const Bill = require('../../model/Bill')
const Complain = require('../../model/Complain')
const User = require('../../model/User')
const Visitor = require('../../model/Visitor')
const UserBill = require('../../model/UserBill')
const Maintenance = require('../../model/Maintenance')
const { successResponse, errorResponse } = require('../../util/response')

exports.getDashboardDataAPI = async (req, res, next) => {
    try {

        const userId = req.userId;

        const user = await User.findById(userId)

        const masterId = user.created_by;

        const camera = user.cameras;

        const pendingComplain = await Complain.find({ created_by: userId, complain_status: "1" })
        const inProgressComplain = await Complain.find({ created_by: userId, complain_status: "4" })
        const resolvedComplain = await Complain.find({ created_by: userId, complain_status: "3" })

        const paidCommanAreaBill = await Bill.find({ status: true, bill_data_type: "common-area-bill", created_by: masterId }).populate('apartment_id').populate('bill_type').populate({
            path: "payments",
            model: "Payment"
        });
        const unpaidCommanAreaBill = await Bill.find({ status: false, bill_data_type: "common-area-bill", created_by: masterId }).populate('apartment_id').populate('bill_type').populate({
            path: "payments",
            model: "Payment"
        });

        const utilityBill = await Bill.find({ user_id: userId, bill_data_type: "utilityBills" }).populate('apartment_id').populate('bill_type').populate({
            path: "payments",
            model: "Payment"
        });

        const paidUtilityBill = await Bill.find({ user_id: userId, status: true, bill_data_type: "utilityBills" }).populate('apartment_id').populate('bill_type').populate({
            path: "payments",
            model: "Payment"
        });
        const unpaidUtilityBill = await Bill.find({ user_id: userId, status: false, bill_data_type: "utilityBills" }).populate('apartment_id').populate('bill_type').populate({
            path: "payments",
            model: "Payment"
        });

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const visitor = await Visitor.find({
            created_by: userId,
            created_at: {
                $gte: startOfToday,
                $lte: endOfToday
            }
        })
            .populate('user_id')
            .populate({
                path: 'apartment_id',
                populate: [
                    { path: 'tower_id' },
                    { path: 'floor_id' }
                ]
            });

        const userBill = await UserBill.find({ user_id: userId })
            .populate('bill_id')
            .populate('apartment_id').populate('user_id')

        const maintenance = await Maintenance.findOne({ cost_type: "1" })

        const fixedCost = maintenance.fixed_data;

        if (!camera || !fixedCost || !maintenance || !userBill || !visitor || !unpaidCommanAreaBill || !paidCommanAreaBill || !paidUtilityBill || !unpaidUtilityBill, !pendingComplain || !resolvedComplain) {
            return errorResponse(res, "Data does not exist", {}, 404)
        }

        const finalData = {
            camera,
            fixedCost,
            userBill,
            visitor,
            pendingComplain,
            resolvedComplain,
            inProgressComplain,
            paidCommanAreaBill,
            unpaidCommanAreaBill,
            paidUtilityBill,
            unpaidUtilityBill,
            utilityBill
        }

        return successResponse(res, "Dashboard data fetched successfully", finalData)

    } catch (error) {
        next(error)
    }
}
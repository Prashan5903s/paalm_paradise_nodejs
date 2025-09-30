const Bill = require('../../model/Bill')
const Complain = require('../../model/Complain')
const User = require('../../model/User')
const Visitor = require('../../model/Visitor')
const RoleUser = require('../../model/RoleUser')
const Notice = require('../../model/Notice')
const mongoose = require('mongoose')
const UserBill = require('../../model/UserBill')
const Maintenance = require('../../model/Maintenance')
const { successResponse, errorResponse } = require('../../util/response')

async function getComplainsByStatus(userId, status) {
    return await Complain.aggregate([
        {
            $match: { created_by: new mongoose.Types.ObjectId(userId) }
        },
        {
            $lookup: {
                from: "complain_users",
                let: { complainId: "$_id" },
                pipeline: [
                    {
                        $match: { $expr: { $eq: ["$complain_id", "$$complainId"] } }
                    },
                    { $sort: { created_at: -1 } }, // latest first
                    { $limit: 1 } // केवल latest record
                ],
                as: "latest_complain_user"
            }
        },
        {
            $unwind: { path: "$latest_complain_user", preserveNullAndEmptyArrays: true }
        },
        {
            $match: { "latest_complain_user.complaint_status": status }
        }
    ]);
}

exports.getDashboardDataAPI = async (req, res, next) => {
    try {

        const userId = req.userId;

        const user = await User.findById(userId)

        const masterId = user.created_by;

        const camera = user.cameras;

        // Use like this:
        const pendingComplain = await getComplainsByStatus(userId, "1");   // pending
        const inProgressComplain = await getComplainsByStatus(userId, "4"); // in-progress
        const resolvedComplain = await getComplainsByStatus(userId, "3");   // resolved

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

        const bills = await Bill.find({ bill_data_type: "maintenance", created_by: masterId }).select('_id');
        const billsId = bills.map(b => b._id.toString())

        const userBill = await UserBill.find({ user_id: userId, bill_id: { $in: billsId } })
            .populate('bill_id')
            .populate('apartment_id').populate('user_id')

        const maintenance = await Maintenance.findOne({ cost_type: "1", created_by: masterId })

        const fixedCost = maintenance.fixed_data;

        const roleUser = await RoleUser.find({ user_id: userId }).select('role_id')

        const roleIds = roleUser.map(r => (r.role_id))

        const notice = await Notice.find({
            created_by: masterId,
            role_id: { $elemMatch: { $in: (roleIds) } }
        });

        if (!camera || !fixedCost || !maintenance || !userBill || !visitor || !unpaidCommanAreaBill || !paidCommanAreaBill || !paidUtilityBill || !unpaidUtilityBill, !pendingComplain || !resolvedComplain || !user || !roleUser || !notice) {
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
            utilityBill,
            notice
        }

        return successResponse(res, "Dashboard data fetched successfully", finalData)

    } catch (error) {
        next(error)
    }
}
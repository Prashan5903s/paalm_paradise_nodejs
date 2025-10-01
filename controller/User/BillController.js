const UserBill = require('../../model/UserBill');
const Bill = require('../../model/Bill');
const User = require('../../model/User')
const Maintenance = require('../../model/Maintenance')
const { successResponse } = require('../../util/response');

exports.getBillController = async (req, res, next) => {
    try {

        const statusField = req.params.status || false;

        let data = [];

        const userId = req.userId
        const type = req.params.type;

        const user = await User.findById(userId)

        const masterId = user?.created_by;

        if (type == 'common-area-bill') {

            const bills = await Bill.find({ status: statusField, bill_data_type: type, created_by: masterId }).populate('apartment_id').populate('bill_type').populate({
                path: "payments",
                model: "Payment"
            });

            data = bills;

        } else if (type == 'maintenance') {

            let datas = {}

            const bills = await Bill.find({ bill_data_type: type, created_by: masterId }).select('_id');
            const billsId = bills.map(b => b._id.toString())

            const userBill = await UserBill.find({ user_id: userId, bill_id: { $in: billsId } })
                .populate('bill_id')
                .populate('apartment_id')
                .populate('user_id')
                .populate('payments')

            const maintenance = await Maintenance.findOne({ cost_type: "1", created_by: masterId })

            const fixedCost = maintenance.fixed_data;

            if (!userBill) {
                return errorResponse(res, 'User bill does not exist', {}, 404)
            }

            datas['userBill'] = userBill;

            datas['fixed_cost'] = fixedCost;

            data = datas;

        } else {

            data = await Bill.find({ created_by: masterId, status: statusField, bill_data_type: type }).populate('apartment_id').populate('bill_type').populate({
                path: "payments",
                model: "Payment"
            })

        }

        return successResponse(res, "Bill fetched successfully", data)

    } catch (error) {
        next(error)
    }
}
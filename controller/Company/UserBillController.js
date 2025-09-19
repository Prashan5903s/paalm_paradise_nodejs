const Apartment = require('../../model/Apartment')
const UserBill = require('../../model/UserBill');
const Maintenance = require('../../model/Maintenance')
const mongoose = require('mongoose')
const { errorResponse, successResponse } = require('../../util/response');

exports.getUserBillController = async (req, res, next) => {
    try {

        const billId = req.params.billId;

        const userId = req.userId;

        let data = {};

        const userBills = await UserBill.find({ bill_id: billId }).select('apartment_id');

        const apartmentIds = userBills.map(b => b.apartment_id);

        const apartments = await Apartment.aggregate([
            {
                $match: {
                    created_by: new mongoose.Types.ObjectId(userId),
                    status: true,
                    assigned_to: { $ne: null },
                    _id: { $in: apartmentIds.map(id => new mongoose.Types.ObjectId(id)) }
                }
            },
            {
                $lookup: {
                    from: "user_bills",
                    localField: "_id",
                    foreignField: "apartment_id",
                    as: "user_bills"
                }
            },
            {
                $addFields: {
                    user_bills: {
                        $filter: {
                            input: "$user_bills",
                            as: "ub",
                            cond: { $eq: ["$$ub.bill_id", new mongoose.Types.ObjectId(billId)] }
                        }
                    }
                }
            },
            // get bill details for user_bills
            {
                $lookup: {
                    from: "bills",
                    localField: "user_bills.bill_id",
                    foreignField: "_id",
                    as: "bill_details"
                }
            },
            {
                $addFields: {
                    user_bills: {
                        $map: {
                            input: "$user_bills",
                            as: "ub",
                            in: {
                                $mergeObjects: [
                                    "$$ub",
                                    {
                                        bill: {
                                            $arrayElemAt: [
                                                {
                                                    $filter: {
                                                        input: "$bill_details",
                                                        as: "bd",
                                                        cond: { $eq: ["$$bd._id", "$$ub.bill_id"] }
                                                    }
                                                },
                                                0
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            {
                $project: { bill_details: 0 }
            },
            // bring in user details (assigned_to)
            {
                $lookup: {
                    from: "users",              // collection name
                    localField: "assigned_to",  // Apartment.assigned_to
                    foreignField: "_id",        // User._id
                    as: "assigned_user"
                }
            },
            {
                $unwind: {
                    path: "$assigned_user",
                    preserveNullAndEmptyArrays: true
                }
            }
        ]);

        // const userBill = await UserBill.find({ bill_id: billId }).populate('bill_id').populate('apartment_id').populate('user_id')

        const maintenance = await Maintenance.findOne({ cost_type: "1" })

        const fixedCost = maintenance.fixed_data;

        if (!apartments) {
            return errorResponse(res, 'User bill does not exist', {}, 404)
        }

        data['userBill'] = apartments;

        data['fixed_cost'] = fixedCost;

        return successResponse(res, 'User bill fetched successfully', data)

    } catch (error) {
        next(error)
    }
}

exports.postUserBillController = async (req, res, next) => {
    try {
        const userId = req.userId;

        const {
            bank_name,
            amount,
            status,
            billId,
            apartment_id,
            paid_remark,
            payment_mode,
            cheque_no,
            cheque_date,
            demand_draft_no,
            demand_draft_date,
            neft_no,
            neft_date,
        } = req.body;

        // check if already exists
        let userBill = await UserBill.findOne({ bill_id: billId, apartment_id });

        if (!userBill) {
            // find the apartment to get assigned user
            const apartment = await Apartment.findById(apartment_id);
            if (!apartment) {
                return warningResponse(res, "Apartment not found.", {}, 404);
            }

            const user_id = apartment.assigned_to;

            userBill = new UserBill({
                bank_name,
                amount: Number(amount),
                cheque_no,
                apartment_id,
                user_id,
                created_by: userId,
                bill_id: billId,
                cheque_date,
                payment_mode,
                demand_draft_no,
                paid_remark,
                demand_draft_date,
                neft_no,
                neft_date,
                status,
            });

            await userBill.save();
        } else {
            // update existing amount by adding
            const userBillAmount = Number(userBill.amount) + Number(amount);

            await UserBill.findOneAndUpdate(
                { bill_id: billId, apartment_id },
                {
                    bank_name,
                    amount: userBillAmount,
                    cheque_no,
                    cheque_date,
                    payment_mode,
                    demand_draft_no,
                    paid_remark,
                    demand_draft_date,
                    neft_no,
                    neft_date,
                    status,
                }
            );
        }

        return successResponse(res, "Payment done successfully");
    } catch (error) {
        next(error);
    }
};

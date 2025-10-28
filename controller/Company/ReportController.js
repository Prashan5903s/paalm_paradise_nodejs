const Bill = require('../../model/Bill');
const UserBill = require('../../model/UserBill')
const Maintenance = require('../../model/Maintenance')
const {
    successResponse
} = require('../../util/response');

exports.getGraphPaymentReport = async (req, res, next) => {
    try {

        const userId = req?.userId;
        const type = req?.params?.type;

        let monthlyTotals = Array(12).fill(0);

        if (type == "All") {

            const bills = await Bill.find({
                    created_by: userId
                })
                .populate('payments');

            bills.forEach(bill => {
                if (!bill.created_at) return;

                const month = bill.created_at.getMonth();
                let totalPayments = 0;

                if (bill.payments && bill.payments.length > 0) {
                    totalPayments = bill.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
                }

                monthlyTotals[month] += totalPayments / 1000;
            });

        } else if (type == "Utility") {

            const bills = await Bill.find({
                created_by: userId,
                bill_data_type: "utilityBills"
            }).populate('payments')

            bills.forEach(bill => {
                if (!bill.created_at) return;

                const month = bill.created_at.getMonth();
                let totalPayments = 0;

                if (bill.payments && bill.payments.length > 0) {
                    totalPayments = bill.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
                }

                monthlyTotals[month] += totalPayments / 1000;
            });

        } else if (type == "Common Area") {

            const bills = await Bill.find({
                created_by: userId,
                bill_data_type: "common-area-bill"
            }).populate('payments')

            bills.forEach(bill => {
                if (!bill.created_at) return;

                const month = bill.created_at.getMonth();
                let totalPayments = 0;

                if (bill.payments && bill.payments.length > 0) {
                    totalPayments = bill.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
                }

                monthlyTotals[month] += totalPayments / 1000;
            });

        } else {

            const bills = await Bill.find({
                created_by: userId,
                bill_data_type: "maintenance"
            }).populate('payments')

            bills.forEach(bill => {
                if (!bill.created_at) return;

                const month = bill.created_at.getMonth();
                let totalPayments = 0;

                if (bill.payments && bill.payments.length > 0) {
                    totalPayments = bill.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
                }

                monthlyTotals[month] += totalPayments / 1000;
            });

        }

        return successResponse(res, "Graph report fetched successfully", monthlyTotals)

    } catch (error) {
        next(error)
    }
}

exports.getTablePaymentReport = async (req, res, next) => {
    try {

        const userId = req?.userId;
        const type = req.params.type;
        const start = req?.params?.start;
        const end = req?.params?.end;

        let bill;

        if (type == "all") {

            bill = await Bill.find({
                    created_by: userId,
                    created_at: {
                        $gte: new Date(start),
                        $lte: new Date(end)
                    }
                })
                .populate("bill_type") // bill_type populate
                .populate({
                    path: "apartment_id",
                    populate: {
                        path: "assigned_to", // Apartment → Assigned User
                        model: "users"
                    }
                })
                .populate({
                    path: "payments",
                    model: "Payment",
                    populate: {
                        path: "user_bill_id", // Payment → UserBill
                        model: "user_bill",
                        populate: {
                            path: "user_id", // UserBill → User
                            model: "users"
                        }
                    }
                });

        } else {
            bill = await Bill.find({
                    created_by: userId,
                    bill_data_type: type,
                    created_at: {
                        $gte: new Date(start),
                        $lte: new Date(end)
                    }
                })
                .populate("bill_type") // bill_type populate
                .populate({
                    path: "apartment_id",
                    populate: {
                        path: "assigned_to", // Apartment → Assigned User
                        model: "users"
                    }
                })
                .populate({
                    path: "payments",
                    model: "Payment",
                    populate: {
                        path: "user_bill_id", // Payment → UserBill
                        model: "user_bill",
                        populate: {
                            path: "user_id", // UserBill → User
                            model: "users"
                        }
                    }
                });
        }

        return successResponse(res, "Table payment report fetched successfully", bill)

    } catch (error) {
        next(error)
    }
}

exports.getFinancialReport = async (req, res, next) => {
    try {

        const userId = req?.userId;
        const type = req?.params?.type
        const start = req?.params?.start;
        const end = req?.params?.end;

        let data = [];

        if (type == 'common-area-bill' || type == "utilityBills") {

            const bills = await Bill.find({
                    bill_data_type: type,
                    created_by: userId,
                    created_at: {
                        $gte: new Date(start),
                        $lte: new Date(end)
                    }
                })
                .populate("bill_type") // bill_type populate
                .populate({
                    path: "apartment_id",
                    populate: {
                        path: "assigned_to", // Apartment → Assigned User
                        model: "users"
                    }
                })
                .populate({
                    path: "payments",
                    model: "Payment",
                    populate: {
                        path: "user_bill_id", // Payment → UserBill
                        model: "user_bill",
                        populate: {
                            path: "user_id", // UserBill → User
                            model: "users"
                        }
                    }
                });

            data = bills;

        } else if (type == 'maintenance') {

            let datas = {}

            const bills = await Bill.find({
                bill_data_type: type,
                created_by: userId,
                created_at: {
                    $gte: new Date(start),
                    $lte: new Date(end)
                }
            }).select('_id');

            const billsId = bills.map(b => b._id.toString())

            const userBill = await UserBill.find({
                    bill_id: {
                        $in: billsId
                    }
                })
                .populate("bill_id") // Bill details
                .populate({
                    path: "apartment_id",
                    populate: {
                        path: "assigned_to", // Apartment → Assigned User
                        model: "users"
                    }
                })
                .populate("user_id") // Direct user of UserBill
                .populate({
                    path: "payments",
                    model: "Payment",
                    populate: {
                        path: "user_bill_id", // Payment → UserBill
                        model: "user_bill",
                        populate: {
                            path: "user_id", // UserBill → User
                            model: "users"
                        }
                    }
                });


            const maintenance = await Maintenance.findOne({
                status: true,
                created_by: userId
            })

            let finalValue;

            const fixedCost = maintenance.fixed_data;

            if (fixedCost.length == 0) {

                finalValue = maintenance.unit_type;

            } else {

                finalValue = fixedCost

            }

            if (!userBill) {
                return errorResponse(res, 'User bill does not exist', {}, 404)
            }

            datas['userBill'] = userBill;

            datas['fixedCost'] = finalValue;

            data = datas;

        } else {

            let datas = {}

            const user_bill = await Bill.find({
                    created_by: userId,
                    bill_data_type: {
                        $ne: "maintenance"
                    },
                    created_at: {
                        $gte: new Date(start),
                        $lte: new Date(end)
                    }
                })
                .populate("bill_type") // bill_type populate
                .populate({
                    path: "apartment_id",
                    populate: {
                        path: "assigned_to", // Apartment → Assigned User
                        model: "users"
                    }
                })
                .populate({
                    path: "payments",
                    model: "Payment",
                    populate: {
                        path: "user_bill_id", // Payment → UserBill
                        model: "user_bill",
                        populate: {
                            path: "user_id", // UserBill → User
                            model: "users"
                        }
                    }
                });

            const bills = await Bill.find({
                created_by: userId,
                bill_data_type: "maintenance",
                created_at: {
                    $gte: new Date(start),
                    $lte: new Date(end)
                }
            }).select('_id');

            const billsId = bills.map(b => b._id.toString())

            const userBill = await UserBill.find({
                    bill_id: {
                        $in: billsId
                    }
                })
                .populate("bill_id") // Bill details
                .populate({
                    path: "apartment_id",
                    populate: {
                        path: "assigned_to", // Apartment → Assigned User
                        model: "users"
                    }
                })
                .populate("user_id") // Direct user of UserBill
                .populate({
                    path: "payments",
                    model: "Payment",
                    populate: {
                        path: "user_bill_id", // Payment → UserBill
                        model: "user_bill",
                        populate: {
                            path: "user_id", // UserBill → User
                            model: "users"
                        }
                    }
                });

            const maintenance = await Maintenance.findOne({
                status: true,
                created_by: userId
            })

            let finalValue;

            const fixedCost = maintenance.fixed_data;

            if (fixedCost.length == 0) {

                finalValue = maintenance.unit_type;

            } else {

                finalValue = fixedCost

            }

            if (!userBill) {
                return errorResponse(res, 'User bill does not exist', {}, 404)
            }

            datas['userBill'] = [...userBill, ...user_bill];

            datas['fixedCost'] = finalValue;

            data = datas;

        }

        return successResponse(res, "Financial report fetched successfully", data)

    } catch (error) {
        next(error)
    }
}
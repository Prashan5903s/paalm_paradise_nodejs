const Bill = require('../../model/Bill');
const { successResponse } = require('../../util/response');

exports.getGraphPaymentReport = async (req, res, next) => {
    try {

        const userId = req?.userId;
        const type = req?.params?.type;

        let monthlyTotals = Array(12).fill(0);

        if (type == "All") {

            const bills = await Bill.find({ created_by: userId })
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

            const bills = await Bill.find({ created_by: userId, bill_data_type: "utilityBills" }).populate('payments')

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

            const bills = await Bill.find({ created_by: userId, bill_data_type: "common-area-bill" }).populate('payments')

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

            const bills = await Bill.find({ created_by: userId, bill_data_type: "maintenance" }).populate('payments')

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

    } catch (error) {
        next(error)
    }
}
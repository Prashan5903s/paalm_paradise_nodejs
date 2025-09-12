const Apartment = require('../../model/Apartment')
const Bill = require('../../model/Bill')
const BillType = require('../../model/BillType')
const { errorResponse, successResponse } = require('../../util/response')

exports.getBillData = async (req, res, next) => {
    try {

        const userId = req.userId;

        const type = req.params.type;

        const bill = await Bill.find({ created_by: userId, bill_data_type: type }).populate('apartment_id').populate('bill_type').populate({
            path: "payments",
            model: "Payment"
        })

        if (!bill) {
            return errorResponse(res, "Bill does not exist", {}, 404)
        }

        return successResponse(res, "Bill data fetched successfully", bill)

    } catch (error) {
        next(error)
    }
}

exports.getCreateBill = async (req, res, next) => {
    try {

        const userId = req.userId;

        const data = {};

        const apartment = await Apartment.find({ created_by: userId });
        const billType = await BillType.find();

        if (!apartment || !billType) {
            return errorResponse(res, "Create data does not exist", {}, 404);
        }

        data.apartment = apartment;
        data.billType = billType;

        return successResponse(res, "Data fetched successfully", data, 200);

    } catch (error) {
        next(error)
    }
}

exports.postBillController = async (req, res, next) => {
    try {

        const userId = req.userId;

        let {
            apartment_id,
            bill_type,
            bill_amount,
            bill_date,
            bill_due_date,
            payment_due_date,
            month,
            addtional_cost,
            type,
            year
        } = req.body;

        const file = req.file;

        //  Parse additional_cost if it comes as a string
        if (addtional_cost && typeof addtional_cost === "string") {
            try {
                addtional_cost = JSON.parse(addtional_cost);
            } catch (e) {
                addtional_cost = [];
            }
        }

        const bill = new Bill({
            bill_data_type: type,
            apartment_id: apartment_id || null,
            bill_type: bill_type || null,
            bill_amount,
            bill_date,
            bill_due_date,
            doc_data: file?.filename,
            payment_due_date,
            month,
            year,
            additional_cost: addtional_cost,
            created_by: userId
        });

        await bill.save();
        return successResponse(res, "Bill created successfully");
    } catch (error) {
        next(error);
    }
};

exports.putBillController = async (req, res, next) => {
    try {
        const userId = req.userId;
        const billId = req.params.billId;

        if (!req.body) {
            return errorResponse(res, "Request body is missing", {}, 400);
        }

        const bill = await Bill.findOne({ _id: billId, created_by: userId });
        if (!bill) {
            return errorResponse(res, "Bill does not exist", {}, 404);
        }

        let {
            apartment_id,
            bill_type,
            bill_amount,
            bill_date,
            bill_due_date,
            payment_due_date,
            month,
            addtional_cost,
            type,
            year
        } = req.body;

        //  Parse additional_cost same as in POST
        if (addtional_cost && typeof addtional_cost === "string") {
            try {
                addtional_cost = JSON.parse(addtional_cost);
            } catch (e) {
                addtional_cost = [];
            }
        }

        await Bill.findByIdAndUpdate(
            billId,
            {
                bill_data_type: type,
                apartment_id: apartment_id || null,
                bill_type: bill_type || null,
                bill_amount,
                bill_date,
                bill_due_date,
                payment_due_date,
                month,
                year,
                additional_cost: addtional_cost,
                updated_at: new Date(),
                created_by: userId
            },
            { new: true }
        );

        return successResponse(res, "Bill updated successfully");
    } catch (error) {
        next(error);
    }
};



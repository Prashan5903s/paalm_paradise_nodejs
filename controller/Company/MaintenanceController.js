const Maintenance = require('../../model/Maintenance');
const { errorResponse, successResponse } = require('../../util/response');

exports.getMaintenanceAPIController = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const type = req.params.type;

        const maintenance = await Maintenance.findOne({ created_by: userId, cost_type: type })

        if (!maintenance) {
            return errorResponse(res, "Maintenance does not exist", {}, 404)
        }

        return successResponse(res, "Maintenance fetched successfully", maintenance)

    } catch (error) {
        next(error)
    }
}

exports.postMaintenanceAPIController = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const { unit_data } = req.body;

        const type = req.params.type;

        const maintenance = await Maintenance.findOne({ created_by: userId, cost_type: type })

        if (!maintenance) {
            return errorResponse(res, "Maintenance does not exist", {}, 404)
        }

        if (type == "1") {

            const result = Object.entries(unit_data).map(([key, value]) => ({
                apartment_type: String(key),
                unit_value: String(value)
            }));

            await Maintenance.findOneAndUpdate({ created_by: userId, cost_type: type }, {
                fixed_data: result
            })

        } else {

            await Maintenance.findOneAndUpdate({ created_by: userId, cost_type: type }, {
                unit_type: unit_data
            })

        }

        return successResponse(res, "Maintenance setting updated successfully")


    } catch (error) {
        next(error)
    }
}
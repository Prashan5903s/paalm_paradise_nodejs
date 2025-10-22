const AppConfig = require('../../model/AppConfig');
const { successResponse } = require('../../util/response');

exports.getConfigAPIController = async (req, res, next) => {
    try {

        const appConfig = await AppConfig.findOne();

        return successResponse(res, "App config fetched successfully", appConfig)

    } catch (error) {
        next(error)
    }
}
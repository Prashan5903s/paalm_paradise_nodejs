const ApartmentType = require('../../model/ApartmentType');
const { errorResponse, successResponse } = require('../../util/response');

exports.getApartmentType = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const apartmentType = await ApartmentType.find({ created_by: userId })

        if (!apartmentType) {
            return errorResponse(res, "Apartment type does not exist", {}, 404)
        }

        return successResponse(res, "Apartment fetched successfully", apartmentType)

    } catch (error) {
        next(error)
    }
}

exports.postType = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const { name } = req.body

        const apartmentType = new ApartmentType({
            name,
            created_by: userId
        })

        await apartmentType.save()

        return successResponse(res, "Apartment type saved successfully")

    } catch (error) {
        next(error)
    }
}

exports.updateType = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const { name } = req.body

        const id = req.params.id;

        const apartmentType = await ApartmentType.findOne({ created_by: userId, _id: id })

        if (!apartmentType) {
            return errorResponse(res, "Apartment type does not exist", {}, 404)
        }

        await ApartmentType.findOneAndUpdate({ created_by: userId, _id: id }, {
            name
        })

        return successResponse(res, "Apartment type updated successfully")

    } catch (error) {
        next(error)
    }
}
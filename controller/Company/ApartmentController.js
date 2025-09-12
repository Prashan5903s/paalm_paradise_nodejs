const Tower = require('../../model/Tower')
const Apartment = require('../../model/Apartment');
const { errorResponse, successResponse } = require('../../util/response');

exports.getApartmentAPI = async (req, res, next) => {
    try {

        const userId = req.userId;

        const apartment = await Apartment.find({ created_by: userId })

        if (!apartment) {
            return errorResponse(res, "Apartment does not exist", {}, 404)
        }

        return successResponse(res, "Apartment fetched successfully", apartment)

    } catch (error) {
        next(error)
    }
}

exports.createApartmentAPI = async (req, res, next) => {
    try {
        const userId = req.userId;

        const towers = await Tower.find({ created_by: userId }).populate('floors');

        if (!towers) {
            return errorResponse(res, "Apartment does not exist", {}, 404)
        }

        return successResponse(res, "Apartment fetched successfully", towers)

    } catch (error) {
        next(error)
    }
}

exports.postApartmentAPI = async (req, res, next) => {
    try {

        const userId = req.userId;

        const { tower, floor, apartmentNumber, area, apartmentType, status } = req.body

        const apartment = new Apartment({
            tower_id: tower,
            floor_id: floor,
            apartment_no: apartmentNumber,
            apartment_area: area,
            apartment_type: apartmentType,
            status: status == 'active',
            created_by: userId

        })

        await apartment.save()

        return successResponse(res, 'Apartment created successfully')

    } catch (error) {
        next(error)
    }
}

exports.updateApartmentAPI = async (req, res, next) => {
    try {

        const userId = req.userId;
        const apartmentId = req.params.apartmentId;

        const { tower, floor, apartmentNumber, area, apartmentType, status } = req.body

        const apartment = await Apartment.findOne({ created_by: userId, _id: apartmentId })

        if (!apartment) {
            return errorResponse(res, "Apartment does not exist", {}, 404)
        }

        await Apartment.findOneAndUpdate({ created_by: userId }, {
            tower_id: tower,
            floor_id: floor,
            apartment_no: apartmentNumber,
            apartment_area: area,
            apartment_type: apartmentType,
            status: status == 'active',
            created_by: userId
        })

        return successResponse(res, "Apartment updated successfully")

    } catch (error) {
        next(error)
    }
}
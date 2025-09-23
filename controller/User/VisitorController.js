const Visitor = require('../../model/Visitor');
const Apartment = require('../../model/Apartment')
const { errorResponse, successResponse } = require('../../util/response');

function generateSixDigitCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.getVisitorController = async (req, res, next) => {
    try {

        const userId = req.userId;

        const visitor = await Visitor.find({ created_by: userId })
            .populate('user_id')
            .populate({
                path: 'apartment_id',
                populate: [
                    { path: 'tower_id' },
                    { path: 'floor_id' }
                ]
            });


        if (!visitor) {
            return errorResponse(res, "Visitor does not exist", {}, 404)
        }

        return successResponse(res, "Visitor fetched successfully", visitor)

    } catch (error) {
        next(error)
    }
}

exports.createVisitorController = async (req, res, next) => {
    try {

        const userId = req.userId;

        const apartment = await Apartment.find({ assigned_to: userId })

        if (!apartment) {
            return errorResponse(res, "Apartment does not exist", {}, 404)
        }

        return successResponse(res, "Apartment fetched successfully", apartment)

    } catch (error) {
        next(error)
    }
}

exports.postVisitorController = async (req, res, next) => {
    try {

        const userId = req.userId;

        const { visitor_name, visitor_contact, checkin_date, checkin_from_time, checkin_to_time, apartment_id, no_of_persons, vehicle_number, category, description } = req.body;

        let apartmentId = null;

        if (!apartment_id) {

            const apartments = await Apartment.findOne({ assigned_to: userId })
            if (!apartments) {
                return errorResponse(res, "User has no apartment assigned", {}, 500)
            } else {
                apartmentId = apartments._id
            }

        } else {
            apartmentId = apartment_id;
        }

        const visitor = new Visitor({
            visitor_name,
            apartment_id: apartmentId,
            visitor_contact_no: visitor_contact,
            check_in_date: checkin_date,
            check_in_from_time: checkin_from_time,
            check_in_to_time: checkin_to_time,
            no_person: no_of_persons,
            vehicle_no: vehicle_number,
            category,
            description,
            otp: generateSixDigitCode(),
            created_by: userId,
            user_id: userId
        })

        await visitor.save();

        return successResponse(res, "Visitor created successfully")

    } catch (error) {
        next(error)
    }
}

exports.putVisitiorController = async (req, res, next) => {
    try {

        const id = req.params.id;
        const userId = req.userId;

        const { visitor_name, visitor_contact, checkin_date, checkin_from_time, checkin_to_time, apartment_id, no_of_persons, vehicle_number, category, description } = req.body;

        let apartmentId = null;

        if (!apartment_id) {

            const apartments = await Apartment.findOne({ assigned_to: userId })
            apartmentId = apartments._id

        } else {
            apartmentId = apartment_id;
        }


        await Visitor.findOneAndUpdate({ _id: id, created_by: userId }, {
            visitor_name,
            apartment_id: apartmentId,
            visitor_contact_no: visitor_contact,
            check_in_date: checkin_date,
            check_in_from_time: checkin_from_time,
            check_in_to_time: checkin_to_time,
            no_person: no_of_persons,
            vehicle_no: vehicle_number,
            category,
            description,
        })

        return successResponse(res, "Visitor updated successfully")

    } catch (error) {
        next(error)
    }
}

exports.allowGateInFunc = async (req, res, next) => {
    try {

        const id = req?.params?.id;

        await Visitor.findByIdAndUpdate(id, {
            status: true
        })

        return successResponse(res, "Visitor allowed successfully")

    } catch (error) {
        next(error)
    }
}
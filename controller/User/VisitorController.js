const Visitor = require('../../model/Visitor');
const Apartment = require('../../model/Apartment')
const User = require('../../model/User')
const VisitorType = require('../../model/VisitorType')
const {
    errorResponse,
    successResponse
} = require('../../util/response');

function generateSixDigitCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function convertTo24Hour(timeStr) {
    if (!timeStr) return null;

    // Normalize spacing and uppercase (handles inputs like "3:05pm" or "03:05  pm")
    timeStr = timeStr.trim().toUpperCase();

    const [time, modifier] = timeStr.split(" ");
    if (!time || !modifier) return timeStr; // already in 24-hour format

    let [hours, minutes] = time.split(":").map(Number);

    if (modifier === "PM" && hours !== 12) {
        hours += 12;
    }
    if (modifier === "AM" && hours === 12) {
        hours = 0;
    }

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

exports.getVisitorController = async (req, res, next) => {
    try {

        const userId = req.userId;

        const visitors = await Visitor.find({
                created_by: userId,
            })
            .populate('user_id')
            .populate('category')
            .populate({
                path: 'apartment_id',
                populate: [{
                        path: 'tower_id'
                    },
                    {
                        path: 'floor_id'
                    }
                ]
            });

        if (!visitors) {
            return errorResponse(res, "No visitors found", {}, 404);
        }

        const now = new Date();
        const bulkUpdates = [];

        for (const visitor of visitors) {
            const {
                check_in_date,
                check_in_from_time,
                check_in_to_time,
                status
            } = visitor;

            // If any field missing, skip this visitor
            if (!check_in_date || !check_in_from_time || !check_in_to_time) continue;

            // Combine date + time into full Date objects
            const toFrom24 = convertTo24Hour(check_in_from_time);
            const fromDateTime = new Date(`${check_in_date}T${toFrom24}:00`);

            const toTime24 = convertTo24Hour(check_in_to_time);
            const toDateTime = new Date(`${check_in_date}T${toTime24}:00`);

            let visitorStatus = 1; // default - not started

            if (status === true || status === "true") {
                visitorStatus = 4; // completed
            } else if (now > toDateTime) {
                visitorStatus = 3; // expired
            }

            // Prepare bulk update
            bulkUpdates.push({
                updateOne: {
                    filter: {
                        _id: visitor._id
                    },
                    update: {
                        $set: {
                            visitor_status: visitorStatus
                        }
                    },
                },
            });

            // Also update the in-memory object so the response is accurate
            visitor.visitor_status = visitorStatus;
        }

        // Execute all updates together for better performance
        if (bulkUpdates.length > 0) {
            await Visitor.bulkWrite(bulkUpdates);
        }

        return successResponse(res, "Visitors fetched successfully", visitors);
    } catch (error) {
        next(error);
    }
};


exports.getVisitorFilterController = async (req, res, next) => {
    try {
        const userId = req.userId;
        const start = req?.params?.start ? new Date(req.params.start) : null;
        const end = req?.params?.end ? new Date(req.params.end) : null;

        // बेसिक condition
        const filter = {
            created_by: userId
        };

        // अगर start और end दोनों हैं
        if (start && end) {
            filter.created_at = {
                $gte: start,
                $lte: end
            };
        }
        // सिर्फ start है
        else if (start) {
            filter.created_at = {
                $gte: start
            };
        }
        // सिर्फ end है
        else if (end) {
            filter.created_at = {
                $lte: end
            };
        }

        const visitors = await Visitor.find(filter)
            .populate('user_id')
            .populate('category')
            .populate({
                path: 'apartment_id',
                populate: [{
                        path: 'tower_id'
                    },
                    {
                        path: 'floor_id'
                    }
                ]
            });

        if (!visitors) {
            return errorResponse(res, "No visitors found", {}, 404);
        }

        const now = new Date();
        const bulkUpdates = [];

        for (const visitor of visitors) {
            const {
                check_in_date,
                check_in_from_time,
                check_in_to_time,
                status
            } = visitor;

            // If any field missing, skip this visitor
            if (!check_in_date || !check_in_from_time || !check_in_to_time) continue;

            const toFrom24 = convertTo24Hour(check_in_from_time);
            const fromDateTime = new Date(`${check_in_date}T${toFrom24}:00`);

            const toTime24 = convertTo24Hour(check_in_to_time);
            const toDateTime = new Date(`${check_in_date}T${toTime24}:00`);

            let visitorStatus = 1; // default - not started

            if (status === true || status === "true") {
                visitorStatus = 4; // completed
            } else if (now > toDateTime) {
                visitorStatus = 3; // expired
            }

            // Prepare bulk update
            bulkUpdates.push({
                updateOne: {
                    filter: {
                        _id: visitor._id
                    },
                    update: {
                        $set: {
                            visitor_status: visitorStatus
                        }
                    },
                },
            });

            // Also update the in-memory object so the response is accurate
            visitor.visitor_status = visitorStatus;
        }

        // Execute all updates together for better performance
        if (bulkUpdates.length > 0) {
            await Visitor.bulkWrite(bulkUpdates);
        }

        return successResponse(res, "Visitor fetched successfully", visitors);

    } catch (error) {
        next(error);
    }
};

exports.createVisitorController = async (req, res, next) => {
    try {

        const userId = req.userId;

        const data = {}

        const users = await User.findById(userId)
        const masterId = users.created_by;

        const apartment = await Apartment.find({
            assigned_to: userId
        })

        const visitorType = await VisitorType.find({
            created_by: masterId
        })

        if (!apartment || !visitorType) {
            return errorResponse(res, "Apartment does not exist", {}, 404)
        }

        data['apartment'] = apartment
        data['visitorType'] = visitorType

        return successResponse(res, "Apartment fetched successfully", data)

    } catch (error) {
        next(error)
    }
}

exports.postVisitorController = async (req, res, next) => {
    try {

        const userId = req.userId;

        const {
            visitor_name,
            visitor_contact,
            checkin_date,
            checkin_from_time,
            checkin_to_time,
            apartment_id,
            no_of_persons,
            vehicle_number,
            category,
            description
        } = req.body;

        let apartmentId = null;

        if (!apartment_id) {

            const apartments = await Apartment.findOne({
                assigned_to: userId
            })
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

        const {
            visitor_name,
            visitor_contact,
            checkin_date,
            checkin_from_time,
            checkin_to_time,
            apartment_id,
            no_of_persons,
            vehicle_number,
            category,
            description
        } = req.body;

        let apartmentId = null;

        if (!apartment_id) {

            const apartments = await Apartment.findOne({
                assigned_to: userId
            })
            apartmentId = apartments._id

        } else {
            apartmentId = apartment_id;
        }


        await Visitor.findOneAndUpdate({
            _id: id,
            created_by: userId
        }, {
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

        const status = req?.params?.status;

        if (status == true || status == "true") {
            await Visitor.findByIdAndUpdate(id, {
                status: true,
                visitor_status: 4
            })
        } else {
            await Visitor.findByIdAndUpdate(id, {
                status: false,
                visitor_status: 2
            })
        }

        return successResponse(res, "Visitor allowed successfully")

    } catch (error) {
        next(error)
    }
}

exports.getVisitorHappyCode = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const OTP = req?.params?.otp;

        const user = await User.findById(userId)

        if (!user) {
            return errorResponse(res, "User does not exist", {}, 404)
        }

        const masterId = user?.created_by

        const users = await User.find({
            created_by: masterId
        }, '_id');

        const userIds = users.map(user => user._id);

        const visitor = await Visitor.findOne({
            created_by: {
                $in: userIds
            },
            otp: OTP
        }).populate("apartment_id").populate("user_id").populate("category");


        if (!visitor) {
            return errorResponse(res, "Visitor does not exist", {}, 404)
        }

        const checkDate = visitor?.check_in_date;
        const checkInToTime = visitor?.check_in_to_time;

        // Combine date + time into full Date objects

        const toTime24 = convertTo24Hour(checkInToTime);
        const toDateTime = new Date(`${checkDate}T${toTime24}:00`);

        const now = new Date();


        if (now > toDateTime) {
            return successResponse(res, "Visitor time expired", {}, 500)
        } else {
            return successResponse(res, "Visitor data fetched successfully", visitor)
        }


    } catch (error) {
        next(error)
    }
}
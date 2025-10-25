const mongoose = require('mongoose')
const Complain = require('../../model/Complain');
const TicketType = require('../../model/TicketType');
const User = require('../../model/User')
const ComplainUser = require('../../model/ComplainUser')
const {
    errorResponse,
    successResponse
} = require('../../util/response');

function generateSixDigitCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.getMyComplainController = async (req, res, next) => {
    try {
        const userId = req.userId;

        const complains = await Complain.aggregate([{
                $match: {
                    created_by: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "complain_users",
                    let: {
                        complainId: "$_id"
                    },
                    pipeline: [{
                            $match: {
                                $expr: {
                                    $eq: ["$complain_id", "$$complainId"]
                                }
                            }
                        },
                        {
                            $sort: {
                                created_at: -1
                            }
                        },
                        {
                            $limit: 1
                        }
                    ],
                    as: "latest_complain_user"
                }
            },
            {
                $unwind: {
                    path: "$latest_complain_user",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "ticket_types", // ध्यान दें collection का plural नाम
                    localField: "category",
                    foreignField: "_id",
                    as: "category"
                }
            },
            {
                $unwind: {
                    path: "$category",
                    preserveNullAndEmptyArrays: true
                }
            }
        ]);

        if (!complains || complains.length === 0) {
            return errorResponse(res, "Complain does not exist", {}, 404);
        }

        return successResponse(res, "Complain fetched successfully", complains);

    } catch (error) {
        next(error);
    }
};

exports.getMyComplainFilterController = async (req, res, next) => {
    try {
        const userId = req.userId;

        const start = req?.params?.start ? new Date(req.params.start) : null;
        const end = req?.params?.end ? new Date(req.params.end) : null;

        const status = req?.params?.status;

        const matchCondition = {
            created_by: new mongoose.Types.ObjectId(userId),
            complain_status: status
        };

        if (start && end) {
            matchCondition.created_at = {
                $gte: start,
                $lte: end
            };
        } else if (start) {
            matchCondition.created_at = {
                $gte: start
            };
        } else if (end) {
            matchCondition.created_at = {
                $lte: end
            };
        }

        const complains = await Complain.aggregate([{
                $match: matchCondition
            },
            {
                $lookup: {
                    from: "complain_users",
                    let: {
                        complainId: "$_id"
                    },
                    pipeline: [{
                            $match: {
                                $expr: {
                                    $eq: ["$complain_id", "$$complainId"]
                                }
                            }
                        },
                        {
                            $sort: {
                                created_at: -1
                            }
                        },
                        {
                            $limit: 1
                        }
                    ],
                    as: "latest_complain_user"
                }
            },
            {
                $unwind: {
                    path: "$latest_complain_user",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "ticket_types",
                    localField: "category",
                    foreignField: "_id",
                    as: "category"
                }
            },
            {
                $unwind: {
                    path: "$category",
                    preserveNullAndEmptyArrays: true
                }
            }
        ]);


        if (!complains) {
            return errorResponse(res, "Complain does not exist", {}, 404);
        }

        return successResponse(res, "Complain fetched successfully", complains);

    } catch (error) {
        next(error);
    }
};

exports.getCreateComplainController = async (req, res, next) => {
    try {

        const userId = req?.userId;

        const user = await User.findById(userId)

        const masterId = user.created_by;

        const ticketType = await TicketType.find({
            created_by: masterId
        })

        if (!ticketType || !user) {
            return errorResponse(res, "Create data does not exist", {}, 404)
        }

        return successResponse(res, 'Create data fetched successfully', ticketType)

    } catch (error) {
        next(error)
    }
}

exports.postComplainController = async (req, res, next) => {
    try {

        const userId = req.userId;

        const {
            category,
            complaint_type,
            description,
            nature
        } = req.body

        const complain = new Complain({
            nature,
            happy_code: generateSixDigitCode(),
            complain_type: complaint_type,
            description,
            category: category,
            created_by: userId
        })

        await complain.save();

        const complainUser = new ComplainUser({
            complain_id: complain._id,
            complaint_status: "1",
            created_by: userId
        })

        await complainUser.save()

        return successResponse(res, "Complain saved successfully")

    } catch (error) {
        next(error)
    }
}

exports.deleteComplainController = async (req, res, next) => {
    try {

        const userId = req.userId;
        const id = req.params.id;

        await Complain.findOneAndDelete({
            _id: id,
            created_by: userId
        })

        return successResponse(res, "Complain deleted successfully")

    } catch (error) {
        next(error)
    }
}
const mongoose = require('mongoose')
const Complain = require('../../model/Complain');
const ComplainUser = require('../../model/ComplainUser')
const {
    errorResponse,
    successResponse
} = require('../../util/response');

exports.getComplainResolvedController = async (req, res, next) => {
    try {

        const userId = req.userId;

        const complains = await Complain.aggregate([{
                $match: {
                    "assigned_to.user": mongoose.Types.ObjectId.createFromHexString(userId)
                }
            },

            // 🔹 Created By User
            {
                $lookup: {
                    from: "users",
                    localField: "created_by",
                    foreignField: "_id",
                    as: "created_by_user"
                }
            },

            // 🔹 Latest complain_user
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

            // 🔹 Category
            {
                $lookup: {
                    from: "ticket_types",
                    localField: "category",
                    foreignField: "_id",
                    as: "category"
                }
            },

            // 🔹 Unwinds
            {
                $unwind: {
                    path: "$category",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $unwind: {
                    path: "$created_by_user",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $unwind: {
                    path: "$latest_complain_user",
                    preserveNullAndEmptyArrays: true
                }
            },

            // 🔥 🔥 🔥 HANDLE ARRAY apartment_data
            {
                $unwind: {
                    path: "$created_by_user.apartment_data",
                    preserveNullAndEmptyArrays: true
                }
            },

            // 🔹 Direct lookup Apartment
            {
                $lookup: {
                    from: "apartments",
                    localField: "created_by_user.apartment_data.apartment_id",
                    foreignField: "_id",
                    as: "created_by_user.apartment_data.apartment_id"
                }
            },

            // 🔹 Direct lookup Tower
            {
                $lookup: {
                    from: "towers",
                    localField: "created_by_user.apartment_data.tower_id",
                    foreignField: "_id",
                    as: "created_by_user.apartment_data.tower_id"
                }
            },

            // 🔹 Direct lookup Floor
            {
                $lookup: {
                    from: "floors",
                    localField: "created_by_user.apartment_data.floor_id",
                    foreignField: "_id",
                    as: "created_by_user.apartment_data.floor_id"
                }
            },

            // 🔹 Unwind all
            {
                $unwind: {
                    path: "$created_by_user.apartment_data.apartment_id",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $unwind: {
                    path: "$created_by_user.apartment_data.tower_id",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $unwind: {
                    path: "$created_by_user.apartment_data.floor_id",
                    preserveNullAndEmptyArrays: true
                }
            },

            // 🔹 Group back to array
            {
                $group: {
                    _id: "$_id",
                    doc: {
                        $first: "$$ROOT"
                    },
                    apartment_data: {
                        $push: "$created_by_user.apartment_data"
                    }
                }
            },
            {
                $addFields: {
                    "doc.created_by_user.apartment_data": "$apartment_data"
                }
            },
            {
                $replaceRoot: {
                    newRoot: "$doc"
                }
            },

            // 🔹 Filter status
            {
                $match: {
                    "latest_complain_user.complaint_status": {
                        $ne: "3"
                    }
                }
            },

            // 🔹 Final cleanup
            {
                $project: {
                    happy_code: 0
                }
            }
        ]);

        if (!complains) {
            return errorResponse(res, "Complain does not exist", {}, 404)
        }

        return successResponse(res, "Complain fetched successfully", complains)

    } catch (error) {
        next(error)
    }
}

exports.postCompanyResolvedController = async (req, res, next) => {
    try {

        const userId = req.userId;

        const {
            status,
            remark,
            happy_code,
            complain_id
        } = req.body;

        const complain = await Complain.findById(complain_id)

        const happyCode = complain?.happy_code;

        if (status == "3") {

            if (happyCode == happy_code) {

                const complainUser = new ComplainUser({
                    remark,
                    complain_id,
                    complaint_status: status,
                    created_by: userId,
                    created_at: Date.now()
                })

                await complainUser.save()

            } else {
                return errorResponse(res, "Happy code does not match", {}, 500)
            }

        } else {

            const complainUser = new ComplainUser({
                remark,
                complain_id,
                complaint_status: status,
                created_by: userId,
                created_at: Date.now()
            })

            await complainUser.save()

        }

        return successResponse(res, "Complain saved successfully")

    } catch (error) {
        next(error)
    }
}
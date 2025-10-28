const RoleUser = require('../../model/RoleUser')
const Complain = require('../../model/Complain')
const User = require('../../model/User');
const ComplainUser = require('../../model/ComplainUser')
const {
    errorResponse,
    successResponse
} = require('../../util/response');

exports.getComplainController = async (req, res, next) => {
    try {

        const userId = req.userId;


        const users = await User.find({
            created_by: userId,
            user_type: {
                $ne: "4"
            }
        }).select('_id');

        const userIds = users.map(u => u._id);

        const status = (req?.params.status);

        const complain = await Complain.aggregate([{
                $match: {
                    created_by: {
                        $in: userIds
                    }
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
                                created_at: 1
                            } // oldest → latest
                        }
                    ],
                    as: "complain_users"
                }
            },
            {
                $addFields: {
                    all_complain_users: "$complain_users",
                    latest_complain_user: {
                        $last: "$complain_users"
                    }
                }
            },
            {
                // ✅ filter by the latest complain user’s complaint_status
                $match: {
                    "latest_complain_user.complaint_status": status
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "assigned_to.user",
                    foreignField: "_id",
                    as: "assigned_user"
                }
            },
            {
                $unwind: {
                    path: "$assigned_user",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    complain_users: 0 // hide full complain_users array
                }
            }
        ]);

        if (!complain) {
            return errorResponse(res, "Complain does not exist", {}, 404)
        }

        return successResponse(res, "Complain fetched successfully", complain)

    } catch (error) {
        next(error)
    }
}

exports.createComplainController = async (req, res, next) => {
    try {

        const userId = req.userId;

        const roleId = "68c01730556298d2b76244ac";

        // 1. Find all role_user entries with the specific role
        const roleUsers = await RoleUser.find({
            role_id: roleId
        }).select('user_id');

        // 2. Extract user_ids
        const userIds = roleUsers.map(r => r.user_id);

        // 3. Fetch users created by userId and in role_user
        const users = await User.find({
            _id: {
                $in: userIds
            },
            user_type: {
                $ne: "4"
            },
            created_by: userId
        });

        if (!users) {
            return errorResponse(res, "User does not exist", {}, 404)
        }

        return successResponse(res, "User create data", users)

    } catch (error) {
        next(error)
    }
}

exports.postComplainController = async (req, res, next) => {
    try {

        const userId = req.userId

        const id = req.params.id;
        const code = req.params.code;

        const {
            status,
            user,
            remark
        } = req.body;

        const complain = await Complain.findById(id)

        if (!complain) {
            return errorResponse(res, "Complain does not exist", {}, 404)
        }

        if (code == 1) {

            await Complain.findByIdAndUpdate(id, {
                assigned_to: {
                    user,
                    remark
                },
            })

            const complain_user = await ComplainUser.findOne({
                complain_id: complain._id
            });

            if (!complain_user) {

                const complainUser = new ComplainUser({
                    complain_id: complain._id,
                    complaint_status: "2",
                    created_by: userId,
                    created_at: Date.now()
                })

                await complainUser.save()

            } else {

                const typeStatus = complain_user?.complaint_status;

                if (typeStatus != "2") {
                    const complainUser = new ComplainUser({
                        complain_id: complain._id,
                        complaint_status: "2",
                        created_by: userId,
                        created_at: Date.now()
                    })

                    await complainUser.save()
                }

            }


        } else {

            const complainUser = new ComplainUser({
                complain_id: complain._id,
                complaint_status: status,
                created_by: userId,
                remark,
                created_at: Date.now()
            })

            await complainUser.save()

        }

        return successResponse(res, "Complain updated successfully")

    } catch (error) {
        next(error)
    }
}
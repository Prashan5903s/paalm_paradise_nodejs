const mongoose = require('mongoose')
const Complain = require('../../model/Complain');
const ComplainUser = require('../../model/ComplainUser')
const { errorResponse, successResponse } = require('../../util/response');

exports.getComplainResolvedController = async (req, res, next) => {
    try {

        const userId = req.userId;

        const complains = await Complain.aggregate([
            {
                $match: { "assigned_to.user": new mongoose.Types.ObjectId(userId) }
            },
            {
                $lookup: {
                    from: "complain_users",
                    let: { complainId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$complain_id", "$$complainId"] }
                            }
                        },
                        { $sort: { created_at: -1 } }, // latest first
                        { $limit: 1 }
                    ],
                    as: "latest_complain_user"
                }
            },
            {
                $unwind: { path: "$latest_complain_user", preserveNullAndEmptyArrays: true }
            },
            {
                $match: { "latest_complain_user.complaint_status": { $ne: "3" } }
            },
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

        const { status, remark, happy_code, complain_id } = req.body;

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
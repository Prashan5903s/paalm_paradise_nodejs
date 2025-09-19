const mongoose = require('mongoose')
const Complain = require('../../model/Complain');
const ComplainUser = require('../../model/ComplainUser')
const { errorResponse, successResponse } = require('../../util/response');

function generateSixDigitCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.getMyComplainController = async (req, res, next) => {
    try {
        const userId = req.userId;

        const complains = await Complain.aggregate([
            {
                $match: { created_by: new mongoose.Types.ObjectId(userId) }
            },
            {
                $lookup: {
                    from: "complain_users",
                    let: { complainId: "$_id" },
                    pipeline: [
                        {
                            $match: { $expr: { $eq: ["$complain_id", "$$complainId"] } }
                        },
                        { $sort: { created_at: -1 } }, // latest first
                        { $limit: 1 } // केवल latest record
                    ],
                    as: "latest_complain_user"
                }
            },
            {
                $unwind: { path: "$latest_complain_user", preserveNullAndEmptyArrays: true }
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

exports.postComplainController = async (req, res, next) => {
    try {

        const userId = req.userId;

        const { category, complaint_type, description, nature } = req.body

        const complain = new Complain({
            nature,
            happy_code: generateSixDigitCode(),
            complain_type: complaint_type,
            description,
            category: category,
            created_by: userId
        })

        await complain.save();

        return successResponse(res, "Complain saved successfully")

    } catch (error) {
        next(error)
    }
}

exports.deleteComplainController = async (req, res, next) => {
    try {

        const userId = req.userId;
        const id = req.params.id;

        await Complain.findOneAndDelete({ _id: id, created_by: userId })

        return successResponse(res, "Complain deleted successfully")

    } catch (error) {
        next(error)
    }
}
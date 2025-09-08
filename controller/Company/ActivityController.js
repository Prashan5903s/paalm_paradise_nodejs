const AppConfig = require('../../model/AppConfig');
const Activity = require('../../model/Activity')
const mongoose = require('mongoose')
const { errorResponse, successResponse } = require('../../util/response');

exports.getActivityAPI = async (req, res, next) => {
    try {
        const userId = req.userId;
        const module_id = req.params.moduleId;
        const specificModuleTypeId = new mongoose.Types.ObjectId("68886902954c4d9dc7a379bd");

        const activities = await Activity.aggregate([
            {
                $match: {
                    created_by: new mongoose.Types.ObjectId(userId),
                    module_id: new mongoose.Types.ObjectId(module_id),
                }
            },
            // Lookup from app_config collection (same as before)
            {
                $lookup: {
                    from: 'app_config',
                    let: { moduleTypeId: '$module_type_id' },
                    pipeline: [
                        { $unwind: '$activity_data' },
                        { $match: { $expr: { $eq: ['$activity_data._id', '$$moduleTypeId'] } } },
                        { $project: { _id: 0, activity_data: 1 } }
                    ],
                    as: 'activity_type',
                }
            },
            {
                $unwind: {
                    path: '$activity_type',
                    preserveNullAndEmptyArrays: true
                }
            },
            // Add questions only if module_type_id matches the specific id
            {
                $lookup: {
                    from: 'questions',
                    let: { activityId: '$_id', moduleId: '$module_id', moduleTypeId: '$module_type_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$activity_id', '$$activityId'] },
                                        { $eq: ['$module_id', '$$moduleId'] },
                                        { $eq: ['$$moduleTypeId', specificModuleTypeId] } // only join questions if module_type_id matches
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'questions'
                }
            }
        ]);

        if (!activities || activities.length === 0) {
            return errorResponse(res, "Activity does not exist", {}, 404);
        }

        return successResponse(res, "Activity fetched successfully", activities);

    } catch (error) {
        next(error);
    }
};

exports.getCreateFormAPI = async (req, res, next) => {
    try {
        const appConfig = await AppConfig.findOne({ type: 'Activity_data' });

        if (!appConfig) {
            return errorResponse(res, 'App config does not exist', {}, 404);
        }

        return successResponse(res, 'Create data fetched successfully', {
            appConfig,
        });
    } catch (error) {
        console.error('getCreateFormAPI error:', error);
        return errorResponse(res, 'Internal Server Error', {}, 500);
    }
};

exports.postActivityFormAPI = async (req, res, next) => {
    try {
        const userId = req.userId;
        const mId = req.params.moduleId;
        const typeId = req.params.typeId;

        const activity = new Activity({
            created_by: userId,
            module_id: mId,
            module_type_id: typeId
        })

        await activity.save()

        return successResponse(res, "Activity saved successfully")

    } catch (error) {
        next(error)
    }
}

exports.deleteActivityAPI = async (req, res, next) => {
    try {

        const userId = req.userId;
        const moduleId = req.params.moduleId;
        const id = req.params.id;

        const activity = await Activity.findOne({ created_by: userId, module_id: moduleId, _id: id })

        if (!activity) {
            return errorResponse(res, "Activity does not exist", {}, 404)
        }

        await Activity.findOneAndDelete({ created_by: userId, module_id: moduleId, _id: id })

        return successResponse(res, "Activity deleted successfully")

    } catch (error) {
        next(error)
    }
}

exports.setNameActivityAPI = async (req, res, next) => {
    try {

        const userId = req.userId;
        const moduleId = req.params.moduleId;
        const id = req.params.id;

        const { title } = req.body;

        const activity = await Activity.findOne({ created_by: userId, module_id: moduleId, _id: id })

        if (!activity) {
            return errorResponse(res, "Activity does not exist", {}, 404)
        }

        await Activity.findOneAndUpdate({ created_by: userId, module_id: moduleId, _id: id }, {
            $set: {
                name: title
            }
        })

        return successResponse(res, "Activity saved successfully")

    } catch (error) {
        next(error);
    }
}

exports.postActivityDataAPI = async (req, res, next) => {
    try {
        const { moduleId, moduleTypeId, id } = req.params;

        const userId = req.userId;

        const activity = await Activity.findOne({ created_by: userId, module_id: moduleId, module_type_id: moduleTypeId, _id: id });
        if (!activity) return errorResponse(res, "Activity does not exist", {}, 404);

        const { title, video_url } = req.body;
        const file = req.file;

        const updatePayload = {};

        if (moduleTypeId === "688723af5dd97f4ccae68834") {
            // Document Upload
            updatePayload.document_data = {
                title,
                image_url: file?.filename || activity.document_data?.image_url || ""
            };
        } else if (moduleTypeId === "688723af5dd97f4ccae68835") {
            // Video Upload
            updatePayload.video_data = {
                title,
                video_url: file?.filename || activity.video_data?.file_url || ""
            };
        } else if (moduleTypeId === "688723af5dd97f4ccae68836") {
            // YouTube Video
            updatePayload.video_data = {
                title,
                video_url: video_url || activity.video_data?.video_url || ""
            };
        } else if (moduleTypeId === "688723af5dd97f4ccae68837") {
            // SCORM Upload
            updatePayload.scorm_data = {
                title,
                content_url: file?.filename || activity.scorm_data?.file_url || ""
            };
        } else {
            return errorResponse(res, "Unsupported moduleTypeId", {}, 400);
        }

        await Activity.findOneAndUpdate({ created_by: userId, module_id: moduleId, module_type_id: moduleTypeId, _id: id }, { $set: updatePayload });
        return successResponse(res, "Activity data uploaded successfully");

    } catch (error) {
        next(error);
    }
};

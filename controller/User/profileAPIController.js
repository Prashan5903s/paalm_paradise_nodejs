const User = require('../../model/User');
const {
    successResponse
} = require('../../util/response');

exports.postProfileAPIController = async (req, res, next) => {
    try {

        const userId = req.userId;

        // Use the uploaded file if it exists
        const imageUrl = req.file ? req.file.filename : '';

        await User.findByIdAndUpdate(userId, {
            photo: imageUrl
        })

        const user = await User.findById(userId)

        return successResponse(res, "Profile image updated successfully", user?.photo)

    } catch (error) {
        next(error)
    }
}
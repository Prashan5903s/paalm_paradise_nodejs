const Asset = require('../../model/Assets')
const Vendor = require('../../model/Vendor')
const User = require('../../model/User')
const AssetLocation = require('../../model/AssetLocation')
const AssetCategory = require('../../model/AssetCategory')
const { successResponse, errorResponse } = require('../../util/response')

exports.getAssetAPIController = async (req, res, next) => {
  try {
    const userId = req?.userId

    const assets = await Asset.find({
      created_by: userId
    })

    if (!assets) {
      return errorResponse(res, 'Asset not found', {}, 404)
    }

    const assetLocation = await AssetLocation.find({
      created_by: userId
    })

    const assetCategory = await AssetCategory.find({
      created_by: userId
    })

    const vendor = await Vendor.find({
      created_by: userId
    })

    const users = await User.find({
      created_by: userId
    })

    const finalData = {
      assets,
      category: assetCategory,
      location: assetLocation,
      vendor,
      users
    }

    return successResponse(res, 'Asset fetched successfully', finalData)
  } catch (error) {
    next(error)
  }
}

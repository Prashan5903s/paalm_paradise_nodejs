const RoleUser = require('../../model/RoleUser')
const Complain = require('../../model/Complain')
const User = require('../../model/User')
const Tower = require('../../model/Tower')
const Floor = require('../../model/Floor')
const TicketType = require('../../model/TicketType')
const ComplainUser = require('../../model/ComplainUser')
const {
  errorResponse,
  successResponse
} = require('../../util/response')

const mongoose = require("mongoose")

exports.getComplainController = async (req, res, next) => {
  try {
    const userId = req.userId

    const users = await User.find({
      created_by: userId,
      user_type: {
        $ne: '4'
      }
    }).select('_id')

    const userIds = users.map(u => u._id)

    const status = req?.params.status

    const complain = await Complain.aggregate([{
        $match: {
          created_by: {
            $in: userIds
          }
        }
      },
      {
        $lookup: {
          from: 'complain_users',
          let: {
            complainId: '$_id'
          },
          pipeline: [{
              $match: {
                $expr: {
                  $eq: ['$complain_id', '$$complainId']
                }
              }
            },
            {
              $sort: {
                created_at: 1
              } // oldest → latest
            }
          ],
          as: 'complain_users'
        }
      },
      {
        $addFields: {
          all_complain_users: '$complain_users',
          latest_complain_user: {
            $last: '$complain_users'
          }
        }
      },
      {
        // ✅ filter by the latest complain user’s complaint_status
        $match: {
          'latest_complain_user.complaint_status': status
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'assigned_to.user',
          foreignField: '_id',
          as: 'assigned_user'
        }
      },
      {
        $unwind: {
          path: '$assigned_user',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          complain_users: 0 // hide full complain_users array
        }
      }
    ])

    if (!complain) {
      return errorResponse(res, 'Complain does not exist', {}, 404)
    }

    return successResponse(res, 'Complain fetched successfully', complain)
  } catch (error) {
    next(error)
  }
}

exports.createComplainController = async (req, res, next) => {
  try {
    const userId = req.userId

    const roleId = '68c01730556298d2b76244ac'

    // 1. Find all role_user entries with the specific role
    const roleUsers = await RoleUser.find({
      role_id: roleId
    }).select('user_id')

    // 2. Extract user_ids
    const userIds = roleUsers.map(r => r.user_id)

    // 3. Fetch users created by userId and in role_user
    const users = await User.find({
      _id: {
        $in: userIds
      },
      user_type: {
        $ne: '4'
      },
      created_by: userId
    })

    if (!users) {
      return errorResponse(res, 'User does not exist', {}, 404)
    }

    return successResponse(res, 'User create data', users)
  } catch (error) {
    next(error)
  }
}

exports.postComplainController = async (req, res, next) => {
  try {
    const userId = req.userId

    const id = req.params.id
    const code = req.params.code

    const {
      status,
      user,
      remark
    } = req.body

    const complain = await Complain.findById(id)

    if (!complain) {
      return errorResponse(res, 'Complain does not exist', {}, 404)
    }

    if (code == 1) {
      await Complain.findByIdAndUpdate(id, {
        assigned_to: {
          user,
          remark
        }
      })

      const complain_user = await ComplainUser.findOne({
        complain_id: complain._id
      })

      if (!complain_user) {
        const complainUser = new ComplainUser({
          complain_id: complain._id,
          complaint_status: '2',
          created_by: userId,
          created_at: Date.now()
        })

        await complainUser.save()
      } else {
        const typeStatus = complain_user?.complaint_status

        if (typeStatus != '2') {
          const complainUser = new ComplainUser({
            complain_id: complain._id,
            complaint_status: '2',
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

    return successResponse(res, 'Complain updated successfully')
  } catch (error) {
    next(error)
  }
}

exports.getComplainReportDataAPI = async (req, res, next) => {
  try {
    const userId = req.userId;

    const {
      tower,
      floor,
      category,
      status,
      assignedTo,
      resident
    } = req.query;

    // Master data
    const [towers, floors, ticketType, users] = await Promise.all([
      Tower.find({
        created_by: userId,
        status: true
      }).select('_id name'),

      Floor.find({
        created_by: userId,
        status: true
      }).select('_id name floor_name'),

      TicketType.find({
        created_by: userId
      }).select('_id name'),

      User.find({
        created_by: userId,
        user_type: {
          $ne: '4'
        }
      }).select('_id first_name last_name email')
    ]);

    const userIds = users.map(u => u._id);

    const statusMap = {
      1: "Pending",
      2: "Assigned",
      3: "Resolved",
      4: "In progress"
    };

    const statusData = [{
        title: 'Pending',
        value: 1
      },
      {
        title: 'Assigned',
        value: 2
      },
      {
        title: 'Resolved',
        value: 3
      },
      {
        title: 'In progress',
        value: 4
      }
    ];

    // Initial match
    const matchStage = {
      created_by: {
        $in: userIds
      }
    };

    if (tower && mongoose.Types.ObjectId.isValid(tower)) {
      matchStage.tower =
        mongoose.Types.ObjectId.createFromHexString(tower);
    }

    if (floor && mongoose.Types.ObjectId.isValid(floor)) {
      matchStage.floor =
        mongoose.Types.ObjectId.createFromHexString(floor);
    }

    if (category && mongoose.Types.ObjectId.isValid(category)) {
      matchStage.category =
        mongoose.Types.ObjectId.createFromHexString(category);
    }

    if (assignedTo && mongoose.Types.ObjectId.isValid(assignedTo)) {
      matchStage['assigned_to.user'] =
        mongoose.Types.ObjectId.createFromHexString(assignedTo);
    }

    const pipeline = [{
        $match: matchStage
      },

      // Resident / Created by user
      {
        $lookup: {
          from: 'users',
          localField: 'created_by',
          foreignField: '_id',
          pipeline: [{
            $project: {
              _id: 1,
              first_name: 1,
              last_name: 1
            }
          }],
          as: 'created_by'
        }
      },
      {
        $unwind: {
          path: '$created_by',
          preserveNullAndEmptyArrays: true
        }
      }
    ];

    // Search resident by name
    if (resident) {

      pipeline.push({
        $match: {
          $or: [{
              'created_by.first_name': {
                $regex: resident,
                $options: 'i'
              }
            },
            {
              'created_by.last_name': {
                $regex: resident,
                $options: 'i'
              }
            }
          ]
        }
      });
    }

    pipeline.push(
      // Tower
      {
        $lookup: {
          from: 'towers',
          localField: 'tower',
          foreignField: '_id',
          as: 'tower'
        }
      }, {
        $unwind: {
          path: '$tower',
          preserveNullAndEmptyArrays: true
        }
      },

      // Floor
      {
        $lookup: {
          from: 'floors',
          localField: 'floor',
          foreignField: '_id',
          as: 'floor'
        }
      }, {
        $unwind: {
          path: '$floor',
          preserveNullAndEmptyArrays: true
        }
      },

      // Category
      {
        $lookup: {
          from: 'ticket_types',
          localField: 'category',
          foreignField: '_id',
          pipeline: [{
            $project: {
              _id: 1,
              name: 1
            }
          }],
          as: 'category'
        }
      }, {
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true
        }
      },

      // Complaint history (same as first API)
      {
        $lookup: {
          from: 'complain_users',
          let: {
            complainId: '$_id'
          },
          pipeline: [{
              $match: {
                $expr: {
                  $eq: ['$complain_id', '$$complainId']
                }
              }
            },
            {
              $sort: {
                created_at: 1
              }
            }
          ],
          as: 'complain_users'
        }
      },

      // Add full history + latest entry
      {
        $addFields: {
          all_complain_users: '$complain_users',
          latest_complain_user: {
            $last: '$complain_users'
          }
        }
      },

      // Nature data
      {
        $addFields: {
          nature_data: {
            $switch: {
              branches: [{
                  case: {
                    $eq: ['$nature', 1]
                  },
                  then: {
                    value: 1,
                    title: 'Normal'
                  }
                },
                {
                  case: {
                    $eq: ['$nature', 2]
                  },
                  then: {
                    value: 2,
                    title: 'Urgent'
                  }
                },
                {
                  case: {
                    $eq: ['$nature', 3]
                  },
                  then: {
                    value: 3,
                    title: 'Emergency'
                  }
                }
              ],
              default: {
                value: 0,
                title: 'Unknown'
              }
            }
          }
        }
      },

      // Complaint status data
      {
        $addFields: {
          complain_status_data: {
            $switch: {
              branches: [{
                  case: {
                    $eq: ['$complain_status', 1]
                  },
                  then: {
                    value: 1,
                    title: 'Active'
                  }
                },
                {
                  case: {
                    $eq: ['$complain_status', 0]
                  },
                  then: {
                    value: 0,
                    title: 'Inactive'
                  }
                }
              ],
              default: {
                value: -1,
                title: 'Unknown'
              }
            }
          }
        }
      }
    );

    // Filter by latest complaint status
    if (status !== undefined && status !== '') {
      pipeline.push({
        $match: {
          'latest_complain_user.complaint_status': String(status)
        }
      });
    }

    pipeline.push(
      // Assigned user
      {
        $lookup: {
          from: 'users',
          localField: 'assigned_to.user',
          foreignField: '_id',
          pipeline: [{
            $project: {
              _id: 1,
              first_name: 1,
              last_name: 1,
              email: 1
            }
          }],
          as: 'assigned_user'
        }
      }, {
        $unwind: {
          path: '$assigned_user',
          preserveNullAndEmptyArrays: true
        }
      },
      // Put relation inside assigned_to.user

      {
        $addFields: {
          'assigned_to.user': '$assigned_user'
        }
      },

      {
        $project: {
          assigned_user: 0,
          complain_users: 0,
          __v: 0
        }
      },

      // Latest first
      {
        $sort: {
          created_at: -1
        }
      }
    );

    const complain = await Complain.aggregate(pipeline);

    const finalData = {
      compLen: complain.length,
      complain,
      towers,
      floors,
      statusData,
      users,
      category: ticketType
    };

    return successResponse(
      res,
      'Complain report data fetched successfully',
      finalData
    );
  } catch (error) {
    console.error('getComplainReportDataAPI error:', error);
    next(error);
  }
};
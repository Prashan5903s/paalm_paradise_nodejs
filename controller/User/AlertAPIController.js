const mongoose = require('mongoose')
const User = require('../../model/User')
const SendUserMail = require('../../util/sendMail')
const AppConfig = require('../../model/AppConfig')
const { successResponse } = require('../../util/response')

exports.getAlertController = async (req, res, next) => {
  try {
    const userId = req?.userId

    const appConfig = await AppConfig.findOne({
      type: 'panic_mail_data'
    })

    const mailSubject = appConfig?.panic_data?.mail_subject
    const mailBody = appConfig?.panic_data?.mail_body

    const user = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $unwind: {
          path: '$apartment_data',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'towers',
          localField: 'apartment_data.tower_id',
          foreignField: '_id',
          as: 'tower'
        }
      },
      {
        $lookup: {
          from: 'apartments',
          localField: 'apartment_data.apartment_id',
          foreignField: '_id',
          as: 'apartment'
        }
      },
      {
        $addFields: {
          'apartment_data.tower': {
            $arrayElemAt: ['$tower', 0]
          },
          'apartment_data.apartment': {
            $arrayElemAt: ['$apartment', 0]
          }
        }
      },
      {
        $project: {
          tower: 0,
          apartment: 0
        }
      },
      {
        $group: {
          _id: '$_id',
          user: {
            $first: '$$ROOT'
          },
          apartment_data: {
            $push: '$apartment_data'
          }
        }
      },
      {
        $addFields: {
          'user.apartment_data': '$apartment_data'
        }
      },
      {
        $replaceRoot: {
          newRoot: '$user'
        }
      }
    ])

    const apartment = user[0].apartment_data
      .map(item => item.apartment?.apartment_no)
      .filter(Boolean)
      .join(', ')

    const tower = user[0].apartment_data
      .map(item => item.tower?.name)
      .filter(Boolean)
      .join(', ')

    const masterId = user[0]?.created_by
    const ownerName = user[0]?.first_name + ' ' + user[0]?.last_name
    const contactNo = user[0]?.phone

    const alertTime = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(new Date())

    const masterUser = await User.findById(masterId)

    const finalMailBody = mailBody
      .replace(/{{owner_name}}/g, ownerName)
      .replace(/{{apartment_number}}/g, apartment)
      .replace(/{{tower_name}}/g, tower)
      .replace(/{{alert_time}}/g, alertTime)
      .replace(/{{contact_number}}/g, contactNo)

    const users = await User.aggregate([
      {
        $match: {
          created_by: masterId
        }
      },
      {
        $lookup: {
          from: 'role_users',
          localField: '_id',
          foreignField: 'user_id',
          as: 'role_user'
        }
      },
      {
        $addFields: {
          isSecurityGuard: {
            $in: [
              mongoose.Types.ObjectId.createFromHexString(
                '68cd0e38c2d476bd45384234'
              ),
              '$role_user.role_id'
            ]
          }
        }
      },
      {
        $match: {
          isSecurityGuard: true
        }
      }
    ])

    const matchEmails = users.map(user => user.email)

    const finalEmail = [...matchEmails, masterUser.email]

    // await SendUserMail(finalEmail, mailSubject, finalMailBody, userId)
    //   .then(info => {
    //     console.log('Mail sent:', info.messageId)
    //   })
    //   .catch(err => {
    //     console.error('Error sending mail:', err)
    //   })

    return successResponse(res, 'Alert sent successfully', finalEmail)
  } catch (error) {
    next(error)
  }
}

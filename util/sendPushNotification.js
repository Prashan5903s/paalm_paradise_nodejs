const admin = require('./firebase') // Firebase Admin initialization

async function sendNotification (
  deviceToken,
  title,
  body,
  screen,
  userId,
  priority = 'high'
) {
  const message = {
    token: deviceToken,

    notification: {
      title: title,
      body: body
    },

    data: {
      screen: String(screen),
      userId: String(userId)
    },

    android: {
      priority: priority, // "high" or "normal"
      notification: {
        sound: 'default'
      }
    },

    apns: {
      payload: {
        aps: {
          sound: 'default'
        }
      }
    }
  }

  try {
    const response = await admin.messaging().send(message)
    console.log('Notification sent:', response)
    return response
  } catch (error) {
    console.error('Error sending notification:', error)
    throw error
  }
}

module.exports = { sendNotification }

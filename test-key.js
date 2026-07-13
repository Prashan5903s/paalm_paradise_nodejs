const crypto = require('crypto')
require('dotenv').config();

const key = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

try {
  console.log(JSON.stringify(process.env.FIREBASE_PRIVATE_KEY))
  crypto.createPrivateKey(key)
  console.log('VALID')
} catch (e) {
  console.log('INVALID')
  console.log(e)
}

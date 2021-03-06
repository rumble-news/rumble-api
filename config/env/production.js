
/**
 * Expose
 */

module.exports = {
  db: process.env.MONGODB_URI,
  stream: {
    apiKey: process.env.STREAM_API_KEY,
    apiSecret: process.env.STREAM_API_SECRET,
    appId: '14328'
  },
  embedly: {
    apiKey: process.env.EMBEDLY_API_KEY
  },
  winston: {
    level: 'info'
  },
  facebook: {
    clientID: 'APP_ID',
    clientSecret: 'SECRET',
    callbackURL: 'http://localhost:3000/auth/facebook/callback',
    scope: [
      'email',
      'user_about_me',
      'user_friends'
    ]
  },
  google: {
    clientID: 'APP_ID',
    clientSecret: 'SECRET',
    callbackURL: 'http://localhost:3000/auth/google/callback',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.google.com/m8/feeds',
    ]
  }
};

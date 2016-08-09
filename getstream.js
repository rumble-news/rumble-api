exports.config = {

  /**
  * GetStream.io API key
  */
  apiKey: process.env.STREAM_API_KEY,


  /**
  * GetStream.io API Secret
  */
  apiSecret: process.env.STREAM_API_SECRET,


  /**
  * GetStream.io API App ID
  */
  apiAppId: "14328",


  /**
  * GetStream.io API Location
  */
  apiLocation: "",


  /**
  * GetStream.io User Feed slug
  */
  userFeed: "user",


  /**
  * GetStream.io Notification Feed slug
  */
  notificationFeed: "notification",


  newsFeeds: {

    /**
    * GetStream.io Flat Feed slug
    */
    flat: "flat",

    /**
    * GetStream.io Aggregated Feed slug
    */
    aggregated: "timeline"
  }


}

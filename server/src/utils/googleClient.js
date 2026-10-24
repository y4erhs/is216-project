const { google } = require('googleapis')

// Makes a fresh Google login helper using your .env values
function createOAuthClient() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    )
}

module.exports = { createOAuthClient }
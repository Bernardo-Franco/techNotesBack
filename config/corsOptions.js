const allowedOrigins = require("./allowedOrigins");

const corsOptions = {
    origin: (origin, callback) => {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {  // if it does not have an origin url it'll allow the access example aplications like postman
            callback(null, true)
        } else {
            callback(new Error("not allowed by cors"))
        }
    },
    credentials: true,
    optiosSuccessStatus: 200
}

module.exports = corsOptions
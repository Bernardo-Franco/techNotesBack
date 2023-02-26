require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const { logEvents, logger } = require('./middleware/logger')
const errorHandler = require('./middleware/errorHandler');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const corsOptions = require('./config/corsOptions');
const connectDB = require('./config/dbConn.js');
const mongoose = require('mongoose');
const PORT = process.env.PORT || 3500;

connectDB();

app.use(logger)

app.use(cors(corsOptions))

app.use(express.json());

app.use(cookieParser());

app.use('/', express.static(path.join(__dirname, '/public')));

app.use('/', require("./router/root"));
app.use('/auth', require("./router/authRoute"))
app.use('/users', require("./router/userRoute"))
app.use('/notes', require("./router/notesRoute"))

app.all('*', (req, res) => {
    res.status(404);
    if ( req.accepts('html')) {
        res.sendFile(path.join(__dirname, "views","404.html"));
    } else if ( req.accepts('json')) {
        res.json({ message: "404 Not Found" })
    } else {
        res.type("txt").sendFile("404 Not Found");
    }
} )

app.use(errorHandler)

mongoose.connection.once("open", ()=> {
    console.log("connected to Mongo - DB")
    app.listen(PORT, () => { console.log(`server running on port ${PORT}`) })
})

mongoose.connection.on("error", (err) => {
    console.log(err);
    logEvents(`${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}\n`,'mongoErrLog.log')
})
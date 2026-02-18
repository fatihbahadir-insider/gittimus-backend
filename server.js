require('dotenv').config();

const express = require('express');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const connectDB = require('./config/dbConn');
const PORT = process.env.PORT || 3500;


app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit : '50mb' }));

app.use(express.json());
app.use(cookieParser());

mongoose.connection.once('open', () => {
    console.log("Connected to MongoDB");
    app.listen(PORT, ()=>console.log(`Server running on port ${PORT}`))
})
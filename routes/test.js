const express = require('express');
const router = express.Router();

router.route('/')
    .get(function(req, res) {
        console.log("GET request received at /test");
    })
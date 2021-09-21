require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dns = require("dns");
const bodyParse = require("body-parser");
const url = require("url");
// const mongodb =require("mongodb");
// const moongose = require("mongoose");
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.use(bodyParse.urlencoded({ extended: false }));
app.post("/api/shorturl", (req, res) => {
  const requrl = req.body.url;
  let parsedurl = url.parse(requrl);
  var isValid = false;
  dns.lookup(parsedurl.hostname, (err, address, family) => {
    if (err) {
      return console.log(err);
    }
    console.log("address = ", address);
    if (typeof address !== "undefined" || address != null) {
      var isValid = true;
    }
  });
  if (isValid) {
    res.json({ original_url: requrl, short_url: 2 });
  } else {
    res.json({ error: "invalid url" });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

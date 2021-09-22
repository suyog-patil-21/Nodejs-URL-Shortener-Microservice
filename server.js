require("dotenv").config();
const express = require("express");
const cors = require("cors");
var validUrl = require("valid-url");
const url = require("url");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dns = require("dns");
const app = express();
// Basic Configuration
const port = process.env.PORT || 8080;

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
app.use(cors());
app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.use(express.urlencoded({ extended: false }));

const shorturlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: { type: Number, unique: true },
});

const ShortUrl = mongoose.model("UrlShortnercollection", shorturlSchema);

app.post("/api/shorturl", async (req, res) => {
  const reqUrl = req.body.url;
  // TODO : {error "Invalid Hostname"}
  //check valid url
  if (validUrl.isUri(reqUrl)) {
    //if valid url
    const temp = url.parse(reqUrl, true);
    // console.log("Valid url");
    dns.lookup(temp.hostname, async function (err, address, _) {
      if (err) {
        res.json({ error: "Invalid Hostname" });
      }
      if (address.length > 0) {
        var responseJson = {
          original_url: null,
          short_url: null,
        };
        // valid address
        var foundUrl = await ShortUrl.findOne({ original_url: reqUrl }).exec();
        if (foundUrl === null) {
          // no url present with name `reqUrl` so create here
          var query = await ShortUrl.find({}).sort({ short_url: "desc" });
          responseJson.original_url = reqUrl;
          responseJson.short_url = query[0].short_url + 1;
          ShortUrl.create(responseJson);
        } else {
          responseJson.original_url = foundUrl.original_url;
          responseJson.short_url = foundUrl.short_url;
        }
        // console.log(foundUrl);
        res.json(responseJson);
      }
      res.end();
    });
  } else {
    // if invalid Url
    res.json({ error: "Invalid URL" });
  }
});

//redirection route
app.get("/api/shorturl/:short?", (req, res) => {
  var redirectUrlid = req.params.short;
  if (redirectUrlid == undefined) {
    res.end("Not found");
  } else if (isNaN(redirectUrlid)) {
    res.json({ error: "Wrong format" });
  } else {
    ShortUrl.findOne({ short_url: redirectUrlid }, (err, newurl) => {
      if (err) return console.log(err);
      res.redirect(newurl.original_url);
    });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

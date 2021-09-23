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

  const temp = url.parse(reqUrl, true);
  //check valid url
  if ((temp.protocol == 'http:' ||temp.protocol == 'https:') && temp.hostname !== "" && validUrl.isUri(reqUrl)) {
    //if valid url

    // console.log("Valid url");
    dns.lookup(temp.hostname, async function (err, address, _) {
      if (err) {
        console.log(err);
        return res.json({ error: "Invalid Hostname" });
      }
      console.log(address);
      if (address === undefined || address.length > 0) {
        var responseJson = {
          original_url: null,
          short_url: null,
        };
        // valid address
        var foundUrl = await ShortUrl.findOne({ original_url: reqUrl })
          .exec()
          .catch((err) => {
            console.log(err);
          });
        if (foundUrl === null) {
          // no url present with name `reqUrl` so create here
          // TODO : for new creating
          responseJson.original_url = reqUrl;
          try {
            var collection = await ShortUrl.find({})
              .sort({ short_url: -1 })
              .exec();
            if (collection.length === 0) {
              responseJson.short_url = 1;
            } else {
              console.log(collection, collection[0].short_url);
              responseJson.short_url = 1 + collection[0].short_url;
            }
            ShortUrl.create(responseJson);
            console.log("collection containes ", collection.length === 0);
          } catch (err) {
            console.log("'.find()' error for DB : ", err);
          }
        } else {
          //search with this fields
          responseJson.original_url = foundUrl.original_url;
          responseJson.short_url = foundUrl.short_url;
        }
        res.json(responseJson);
      } else {
        res.json({ error: "Invalid URL" });
      }
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

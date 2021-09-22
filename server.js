require("dotenv").config();
const express = require("express");
const cors = require("cors");
var validUrl = require("valid-url");
const mongoose = require("mongoose");
const { query } = require("express");
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
  const requrl = req.body.url;
  let newNum = 1;

  if (validUrl.isUri(requrl)) {
    var query = await ShortUrl.find({}).sort({
      short_url: "asc",
    });
    var index = null;
    query.forEach((value, indexs, array) => {
      if (value.original_url === requrl) {
        index = indexs;
      }
    });
    
    if (index != null &&query.length != 0) {
      res.json({
        original_url: query[index].original_url,
        short_url: query[index].short_url,
      });
    } else {
      if (index == null) newNum = query[query.length-1].short_url + 1;
      ShortUrl.create(
        { original_url: requrl, short_url: newNum },
        (err, data) => {
          if (err) return handleError(err);
          res.json({
            original_url: data.original_url,
            short_url: data.short_url,
          });
        }
      );
    }
  } else {
    res.json({ error: "invalid url" });
  }
});

//redirection route
app.get("/api/shorturl/:short?", (req, res) => {
  var redirectUrlid = req.params.short;
  if (redirectUrlid == undefined) {
    res.end("Not found");
  } else if (isNaN(redirectUrlid)) {
    res.json({ error: "invalid url" });
  } else {
    ShortUrl.findOne({ short_url: redirectUrlid }, (err, newurl) => {
      if (err) return handleError(err);
      res.redirect(newurl.original_url);
    });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

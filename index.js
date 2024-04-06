require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require("dns");
const bodyParser = require("body-parser");
const fs = require("fs");

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', (req, res) => {
  const { url } = req.body;

  dns.lookup(url, (err, address, family) => {
    if (err) {
      console.error('Domain lookup failed:', err);
      res.send("Enter a valid domain with format - www.facebook.com")
    } else {
      console.log('Domain is verified. IP address:', address);

      let data = fs.readFileSync("./mappings.json");
      data = JSON.parse(data);
      let { count, mapping } = data;

      for (let map of mapping) {
        if (map.original_url === url) {
          res.json({ map });
          return;
        }
      }

      newUrl = { "original_url": url, "short_url": count++ };

      mapping.push(newUrl);

      let newData = { count: count, mapping: mapping };

      fs.writeFileSync("./mappings.json", JSON.stringify(newData));

      res.json({ ...newUrl, "short_url": --count })
    }
  });
})

app.get("/api/shorturl/:number", (req, res) => {
  let number = req.params.number;
  let data = fs.readFileSync("./mappings.json");
  data = JSON.parse(data);
  let { mapping } = data;

  for (let map of mapping) {
    if (map.short_url === +number) {
      res.redirect(`https://${map.original_url}`);
      return;
    }
  }

  res.json({ "error": "No short URL found for the given input" })
})

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

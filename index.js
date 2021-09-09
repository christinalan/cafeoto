let express = require("express");
let app = express();

app.use("/", express.static("src"));
// app.use("/", express.static("node_modules/three/build"));
// app.use("/", express.static("node_modules/three/examples/jsm"));

let http = require("http");
let server = http.createServer(app);

// if (process.env.NODE_ENV === "production") {
//   app.use((req, res, next) => {
//     if (req.header("x-forwarded-proto") !== "https")
//       res.redirect(`https://${req.header("host")}${req.url}`);
//     else next();
//   });
// }

// let https = require("https");
// let fs = require("fs");
// let options = {
//   key: fs.readFileSync("./localhost-key.pem"),
//   cert: fs.readFileSync("./localhost.pem"),
// };

// let server = https.createServer(options, app);

let port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log("server is listening at port: " + port);
});

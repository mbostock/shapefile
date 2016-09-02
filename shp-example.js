var shp = require("./shp");

shp.open("test/null.shp")
  .then((points) => points.header()
    .then((header) => console.log("header", header))
    .then(function next() {
      return points.record().then((record) => record
          ? (console.log("record", record), next())
          : console.log("end"));
    })
    .catch((error) => points.close().then(() => { throw error; }))
    .then(() => points.close()))
  .catch((error) => console.error(error.stack));

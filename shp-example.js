var shp = require("./shp");

shp.open("test/null.shp")
  .then(function(points) {
    return points.header()
      .then(function(header) { console.log("header", header); })
      .then(function next() {
        return points.record().then(function(record) {
          if (!record) return;
          console.log("record", record);
          return next();
        });
      })
      .then(function() { return points.close(); });
  })
  .catch(function(error) { console.error(error.stack); });

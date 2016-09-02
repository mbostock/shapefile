var tape = require("tape"),
    shp = require("../shp");

function readHeader(path, options) {
  return shp.open(path, options)
    .then((file) => file.header()
      .catch((error) => file.close().then(() => { throw error; }))
      .then((header) => file.close().then(() => header)));
}

function readRecords(path, options) {
  return shp.open(path, options)
    .then((file) => file.header()
      .then((header) => {
        var records = [];
        return (function next() {
          return file.record().then((record) => record ? (records.push(record), next()) : records);
        })();
      })
      .catch((error) => file.close().then(() => { throw error; }))
      .then((records) => file.close().then(() => records)));
}

tape("The header of a simple shapefile", function(test) {
  readHeader("./test/boolean-property.shp")
    .then((header) => test.deepEqual(header, {
      fileCode: 9994,
      version: 1000,
      shapeType: 1,
      box: [1, 2, 17, 18]
    }))
    .then(() => test.end());
});

tape("The header of an empty shapefile", function(test) {
  readHeader("./test/empty.shp")
    .then((header) => test.deepEqual(header, {
      fileCode: 9994,
      version: 1000,
      shapeType: 3,
      box: [0, 0, 0, 0]
    }))
    .then(() => test.end());
});

tape("The records of an empty shapefile", function(test) {
  readRecords("./test/empty.shp")
    .then((records) => test.deepEqual(records, []))
    .then(() => test.end());
});

tape("The records of a shapefile of points", function(test) {
  readRecords("./test/points.shp")
    .then((records) => test.deepEqual(records, [
      {shapeType: 1, x: 1, y: 2},
      {shapeType: 1, x: 3, y: 4},
      {shapeType: 1, x: 5, y: 6},
      {shapeType: 1, x: 7, y: 8},
      {shapeType: 1, x: 9, y: 10},
      {shapeType: 1, x: 11, y: 12},
      {shapeType: 1, x: 13, y: 14},
      {shapeType: 1, x: 15, y: 16},
      {shapeType: 1, x: 17, y: 18}
    ]))
    .then(() => test.end());
});

tape("The records of a shapefile of multipoints", function(test) {
  readRecords("./test/multipoints.shp")
    .then((records) => test.deepEqual(records, [
      {shapeType: 8, box: [1, 2, 9, 10], points: [[1, 2], [3, 4], [5, 6], [7, 8], [9, 10]]},
      {shapeType: 8, box: [11, 12, 19, 20], points: [[11, 12], [13, 14], [15, 16], [17, 18], [19, 20]]}
    ]))
    .then(() => test.end());
});

tape("The records of a shapefile of polylines", function(test) {
  readRecords("./test/polylines.shp")
    .then((records) => test.deepEqual(records, [
      {shapeType: 3, box: [1, 2, 9, 10], parts: [0], points: [[1, 2], [3, 4], [5, 6], [7, 8], [9, 10]]},
      {shapeType: 3, box: [11, 12, 19, 20], parts: [0, 2], points: [[11, 12], [13, 14], [15, 16], [17, 18], [19, 20]]}
    ]))
    .then(() => test.end());
});

tape("The records of a shapefile of polygons", function(test) {
  readRecords("./test/polygons.shp")
    .then((records) => test.deepEqual(records, [
      {shapeType: 5, box: [0, 0, 1, 1], parts: [0], points: [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]},
      {shapeType: 5, box: [0, 0, 4, 4], parts: [0, 5], points: [[0, 0], [0, 4], [4, 4], [4, 0], [0, 0], [1, 1], [3, 1], [3, 3], [1, 3], [1, 1]]},
      {shapeType: 5, box: [2, 2, 5, 5], parts: [0, 5], points: [[2, 2], [2, 3], [3, 3], [3, 2], [2, 2], [4, 4], [4, 5], [5, 5], [5, 4], [4, 4]]}
    ]))
    .then(() => test.end());
});

tape("The records of a shapefile with null features", function(test) {
  readRecords("./test/null.shp")
    .then((records) => test.deepEqual(records, [
      {shapeType: 1, x: 1, y: 2},
      {shapeType: 0},
      {shapeType: 1, x: 5, y: 6},
      {shapeType: 0},
      {shapeType: 0},
      {shapeType: 1, x: 11, y: 12},
      {shapeType: 1, x: 13, y: 14},
      {shapeType: 0},
      {shapeType: 1, x: 17, y: 18}
    ]))
    .then(() => test.end());
});

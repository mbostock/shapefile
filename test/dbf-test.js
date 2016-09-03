process.env.TZ = "America/Los_Angeles";

var tape = require("tape"),
    dbf = require("../dbf");

function readHeader(path, options) {
  return dbf.open(path, options)
    .then((source) => source.header()
      .catch((error) => source.close().then(() => { throw error; }))
      .then((header) => source.close().then(() => header)));
}

function readRecords(path, options) {
  var records = [];
  return dbf.open(path, options)
    .then((source) => source.header()
      .then(function repeat() { return source.record()
        .then((record) => record ? (records.push(record), repeat()) : records); })
      .catch((error) => source.close().then(() => { throw error; }))
      .then((records) => source.close().then(() => records)));
}

tape("The header of a simple dBASE file", function(test) {
  readHeader("./test/boolean-property.dbf")
    .then((header) => test.deepEqual(header, {
      version: 3,
      length: 9,
      date: new Date(Date.UTC(1995, 6, 26, 7)),
      fields: [{name: "foo", type: "L", length: 1}]
    }))
    .then(() => test.end());
});

tape("The header of an empty dBASE file", function(test) {
  readHeader("./test/empty.dbf")
    .then((header) => test.deepEqual(header, {
      version: 3,
      length: 0,
      date: new Date(Date.UTC(1995, 6, 26, 7)),
      fields: []
    }))
    .then(() => test.end());
});

tape("The header of a dBASE file with ISO-8859-1 property names", function(test) {
  readHeader("./test/latin1-property.dbf")
    .then((header) => test.deepEqual(header, {
      length: 1,
      date: new Date(Date.UTC(1995, 6, 26, 7)),
      version: 3,
      fields: [{name: "name", type: "C", length: 80}]
    }))
    .then(() => test.end());
});

tape("The records of a dBASE file with ISO-8859-1 property names", function(test) {
  dbf.open("./test/latin1-property.dbf")
    .then((file) => file.header()
      .then((header) => {
        var records = [];
        return (function next() {
          return file.record().then((record) => record ? (records.push(record), next()) : records);
        })();
      })
      .then((records) => test.deepEqual(records, [
        ["México"]
      ]))
      .then(() => file.close()))
    .then(() => test.end())
    .catch((error) => file.close().then(() => test.end(error)));
});

tape("The header of a dBASE file with UTF-8 property names", function(test) {
  readHeader("./test/utf8-property.dbf", {encoding: "utf8"})
    .then((header) => test.deepEqual(header, {
      length: 1,
      date: new Date(Date.UTC(1995, 6, 26, 7)),
      version: 3,
      fields: [{name: "☃", type: "C", length: 80}]
    }))
    .then(() => test.end());
});

tape("The records of a dBASE file with UTF-8 property names", function(test) {
  readRecords("./test/utf8-property.dbf", {encoding: "utf8"})
    .then((records) => test.deepEqual(records, [
      ["ηελλο ςορλδ"]
    ]))
    .then(() => test.end());
});

tape("The records of a dBASE file with UTF-8 property names", function(test) {
  readRecords("./test/empty.dbf")
    .then((records) => test.deepEqual(records, []))
    .then(() => test.end());
});

tape("The records of a simple dBASE file", function(test) {
  readRecords("./test/boolean-property.dbf")
    .then((records) => test.deepEqual(records, [
      [null],
      [true],
      [true],
      [false],
      [false],
      [true],
      [true],
      [false],
      [false]
    ]))
    .then(() => test.end());
});

tape("The records of a dBASE file with a string property", function(test) {
  readRecords("./test/string-property.dbf")
    .then((records) => test.deepEqual(records, [
      [null],
      ["blue"],
      ["green"]
    ]))
    .then(() => test.end());
});

tape("The records of a dBASE file with a number property", function(test) {
  readRecords("./test/number-property.dbf")
    .then((records) => test.deepEqual(records, [
      [null],
      [42],
      [-4]
    ]))
    .then(() => test.end());
});

tape("The records of a dBASE file with a date property", function(test) {
  readRecords("./test/date-property.dbf")
    .then((records) => test.deepEqual(records, [
      [new Date(2013, 0, 2)],
      [new Date(2013, 1, 2)],
      [new Date(2013, 0, 3)]
    ]))
    .then(() => test.end());
});

tape("The records of a dBASE file with a multiple properties", function(test) {
  readRecords("./test/mixed-properties.dbf")
    .then((records) => test.deepEqual(records, [
      [null, null],
      [42, null],
      [null, "blue"]
    ]))
    .then(() => test.end());
});

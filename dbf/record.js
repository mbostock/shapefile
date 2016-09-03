var readBoolean = require("./boolean"),
    readDate = require("./date"),
    readNumber = require("./number"),
    readString = require("./string");

var types = {
  B: readNumber,
  C: readString,
  D: readDate,
  F: readNumber,
  L: readBoolean,
  M: readNumber,
  N: readNumber
};

module.exports = function() {
  var i = 1;
  return this._source.read(this._recordLength).then((buffer) => buffer.length
      ? this._fields.map((f) => types[f.type](this._decode(buffer, i, i += f.length)))
      : null);
};

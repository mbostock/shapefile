var readNull = require("./null");

module.exports = function() {
  return this._source.read(8)
    .then((buffer) => buffer.length == 0 ? null : this._source.read(buffer.readInt32BE(4) * 2)
      .then((buffer) => buffer.readInt32LE(0) ? this._type(buffer) : readNull()));
};

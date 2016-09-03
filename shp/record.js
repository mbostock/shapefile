var readNull = require("./null");

module.exports = function() {
  return this._source.skip(4).readInt32BE()
    .then((length) => length == null ? null : this._source.read(length * 2)
      .then((buffer) => buffer.readInt32LE(0) ? this._type(buffer) : readNull()));
};

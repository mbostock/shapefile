var readNull = require("./null");

module.exports = function() {
  return this._file.skip(4).readInt32BE()
    .then((length) => length == null ? null : this._file.read(length * 2)
      .then((buffer) => buffer.readInt32LE(0) ? this._type(buffer) : readNull()));
};

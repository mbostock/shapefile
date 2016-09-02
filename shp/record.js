var readNull = require("./null");

module.exports = function() {
  return this._file.read(8).then((buffer) => buffer.length
      ? this._file.read(buffer.readInt32BE(4) * 2).then((buffer) => buffer.readInt32LE(0)
          ? this._type(buffer)
          : readNull())
      : null);
};

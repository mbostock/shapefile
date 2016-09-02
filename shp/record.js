var readNull = require("./null");

module.exports = function() {
  if (this._type == null) throw new Error("must read header before records");
  return this._file.read(8).then((buffer) => buffer.length
      ? this._file.read(buffer.readInt32BE(4) * 2).then((buffer) => buffer.readInt32LE(0)
          ? this._type(buffer)
          : readNull())
      : null);
};

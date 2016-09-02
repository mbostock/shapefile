function name(string) {
  var i = string.indexOf("\0");
  return i < 0 ? string : string.substring(0, i);
}

module.exports = function() {
  if (this._recordLength != null) throw new Error("already read header");
  return this._file.read(32).then((buffer) => {
    this._version = buffer.readUInt8(0); // TODO verify 3
    this._date = new Date(1900 + buffer.readUInt8(1), buffer.readUInt8(2) - 1, buffer.readUInt8(3));
    this._length = buffer.readUInt32LE(4);
    this._recordLength = buffer.readUInt16LE(10);
    return this._file.read(buffer.readUInt16LE(8) - 32);
  }).then((buffer) => {
    var n = 0;
    while (buffer.readUInt8(n) != 0x0d) {
      this._fields.push({
        name: name(this._decode(buffer, n, n + 11)),
        type: buffer.toString("ascii", n + 11, n + 12),
        length: buffer.readUInt8(n + 16)
      });
      n += 32;
    }
    return {
      version: this._version,
      date: this._date,
      length: this._length,
      fields: this._fields
    };
  });
};

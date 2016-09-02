module.exports = function() {
  return this._file.read(32).then((head) => this._file.read(head.readUInt16LE(8) - 32).then((body) => {
    var n = 0;
    while (body.readUInt8(n) != 0x0d) {
      this._fields.push({
        name: this._decode(body, n, n + 11).replace(/\0.*/, ""),
        type: body.toString("ascii", n + 11, n + 12),
        length: body.readUInt8(n + 16)
      });
      n += 32;
    }
    this._recordLength = head.readUInt16LE(10);
    return {
      version: head.readUInt8(0), // TODO verify 3
      date: new Date(1900 + head.readUInt8(1), head.readUInt8(2) - 1, head.readUInt8(3)),
      length: head.readUInt32LE(4),
      fields: this._fields
    };
  }));
};

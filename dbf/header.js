import view from "../view";

export default function() {
  var that = this;
  return that._source.read(32).then(function(result) {
    var head = view(result);
    return that._source.read(head.getUint16(8, true) - 32).then(function(result) {
      var body = view(result), n = 0;
      while (body.getUint8(n) != 0x0d) {
        that._fields.push({
          name: that._decode(result.value.subarray(n, n + 11)).replace(/\0.*/, ""),
          type: String.fromCharCode(result.value[n + 11]),
          length: body.getUint8(n + 16)
        });
        n += 32;
      }
      that._recordLength = head.getUint16(10, true);
      return {
        version: head.getUint8(0), // TODO verify 3
        date: new Date(1900 + head.getUint8(1), head.getUint8(2) - 1, head.getUint8(3)),
        length: head.getUint32(4, true),
        fields: that._fields
      };
    });
  });
};

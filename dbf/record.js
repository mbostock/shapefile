import readBoolean from "./boolean";
import readDate from "./date";
import readNumber from "./number";
import readString from "./string";

var types = {
  B: readNumber,
  C: readString,
  D: readDate,
  F: readNumber,
  L: readBoolean,
  M: readNumber,
  N: readNumber
};

export default function() {
  var that = this, i = 1;
  return that._source.read(that._recordLength).then(function(result) {
    if (result.done) return null;
    return that._fields.map(function(f) {
      return types[f.type](that._decode(result.value.subarray(i, i += f.length)));
    });
  });
}

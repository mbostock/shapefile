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
  return that._source.slice(that._recordLength).then(function(value) {
    return value && (value[0] !== 0x1a) ? {done: false, value: that._fields.reduce(function(p, f) {
      p[f.name] = types[f.type](that._decode(value.subarray(i, i += f.length)));
      return p;
    }, {})} : {done: true, value: undefined};
  });
}

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
    if(!value || (value && value[0] === 0x1a)) {
      return {done: true, value: undefined};
    }
    var values = that._fields.reduce(function(p, f) {
      p[f.name] = types[f.type](that._decode(value.subarray(i, i += f.length)));
      return p;
    }, {});
    values.markedAsDeleted = value[0] === 0x2A;
    return {done: false, value: values};
  });
}

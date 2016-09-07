import view from "../view";
import readNull from "./null";

export default function() {
  var that = this;
  return that._source.slice(8).then(function(array) {
    if (array == null) return {done: true, value: undefined};
    var header = view(array);
    return that._source.slice(header.getInt32(4, false) * 2).then(function(array) {
      var record = view(array);
      return {done: false, value: record.getInt32(0, true) ? that._type(record) : readNull()};
    });
  });
}

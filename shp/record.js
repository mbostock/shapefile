import view from "../view";
import readNull from "./null";

export default function record() {
  var that = this;
  return that._source.read(8).then(function(result) {
    if (result.done) return null;
    var header = view(result);
    return that._source.read(header.getInt32(4, false) * 2).then(function(result) { // TODO optimize read
      var record = view(result);
      return record.getInt32(0, true) ? that._type(record) : readNull();
    });
  });
}

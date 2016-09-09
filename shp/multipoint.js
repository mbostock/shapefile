export default function(record) {
  var i = 40, j, n = record.getInt32(36, true), coordinates = new Array(n);
  for (j = 0; j < n; ++j, i += 16) coordinates[j] = [record.getFloat64(i, true), record.getFloat64(i + 8, true)];
  return {type: "MultiPoint", coordinates: coordinates};
};

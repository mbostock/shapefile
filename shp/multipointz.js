export default function(record) {
    var i = 40, j, n = record.getInt32(36, true), coordinates = new Array(n);
    for (j = 0; j < n; ++j, i += 24) coordinates[j] = [record.getFloat64(i, true), record.getFloat64(i + 8, true),record.getFloat64(i + 16, true)];
    return {type: "MultiPoint", coordinates: coordinates};
};


export default function(record) {
        var z=0,i = 44, j, n = record.getInt32(36, true), m = record.getInt32(40, true), parts = new Array(n), points = new Array(m), polygons = [], holes = [];
        for (j = 0; j < n; ++j, i += 4) parts[j] = record.getInt32(i, true);
        z = i + 16*m + 16
        for (j = 0; j < m; ++j, i += 16,z+=8) points[j] = [record.getFloat64(i, true), record.getFloat64(i + 8, true),record.getFloat64(z, true)];

        parts.forEach(function(i, j) {
            var ring = points.slice(i, parts[j + 1]);
            if (ringClockwise(ring)) polygons.push([ring]);
            else holes.push(ring);
        });

        holes.forEach(function(hole) {
            polygons.some(function(polygon) {
                if (ringContainsSome(polygon[0], hole)) {
                    polygon.push(hole);
                    return true;
                }
            }) || polygons.push([hole]);
        });

        return polygons.length === 1
            ? {type: "PolygonZ", coordinates: polygons[0]}
            : {type: "MultiPolygonZ", coordinates: polygons};
    };

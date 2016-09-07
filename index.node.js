var path = require("path-source"),
    array = require("array-source"),
    stream = require("stream-source"),
    shapefile = require("./dist/shapefile.node"),
    TextDecoder = require("text-encoding").TextDecoder;

exports.open = open;
exports.read = read;

function open(shp, dbf, options) {
  if (typeof dbf === "string") {
    dbf = path(dbf, options);
  } else if (dbf instanceof ArrayBuffer || dbf instanceof Uint8Array) {
    dbf = array(dbf);
  } else if (dbf != null) {
    dbf = stream(dbf);
  }
  if (typeof shp === "string") {
    if (dbf === undefined) {
      if (!/\.shp$/.test(shp)) dbf = shp + ".dbf", shp += ".shp";
      else dbf = shp.substring(0, shp.length - 4) + ".dbf";
      dbf = path(dbf, options).catch(function(ignore) { return null; });
    }
    shp = path(shp, options);
  } else if (shp instanceof ArrayBuffer || shp instanceof Uint8Array) {
    shp = array(shp);
  } else {
    shp = stream(shp);
  }
  return Promise.all([shp, dbf]).then(function(sources) {
    var shp = sources[0], dbf = sources[1], encoding = "windows-1252";
    if (options && options.encoding != null) encoding = options.encoding;
    return shapefile(shp, dbf, dbf && new TextDecoder(encoding));
  });
}

function read(shp, dbf, options) {
  return open(shp, dbf, options).then(function(source) {
    var features = [], collection = {type: "FeatureCollection", features: features, bbox: source.bbox};
    return source.read().then(function read(result) {
      if (result.done) return collection;
      features.push(result.value);
      return source.read().then(read);
    });
  });
}

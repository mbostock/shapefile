var pathSource = require("path-source"),
    shapefile = require("./dist/shapefile.node"),
    TextDecoder = require("text-encoding").TextDecoder;

exports.open = function(path, options) {
  if (/\.shp$/i.test(path += "")) path = path.substring(0, path.length - 4);
  return Promise.all([
    pathSource(path + ".shp", options),
    pathSource(path + ".dbf", options)
  ]).then(function(sources) {
    var encoding = "windows-1252";
    if (options && options.encoding != null) encoding = options.encoding;
    return shapefile(sources[0], sources[1], new TextDecoder(encoding));
  });
};

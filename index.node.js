var pathSource = require("path-source"),
    shapefile = require("./dist/shapefile.node"),
    TextDecoder = require("text-encoding").TextDecoder;

// TODO options
// TODO explicit dbfPath
// TODO if implicit dbfPath, ignore errors on open
exports.source = function(path) {
  if (/\.shp$/i.test(path += "")) path = path.substring(0, path.length - 4);
  return shapefile(pathSource(path + ".shp"), pathSource(path + ".dbf"), new TextDecoder);
};

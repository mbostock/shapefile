var pathSource = require("path-source"),
    shapefile = require("./dist/shapefile.node"),
    TextDecoder = require("text-encoding").TextDecoder;

exports.source = function(path) {
  if (/\.shp$/i.test(path += "")) path = path.substring(0, path.length - 4);
  return Promise.all([
    pathSource(path + ".shp"),
    pathSource(path + ".dbf")
  ]).then(function(sources) {
    return shapefile(sources[0], sources[1], new TextDecoder);
  });
};

import pathSource from "path-source";
import shapefile from "./shapefile/index";

// TODO options
// TODO explicit dbfPath
// TODO if implicit dbfPath, ignore errors on open
export function source(path) {
  if (/\.shp$/i.test(path += "")) path = path.substring(0, path.length - 4);
  return shapefile(pathSource(path + ".shp"), pathSource(path + ".dbf"), new TextDecoder);
}

// TODO
// function source(options) {
//   var ignoreProperties = false;
//   if (options && (options.ignoreProperties != null)) ignoreProperties = !!options.ignoreProperties;
//   return new Shapefile(shp.source(options), ignoreProperties ? null : dbf.source(options));
// }

// TODO
// exports.read = function(path, options) {
//   var features = [], collection = {type: "FeatureCollection", bbox: null, features: features};
//   return source(options).open(path)
//     .then((source) => source.header()
//       .then((header) => collection.bbox = header.bbox)
//       .then(function repeat() { return source.record()
//         .then((record) => record && (features.push(record), repeat())); })
//       .catch((error) => source.close().then(() => { throw error; }))
//       .then(() => (source.close(), collection)));
// };

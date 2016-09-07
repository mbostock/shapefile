import pathSource from "path-source";
import shapefile from "./shapefile/index";

export function source(path) {
  if (/\.shp$/i.test(path += "")) path = path.substring(0, path.length - 4);
  return Promise.all([
    pathSource(path + ".shp"),
    pathSource(path + ".dbf")
  ]).then(function(sources) {
    return shapefile(sources[0], sources[1], new TextDecoder);
  });
}

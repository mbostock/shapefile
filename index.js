import path from "path-source";
import array from "array-source";
import stream from "stream-source";
import shapefile from "./shapefile/index";

export function open(shp, dbf, options) {
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

import path from "path-source";
import array from "array-source";
import stream from "stream-source";
import dbf from "./dbf/index";
import shapefile from "./shapefile/index";
import shp from "./shp/index";

export function open(shp, dbf, options) {
  if (typeof dbf === "string") {
    if (!/\.dbf$/.test(dbf)) dbf += ".dbf";
    dbf = path(dbf, options);
  } else if (dbf instanceof ArrayBuffer || dbf instanceof Uint8Array) {
    dbf = array(dbf);
  } else if (dbf != null) {
    dbf = stream(dbf);
  }
  if (typeof shp === "string") {
    if (!/\.shp$/.test(shp)) shp += ".shp";
    if (dbf === undefined) dbf = path(shp.substring(0, shp.length - 4) + ".dbf", options).catch(function() {});
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

export function openShp(source, options) {
  if (typeof source === "string") {
    if (!/\.shp$/.test(source)) source += ".shp";
    source = path(source, options);
  } else if (source instanceof ArrayBuffer || source instanceof Uint8Array) {
    source = array(source);
  } else {
    source = stream(source);
  }
  return Promise.resolve(source).then(shp);
}

export function openDbf(source, options) {
  var encoding = "windows-1252";
  if (options && options.encoding != null) encoding = options.encoding;
  encoding = new TextDecoder(encoding);
  if (typeof source === "string") {
    if (!/\.dbf$/.test(source)) source += ".dbf";
    source = path(source, options);
  } else if (source instanceof ArrayBuffer || source instanceof Uint8Array) {
    source = array(source);
  } else {
    source = stream(source);
  }
  return Promise.resolve(source).then(function(source) {
    return dbf(source, encoding);
  });
}

export function read(shp, dbf, options) {
  return open(shp, dbf, options).then(function(source) {
    var features = [], collection = {type: "FeatureCollection", features: features, bbox: source.bbox};
    return source.read().then(function read(result) {
      if (result.done) return collection;
      features.push(result.value);
      return source.read().then(read);
    });
  });
}

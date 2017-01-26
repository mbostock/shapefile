# Streaming Shapefile Parser

In Node:

```js
var shapefile = require("shapefile");

shapefile.open("example.shp")
  .then(source => source.read()
    .then(function log(result) {
      if (result.done) return;
      console.log(result.value);
      return source.read().then(log);
    }))
  .catch(error => console.error(error.stack));
```

In a browser:

```html
<!DOCTYPE html>
<script src="https://unpkg.com/shapefile@0.6"></script>
<script>

shapefile.open("https://cdn.rawgit.com/mbostock/shapefile/master/test/points.shp")
  .then(source => source.read()
    .then(function log(result) {
      if (result.done) return;
      console.log(result.value);
      return source.read().then(log);
    }))
  .catch(error => console.error(error.stack));

</script>
```

In a terminal:

```
shp2json example.shp
```

For a live example, see [bl.ocks.org/2dd741099154a4da55a7db31fd96a892](http://bl.ocks.org/mbostock/2dd741099154a4da55a7db31fd96a892). See also [ndjson-cli](https://github.com/mbostock/ndjson-cli) for examples of manipulating GeoJSON using newline-delimited JSON streams. See [Command-Line Cartography](https://medium.com/@mbostock/command-line-cartography-part-1-897aa8f8ca2c) for a longer introduction.

This parser implementation is based on the [ESRI Shapefile Technical Description](http://www.esri.com/library/whitepapers/pdfs/shapefile.pdf), [dBASE Table for ESRI Shapefile (DBF)](http://www.digitalpreservation.gov/formats/fdd/fdd000326.shtml) and [Data File Header Structure for the
dBASE Version 7 Table File](http://www.dbase.com/Knowledgebase/INT/db7_file_fmt.htm). Caveat emptor: this is a work in progress and does not currently support all shapefile geometry types. It only supports dBASE III and has little error checking. Please contribute if you want to help!

In-browser parsing of dBASE table files requires [TextDecoder](https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder#Browser_compatibility), part of the [Encoding living standard](https://encoding.spec.whatwg.org/), which is not supported in IE or Safari as of September, 2016. See [text-encoding](https://github.com/inexorabletash/text-encoding) for a browser polyfill.

TypeScript definitions are available in [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/shapefile): `typings install dt~shapefile`.

## API Reference

<a name="read" href="#read">#</a> shapefile.<b>read</b>(<i>shp</i>[, <i>dbf</i>[, <i>options</i>]]) [<>](https://github.com/mbostock/shapefile/blob/master/index.js#L62 "Source")

Returns a promise that yields a [GeoJSON feature collection](http://geojson.org/geojson-spec.html#feature-collection-objects) for specified shapefile *shp* and dBASE table file *dbf*. The meaning of the arguments is the same as [shapefile.open](#open). This is a convenience API for reading an entire shapefile in one go; use this method if you don’t mind putting the whole shapefile in memory. The yielded *collection* has a bbox property representing the bounding box of all records in this shapefile. The bounding box is specified as [*xmin*, *ymin*, *xmax*, *ymax*], where *x* and *y* represent longitude and latitude in spherical coordinates.

The [coordinate reference system](http://geojson.org/geojson-spec.html#coordinate-reference-system-objects) of the feature collection is not specified. This library does not support parsing coordinate reference system specifications (.prj); see [Proj4js](https://github.com/proj4js/proj4js) for parsing [well-known text (WKT)](https://en.wikipedia.org/wiki/Well-known_text#Coordinate_reference_system) specifications.

<a name="open" href="#open">#</a> shapefile.<b>open</b>(<i>shp</i>[, <i>dbf</i>[, <i>options</i>]]) [<>](https://github.com/mbostock/shapefile/blob/master/index.js#L6 "Source")

Returns a promise that yields a GeoJSON Feature [*source*](#sources).

If typeof *shp* is “string”, opens the shapefile at the specified *shp* path. If *shp* does not have a “.shp” extension, it is implicitly added. If *shp* instanceof ArrayBuffer or *shp* instanceof Uint8Array, reads the specified in-memory shapefile. Otherwise, *shp* must be a [Node readable stream](https://nodejs.org/api/stream.html#stream_readable_streams) in Node or a [WhatWG standard readable stream](https://streams.spec.whatwg.org/#rs) in browsers.

If typeof *dbf* is “string”, opens the dBASE file at the specified *dbf* path. If *dbf* does not have a “.dbf” extension, it is implicitly added. If *dbf* instanceof ArrayBuffer or *dbf* instanceof Uint8Array, reads the specified in-memory dBASE file. If *dbf* is undefined and *shp* is a string, then *dbf* defaults to *shp* with the “.shp” extension replaced with “.dbf”; in this case, no error is thrown if there is no dBASE file at the resulting implied *dbf*. If *dbf* is undefined and *shp* is not a string, or if *dbf* is null, then no dBASE file is read, and the resulting GeoJSON features will have empty properties. Otherwise, *dbf* must be a [Node readable stream](https://nodejs.org/api/stream.html#stream_readable_streams) in Node or a [WhatWG standard readable stream](https://streams.spec.whatwg.org/#rs) in browsers.

If typeof *shp* or *dbf* is “string”, in Node, the files are read from the [file system](https://nodejs.org/api/fs.html); in browsers, the files are read using [streaming](https://www.chromestatus.com/feature/5804334163951616) [fetch](https://fetch.spec.whatwg.org/), if available, and falling back to [XMLHttpRequest](https://xhr.spec.whatwg.org/). See [path-source](https://github.com/mbostock/path-source) for more.

The follwing options are supported:

* `encoding` - the dBASE character encoding; defaults to “windows-1252”
* `highWaterMark` - in Node, the size of the stream’s internal buffer; defaults to 65536

<a name="openShp" href="#openShp">#</a> shapefile.<b>openShp</b>(<i>shp</i>[, <i>options</i>]) [<>](https://github.com/mbostock/shapefile/blob/master/index.js#L33 "Source")

Returns a promise that yields a GeoJSON geometry [*source*](#sources). Unlike [shapefile.open](#open), this only reads the shapefile, and never the associated dBASE file. Subsequent calls to [*source*.read](#source_read) will yield GeoJSON geometries.

If typeof *shp* is “string”, opens the shapefile at the specified *shp* path. If *shp* does not have a “.shp” extension, it is implicitly added. In Node, the files are read from the [file system](https://nodejs.org/api/fs.html); in browsers, the files are read using [streaming](https://www.chromestatus.com/feature/5804334163951616) [fetch](https://fetch.spec.whatwg.org/), if available, and falling back to [XMLHttpRequest](https://xhr.spec.whatwg.org/). (See [path-source](https://github.com/mbostock/path-source) for more.) If *shp* instanceof ArrayBuffer or *shp* instanceof Uint8Array, reads the specified in-memory shapefile. Otherwise, *shp* must be a [Node readable stream](https://nodejs.org/api/stream.html#stream_readable_streams) in Node or a [WhatWG standard readable stream](https://streams.spec.whatwg.org/#rs) in browsers.

The follwing options are supported:

* `highWaterMark` - in Node, the size of the stream’s internal buffer; defaults to 65536

<a name="openDbf" href="#openDbf">#</a> shapefile.<b>openDbf</b>(<i>dbf</i>[, <i>options</i>]) [<>](https://github.com/mbostock/shapefile/blob/master/index.js#L45 "Source")

Returns a promise that yields a GeoJSON properties object [*source*](#sources). Unlike [shapefile.open](#open), this only reads the dBASE file, and never the associated shapefile. Subsequent calls to [*source*.read](#source_read) will yield GeoJSON properties objects.

If typeof *dbf* is “string”, opens the dBASE at the specified *dbf* path. If *dbf* does not have a “.dbf” extension, it is implicitly added. In Node, the files are read from the [file system](https://nodejs.org/api/fs.html); in browsers, the files are read using [streaming](https://www.chromestatus.com/feature/5804334163951616) [fetch](https://fetch.spec.whatwg.org/), if available, and falling back to [XMLHttpRequest](https://xhr.spec.whatwg.org/). (See [path-source](https://github.com/mbostock/path-source) for more.) If *dbf* instanceof ArrayBuffer or *dbf* instanceof Uint8Array, reads the specified in-memory shapefile. Otherwise, *dbf* must be a [Node readable stream](https://nodejs.org/api/stream.html#stream_readable_streams) in Node or a [WhatWG standard readable stream](https://streams.spec.whatwg.org/#rs) in browsers.

The follwing options are supported:

* `encoding` - the dBASE character encoding; defaults to “windows-1252”
* `highWaterMark` - in Node, the size of the stream’s internal buffer; defaults to 65536

### Sources

Calling [shapefile.open](#open) yields a *source*; you can then call [*source*.read](#source_read) to read individual GeoJSON features. Similarly, [shapefile.openShp](#openShp) yields a *source* of GeoJSON geometries, and [shapefile.openDbf](#openDbf) yields of a *source* of GeoJSON properties objects.

<a name="source_bbox" href="#source_bbox">#</a> <i>source</i>.<b>bbox</b>

The shapefile’s bounding box [*xmin*, *ymin*, *xmax*, *ymax*], where *x* and *y* represent longitude and latitude in spherical coordinates. This field is only defined on sources returned by [shapefile.open](#open) and [shapefile.openShp](#openShp), not [shapefile.openDbf](#openDbf).

<a name="source_read" href="#source_read">#</a> <i>source</i>.<b>read</b>() [<>](https://github.com/mbostock/shapefile/blob/master/shapefile/read.js "Source")

Returns a Promise for the next record from the underlying stream. The yielded result is an object with the following properties:

* `value` - a JSON object, or undefined if the stream ended
* `done` - a boolean which is true if the stream ended

The type of JSON object depends on the type of *source*: it may be either a [GeoJSON feature](http://geojson.org/geojson-spec.html#feature-objects), a [GeoJSON geometry](http://geojson.org/geojson-spec.html#geometry-objects), or a GeoJSON properties object (any JSON object).

<a name="source_cancel" href="#source_cancel">#</a> <i>source</i>.<b>cancel</b>() [<>](https://github.com/mbostock/shapefile/blob/master/shapefile/cancel.js "Source")

Returns a Promise which is resolved when the underlying stream has been destroyed.

## Command Line Reference

### shp2json

<a name="shp2json" href="#shp2json">#</a> <b>shp2json</b> [<i>options…</i>] [<i>file</i>] [<>](https://github.com/mbostock/shapefile/blob/master/bin/shp2json "Source")

Converts the specified shapefile *file* to GeoJSON. If *file* is not specified, defaults to reading from stdin (with no dBASE file). For example, to convert to a feature collection:

```
shp2json example.shp
```

To convert to a geometry collection:

```
shp2json -g example.shp
```

To convert to newline-delimited features:

```
shp2json -n example.shp
```

To convert to newline-delimited geometries:

```
shp2json -ng example.shp
```

When [--geometry](#shp2json_geometry) or [--ignore-properties](#shp2json_ignore_properties) is not used, the shapefile is joined to the dBASE table file (.dbf) file corresonding to the specified shapefile *file*, if any.

<a name="shp2json_help" href="#shp2json_help">#</a> shp2json <b>-h</b>
<br><a href="#shp2json_help">#</a> shp2json <b>--help</b>

Output usage information.

<a name="shp2json_version" href="#shp2json_version">#</a> shp2json <b>-V</b>
<br><a href="#shp2json_version">#</a> shp2json <b>--version</b>

Output the version number.

<a name="shp2json_out" href="#shp2json_out">#</a> shp2json <b>-o</b> <i>file</i>
<br><a href="#shp2json_out">#</a> shp2json <b>--out</b> <i>file</i>

Specify the output file name. Defaults to “-” for stdout.

<a name="shp2json_newline_delimited" href="#shp2json_newline_delimited">#</a> shp2json <b>-n</b>
<br><a href="#shp2json_newline_delimited">#</a> shp2json <b>--newline-delimited</b>

Output [newline-delimited JSON](http://ndjson.org/), with one feature or [geometry](#shp2json_geometry) per line.

<a name="shp2json_geometry" href="#shp2json_geometry">#</a> shp2json <b>-g</b>
<br><a href="#shp2json_geometry">#</a> shp2json <b>--geometry</b>

Output a [geometry collection](http://geojson.org/geojson-spec.html#geometrycollection) instead of a [feature collection](http://geojson.org/geojson-spec.html#feature-collection-objects) or, in conjuction with [--newline-delimited](#shp2json_newline_delimited), [geometries](http://geojson.org/geojson-spec.html#geometry-objects) instead of [feature objects](http://geojson.org/geojson-spec.html#feature-objects). Implies [--ignore-properties](#shp2json_ignore_properties).

<a name="shp2json_ignore_properties" href="#shp2json_ignore_properties">#</a> shp2json <b>--ignore-properties</b>

Ignore the corresponding dBASE table file (.dbf), if any. Output features will have an empty properties object.

<a name="shp2json_encoding" href="#shp2json_encoding">#</a> shp2json <b>--encoding</b> <i>encoding</i>

Specify the dBASE table file character encoding. Defaults to “windows-1252”.

<a name="shp2json_crs_name" href="#shp2json_crs_name">#</a> shp2json <b>--crs-name</b> <i>name</i>

Specify the [coordinate reference system name](http://geojson.org/geojson-spec.html#named-crs). This only applies when generating a feature collection; it is ignored when [-n](#shp2json_newline_delimited) or [-g](#shp2json_geometry) is used. Per the GeoJSON specification, the name should be an OGC CRS URN such as `urn:ogc:def:crs:OGC:1.3:CRS84`. However, legacy identifiers such as `EPSG:4326` may also be used.

This does not convert between coordinate reference systems! It merely outputs coordinate reference system metadata. This library does not support parsing coordinate reference system specifications (.prj).

### dbf2json

<a name="dbf2json" href="#dbf2json">#</a> <b>dbf2json</b> [<i>options…</i>] [<i>file</i>] [<>](https://github.com/mbostock/shapefile/blob/master/bin/dbf2json "Source")

Converts the specified dBASE *file* to JSON. If *file* is not specified, defaults to reading from stdin. For example:

```
dbf2json example.dbf
```

To convert to newline-delimited objects:

```
dbf2json -n example.dbf
```

<a name="dbf2json_help" href="#dbf2json_help">#</a> dbf2json <b>-h</b>
<br><a href="#dbf2json_help">#</a> dbf2json <b>--help</b>

Output usage information.

<a name="dbf2json_version" href="#dbf2json_version">#</a> dbf2json <b>-V</b>
<br><a href="#dbf2json_version">#</a> dbf2json <b>--version</b>

Output the version number.

<a name="dbf2json_out" href="#dbf2json_out">#</a> dbf2json <b>-o</b> <i>file</i>
<br><a href="#dbf2json_out">#</a> dbf2json <b>--out</b> <i>file</i>

Specify the output file name. Defaults to “-” for stdout.

<a name="dbf2json_newline_delimited" href="#dbf2json_newline_delimited">#</a> dbf2json <b>-n</b>
<br><a href="#dbf2json_newline_delimited">#</a> dbf2json <b>--newline-delimited</b>

Output [newline-delimited JSON](http://ndjson.org/), with one object per line.

<a name="dbf2json_encoding" href="#dbf2json_encoding">#</a> dbf2json <b>--encoding</b> <i>encoding</i>

Specify the input character encoding. Defaults to “windows-1252”.

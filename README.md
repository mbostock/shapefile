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
<script src="https://unpkg.com/shapefile@0.5"></script>
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

This parser implementation is based on the [ESRI Shapefile Technical Description](http://www.esri.com/library/whitepapers/pdfs/shapefile.pdf) and [dBASE Table File Format](http://www.digitalpreservation.gov/formats/fdd/fdd000325.shtml). Caveat emptor: this is a work in progress and does not currently support all shapefile geometry types. It only supports dBASE III and has little error checking. Please contribute if you want to help!

## API Reference

<a name="open" href="#open">#</a> shapefile.<b>open</b>(<i>shp</i>[, <i>dbf</i>[, <i>options</i>]]) [<>](https://github.com/mbostock/shapefile/blob/master/index.js#L6 "Source")

Returns a promise that yields an open shapefile *source*.

If typeof *shp* is “string”, opens the shapefile at the specified *shp* path. If *shp* does not have a “.shp” extension, it is implicitly added. If *shp* instanceof ArrayBuffer or *shp* instanceof Uint8Array, reads the specified in-memory shapefile. Otherwise, *shp* must be a [Node readable stream](https://nodejs.org/api/stream.html#stream_readable_streams) in Node or a [WhatWG standard readable stream](https://streams.spec.whatwg.org/#rs) in browsers.

If typeof *dbf* is “string”, opens the dBASE file at the specified *dbf* path. If *dbf* does not have a “.dbf” extension, it is implicitly added. If *dbf* instanceof ArrayBuffer or *dbf* instanceof Uint8Array, reads the specified in-memory dBASE file. If *dbf* is undefined and *shp* is a string, then *dbf* defaults to *shp* with the “.shp” extension replaced with “.dbf”; in this case, no error is thrown if there is no dBASE file at the resulting implied *dbf*. If *dbf* is undefined and *shp* is not a string, or if *dbf* is null, then no dBASE file is read, and the resulting GeoJSON features will have empty properties. Otherwise, *dbf* must be a [Node readable stream](https://nodejs.org/api/stream.html#stream_readable_streams) in Node or a [WhatWG standard readable stream](https://streams.spec.whatwg.org/#rs) in browsers.

If typeof *shp* or *dbf* is “string”, in Node, the files are read from the [file system](https://nodejs.org/api/fs.html); in browsers, the files are read using [streaming](https://www.chromestatus.com/feature/5804334163951616) [fetch](https://fetch.spec.whatwg.org/), if available, and falling back to [XMLHttpRequest](https://xhr.spec.whatwg.org/).

The follwing options are supported:

* `encoding` - the dBASE character encoding; defaults to “windows-1252”
* `highWaterMark` - in Node, the size of the stream’s internal buffer; defaults to 65536

<a name="read" href="#read">#</a> shapefile.<b>read</b>(<i>shp</i>[, <i>dbf</i>[, <i>options</i>]]) [<>](https://github.com/mbostock/shapefile/blob/master/index.js#L31 "Source")

Returns a promise that yields a [GeoJSON feature collection](http://geojson.org/geojson-spec.html#feature-collection-objects) for specified shapefile *shp* and dBASE table file *dbf*. The meaning of the arguments is the same as [shapefile.open](#open). This is a convenience API for reading an entire shapefile in one go; use this method if you don’t mind putting the whole shapefile in memory. The yielded *collection* has a bbox property representing the bounding box of all records in this shapefile. The bounding box is specified as [*xmin*, *ymin*, *xmax*, *ymax*], where *x* and *y* represent longitude and latitude in spherical coordinates.

<a name="source_bbox" href="#source_bbox">#</a> <i>source</i>.<b>bbox</b>

The shapefile’s bounding box [*xmin*, *ymin*, *xmax*, *ymax*], where *x* and *y* represent longitude and latitude in spherical coordinates.

<a name="source_read" href="#source_read">#</a> <i>source</i>.<b>read</b>() [<>](https://github.com/mbostock/shapefile/blob/master/shapefile/read.js "Source")

Returns a Promise for the next record from the underlying stream. The yielded result is an object with the following properties:

* `value` - a [GeoJSON feature](http://geojson.org/geojson-spec.html#feature-objects), or undefined if the stream ended
* `done` - a boolean which is true if the stream ended

<a name="source_cancel" href="#source_cancel">#</a> <i>source</i>.<b>cancel</b>() [<>](https://github.com/mbostock/shapefile/blob/master/shapefile/cancel.js "Source")

Returns a Promise which is resolved when the underlying stream has been destroyed.

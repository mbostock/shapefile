# Streaming Shapefile Parser

Based on the [ESRI Shapefile Technical Description](http://www.esri.com/library/whitepapers/pdfs/shapefile.pdf) and [dBASE Table File Format](http://www.digitalpreservation.gov/formats/fdd/fdd000325.shtml). Caveat emptor: this library is a work in progress and does not currently support all shapefile geometry types. It also only supports dBASE III and has no error checking. Please contribute if you want to help!

## API Reference

<a name="read" href="#read">#</a> shapefile.<b>read</b>(<i>path</i>[, <i>options</i>])

Returns a promise that yields a [GeoJSON feature collection](http://geojson.org/geojson-spec.html#feature-collection-objects) for the shapefile at the given *path*. The *path* should include the extension “.shp”. The supported options are:

* `encoding` - the DBF character encoding (defaults to ISO-8859-1)
* `ignoreProperties` - if true, don’t read properties (faster; defaults to false)

The yielded *collection* has a `bbox` property containing representing the bounding box of all records in this shapefile. The bounding box is specified as [xmin, ymin, xmax, ymax], where *x* and *y* represent longitude and latitude in spherical coordinates.

This is a convenience API for reading an entire shapefile in one go; use this method if you don’t mind putting the whole shapefile in memory, or use <a href="#open">shapefile.open</a> to process records individually.

<a name="source" href="#source">#</a> shapefile.<b>source</b>(<i>options</i>)

Returns a new shapefile source. For example:

```js
var hello = shapefile.source();
```

The source is initially closed; use [shapefile.open](#open) or [*source*.open](#source_open) to open a shapefile. The supported options:

* `size` - the internal buffer size, akin to Node’s `highWaterMark`
* `encoding` - the DBF character encoding (defaults to ISO-8859-1)
* `ignoreProperties` - if true, don’t read properties (faster; defaults to false)

<a name="open" href="#open">#</a> shapefile.<b>open</b>(<i>path</i>)

Returns a promise that yields an open shapefile source for the specified *path* and optional *options*. A convenience method equivalent to:

```js
shapefile.source(options).open(path)
```

For example:

```js
shapefile.open("hello.shp")
  .then((hello) => hello.close())
  .catch((error) => console.error(error.stack));
```

<a name="source_open" href="#source_open">#</a> <i>source</i>.<b>open</b>(<i>path</i>)

Returns a promise that yields an open shapefile source for the specified *path*, positioned at the start of the shapefile. For example:

```js
var hello = shapefile.source();

hello.open("hello.shp")
  .then(() => hello.close())
  .catch((error) => console.error(error.stack));
```

Yields an error if this source is not closed or if there was an error opening the underlying shapefile. In this case, this source is still considered closed, and you can use this source to open another shapefile if desired.

After opening, you can call [*source*.close](#source_close) to close the shapefile. After closing, you can re-open a source with the same or different path, if desired. If this source was created using [shapefile.open](#open), the yielded source is already open, and you don’t need to call this method.

<a name="source_header" href="#source_header">#</a> <i>source</i>.<b>header</b>()

…

<a name="source_record" href="#source_record">#</a> <i>source</i>.<b>record</b>()

…

<a name="source_close" href="#source_close">#</a> <i>source</i>.<b>close</b>()

Returns a promise that yields a closed shapefile source.

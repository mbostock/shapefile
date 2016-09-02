# Streaming Shapefile Parser

Based on the [ESRI Shapefile Technical Description](http://www.esri.com/library/whitepapers/pdfs/shapefile.pdf) and [dBASE Table File Format](http://www.digitalpreservation.gov/formats/fdd/fdd000325.shtml).

Caveat emptor: this library is a work in progress and does not currently support all shapefile geometry types. It also only supports dBASE III and has no error checking. Please contribute if you want to help!

To load:

```js
var shapefile = require("shapefile");
```

## API Reference

<a name="read" href="#read">#</a> <i>shapefile</i>.<b>read</b>(<i>path</i>[, <i>options</i>])

Returns a promise that yields a [GeoJSON feature collection](http://geojson.org/geojson-spec.html#feature-collection-objects) for the shapefile at the given *path*. The *path* should be of the form `path/to/file.shp`; the corresponding DBF file, if any, should be `path/to/file.dbf`. The supported options are:

* *encoding* - the DBF character encoding (defaults to ISO-8859-1)
* *ignore-properties* - if true, don’t read properties (faster; defaults to false)

The yielded *collection* has a `bbox` property containing representing the bounding box of all records in this shapefile. The bounding box is specified as [xmin, ymin, xmax, ymax], where *x* and *y* represent longitude and latitude in spherical coordinates.

This is a convenience API for reading an entire shapefile in one go; use this method if you don’t mind putting the whole shapefile in memory, or use <a href="#open"><i>shapefile</i>.open</a> to process records individually.

<a name="source" href="#source">#</a> <i>shapefile</i>.<b>source</b>(<i>options</i>)

…

<a name="open" href="#open">#</a> <i>shapefile</i>.<b>open</b>(<i>path</i>)

…

### Shapefiles (.shp)

Based on the [ESRI Shapefile Technical Description](http://www.esri.com/library/whitepapers/pdfs/shapefile.pdf).

<a name="_shp_source" href="#_shp_source">#</a> <i>shapefile</i>.shp.<b>source</b>(<i>options</i>)

…

<a name="_shp_open" href="#_shp_open">#</a> <i>shapefile</i>.shp.<b>open</b>(<i>path</i>[, <i>options</i>])

…

<a name="shp_open" href="#shp_open">#</a> <i>shp</i>.<b>open</b>(<i>path</i>)

…

<a name="shp_header" href="#shp_header">#</a> <i>shp</i>.<b>header</b>()

…

<a name="shp_record" href="#shp_record">#</a> <i>shp</i>.<b>record</b>()

…

<a name="shp_close" href="#shp_close">#</a> <i>shp</i>.<b>close</b>()

…

### dBASE Table Files (.dbf)

Based on the [dBASE Table File Format](http://www.digitalpreservation.gov/formats/fdd/fdd000325.shtml).

<a name="_dbf_source" href="#_dbf_source">#</a> <i>shapefile</i>.dbf.<b>source</b>(<i>options</i>)

…

<a name="_dbf_open" href="#_dbf_open">#</a> <i>shapefile</i>.dbf.<b>open</b>(<i>path</i>[, <i>options</i>])

…

<a name="dbf_open" href="#dbf_open">#</a> <i>dbf</i>.<b>open</b>(<i>path</i>)

…

<a name="dbf_header" href="#dbf_header">#</a> <i>dbf</i>.<b>header</b>()

…

<a name="dbf_record" href="#dbf_record">#</a> <i>dbf</i>.<b>record</b>()

…

<a name="dbf_close" href="#dbf_close">#</a> <i>dbf</i>.<b>close</b>()

…

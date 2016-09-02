# Streaming Shapefile Parser

Based on the [ESRI Shapefile Technical Description](http://www.esri.com/library/whitepapers/pdfs/shapefile.pdf) and [dBASE Table File Format](http://www.digitalpreservation.gov/formats/fdd/fdd000325.shtml). Caveat emptor: this library is a work in progress and does not currently support all shapefile geometry types. It also only supports dBASE III and has no error checking. Please contribute if you want to help!

## API Reference

<a name="read" href="#read">#</a> shapefile.<b>read</b>(<i>path</i>[, <i>options</i>])

Returns a promise that yields a [GeoJSON feature collection](http://geojson.org/geojson-spec.html#feature-collection-objects) for the shapefile at the given *path*. The *path* should include the extension “.shp”. The supported options are:

* *encoding* - the DBF character encoding (defaults to ISO-8859-1)
* *ignore-properties* - if true, don’t read properties (faster; defaults to false)

The yielded *collection* has a `bbox` property containing representing the bounding box of all records in this shapefile. The bounding box is specified as [xmin, ymin, xmax, ymax], where *x* and *y* represent longitude and latitude in spherical coordinates.

This is a convenience API for reading an entire shapefile in one go; use this method if you don’t mind putting the whole shapefile in memory, or use <a href="#open">shapefile.open</a> to process records individually.

<a name="source" href="#source">#</a> shapefile.<b>source</b>(<i>options</i>)

…

<a name="open" href="#open">#</a> shapefile.<b>open</b>(<i>path</i>)

…

<a name="source_open" href="#source_open">#</a> <i>source</i>.<b>open</b>(<i>path</i>)

…

<a name="source_header" href="#source_header">#</a> <i>source</i>.<b>header</b>()

…

<a name="source_record" href="#source_record">#</a> <i>source</i>.<b>record</b>()

…

<a name="source_close" href="#source_close">#</a> <i>source</i>.<b>close</b>()

…

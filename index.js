var fs = require("fs"),
    shp = require("./shp"),
    dbf = require("./dbf");

exports.version = require("./package.json").version;

exports.read = function(filename, encoding, sink) {
  if (/\.shp$/.test(filename)) filename = filename.substring(0, filename.length - 4);

  var dbfDepth = 0,
      shpDepth = 0;

  var dbfSink = {
    geometryStart: function() { if (++dbfDepth === 2) sink.geometryStart(); },
    geometryEnd: function() { if (--dbfDepth === 0) sink.geometryEnd(); else dbfSink.pause(), shpSink.resume(); },
    property: function(name, value) { sink.property(name, value); }
  };

  var shpSink = {
    geometryStart: function() { if (++shpDepth === 1) sink.geometryStart(), shpSink.pause(), dbfSink.resume(); },
    geometryEnd: function() { if (--shpDepth === 1) sink.geometryEnd(), shpSink.pause(), dbfSink.resume(); },
    bbox: function(x0, x1, y0, y1) { sink.bbox(x0, x1, y0, y1); },
    polygonStart: function() { sink.polygonStart(); },
    polygonEnd: function() { sink.polygonEnd(); },
    lineStart: function() { sink.lineStart(); },
    lineEnd: function() { sink.lineEnd(); },
    point: function(x, y) { sink.point(x, y); }
  };

  dbf.read(fs.createReadStream(filename + ".dbf"), encoding, dbfSink);
  shp.read(fs.createReadStream(filename + ".shp"), shpSink);
};

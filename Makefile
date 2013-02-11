# ogr2ogr doesn’t support logical (L) or date (D) properties (apparently),
# so boolean-property and date-property were made by hand in a hex editor.

TESTS = \
	empty \
	mixed-properties \
	multipoints \
	null \
	number-property \
	points \
	polygons \
	polylines \
	string-property \
	unicode-property

TEST_FILES = \
	$(addprefix test/,$(addsuffix .shp,$(TESTS))) \
	$(addprefix test/,$(addsuffix .dbf,$(TESTS)))

all: node_modules $(TEST_FILES)

node_modules:
	npm install

test/%.shp test/%.dbf: test/%.json
	rm -f $@ && ogr2ogr -f 'ESRI Shapefile' $@ $<

test/unicode-property.shp test/unicode-property.dbf: test/unicode-property.json
	rm -f $@ && ogr2ogr -lco ENCODING=UTF-8 -f 'ESRI Shapefile' $@ $<

test: all
	./node_modules/vows/bin/vows
	@echo

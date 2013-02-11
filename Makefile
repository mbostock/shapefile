TEST_FILES =  \
	test/unicode-property.shp \
	test/unicode-property.dbf

all: node_modules $(TEST_FILES)

node_modules:
	npm install

test/unicode-property.shp test/unicode-property.dbf: test/unicode-property.json
	rm -f test/unicode-property.shp && ogr2ogr -lco ENCODING=UTF-8 -f 'ESRI Shapefile' test/unicode-property.shp test/unicode-property.json

test: all
	./node_modules/vows/bin/vows
	@echo

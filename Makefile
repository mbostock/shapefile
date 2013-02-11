all: node_modules

node_modules:
	npm install

test: all
	./node_modules/vows/bin/vows
	@echo

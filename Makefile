install:
	npm ci

develop:
	npx webpack serve

build:
	rm -rf dist
	npx webpack --mode production

lint:
	npx eslint .

.PHONY: test

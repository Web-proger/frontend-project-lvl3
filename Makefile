install:
	npm ci

develop:
	npx webpack serve

test:
	npm test

build:
	rm -rf dist
	NODE_ENV=production npx webpack

lint:
	npx eslint .

.PHONY: test

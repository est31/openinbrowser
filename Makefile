NAME := openinbrowser
VERSION := $(shell grep '"version":' manifest.json|sed 's@.*version.*:\s*"\([^"]*\)".*@\1@')
TARGET_XPI = $(NAME)-$(VERSION).xpi

xpi:
	git archive --format zip -o $(TARGET_XPI) HEAD -- .

npm-refresh:
	npm install browserify
	npm install
	npm run build

all: xpi npm-refresh

.PHONY: xpi all

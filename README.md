Open in Browser
===============

Open in Browser is a Firefox extension that allows you to open documents directly in the browser.

# DEPRECATION NOTICE

This repository contains a rewrite of the original XUL based extension as a WebExtension.
It was intended to be published as a newer version of that original extension,
but there is a better implementation now which is living at https://github.com/Rob--W/open-in-browser. It provides the web extension based future/present of the add on.

This rewrite is deprecated.

## Installation

You can install the extension from its [addons.mozilla.org page](https://addons.mozilla.org/En-us/firefox/addon/open-in-browser/).

## Configuration

There is no way to configure the Add-on yet.

## Limitations and Issues

* It does not work for protocols other that HTTP because of a technical limitation.
* Automatic opening in browser is not implemented.
* You can't customize things yet.
* It creates its own UI instead of extending the existing UI.

## Building the extension

You need a Unix shell with `make` and `git` in your PATH. Cygwin works well on Windows.

Go in the root of the sources and run:

    make xpi

This will generate a `openinbrowser-VERSION.xpi` archive in the current directory.

If you want to modify the sources, first commit your changes in git and then run the above `make` command again.
You can use `git commit --amend` to update the last commit. 

## Testing

A few manual tests are available in the tests directory.

For the HTTP protocol tests, you should serve the tests directory with a Web server that interprets PHP scripts.
If you have Docker, you can use the following command:

    cd openinbrowser/tests/
    docker run -it -p 8080:80 -v "$PWD":/var/www/html php:5.6-apache

which will run a Web server on port 8080. You can then access the tests using http://localhost:8080/tests.html and
follow the instructions.

For the file protocol test, open the tests/tests.html file from the file system (for instance. file:///C:/openinbrowser/tests/tests.html) and follow the instructions.

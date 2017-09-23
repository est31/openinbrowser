/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is the Open in Browser extension.
 *
 * The Initial Developer of the Original Code is
 * Sylvain Pasche <sylvain.pasche@gmail.com>.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 * est31
 *
 * ***** END LICENSE BLOCK ***** */

var dispositionPage = browser.extension.getURL("dispatch.html");

var urlActions = {};

// https://dxr.mozilla.org/mozilla-central/source/netwerk/mime/nsMimeTypes.h
var textBlacklist = [
	"text/enriched",
	"text/calendar",
	"text/html",
	"text/mdl",
	"text/plain",
	"text/richtext",
	"text/vcard",
	"text/css",
	"text/jsss",
	"text/json",
	"text/xml",
	"text/rdf",
	"text/vtt",
	"text/ecmascript",
	"text/javascript",
	"text/xsl",
	"text/event-stream",
	"text/cache-manifest"
];

function isUnknownMime(mime) {
	var token = /[\w\d!#\$%&'\*\+\-\.\^`|\~]+/;
	var r = new RegExp("(" + token.source + "/" + token.source + ")*(\s*;\s*[^;]+)*");
	var typeSubtype = r.exec(mime)[1];
	//console.log("MIME: '" + typeSubtype + "'");
	if (typeSubtype.startsWith('text/') && (textBlacklist.indexOf(typeSubtype) === -1)) {
		return true;
	}
	if (typeSubtype.endsWith('/octet-stream')) {
		return true;
	}
	return false;
}

function headerRecv(responseDetails) {
	//console.log("Headers received for URL ", responseDetails);
	if (urlActions[responseDetails.url]) {
		var action = urlActions[responseDetails.url];
		delete urlActions[responseDetails.url];
		if (action.kind === "dialog") {
			console.log("Showing native dialog: " + responseDetails.url);
			return;
		} else if (action.kind === "open") {
			console.log("Opening in browser: " + responseDetails.url);

			var newHeaders = responseDetails.responseHeaders.filter(function(obj){
				return obj.name.toLowerCase() !== "content-disposition";
			});
			if (action.mime && (action.mime !== "server-sent-mime")) {
				newHeaders = newHeaders.map(function(obj){
					if (obj.name.toLowerCase() === "content-type") {
						obj.value = action.mime;
					}
					return obj;
				});
			}
			// Never cache so that the disposition dialog
			// gets shown again and again.
			// Turns out otherwise it would cache the modified
			// response...
			newHeaders = newHeaders.map(function(obj){
				if (obj.name.toLowerCase() === "cache-control") {
					obj.value = "no-cache, no-store, must-revalidate";
				}
				return obj;
			});
			//console.log(newHeaders);
			return {responseHeaders: newHeaders};
		}
	}
	// Determine whether the download dialog will be shown
	var filename = "";
	var mayDownload = responseDetails.responseHeaders.some(function(obj) {
		if (obj.name.toLowerCase() === "content-disposition" &&
				obj.value.startsWith("attachment")) {
			// https://stackoverflow.com/a/23054920
			var regexRes = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(obj.value);
			if (regexRes) {
				filename = regexRes[1];
			}
			return true;
		}
		return false;
	});
	var unknownMime = responseDetails.responseHeaders.some(function(obj) {
		return obj.name.toLowerCase() === "content-type" && isUnknownMime(obj.value);
	});

	if (!(mayDownload || unknownMime)) {
		return;
	}
	console.log("May show dialog for URL " + responseDetails.url);

	var mode = "cdisp";
	if (unknownMime) {
		mode = "mime";
	}
	var params = {
		url: responseDetails.url,
		filename: filename,
		mode: mode,
	};
	var url = dispositionPage + "#" + encodeURIComponent(JSON.stringify(params));

	browser.tabs.update(responseDetails.tabId, {url: url});

	// This hides the browser's content disposition dialog which would open
	// otherwise (racily??).
	var newHeaders = responseDetails.responseHeaders.filter(function(obj){
		return obj.name.toLowerCase() !== "content-disposition";
	});
	if (unknownMime) {
		newHeaders = newHeaders.map(function(obj){
			if (obj.name.toLowerCase() === "content-type") {
				// Just some MIME type that errors fast on "display"
				// (which won't happen)
				// but without showing an error
				obj.value = "image/png";
			}
			return obj;
		});
	}
	// Never cache so that the disposition dialog
	// gets shown again and again.
	// Turns out otherwise it would cache the modified
	// response...
	newHeaders = newHeaders.map(function(obj){
		if (obj.name.toLowerCase() === "cache-control") {
			obj.value = "no-cache, no-store, must-revalidate";
		}
		return obj;
	});
	return {responseHeaders: newHeaders};
}

browser.webRequest.onHeadersReceived.addListener(
	headerRecv,
	{
		urls: ["<all_urls>"],
		types: ["main_frame"]
	},
	["blocking", "responseHeaders"]
);

function handleDisposition(msg, tab) {
	console.log("Handling disposition message: ", msg);
	var tabId = tab.id;
	var createEntry = true;
	switch (msg.action.kind) {
		case "download":
			// Launch the download
			browser.downloads.download({url: msg.url});
			break;
		case "open":
			// Just re-send the request.
			if (msg.action.mime === "view-source") {
				createEntry = false;
				browser.tabs.update(tabId, {url: "view-source:" + msg.url});
			} else {
				browser.tabs.update(tabId, {url: msg.url});
			}
			break;
		case "dialog":
			// Just re-send the request.
			browser.tabs.update(tabId, {url: msg.url});
			break;
	}
	if (createEntry) {
		urlActions[msg.url] = msg.action;
	}
}

function handleMessage(data, sender, sendResponse) {
	if (sender.url.startsWith(dispositionPage)) {
		handleDisposition(data, sender.tab);
	}
}

browser.runtime.onMessage.addListener(handleMessage);

getChoices(function() {
	// Only include this into the background script
	choices.splice(0, 0, "server-sent-mime");

	for (i in choices) {
		browser.contextMenus.create({
			id: choices[i],
			title: browser.i18n.getMessage(choices[i]),
			contexts: ["link"],
		});
	}
	browser.contextMenus.onClicked.addListener((info, tab) => {
		var mime = info.menuItemId;
		var url = info.linkUrl;
		var msg = {url: url, action: { kind: "open", mime: mime }};
		handleDisposition(msg, tab);
	});
});

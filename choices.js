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

var choices = [
	"text/plain",
	"application/pdf",
	// Note:
	// For image mime types, it relies on the fact that Gecko will correctly
	// display an image even if the server sent it with a mime type that does not
	// match the real image type. For instance, a PNG image sent with
	// image/jpeg Content-Type will still be displayed properly.
	"image/png",
	"text/html",
	// Only supported in Firefox 57 onward.
	// Until we require Firefox 57 we check the browser version first.
	//"view-source",
	"application/json",
	"text/xml",
];

function maybeDisplayViewSource(browserInfo) {
	if (browserInfo.name !== "Firefox") {
		return;
	}
	var intMajor = parseInt(browserInfo.version.split(".")[0]);
	if (intMajor < 57) {
		return;
	}
	choices.splice(4, 0, "view-source");
}

function getChoices(after) {
	browser.runtime.getBrowserInfo().then(function(i) {
		maybeDisplayViewSource(i);
		after();
	});
}

window.getChoices = getChoices;

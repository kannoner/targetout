"use strict";

( function() {

	var thenode = document.querySelector("iframe:hover");
	if (!thenode || (!(window.location))) {
	window.console.log("_dvk_dbg_, node is not found.");
		return;	//	(self.options.html || "")
	}

	var thehash = thenode.getAttribute("id") || "";
		window.console.log(thehash);

	if (!(thehash.length)) {
		var seed = parseInt(Date.now());
// TODO: include permutation of prefix.
		thehash = "kannoner".concat(seed);
		if (document.getElementById(thehash)) {
			seed += parseInt(Math.random() * 11);
			thehash = "kannoner".concat(seed);
		}
		thenode.setAttribute("id", thehash);
	}

	var thestr = window.location.hash || "";
	window.console.log("click of PageMod, from: ", thestr, ", to: ", thehash);
	if (!(thestr.endsWith(thehash)))
		window.setTimeout( function(ahash) {
				window.location.hash = ahash
			}, 0, thehash );

	return;
 }) ();

"use strict";

 const LIB_ISBN = "targetout-toggle-btn"; // from main.js
 const EXCLUDE_TAGS = "iframe, script";
 const ERR_MSG1 = "There is no target in the location bar (#somesign) or it is not a <DIV> nor <TABLE> node.";
 const ERR_MSG2 = "Clone of target node is not ready or them content is not saved to storage.";
 const ERR_MSG3 = "Message is not sent from content of page to browser code.";

 var thebody = document.body;
if (thebody) (function() {

    function tagTest(anode) {

		if (anode === thebody) return null;

		var tagslist = self.options.tagslist || "table div p article";
			tagslist = tagslist.trim().replace(/\s+/g, " ").split(" ").
				map( function(atag) { return ":".concat(atag || "") } );

		if (tagslist.length) {
			if (tagslist[0].length > 1) tagslist.push(":body");
				else tagslist[0] = ":body";
		}
			else tagslist = [ ":body" ];

		var thestr = (anode.tagName || "?").toLowerCase();
        while ( tagslist.every( function(atag) {
                if (this.endsWith(atag)) return false;
                    else return true;
            }, ":".concat(thestr) ) ) {
			anode = anode.parentNode;
			if (anode === thebody) return null;
			thestr = (anode.tagName || "?").toLowerCase();
		}	//	ascending to fit container

		return anode;
    }	//	function tagTest(astr)

    function frameTest(astr) {
		if (!((astr || {}).length)) return false;
		return [ ":frame", ":FRAME", ":iframe", ":IFRAME" ].some(
			function(atag) { 
				return this.endsWith(atag)
			}, ":".concat(astr) );
	}	//	function frameTest(astr)

	var thenode = null, thehash = window.location.hash || "";
	if (thehash.length > 2) thehash = thehash.replace("#", "");
		else thehash = "";
	
    var selection = window.getSelection() || {};
	if (!(thehash.length) || (self.options.prior4sel))
	if (selection.rangeCount) {
	//	NOTE: does exist other common ?
        thenode = selection.getRangeAt(0).commonAncestorContainer;
        if (thenode === thebody) thenode = null;
        else {
            selection = selection.toString().trim();
            if (selection.length < 1) thenode = null;
        }
    }

	if (thenode) selection = true;
	else {
		selection = false;
		if (thehash.length) 
			thenode = document.getElementById(thehash);
	}

	var tagName = (thenode || {}).tagName || "";
	var theframe = frameTest(tagName);
	if (!theframe && thenode)
		thenode = tagTest(thenode);

//	dump("\n_dvk_dbg_, original node: "); dump(tagName); dump("\n");
	var thestr = "";
	if(!theframe)
	if (thenode) 
		try {
			var docum = document.documentElement.cloneNode(true);
			var newnode = thebody.cloneNode(false);
		//	NOTE: first-of-type body will be more accurate?
			var oldnode = docum.querySelector("body");
				oldnode.parentNode.replaceChild(newnode, oldnode);
				newnode.appendChild(thenode.cloneNode(true));
			thehash = thenode.getAttribute("id") || "";
			tagName = thenode.tagName || "";

            var thelst = [];
			if (self.options.frozenview)
                thelst = docum.querySelectorAll(EXCLUDE_TAGS);
            for (newnode of thelst)
                newnode.parentNode.removeChild(newnode);
//  NOTE: DEBUG
/*            window.setTimeout( function(anhtml) {
                    document.documentElement.innerHTML = anhtml
                }, 0, docum.innerHTML );    */
			window.sessionStorage.setItem( LIB_ISBN, docum.innerHTML );
		}
		catch(err) { thestr = ERR_MSG2 }
		else {
		//	last chance if document.activeElement is frame
			thenode = document.activeElement;
			tagName = (thenode || {}).tagName || "";
			if (frameTest(tagName)) theframe = true;
				else thestr = ERR_MSG1;
		}

	if (!thestr) try {

		var themsg = {
			"outerHeight": window.innerHeight,
			"outerWidth": window.innerWidth, 
			"innerHeight": window.innerHeight,
			"innerWidth": window.innerWidth
		}
		if (thenode.getBoundingClientRect) {
			var therect = thenode.getBoundingClientRect();
			if (therect.height) themsg.innerHeight = therect.height;
			if (therect.width) themsg.innerWidth = therect.width;
		}

		if (thehash.length)
			Object.defineProperty( themsg, "name", 
				{ "value": thehash, "enumerable": true } );

		if (tagName.length) {
            var className = (thenode.className || "").trim();
			if (className.length)
			if (!(thehash.length) || (className.length < 33)) {
				className = className.replace( new RegExp(' ', 'g'), '+' );
//		className = className.replace(' ', '+', 'g');
				tagName = [ tagName , className ].join('.');
			}
			Object.defineProperty( themsg, "tag", 
				{ "value": tagName, "enumerable": true } );
		}

		if (theframe) {
			Object.defineProperty( themsg, "frame", 
				{ "value": true, "enumerable": true } );
			if (self.options.prior4sel)
				Object.defineProperty( themsg, "sel", 
					{ "value": true, "enumerable": true } );
		}
		else
			if ((self.options.prior4sel) && selection)
				Object.defineProperty( themsg, "sel", 
					{ "value": true, "enumerable": true } );

		self.postMessage(themsg);
	}
		catch(err) { thestr = ERR_MSG3 }

	if (thestr) window.setTimeout( 
		function() { alert(thestr) }, 0 );

}) ();

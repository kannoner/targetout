var thebody = document.body;
if (document.loadOverlay) thebody = null;
//  dump("\n_dvk_dbg_, pageMod.PageMod are loaded: "); dump("\n");

function handleEvent(eva) {

    function testHash(astr) {
 const PREFIX = [ "OpenLayers_Control_", "OpenLayers_Map_" ];
        if (astr.length < 2) return true;
        return PREFIX.some( function(aprefix) {
            return astr.startsWith(aprefix);
        }, astr );
    }

	var target = eva.target || thebody;
	if (target === thebody) return;

// window.console.log("_dvk_dbg_, target.tagName: ", (target.tagName || ""));
//	if (!(window === window.top)) {  reverse to window.top (tab)
//		self.postMessage(document.documentURI);

//	FUTURE: place rules for targeting only map and videio.    
	var thehash = target.getAttribute("id") || "";
	var tagName = ":".concat((target.tagName || "").toLowerCase());
	if ((":p".endsWith(tagName)) || (":table".endsWith(tagName))) thehash = "";
	else
		while (!(":div".endsWith(tagName)) || (testHash(thehash))) {
			thehash = "";	// avoid paragraph and table
			if ((":p".endsWith(tagName)) || (":table".endsWith(tagName)))
				break;
			target = target.parentNode;
			if (target === thebody) break;
			thehash = target.getAttribute("id") || "";
			tagName = ":".concat((target.tagName || "").toLowerCase());
		}

	if (!(document.location)) return;

	var thestr = "#".concat(document.location.hash || "");
        thehash = "#".concat(thehash);
//	window.console.log("click of PageMod, from: ", thestr, ", to: ", thehash);
	if (thestr.endsWith(thehash)) return;
		self.postMessage(thehash);
	return;
}

if (thebody) (function() {
//	Content scripts receive a detach message when 
//		the add-on that attached them is disabled or removed: 
    self.port.on( "detach", function() {
	dump("_dvk_dbg_, detach event of content script.\n");
        thebody.removeEventListener("click", handleEvent, true);
        thebody.removeEventListener("contextmenu", handleEvent, true);
    } );

    thebody.addEventListener("click", handleEvent, true);
    thebody.addEventListener("contextmenu", handleEvent, true);

}) ();

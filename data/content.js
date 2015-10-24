var thebody = document.body,
    tagslist = [ ":body" ];
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

    function getAanagram(astr) {
        astr = (astr || "").concat("?");
        var index, i, sequence = astr.split("");
        var len = Math.abs(sequence.length - 1);
        for (i = 1; i < len; ++i) {
            index = parseInt(Math.random() * len);
            [ sequence[i], sequence[index] ] = 
                [ sequence[index], sequence[i] ];
        }
        return sequence.join("").replace("?", "");
    };
    
//  if frame or fake then abort
    function frameTest(astr) {
 const FRAMES_LIST = [ ":frame", ":FRAME", ":iframe", ":IFRAME" ];
		if ((astr || {}).length) astr = ":".concat(astr);
            else return true;
        for (var thetag of FRAMES_LIST)
            if (astr.endsWith(thetag))
                return true;
        return false;
	}	//	function frameTest(astr)
    
    function tagTest(anode) {
    //  NOTE: original from acvetab.js
		var thestr = anode.tagName || "";
        if (frameTest(thestr)) return null;
        while ( tagslist.every( function(atag) {
                if (this.endsWith(atag)) return false;
                    else return true; // every proc
            }, ":".concat(thestr).toLowerCase() ) ) {
			anode = anode.parentNode;
            if (!anode) return null;
			if (anode === thebody) return null;
			thestr = (anode.tagName || "?");
		}	//	ascending to fit container
        thestr = anode.getAttribute("id") || "";
        if (thestr.length) return anode;
        if (anode.parentNode === thebody) return anode;
        return anode.parentNode;
    }	//	function tagTest(astr)

    const SEED = "kannoner";
	var target = eva.target || thebody;
	if (target === thebody) return;

 dump("\n_dvk_dbg_, target.tagName: "); dump(target.tagName); dump("\n");
// window.console.log("_dvk_dbg_, target.tagName: ", (target.tagName || ""));
//	if (!(window === window.top)) {  reverse to window.top (tab)
	var thehash = target.getAttribute("id") || "";
    var thenode = tagTest(target);
    if (!thenode) return;
    thehash = thenode.getAttribute("id") || "";
    if (!thehash) {
        var thetag = ":".concat(thenode.tagName).toLowerCase();
    //  div of maps then jump to div.class or div#hash
        if (thetag.endsWith(":div"))
        while (!(thenode.hasAttribute("class"))) {
            if (thenode.parentNode === thebody) return;
            thenode = thenode.parentNode;
            thehash = thenode.getAttribute("id") || "";
            if (thehash.length) break;
        }

        if (!thehash) { //  NOTE: code is not covered.
            var thestr = Date.now().toString();
            thehash = [ SEED, thestr.substr(-7) ].join('_');
            if (document.getElementById(thehash))
                thehash = [ getAanagram(SEED),
                    getAanagram(thestr).substr(-7) ].join('_');
            thenode.setAttribute("id", thehash);
        }
    }
//    dump("_dvk_dbg_, hash: "); dump(thehash); dump("\n");
    self.postMessage(thehash);
	return;
}

if (thebody) (function() {
//  NOTE: original from acvetab.js
    tagslist = self.options.tagslist || "table div p article";
    tagslist = tagslist.trim().replace(/\s+/g, " ").split(" ").
        map( function(atag) { return ":".concat(atag || "") } );
    if (tagslist.length) {
        if (tagslist[0].length > 1) tagslist.push(":body");
            else tagslist[0] = ":body";
    }
        else tagslist = [ ":body" ];

//	Content scripts receive a detach message when 
//		the add-on that attached them is disabled or removed: 
    self.port.on( "detach", function() {
        thebody.removeEventListener("contextmenu", handleEvent, true);
    } );
    thebody.addEventListener("contextmenu", handleEvent, true);
}) ();

"use strict";

if ((window.Components || {}).utils) {
//	Components.utils.import("resource://gre/modules/Services.jsm");
//    if ((Services.ww.activeWindow || {}).content === window)
    self.postMessage({ "disabled": true });
//  below clearing subsystem of options page
    ( function() {
    const STL_SEL = "style.targetout-toggle-btn[type]";
    var thestr = "".concat(document.documentURI || "smb:");
    var thenode = document.querySelector(STL_SEL);
    if (thestr.startsWith("about:addons"))
    if (thenode.hasAttribute("dir")) {
        self.port.on( "detach", function() {
            var thenode = document.querySelector(STL_SEL);
            if (thenode) thenode.parentNode.removeChild(thenode);
 document.getElementById("detail-controls").removeAttribute("dir");
        } );
        thenode.removeAttribute("dir");
    }
    }) ();
}
    else self.postMessage({ "disabled": false });

"use strict";
//const HEXDIG = "1234567890ABCDEFabcdef";
const LIB_ISBN  = "targetout-toggle-btn"; // from main.js
const HTML_NS   = "http://www.w3.org/1999/xhtml";
const IFRAME_CHROME = "chrome://targetout/content/iframe.xul";
const SOME_TOKENS	= "dependent,resizable,menubar,dialog,non-private";
const WINDOW_TYPE	= "add-ons:targetout"; // iframe.xul
const BROWSER_TYPE	= 'navigator:browser';
const STYLE_PATH 	= "chrome://targetout/content/style.html";
const TRANSPARENT	= "chrome://targetout/skin/transparent.png";
const NEUTRAL_PNG	= "chrome://targetout/skin/image.png";
const EXCLUDE_TAGS  = "iframe, script";
const STL_SELECTOR	= [ "style.", "[type]" ].join(LIB_ISBN);
const COLLAPSED_BAR	= 'toolbar[collapsed="true"] toolbarbutton#';
const PANEL_SELECTOR= 'panel panelview toolbarbutton#';
const ERR_MSG       = "The content of the current page is not a well-formed document.";
const BRO_EVENTS = [ "TabSelect", "pageshow" ] // "aftercustomization", "toolbarvisibilitychange", 

var buttons = require('sdk/ui/button/action');
var pageMod = require("sdk/page-mod");
var data = require("sdk/self").data;
//	var self = require("sdk/self");
var preferences = require("sdk/simple-prefs");
var listBrowsers = require("sdk/windows").browserWindows;
const { getMostRecentBrowserWindow, windows } = require('sdk/window/utils');
const { getSelectedTab, getTabContentWindow } = require('sdk/tabs/utils');
const { viewFor } = require("sdk/view/core");

var counter = 1;
var thecfg = {
	contentScriptFile: data.url("acvetab.js"),
	contentScriptOptions: {},

	onMessage: function(acfg, awin) {

        function cfg2size(acfg) {
			const MINI_SIZE = [ 333, 222 ];
            var thesize = [ parseInt(acfg.outerWidth / 2), 
                        parseInt(acfg.outerHeight / 2) ];
            var thepair = [ parseInt(acfg.innerWidth || thesize[0]), 
                        parseInt(acfg.innerHeight || thesize[1]) ];
            if (thepair[0] < thesize[0]) 
				thesize[0] = (thepair[0] < MINI_SIZE[0]) ? 
								MINI_SIZE[0] : thepair[0];
            if (thepair[1] < thesize[1]) 
				thesize[1] = (thepair[1] < MINI_SIZE[1]) ? 
								MINI_SIZE[1] : thepair[1];
            return thesize;
        }	
//	console.log("content msg: ", acfg);
		let thename = [ LIB_ISBN, ++counter ].join("#"),
			coworker = this, thenode = null, thetag,
			parent = getMostRecentBrowserWindow();
		let thewin = awin || getTabContentWindow(getSelectedTab(parent));
    //  get content window of selected tab
		if (!(acfg.frame) && !(acfg.sel)) 
		try {
			thenode = thewin.document.activeElement;
			thetag = ((thenode || {}).tagName || "").toLowerCase();
			if (":".concat(thetag).endsWith(":iframe")) {
				var therect = thenode.getBoundingClientRect();
				acfg = { "frame": true, 
					"tag": thetag,
					"name": (thenode.getAttribute("id") || ""),
					"outerHeight":	acfg.outerHeight,
					"outerWidth":	acfg.outerWidth,
					"innerHeight":	therect.height || acfg["innerHeight"],
					"innerWidth":	therect.width || acfg["innerWidth"]
				}
			}
		}
			catch(err) { thenode = null }

		let domain = "", docum = (thewin || {}).document;
		if (docum) {

			if (acfg.frame) {

				if (!thenode) {
					if (acfg.name) thenode = docum.getElementById(acfg.name);
					if (!thenode) {
						thenode = docum.activeElement;
						acfg.name = thenode.getAttribute("id") || "";
					}
				}

				docum = thenode.contentDocument || thenode.ownerDocument;
				domain = docum.domain || docum.baseURI || "";
				if (domain.lastIndexOf(".") < 1) domain = "";
				docum = docum.documentElement.cloneNode(true);
				if (preferences.prefs["frozenview"])
                    for (thenode of docum.querySelectorAll(EXCLUDE_TAGS))
                        thenode.parentNode.removeChild(thenode);

				thewin.sessionStorage.setItem( LIB_ISBN, docum.innerHTML );
			}
		}
		else	//	fatal failure
			thewin.sessionStorage.removeItem(LIB_ISBN);

		if (acfg.name) {
            thename = [ LIB_ISBN, acfg.name ].join("#");
            thewin = windows(WINDOW_TYPE).find( function(awin) {
                    return this.startsWith(awin.name || "")
                }, thename );
            if (thewin) thewin.close();
        }

	let thesize = cfg2size(acfg);
    let thestr1 = [ "innerWidth", thesize[0] ].join("="),
        thestr2 = [ "innerHeight", thesize[1] ].join("=");
        thestr1 = [ SOME_TOKENS, thestr1, thestr2 ].join(",");
		if (!(preferences.prefs["dependentdlg"]))
			thestr1 = thestr1.replace("dependent,", "")

		thetag = (acfg.tag || "").toLowerCase();
		if ((thetag.endsWith("frame")) && 
				(thetag.indexOf(".") < 0))
					thetag = "FRAME";

		if (acfg.name) thetag = [ thetag || " ", acfg.name ].join("#");
			else if (thetag.length < 3)	//	"pP"
					thetag = "paragraph";

        parent.setTimeout( function(awin, aname, afeatures, atag, adomain) {
		let thewin = awin.openDialog( IFRAME_CHROME,  //  The URL in the newly opened window.
                                        aname, //  that does not specify title of new window
                                        afeatures, //  Position and size features for details.
                                        adomain ); //   Para param's.
//              let thewin = awin.open( IFRAME_CHROME, aname, afeatures );
				thewin.addEventListener( "load", function(eva) {
//		console.log("_dvk_dbg_, load event.target: ", eva.target);
					var title = eva.target.title || "";
					if (atag.length) title = [ atag, title ].join(" - ");
					if (adomain.length > 1) 
						adomain = [ " -(", ")" ].join(adomain);
							else adomain = "";
					eva.target.title = title.concat(adomain);
				}, false );
            }, 0, parent, thename, thestr1, thetag, domain );
//			"chrome,titlebar,centerscreen,dependent,dialog"
	}	//	onMessage: function(apos)
};

var mainBtn = buttons.ActionButton({ id: LIB_ISBN,
	label: "View of Target",
	icon:  NEUTRAL_PNG,

	onClick: function(astate) {

        var selection = "", therect = null, 
            thebro = getMostRecentBrowserWindow();
        let thetab = (thebro) ? getSelectedTab(thebro) : null;
        let thewin = (thetab) ? getTabContentWindow(thetab) : null;
        let thedoc = (thewin || {}).document || { "loadOverlay": true };
        let thenode= (thedoc || {}).activeElement;
        let thetag = ((thenode || {}).tagName || "").toLowerCase();

        if (":".concat(thetag).endsWith(":iframe")) 
		try {	// activeElement is iframe & selection
            selection = thenode.contentWindow.getSelection() || "";
            selection = selection.toString().trim();
//          dump(thewin.sessionStorage.getItem(LIB_ISBN)); dump("\n");
            if (selection.length) therect = thenode.getBoundingClientRect();
//              else thewin.sessionStorage.removeItem(LIB_ISBN);
        }
            catch(err) { }

		var thepref = preferences.prefs["prior4sel"];
        if (therect) {
			var themsg = { "frame": true, 
				"tag": thetag,
				"sel": thepref,
				"outerHeight":	thewin.innerHeight,
				"outerWidth":	thewin.innerWidth,
				"innerHeight":	therect.height || thewin.innerHeight,
				"innerWidth":	therect.width || thewin.innerWidth
			}
            var thename = thenode.getAttribute("id") || "";
            if (thename.length) 
				Object.defineProperty( themsg, "name", 
					{ "value": thename, "enumerable": true } );
            thecfg.onMessage(themsg, thewin);
            return;
        }
//        if ((thedoc.documentURI || 'about:').startsWith('about:'))
        else if (!(thedoc.loadOverlay)) {
            thecfg.contentScriptOptions = { "prior4sel": thepref,
                "frozenview": preferences.prefs["frozenview"],
                "tagslist": preferences.prefs["boxabletags"]
            }
            require("sdk/tabs").activeTab.attach(thecfg);
            return;
        }
    //  NOTE: Alert of rare, quarrel case.
        thebro.setTimeout( function(awin) {
            awin.alert(ERR_MSG) }, 1, thebro );
        return;
	}  //  onClick: function(astate)
});

var shadowBtn = {   isbn: LIB_ISBN,

    handleEvent : function(eva) {

        let thebro = eva.currentTarget || getMostRecentBrowserWindow();
//      if (eva.target === thebro) thebro = getMostRecentBrowserWindow();
        let docum = ((thebro || {}).document || {}).documentElement;
        let content = null, thetab = getSelectedTab(thebro);
        if (thetab) content = getTabContentWindow(thetab).document;

        if (!docum || !content) return;
        if (docum.hasAttribute("customizing")) return;
    //  case: if not current or not top of "pageshow" event
        if ("TabSelect".indexOf(eva.type || "TabSelect")) 
            if (!(content === eva.target))
                return;

        let thestr = (content.documentURI || "about:").toLowerCase();
        let disabled = thestr.startsWith('about:');
        if (!disabled) disabled = (content.loadOverlay) ? true : false;
  //  thebro.console.log( "_dvk_dbg_, handleEvent event: ", eva.type );
//        thebro.console.log(disabled, content.documentURI);
        mainBtn.state( "window", { "disabled": disabled });

        return;
    }
}   //  var shadowBtn

function sdkFireStyle(awin) {
    let thewin = viewFor(awin) || awin || {};
    let docum = (thewin.document || {}).documentElement;
        if (!docum) return;
    var thestyle = docum.querySelector(STL_SELECTOR);
    if (thestyle) {
        shadowBtn.isbn = thestyle.title;
        if (!(docum.hasAttribute("customizing")))
            require("sdk/tabs").activeTab.attach( {
                    attachTo: "top", // not often event
                    contentScriptFile: data.url("oneops.js"),
                    onMessage: function(amsg) {
                        if (amsg) mainBtn.state( "window", amsg )
                    }
                } );    //  state btn subsystem
    }   //  NOTE: Start load, id est below.
    else if (!(docum.querySelector("iframe.".concat(LIB_ISBN)))) {
    //  frame wait for popup of btn body
        BRO_EVENTS.forEach( function(atype) {
            thewin.addEventListener( atype, this, false )
        }, shadowBtn );

        let iframe = thewin.document.createElementNS(HTML_NS, "iframe");
            iframe.className = LIB_ISBN, iframe.hidden = true;
            docum.appendChild(iframe);
            iframe.src = STYLE_PATH;
//   thewin.console.log("_dvk_dbg_, frame is loading.");
    }
    return;
}   //  function sdkFireStyle(awin)

pageMod.PageMod( { attachTo: "frame",
    include: "chrome://targetout/content/*",
    contentScriptWhen: "start",
    contentScript: "self.postMessage({});",
    onAttach: function(worker) {
    require("sdk/tabs").activeTab.attach( { 
        attachTo: "top", 
        contentScriptFile: data.url("oneops.js"),
        onMessage: function(amsg) {
            if (amsg) mainBtn.state( "window", amsg )
        }
    } );
    }   //  onAttach: function(worker)
 } );

var thecontent = null;
function attachContent() {
    if (!thecontent) 
    thecontent = pageMod.PageMod({ include: "*",
        contentScriptWhen: "ready",
        attachTo: [ "existing", "top" ],    // "frame" ],
        contentScriptFile: data.url("content.js"),

        onMessage: function(anhref) {
            if ((anhref || "#").lastIndexOf("#")) return;
                let thebro = getMostRecentBrowserWindow();
                let thedoc = thebro.document;
                    anhref = anhref.replace(/#+/, "");
                if (thedoc && anhref.length)
                if (thedoc.getElementById(shadowBtn.isbn)) {
    //  test if btn is hidden in menu or its toolbar is collapsed.
                    let thestr = COLLAPSED_BAR.concat(shadowBtn.isbn);
                    if (thedoc.querySelector(thestr)) return;
                        thestr = PANEL_SELECTOR.concat(shadowBtn.isbn);
                    if (thedoc.querySelector(thestr)) return;
                    
                    let thewin = getTabContentWindow(getSelectedTab(thebro));
                    ((thewin || {}).location || {}).hash = anhref;
                }
//      thebro.console.log("_dvk_dbg_, msg from content: ", anhref);
            return;
        }
    })
}   //  function attachContent()

preferences.on( "click2hash", function() {
    if (preferences.prefs["click2hash"]) {
        let thelen = LIB_ISBN.length + 1;
        let thewin = getMostRecentBrowserWindow() || {};
        if ((thewin.document) && (thelen > shadowBtn.isbn.length)) {
            var thestyle = thewin.document.querySelector(STL_SELECTOR);
            shadowBtn.isbn = thestyle.title || shadowBtn.isbn;
    thewin.console.log("_dvk_dbg_, shadow btn of main: ", shadowBtn.isbn);
        }
        attachContent();
    }
    else if (thecontent) try {
            thecontent.destroy()
        } finally { thecontent = null }
 } );

//  STARTER: once ready any content then test the browser by the btn
( function() {
    try {
        let thewin = getMostRecentBrowserWindow();
        if (thewin) sdkFireStyle(thewin);
        if (preferences.prefs["click2hash"]) {
            thewin.setTimeout( function(adoc) {
                var thestyle = adoc.querySelector(STL_SELECTOR);
                shadowBtn.isbn = thestyle.title || shadowBtn.isbn;
    thewin.console.log("_dvk_dbg_, shadow btn of main: ", shadowBtn.isbn);
            }, 0, thewin.document );
            attachContent();
        }
    }
    finally {
        listBrowsers.on( "activate", sdkFireStyle )
    } 
}) ();
 
//  <panel id="PanelUI-popup"
//	nav-bar-customization-target	PanelUI-button
//	CODE_SNIPPET = "self.on('click', function (node, data) { self.postMessage() } );"
//	uninstall	disable	shutdown	upgrade	downgrade
exports.onUnload = function (areason) {

    let index = "shutdown".indexOf((areason || "?").toLowerCase());
	if (!index) return;    //    getMostRecentBrowserWindow();

    windows(BROWSER_TYPE).forEach(
        function(awin) {
            try {
                BRO_EVENTS.forEach( function(atype) { 
                    awin.removeEventListener( atype, this, false )
                }, shadowBtn );

                let thelst, theframe = null, 
                    thestyle = awin.document.querySelector(STL_SELECTOR);
                if (thestyle) thestyle.setAttribute("disabled", "true");
                else { //  thestyle.parentNode.removeChild(thestyle);
                thelst = awin.document.querySelectorAll("iframe.".concat(LIB_ISBN));
                for (theframe of thelst)
                    if ((theframe || {}).parentNode === awin.document.documentElement)
                        theframe.parentNode.removeChild(theframe);
                }
            } catch (err) { }
        } );

	windows(WINDOW_TYPE).forEach( 
		function(awin) {
			if ((awin.name || "").startsWith(LIB_ISBN))
				awin.close() } );

    listBrowsers.removeListener( "activate", sdkFireStyle );

	return;
};

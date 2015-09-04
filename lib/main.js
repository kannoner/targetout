"use strict";
//const HEXDIG = "1234567890ABCDEFabcdef";
const LIB_ISBN = "targetout-toggle-btn"; // from main.js
const IFRAME_CHROME = "chrome://targetout/content/iframe.xul";
const JSM_MODULE    = "resource:///modules/CustomizableUI.jsm";
const SOME_TOKENS	= "dependent,resizable,menubar,dialog,non-private";
const WINDOW_TYPE	= "add-ons:targetout"; // iframe.xul
const BROWSER_TYPE	= 'navigator:browser';
const SKIN_PREFIX	= "chrome://targetout/skin/";
const STYLE_PATH 	= "chrome://targetout/content/style.html";
const TRANSPARENT	= "chrome://targetout/skin/transparent.png";
const NEUTRAL_PNG	= "chrome://targetout/skin/image.png";
const EXCLUDE_TAGS  = "iframe, script";
const STL_SELECTOR	= [ "style.", "[type]" ].join(LIB_ISBN);
const COLLAPSED_BAR	= 'toolbar[collapsed="true"] toolbarbutton#';
const PANEL_SELECTOR= 'panel panelview toolbarbutton#';
const ERR_MSG       = "The content of the current page is not a well-formed document.";
const BRO_EVENTS = [ "aftercustomization", //   "beforecustomization", 
                    "toolbarvisibilitychange", 
                    "TabSelect", "pageshow" ]

const INLINE_SCRIPT = [ " if (document.loadOverlay) self.postMessage({ 'disabled': true });",
                    " else if ((document.documentURI || 'about:').startsWith('about:'))",
                    " self.postMessage({ 'disabled': true }); ",
                    " else self.postMessage(self.options);" ].join("\n");

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
    tooltipText: "Frozen View of Detached Target",

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
        else if (thedoc.loadOverlay)
            require("sdk/tabs").activeTab.attach(appendix);
        else 
        if ((thedoc.documentURI || 'about:').startsWith('about:'))
            require("sdk/tabs").activeTab.attach(appendix);
        else {  //  cruise case
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

var appendix = {  //  state btn subsystem
    attachTo: "top",
    contentScriptWhen: "ready",
    include: [ "file://*", "*" ],
    contentScriptOptions: { "disabled": false },
    contentScript: INLINE_SCRIPT,
	onMessage: function(amsg) {
        let thebro = getMostRecentBrowserWindow() || {};
        if (thebro.document) {
    thebro.console.log("_dvk_dbg_, msg by Tab.attach: ", amsg);
            thebro.setTimeout( function(adoc) {
                shadowBtn.updateBtnImage(adoc)
            }, 1, thebro.document );
            mainBtn.state( "window", amsg );
        }
    }
}   //  var appendix

//  fired when bro-btn is found
function sdkFireStyle(awin) {
    let thewin = viewFor(awin) || awin || {};
    let docum = (thewin.document || {}).documentElement;
// thewin.console.log("_dvk_dbg_, active event is fired by list of browser.");
    if (!docum) return;

    if (!(docum.querySelector(STL_SELECTOR))) {

            BRO_EVENTS.forEach( function(atype) { 
                thewin.addEventListener( atype, this, false )
            }, shadowBtn );
// thewin.console.log("_dvk_dbg_, events are charged for active window.");
    //  NOTE: what be without namespace (via another:-).
        let iframe = thewin.document.createElementNS("http://www.w3.org/1999/xhtml", "iframe");
            iframe.className = LIB_ISBN, iframe.hidden = true;
            iframe.title = shadowBtn.isbn;
            docum.appendChild(iframe);
            iframe.src = STYLE_PATH;

        let thebtn = thewin.document.getElementById("PanelUI-popup");
        if (thebtn) thebtn.addEventListener( "popuphidden", shadowBtn, false );

		let thetab = getSelectedTab(thewin);
		let thedoc = (getTabContentWindow(thetab) || {}).document;
		let thestr = (thedoc.documentURI || "about:").toLowerCase();
		if (thestr.startsWith("about:addons"))
			require("sdk/tabs").activeTab.attach( {
				contentScriptWhen: "end",
				contentScriptFile: data.url("settings.js")
			} );

    }

    if (!(docum.hasAttribute("customizing")))
        require("sdk/tabs").activeTab.attach(appendix);

    return;
}

var shadowBtn = {   isbn: null,

    updateBtnImage : function(adoc) {
        var thebtn = adoc.getElementById(this.isbn);
        if (thebtn) thebtn.setAttribute("image", "");
    },

    onWidgetAdded : function(aWidgetId, aArea, aPosition) {
//      dump("\n_dvk_dbg_, onWidgetAdded: "); dump(aWidgetId); dump("\n");
        if((aWidgetId || "").length == this.isbn.length)
            sdkFireStyle(getMostRecentBrowserWindow());
    },  //  it is unused: CustomizableUI.addListener(shadowBtn)
                 
    handleEvent : function(eva) {

        let thebro = eva.currentTarget || getMostRecentBrowserWindow();
        if (eva.target === thebro) thebro = getMostRecentBrowserWindow();
        let docum = ((thebro || {}).document || {}).documentElement;

        if (!docum) return;
    thebro.console.log( "_dvk_dbg_, handleEvent event: ", eva.type );
        thebro.console.log(eva.target);
        if (docum.hasAttribute("customizing")) return;

        let thelen = eva.type.length || parseInt(10);
        if (thelen < 10) {   //  "TabSelect", "pageshow"
            if (thelen == 9)
                thebro.setTimeout( function() {
                    require("sdk/tabs").activeTab.attach(appendix);
                }, 1 );
            else {  //  "pageshow"
                let thetab = getSelectedTab(thebro);
                if (thetab) docum = (getTabContentWindow(thetab) || {}).document;
                if (docum === eva.target) { //  if current content
					let thestr = (docum.documentURI || "about:").toLowerCase();
                    let disabled = thestr.startsWith('about:');
                    if (!disabled) disabled = (docum.loadOverlay) ? true : false;
                    let themap = mainBtn.state("window");
                    if (!(themap.disabled == disabled))
                        appendix.onMessage({ "disabled": disabled });

					if (disabled && thestr.startsWith("about:addons"))
					thebro.setTimeout( function() {
						require("sdk/tabs").activeTab.attach( {	
							contentScriptWhen: "end",
							contentScriptFile: data.url("settings.js")
						} );
					}, 1 );

                }
            }
        } else
            thebro.setTimeout( function(adoc) {
                let thebtn = adoc.getElementById(shadowBtn.isbn);
                if ((thebtn || {}).image) thebtn.setAttribute("image", "");
            }, 1, thebro.document );

        return;
    }
}   //  var shadowBtn

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
    if (preferences.prefs["click2hash"]) attachContent()
        else if (thecontent) try {
//    dump("\n_dvk_dbg_, prefs[click2hash] is false.\n");
            thecontent.destroy()
        } finally { thecontent = null }
 } );

var incompleteStart = function() { };
//  STARTER: once ready any content then test the browser by the btn
( function() {
    var happening = {

        onCustomizeEnd : function(awin) {
//            awin.console.log("_dvk_dbg_, onCustomizeEnd: ", mainBtn);

            var thestr = [ "toolbarbutton[image^='", "']" ].join(SKIN_PREFIX);
            var thebtn = null, docum = (awin.document || {}).documentElement;
            if (docum) thebtn = docum.querySelector(thestr);
            if (thebtn) {
                let thelen = mainBtn.id.length || parseInt(99);
                let btnisbn = thebtn.getAttribute("id") || mainBtn.id;
//    awin.console.log("_dvk_dbg_, have started listening to activate window: ", thebtn);
                if (btnisbn.length > thelen) 
                try {   // derivative is found
                    shadowBtn.isbn = btnisbn;
                    listBrowsers.on( "activate", sdkFireStyle );
                    sdkFireStyle(awin);
                    if (preferences.prefs["click2hash"]) 
                        attachContent();
                }
                    finally { this.CustomizableUI = incompleteStart() }
            }
        },  //  onCustomizeEnd(awin)

        onWidgetAdded: function(aWidgetId, aArea, aPosition) {
            let thestr = aWidgetId || "";
//        dump("\n_dvk_dbg_, onWidgetAdded: "); dump(aWidgetId); dump("\n");
            if (thestr.indexOf(mainBtn.id) > 1) {
                let thewin = getMostRecentBrowserWindow();
                let docum = ((thewin || {}).document || {}).documentElement;
                if (!docum) return;
                if (docum.hasAttribute("customizing")) return;
                    this.onCustomizeEnd(thewin);
            }
            return;
        },

        init: function(awin) {
            incompleteStart = function() {
                try {
                    happening.CustomizableUI.removeListener(happening)
                } 
                    finally { incompleteStart = function() { } };
                return null;
            };
            this.CustomizableUI.addListener(this);
            this.onCustomizeEnd(awin);
        }
    }   //  var happening

//  NOTE: include statement must be wider than other PageMod's op'rs.
 pageMod.PageMod({ contentScriptWhen: "ready",
    include: [ "about:*", "file://*", "*" ],
    attachTo: [ "existing", "top" ],
//	onMessage: function(ablank)
    onAttach: function(anworker) {
        let thewin = getMostRecentBrowserWindow();
    thewin.console.log("_dvk_dbg_, onAttach of start page mod.");
        if ((thewin || {}).Components) {
            thewin["Components"].utils.import(JSM_MODULE, happening);
		}
        if (happening.CustomizableUI) try {
            happening.init(thewin);
        }
            finally { this.destroy() }
    }  //  onAttach: function(anworker)
 });
 
}) ();
 
//  <panel id="PanelUI-popup"
//	nav-bar-customization-target	PanelUI-button
//	CODE_SNIPPET = "self.on('click', function (node, data) { self.postMessage() } );"
//	uninstall	disable	shutdown	upgrade	downgrade
exports.onUnload = function (areason) {

    let index = "shutdown".indexOf((areason || "?").toLowerCase());
	if (!index) return;    //    getMostRecentBrowserWindow();
    
    incompleteStart();

    windows(BROWSER_TYPE).forEach(
        function(awin) {
            try {
                BRO_EVENTS.forEach( function(atype) { 
                    awin.removeEventListener( atype, this, false )
                }, shadowBtn );

                let thebtn = awin.document.getElementById("PanelUI-popup");
                if (thebtn) thebtn.removeEventListener( "popuphidden", shadowBtn, false );

                var thestyle = awin.document.querySelector(STL_SELECTOR);
                if ((thestyle || {}).parentNode)
                    thestyle.parentNode.removeChild(thestyle);
            } catch (err) { }
        } );

	windows(WINDOW_TYPE).forEach( 
		function(awin) {
			if ((awin.name || "").startsWith(LIB_ISBN))
				awin.close() } );
// dump("\n_dvk_dbg_, main code is unload.\n");
    listBrowsers.removeListener( "activate", sdkFireStyle );

	return;
};

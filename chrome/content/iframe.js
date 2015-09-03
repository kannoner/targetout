"use strict";

	const LIB_ISBN = "targetout-toggle-btn"; // from main.js
    const DUMMY_URL= "about:mozilla";
    const LOAD_STAGES = [ "unready", "interactive", "complete" ];
//    Components.utils.import("resource://gre/modules/Services.jsm");
    Components.utils.import("resource://gre/modules/BrowserUtils.jsm");

    var nsContextMenu = {   //  event.shiftKey
        href    : null,
        anchor  : null,    //  document.popupNode
        menu    : false,
        label   : null,
        frame   : null,
        last    : 0,
        initialize: function(aframe, amenu) {
            this.frame = aframe;
            document.addEventListener( "click", this, false );
            amenu.addEventListener( "popupshowing", this, false );
            this.label = document.querySelector("description[crop]");
        },

        setStatusLabel: function(aval) {
            aval = (aval || "").trim();
            if (aval.length > 1) {
                this.label.value = aval;
                this.frame.className = "flex";
                this.last = Date.now();
            }
            else {
                this.frame.className = "fixed";
                this.last = 0;
            }
        },

        updateStatusPanel: function(adoc, eva) {

            let thenode = eva.target || adoc;
            if (thenode === adoc) return;

            let thetype = "".concat(eva.type || "mouseout");
            switch (thetype) {
                    
            case "click" : // mouse event
                thenode = adoc.querySelector("*:link:hover");
                let thestr = (thenode || {}).href || "";
                    this.setStatusLabel(thestr);
                break;
    //  HACK: above always versus only below.
            case "focus" :
                if (thenode === adoc.body) break;
                if (thenode.hasAttribute("href"))
                    this.setStatusLabel(thenode.href);
                break;

            default:
                thenode = adoc.querySelector("*:link:hover");
                let thestr1 = (thenode || {}).href;
                let thestr2 = (adoc.activeElement || {}).href || "";
                if ((!thestr1) && (!thestr2)) {
                    if (!(this.last)) break;
                    if (Math.abs(Date.now() - this.last) < 666)
                        break;
                }
                this.setStatusLabel(thestr1 || thestr2);
            }
            return;
        },  //  updateStatusPanel: function(adoc, eva)

        openUILink: function() {
            if (this.href) openUILinkIn(this.href, "window")
        },
    
        copyLink: function() {
            let clipboard = Components.classes["@mozilla.org/widget/clipboardhelper;1"].
                    getService(Components.interfaces.nsIClipboardHelper);
            clipboard.copyString(this.href);    //  , document);
        },

        handleEvent : function(eva) {

            function testLink(thedoc) {
                if (!thedoc) thedoc = document;
                let thenode = thedoc.querySelector("*:link:focus");
                if (!thenode) thenode = thedoc.querySelector("*:link:hover");
                return thenode;
            }

            let themenu, anchor = eva.currentTarget;
            if (anchor === document) {
    //  if (eva.button) return; NOT Main button is pressed 
                let thedoc = (eva.target || {}).ownerDocument;
                if (document === thedoc) return;

                this.anchor = testLink(thedoc);
//    opener.console.log("_dvk_dbg_, click target: ", this.anchor);
                if (!(eva.button) && this.anchor) {
                    themenu = document.getElementById("main-menu");
                    window.setTimeout( function(amenu) {
                        amenu.openPopup( nsContextMenu.anchor, 
                            "after_pointer", 0, 0, true, false )
                        }, 0, themenu );  //  link click
                    eva.preventDefault();
                } else //  MouseEvent.MOZ_SOURCE_MOUSE 	1
                    if (eva.mozInputSource < 2)
                        this.updateStatusPanel(thedoc, eva);
                return;
            }   //  if (eva.currentTarget === document) click event

            let thetype = parseInt((anchor || {}).nodeType || 8);
            if (thetype >> 3) { // mouse and focus event
                if (!(this.menu)) 
                    this.updateStatusPanel(anchor, eva);
                return;
            }

            this.menu = true;
            document.removeEventListener( "click", this, false );
//          opener.console.log("_dvk_dbg_, popup event: ", document.popupNode);
            let copylink = false;
            let thenode = document.popupNode || this.anchor || {};
                thenode = testLink(thenode.ownerDocument) || {};
            themenu = document.getElementById("context-copyemail");
            let thestr = "".concat(thenode.href || "");
            if (thestr) {
                this.href = thestr;
                if (thestr.startsWith('mailto:')) {
                    thestr = thestr.replace('mailto:', '');
                        thestr = thestr.trim();
                    if (thestr.length) this.href = thestr;
                        else copylink = true;                    
                }
                    else copylink = true;
                (themenu || {}).hidden = copylink;
            }
                else (themenu || {}).hidden = true;

        (document.getElementById("context-copylink") || {}).hidden = !copylink;
        (document.getElementById("context-openlink") || {}).hidden = !copylink;
    
            return;
        }
    };   //  nsContextMenu

	var themain = {
		content : "",
        domain  : "",
        handleEvent : function(anevt) {

            if (anevt.currentTarget === window) {

                let theframe = anevt.target.querySelector("iframe[name]") || {};
                let thedoc = (theframe || {}).contentDocument;
                if (!thedoc) return;

                window.setTimeout( function(aframe) {
                    themain.doFinish(aframe);
                    [ "top", "left", "margin" ].forEach(
                        function(anattr) { this.style[anattr] = 0 }, aframe );
                }, 0, theframe );
                thedoc.documentElement.innerHTML = this.content;
                anevt.currentTarget.removeEventListener(anevt.type, this, false);

                return;
            }   //  load event

            //  popuphidden of menu
            nsContextMenu.menu = false;
            document.addEventListener( "click", nsContextMenu, false );
            nsContextMenu.href = "";
//    window.opener.console.log("_dvk_dbg_, menu is hidden: ", anevt);
            return;
        },	//	handleEvent : function(anevt)

        stateIsReady : function(adoc) {

            window.setTimeout( function(adoc) {
                adoc.addEventListener( "mouseover", nsContextMenu, false );
//              adoc.addEventListener( "mouseout", nsContextMenu, false );
                adoc.addEventListener( "focus", nsContextMenu, true );
            }, 0, adoc);

            let thestr = "".concat(adoc.baseURI || "about:");
            if (thestr.startsWith("about:") || thestr.startsWith("chrome:"))
            if (this.domain && adoc.head) {
                let thenode = adoc.querySelector("base");
                if (!thenode) {
                    thenode = adoc.createElement("base");
                    thenode = adoc.head.appendChild(thenode);
                }

                if (this.domain.indexOf(":") > 1) 
                    thenode.setAttribute("href", this.domain);
                else {
                    thestr = "http://".concat(this.domain);
                    thestr = thestr.replace(/(\/\/+)|(\\\\+)/, "//");
                    thenode.setAttribute("href", thestr);
                }
            }
            adoc.body.style["padding"] = "1em";
        },

		doFinish : function(aframe) {
            let themenu = document.getElementById("main-menu");
            if (themenu) {
                nsContextMenu.initialize(aframe, themenu);
                themenu.addEventListener( "popuphidden", this, false );
            }
            let thedoc = aframe.contentDocument;
			let thestr = (thedoc.readyState || "unready").toLowerCase();
			if (LOAD_STAGES.indexOf(thestr) > 0)
                this.stateIsReady(thedoc);
            else
                window.setTimeout( function(adoc) {
                    themain.stateIsReady(adoc) }, 0, thedoc );
//    window.opener.console.log("_dvk_dbg_, .readyState: ", thestr);
		}
	}; //  var themain = {

(function() {
    let thestr = "";
	let thebro = (window.opener || {}).gBrowser;
	let thewin = (thebro || {}).contentWindow;
	if (thewin) try {
		thestr = thewin.sessionStorage.getItem(LIB_ISBN) || "";
        thestr = thestr.trim();
		if (thestr.length >> 1) {
            themain.content = thestr;
//		window.addEventListener( "message", themain, false );
            window.addEventListener( "load", themain, false );
		} else thestr = "";

        themain.domain = window.arguments[0] || "";
        if (!(themain.domain) && thewin.document)
            themain.domain = thewin.document.baseURI ||
                                thewin.document.domain || "";
	}
        catch(err) { thestr = "" }

    if (!thestr) {
		window.setTimeout(function() { window.close() }, 0 );
		alert(document.querySelector("iframe[name]").srcdoc);
	}
}) ();

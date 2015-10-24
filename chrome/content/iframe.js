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
        last    : 0,

        initialize: function(amenu) {
            document.addEventListener( "click", this, false );
            amenu.addEventListener( "popupshowing", this, false );
            this.label = document.querySelector("description[crop]");
        },

        setStatusLabel: function(aval) {
            aval = (aval || "").trim();
            if (aval.length > 1) {
                this.label.value = aval;
                themain.frame.className = "flex";
                this.last = Date.now();
            }
            else {
                themain.frame.className = "fixed";
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
                let thestr2 = (adoc.activeElement || {}).href;
                if ((!thestr1) && (!thestr2)) {
                    thestr2 = (adoc.activeElement || {}).src || "";
                    if (!thestr2) {
                        if (!(this.last)) break;
                        if (Math.abs(Date.now() - this.last) < 666)
                            break;
                    }
                }
                this.setStatusLabel(thestr1 || thestr2);
            }
            return;
        },  //  updateStatusPanel: function(adoc, eva)

        openUILink: function() {
            let thestr = this.href || "";
            if (!(thestr.length)) {
                let thenode = document.querySelector("*:link:focus");
                if (!thenode) thenode = (themain.frame
                    ).contentDocument.querySelector("*:link:focus");
                thestr = (thenode || {}).href || "";
            }
            
            if (!((thestr.toLowerCase() || 'mailto:'
                  ).startsWith('mailto:')))
                    openUILinkIn(thestr, "window");
        },
    
        copyLink: function() {
            let clipboard = Components.classes["@mozilla.org/widget/clipboardhelper;1"].
                    getService(Components.interfaces.nsIClipboardHelper);
            let thestr = this.href || "";
            if (!(thestr.length)) {
                let thenode = document.querySelector("*:link:focus");
                if (!thenode) thenode = (themain.frame
                    ).contentDocument.querySelector("*:link:focus");
                thestr = (thenode || {}).href || "";
            }
            if (thestr) clipboard.copyString(thestr);
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
            if (thestr.length) {
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
        (document.getElementById("context-closedlg") || {}
                    ).hidden = copylink || (thestr.length > 0);
    
            return;
        }
    };   //  nsContextMenu

	var themain = {

        domain  : ".", // baseURI
        frame   : window.frames[0],
        unset   : "transparent",

        handleEvent : function(anevt) {
//            if (anevt.currentTarget === window) 
            this.frame = anevt.target.querySelector("iframe[name]");
            let thedoc = (this.frame || {}).contentDocument;
            if (!thedoc) return;

            window.setTimeout( function() {

//                [ "top", "left", "margin" ].forEach(
                let attr, thestyle = themain.frame.style;
                for (attr of [ "top", "left", "margin" ])
                     thestyle[attr] = 0;

                let themenu = document.getElementById("main-menu");
                if (!themenu) return;

                nsContextMenu.initialize(themenu);
                themenu.addEventListener( "popuphidden", function() {
                    nsContextMenu.menu = false;
                    document.addEventListener( "click", nsContextMenu, false );
                    nsContextMenu.href = "";
                }, false );

                themenu = themenu.querySelector("menupopup.submenu");
                themenu.addEventListener( "command", function(eva) {
                    let thedoc = themain.frame.contentDocument;
                    let theclr = eva.target.value || themain.unset;
//    window.opener.console.log("_dvk_dbg_, menu command: ", eva);
                    if (thedoc.body.style["backgroundColor"])
                            thedoc.body.style["backgroundColor"] = theclr;
                        else 
                            thedoc.body.style["background"] = theclr;
                    }, false );

                themenu = themenu.querySelector("menuitem[name]");
                let thestr = themenu.getAttribute("name") || "color";
                for (themenu of themenu.parentNode.children) 
                    themenu.setAttribute("name", thestr);

                return;
            }, 0 ); // window.setTimeout( function()

            window.setTimeout( function(adoc) {
                adoc.addEventListener( "mouseover", nsContextMenu, false );
//              adoc.addEventListener( "mouseout", nsContextMenu, false );
                adoc.addEventListener( "focus", nsContextMenu, true );
            }, 0, thedoc);

            anevt.currentTarget.removeEventListener(anevt.type, this, false);    
            return;
        },	//	handleEvent : function(anevt)

        stateIsReady : function(adoc) {

            let thenode = adoc.querySelector("base"),
                thestr = "".concat(adoc.baseURI || "about:");
            if (thestr.startsWith("about:") || thestr.startsWith("chrome:"))
            if (this.domain && adoc.head) {

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
            
            let thebody = adoc.body;
            let thestyle = (thebody || {}).style;
            if (thestyle) {
 [ thestyle["padding"], thestyle["boxSizing"] ] = [ "1em", "border-box" ];
                themain.unset = thestyle["backgroundColor"] 
                        || thestyle["background"] || themain.unset;

                thenode = thebody.firstElementChild;
                if (thenode)
                if (thenode === thebody.lastElementChild) 
                    thenode.style["boxSizing"] = "border-box";
//                    for (thestr of ["top", "left"])
  //                      thenode.style[thestr] = "1ex";
            }
        }
	}; //  var themain = {

window.addEventListener("message", function(eva) {
//    window.opener.console.log("_dvk_dbg_, from main code: ", themain.frame);
    let theframe = themain.frame || document.querySelector("iframe[name]");
    let thedoc = theframe.contentDocument, thestr = (eva.data || "").trim();
    if (thedoc && (thestr.length >> 1)) {
        thedoc.documentElement["innerHTML"] = thestr;
        window.setTimeout( function(adoc) {
            themain.stateIsReady(adoc) }, 0, thedoc );
    }
}, false);

 window.addEventListener( "load", themain, false );
//  TODO: wait for content by window.setTimeout( .
 themain.domain = window.arguments[0] || "http://*/";
//  catch(err) { thestr = "" }

"use strict";

const STL_SELECTOR	= [ "style.", "[type]" ];
const JSM_MODULE    = "resource:///modules/CustomizableUI.jsm"
const SKIN_PREFIX   = "chrome://targetout/skin/"
const BTN_SELECTOR  = "panel panelview toolbarbutton#";
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm")
//  Components.utils.import("resource://gre/modules/Services.jsm")

var thesub = { isbn: "",    //  tooltipText
    title: "Frozen View of Detached Target",
    chrome:"Tab's content is quite chrome.",

    observer: null, btn: null,

    updateAttr : function(abtn) {
        abtn.setAttribute("image", "");
        abtn.tooltipText = (abtn.disabled
                )? this.chrome : this.title;
    },

    resetEvent : function(abtn) {
        if (this.btn === abtn) return;
        var thebtn = this.btn;
        if (this.isbn) try {
            this.btn = null;
            if (abtn) (abtn
                ).addEventListener(
                    "popupshowing", this, false);
            this.btn = abtn;
        } finally {
            if (thebtn) (thebtn
                ).removeEventListener(
                    "popupshowing", this, false)
        }
        return;
    },

    handleEvent : function(eva) {
        var thebtn = 
            eva.currentTarget.querySelector(
                "toolbarbutton#".concat(this.isbn));
        if (thebtn) thebtn.removeAttribute("disabled");
// thebtn.ownerDocument.defaultView.console.log("_dvk_dbg_, popupshowing btn: ", thebtn);
    },

    startUp : function(awin, abtn) {
        var delay = null, observer = this.observer;
        this.observer = 
            new awin.MutationObserver(
                function(alst) {
                    var thebtn = (alst[0] || {}).target;
                    if (!delay && (thebtn || {}).image)
                        delay = awin.setTimeout( function(abtn) {
                            delay = null, thesub.updateAttr(abtn);
                        }, 1, thebtn );
                } );    //  new awin.MutationObserver
        try {
            this.observer.observe( abtn, { "attributes": true } )
        }
            finally { if (observer) observer.disconnect() }
    }
}   //  stop by onWidgetAdded and quasi unload

var themain = {
    observer: null,
    docx:   window.top.document,
    frame:  window.frameElement,
    CustomizableUI: window.top.CustomizableUI,
    className:   window.frameElement.className,
    ISBN_PLACE : "\\[image\\^=\"chrome://targetout/skin/\"\\]",
    TEST_BTN : [ "toolbarbutton[image^='", "']" ].join(SKIN_PREFIX),

    preLoad : function() {
        if (!(this.CustomizableUI))
            Components.utils.import(JSM_MODULE, this);
        window.addEventListener("unload", this, false);
        this.CustomizableUI.addListener(this);
    },

    handleEvent : function(eva) {
        var thewin = (eva.target || {} // target of unload
            ).defaultView || this.docx.defaultView;
        if ((eva.currentTarget || thewin) === thewin)
            this.CustomizableUI.removeListener(this);
// themain.docx.defaultView.console.log("_dvk_dbg_, remove Listener of CustomizableUI");
// themain.docx.defaultView.console.log("_dvk_dbg_, frame event: ", eva);
        if (!(eva.target)) try { // quasi event
            thewin.removeEventListener("unload", this, false);
            if (this.observer) this.observer.disconnect();
            if (thesub.observer) thesub.observer.disconnect();
            var thestyle, thestr = STL_SELECTOR.join(this.className);
            for (thestyle of this.docx.querySelectorAll(thestr))
                thestyle.parentNode.removeChild(thestyle);
            thesub.resetEvent(null);
        }
        finally {
            this.CustomizableUI = null,
                this.observer = null,
                    this.docx = null;
        }   // id est, shutdown
    },

    startUp : function(anisbn) { // remove self frame
        var docum   = this.docx.documentElement, 
            thedoc  = this.frame.contentDocument;
        var reference = docum.firstElementChild,
            thenode = thedoc.querySelector("style[type]");
//    window.top.console.log("_dvk_dbg_, frame is loaded.");
        var thestr = thenode.textContent,
            thedoc = this.docx.defaultView,
        instance = new RegExp(this.ISBN_PLACE, "g"),
            observer = this.observer;
        thestr = thestr.replace(instance, "#".concat(anisbn));
        thenode.textContent = thestr;	//	only once
        thenode.className = this.className;
        thenode.setAttribute("title", anisbn);

        try {
//  The first is an array of objects, each of type MutationRecord. 
//    The second is this MutationObserver instance.
    const vivat = { "type": "mutation", "target": null, "currentTarget": null };
            this.observer = new thedoc.MutationObserver(
                    function(alst) {
                        if (alst.length > 0)
                            themain.handleEvent(vivat)
                } );
            this.observer.observe(  //  the Node on which to observe
                docum.insertBefore(thenode, reference),
                { "attributes": true } );   
            //  specifies which mutations should be reported
        }
        finally {
            if (observer) observer.disconnect();
        }
    //  thedoc already is window.top
        try {
            thedoc.addEventListener("unload", this, false);
        }
        finally {
            this.frame.contentWindow.removeEventListener(
                "unload", this, false)
        }

    },  //  startUp : { // remove self frame

    onWidgetAdded : function(aWidgetId, aArea, aPosition) {
        var docum = this.docx.documentElement;
        if (!docum) return; //  Services.ww.activeWindow
        if (docum.hasAttribute("customizing")) return;
 themain.docx.defaultView.console.log("_dvk_dbg_, onWidgetAdded event: ", aWidgetId);
        if (thesub.isbn) {
            if (thesub.isbn.indexOf(aWidgetId || "")) return;
            var observer = thesub.observer,
                thebtn = this.docx.getElementById(thesub.isbn);
            thesub.observer = null;
            try {
                if (thebtn) {
                    this.docx.defaultView.setTimeout(
                        function(awin, abtn) { thesub.startUp(awin, abtn)
                            } , 1, this.docx.defaultView, thebtn );
                    if (thebtn.image) thesub.updateAttr(thebtn);
                    thebtn.removeAttribute("disabled");
 //  HACK: version 40 lose link of btn state skd and dom via menu op's.
                }
                    else thesub.resetEvent(
                        this.docx.getElementById("PanelUI-popup"));
            }
                finally { if (observer) observer.disconnect() }
        } else {
            var thestr = "".concat(aWidgetId || "");
            if (thestr.indexOf(this.className) > 1)
                this.onCustomizeEnd(this.docx.defaultView);
        }
        return;
    },   //  onWidgetAdded : function(aWidgetId, aArea, aPosition)

    onCustomizeEnd : function(awin) {

        var thebtn = null;
        if (!(thesub.isbn)) {
            var docum = awin.document.documentElement;
            if (docum) thebtn = docum.querySelector(this.TEST_BTN);
            if (thebtn) 
                thesub.isbn = 
                    thebtn.getAttribute("id") || thesub.isbn;
    awin.console.log("_dvk_dbg_, onCustomizeEnd event of CustomizableUI: ", thesub.isbn);
            awin.console.log(thesub.isbn);
        }
//  NOTE: case for inactive window has not examination.
        if (thesub.isbn) try {
            var theframe = this.frame || {};
            if (theframe.parentNode) try {
                this.startUp(thesub.isbn)
            }
            finally {
                if (this.observer) {
                    this.frame = null;
                    theframe.parentNode.removeChild(theframe);
                }
            }
            if (this.docx.defaultView === awin)
                this.onWidgetAdded(thesub.isbn);
        }
        catch(err) {
            Components.utils.reportError(err)
        }
    }  //  onCustomizeEnd(awin)

}   //  var themain

try {
    themain.preLoad();
//  window.top.console.log("_dvk_dbg_, preLoad frame: ", themain);
    window.onload = function() {
        var elements = (document.forms[0] || {}).elements || {};
        themain.onCustomizeEnd(window.top);
        if (elements) {
            thesub.title = elements["title"].value || thesub.title;
            thesub.chrome = elements["chrome"].value || thesub.chrome;
        }
    }    
}
catch(err) {
    Components.utils.reportError(err)
}

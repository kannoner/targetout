"use strict";

const INLINE_STYLE =  [ " .targetout hbox.preferences-alignment > label.preferences-title { font-size: 88.1%; }",
						" hbox.preferences-alignment checkbox[checked] { background-color: ButtonFace; } " ].join("\n");
const PACK_ISBN = "targetout@code.google.com";

if ((window.Components || {}).utils)
( function() {
	Components.utils.import("resource://gre/modules/Services.jsm")
	var thenode = document.querySelector("style.targetout");
	if (thenode) return;

	var themain = {

		detach: function(aparam) {
			Services.obs.removeObserver( themain, "addon-options-displayed" );
			var thenode = document.documentElement.querySelector("style.targetout");
			console.log("_dvk_dbg_ detach from about:addons: ", aparam);
			if (thenode) thenode.parentNode.removeChild(thenode);
		},

		observe: function(adoc, aTopic, aData) {
			
			if ("".concat(aTopic).indexOf("addon-options-displayed"))
				return;
			if ("".concat(aData).indexOf(PACK_ISBN)) return;

			var target, thebox, 
				thestr = [ "setting.targetout[type=", "bool", "]" ].join('"') ;
			var thelist = document.documentElement.querySelectorAll(thestr);
			for (thebox of thelist) {
				target = document.getAnonymousElementByAttribute(thebox, "anonid", "input");
				if (target) {
					target.label = thebox.getAttribute("title") || target.label;
					thestr = thebox.getAttribute("desc") || "";
						thebox.setAttribute("title", thestr);
					(target.parentNode || {}).tooltipText = thestr;
					thebox.removeAttribute("desc");	//  abox.setAttribute("desc", " ");
					target.addEventListener( "command", function(eva) {
						let thenode = eva.currentTarget;
						if (thenode.checked)
							thenode.parentNode.setAttribute(
								"style", "background-color: ButtonFace;");
						else
							thenode.parentNode.removeAttribute("style");
//		console.log("_dvk_dbg_, command via checkbox");
					}, false );

					if (target.checked)
						target.parentNode.setAttribute("style", 
							"background-color: ButtonFace;");
				}
			}
			
			target = document.getElementById("detail-controls");
			if (target) target.setAttribute("dir", "reverse");
				
			return;
		}	//	observe: function(adoc, aTopic, aData) {
	}	//	var themain = {
//	TODO: add unload of window for reliability.  
//	self.port.removeListener("ready", listener1); will be mutually exclusive event with "detach"
	self.port.on( "detach", themain.detach );
    Services.obs.addObserver( themain, "addon-options-displayed", false );

	thenode = document.documentElement.firstElementChild;
	var thestr = [ "<xhtml:style class='targetout'>",
					"</xhtml:style>" ].join(INLINE_STYLE);
	try {
		thenode.insertAdjacentHTML("afterend", thestr);
		thestr = "";
	} catch(err) { }
	
	if (thestr) {
		thestr = thestr.replace( new RegExp("xhtml:", "g"), "html:" );
		thenode.insertAdjacentHTML("afterend", thestr);
	}

	return;
}) ();

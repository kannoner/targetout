"use strict";

 self.port.on( "detach", function() {
    var thenode, selector = "command.targetout[oncommand]";
    for (thenode of document.querySelectorAll(selector))
         thenode.parentNode.removeChild(thenode);
 } );

( function() {

 var thecmd = "chrome://mozapps/content/extensions/about.xul?";
 var [ urilo, search ] = (self.options || thecmd).split("?", 2);
 thecmd = [ " openDialog( ", urilo, ", ", (search || ""), ", ", 
    "chrome,centerscreen,modal,resizable", ", {} );" ].join('"');
 var thenode, selector = "command.targetout[oncommand]";
    thenode = document.querySelector(selector);
 if (!thenode) {
    thenode = document.createElement("command");
//      thenode.setAttribute( "type", "application/javascript" );
    thenode.setAttribute( "class", "targetout" );
    thenode.setAttribute( "oncommand", thecmd );
    thenode = document.documentElement.appendChild(thenode);
}
// .open( self.options, "", "chrome,centerscreen,modal,resizable", {} );
 if (thenode) window.setTimeout(
     function(aselector) {
         document.querySelector(aselector).doCommand()
     }, 0, selector );
// dump("\n_dvk_dbg_, about script: "); dump(self.options); dump("\n");
} ) ();

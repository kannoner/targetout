
"use strict";

//  dump("\n_dvk_dbg_, about:blank is ready: "); dump(window.name); dump("\n");

(function() {
    const LIB_ISBN = "targetout-toggle-btn"; // from main.js
    if ((window.name || "").startsWith(LIB_ISBN))
        self.postMessage(window.name);
}) ();

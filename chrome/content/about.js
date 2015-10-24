// -*- indent-tabs-mode: nil; js-indent-level: 2 -*-

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var counter = 0;

function init(anaddon) {

  var thenode = document.getElementById("main-menu").firstElementChild;
  var thebtn = document.documentElement.getButton("accept");
  thebtn.parentNode.appendChild(document.querySelector("hbox.resizer"));
    thebtn.tooltipText = thenode.getAttribute("acceltext") || "";
    
  var extensionsStrings = document.getElementById("extensionsStrings");

  document.documentElement.setAttribute("addontype", anaddon.type);

  if (anaddon.iconURL) {
    var extensionIcon = document.getElementById("extensionIcon");
    extensionIcon.src = anaddon.iconURL;
  }

  document.title = extensionsStrings.getFormattedString("aboutWindowTitle", [ anaddon.name ]);
  var extensionName = document.getElementById("extensionName");
  extensionName.textContent = anaddon.name;

  var extensionVersion = document.getElementById("extensionVersion");
  if (anaddon.version) extensionVersion.setAttribute( 
        "value", extensionsStrings.getFormattedString(
            "aboutWindowVersionString", [anaddon.version]));
    else extensionVersion.hidden = true;

  var extensionDescription = document.getElementById("extensionDescription");
  if (anaddon.description) extensionDescription.textContent = anaddon.description;
        else extensionDescription.hidden = true;

  var numDetails = 0;

  var extensionCreator = document.getElementById("extensionCreator");
  if (anaddon.creator) {
    extensionCreator.setAttribute("value", anaddon.creator);
    numDetails++;
  } else {
    extensionCreator.hidden = true;
    var extensionCreatorLabel = document.getElementById("extensionCreatorLabel");
    extensionCreatorLabel.hidden = true;
  }

  var extensionHomepage = document.getElementById("extensionHomepage");
  var homepageURL = anaddon.homepageURL;
  if (homepageURL) {
    extensionHomepage.setAttribute("homepageURL", homepageURL);
    extensionHomepage.setAttribute("tooltiptext", homepageURL);
    numDetails++;
  } 
    else extensionHomepage.hidden = true;

  numDetails += appendToList("extensionDevelopers", "developersBox", anaddon.developers);
  numDetails += appendToList("extensionTranslators", "translatorsBox", anaddon.translators);
  numDetails += appendToList("extensionContributors", "contributorsBox", anaddon.contributors);

  var extensionDetailsBox = document.getElementById("extensionDetailsBox");
  if (numDetails == 0) extensionDetailsBox.hidden = true;

  var acceptButton = document.documentElement.getButton("accept");
  acceptButton.label = extensionsStrings.getString("aboutWindowCloseButton");
  
  setTimeout( function() { sizeToContent() }, 0 );
}   //  function init() {

function appendToList(aHeaderId, aNodeId, aItems) {
  var header = document.getElementById(aHeaderId);
  var node = document.getElementById(aNodeId);

  if (!aItems || aItems.length == 0) {
    header.hidden = true;
    return 0;
  }

  for (let currentItem of aItems) {
    var label = document.createElement("label");
    label.textContent = currentItem;
    label.setAttribute("class", "contributor");
    node.appendChild(label);
  }

  return aItems.length;
}

function loadHomepage(aEvent) {
    setTimeout( function() { window.close() }, 0 );
    openURL(aEvent.target.getAttribute("homepageURL"));
}

Components.utils.import("resource://gre/modules/AddonManager.jsm");
AddonManager.getAddonByID( "targetout@code.google.com", 
    function(anaddon) {
        if (++counter >> 1) init(anaddon);
        else window.onload = function() {
                    window.setTimeout( function(anaddon) 
                        { init(anaddon) }, 0, anaddon )
            }
    } );    //  AddonManager.getAddonByID

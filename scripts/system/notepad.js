'use strict';

//
//  notepad.js
//
//  Created by Mohammed Nafees on April 1 2018.
//  Copyright 2018 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

// Icon: Notepad by Lemon Liu from the Noun Project

(function() {
  var APP_NAME = "NOTEPAD";
  var APP_URL = "https://mnafees.github.io/work/hifi/scripts/notepad/webpage/index.html";
  var APP_ICON = "https://mnafees.github.io/work/hifi/scripts/notepad/tablet_app/icon.svg";

  var tablet = Tablet.getTablet("com.highfidelity.interface.tablet.system");

  var button = tablet.addButton({
    icon: APP_ICON,
    text: APP_NAME
  });

  function onClicked() {
    tablet.gotoWebScreen(APP_URL);
  }
  button.clicked.connect(onClicked);

  function cleanup() {
    tablet.removeButton(button);
  }
  Script.scriptEnding.connect(cleanup);
}());
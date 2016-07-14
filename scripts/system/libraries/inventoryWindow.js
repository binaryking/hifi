var GOOGLE_SHEETS_INVENTORY_HTML_URL = Script.resolvePath("../html/googleSheetsInventory.html");
var GOOGLE_API_CLIENT_ID = "172641056593-nemn2u9qbfe0ttvn92k1nd9eafiae3te.apps.googleusercontent.com";
var GOOGLE_API_REDIRECT_URI = "http://localhost:8415";
var GOOGLE_API_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
var GOOGLE_API_PROMPT = "none";
var GOOGLE_SPREADSHEET_ID_SETTING_KEY = "g_spreadsheet_id";
var GOOGLE_SHEETS_ENDPOINT = "https://sheets.googleapis.com/v4/spreadsheets";

InventoryWindow = function() {
    var that = {};

    var webView = new OverlayWebWindow({
        title: "Google Sheets Inventory",
        source: GOOGLE_SHEETS_INVENTORY_HTML_URL,
        toolWindow: true
    });

    var visible = false;

    webView.setVisible(visible);

    that.webView = webView;

    var accessToken = null;

    var gspreadsheetId = Settings.getValue(GOOGLE_SPREADSHEET_ID_SETTING_KEY);

    var gspreadsheetEntryCount = null;
    var gspreadsheetEntriesJSON = [];

    var selectedEntityIndex = null;

    that.setVisible = function(newVisible) {
        visible = newVisible;
        webView.setVisible(visible);
    };

    that.toggleVisible = function() {
        that.setVisible(!visible);
    };

    webView.webEventReceived.connect(function(data) {
        data = JSON.parse(data);
        if (data.type == "gauth") {
            auth();
        } else if (data.type == "gdeauth") {
            deauth();
        } else if (data.type == "storeentity") {
            if (!selectionManager.hasSelection()) {
                Window.alert("No entities have been selected.");
            } else {
                storeEntities();
            }
        } else if (data.type == "entityselected") {
            selectedEntityIndex = data.index;
        } else if (data.type == "rezentity") {
            if (selectedEntityIndex == null) {
                Window.alert("Please select an entity.");
            } else {
                rezEntity();
            }
        }
    });

    String.prototype.startsWith = function(str) {
        return (this.indexOf(str) === 0);
    };

    String.prototype.contains = function(s, i) {
        return this.indexOf(s, i) != -1;
    };

    function auth() {
        var authUrl = "https://accounts.google.com/o/oauth2/v2/auth?response_type=token";
        authUrl += "&client_id=" + GOOGLE_API_CLIENT_ID;
        authUrl += "&redirect_uri=" + GOOGLE_API_REDIRECT_URI;
        authUrl += "&scope=" + GOOGLE_API_SCOPE;
        authUrl += "&prompt=" + GOOGLE_API_PROMPT;

        var gauthWindow = new OverlayWebWindow({
            title: "Authenticate with Google",
            source: authUrl,
            width: 700,
            height: 500,
            visible: true
        });

        gauthWindow.fromQml.connect(function(message) {
            // keep a look on URL change to OAuth redirect_uri
            if (message.type) {
                if (message.type == "event" && message.name == "newUrlChanged") {
                    if (message.value.startsWith(GOOGLE_API_REDIRECT_URI)) {
                        gauthWindow.close();
                        if (message.value.contains("access_token")) {
                            accessToken = message.value.split("#")[1].split("=")[1].split("&")[0];
                            if (gspreadsheetId == "") {
                                // create new Google Spreadsheet
                                print("Creating new Google spreadsheet ...");
                                var url = GOOGLE_SHEETS_ENDPOINT; 
                                url += "?access_token=" + accessToken;

                                var request = new XMLHttpRequest();
                                request.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
                                request.open("POST", url, true);
                                request.onreadystatechange = function() {
                                    if (request.readyState === request.DONE) {
                                        if (request.status == 200) {
                                            var response = JSON.parse(request.responseText);
                                            Settings.setValue(GOOGLE_SPREADSHEET_ID_SETTING_KEY, response.spreadsheetId);
                                            gspreadsheetId = response.spreadsheetId;
                                        }
                                    }
                                };
                                request.send(JSON.stringify({
                                    properties: { title: "Hifi Entity Inventory" }
                                }));
                            }

                            var data = {
                                type: "authenticated"
                            };
                            webView.emitScriptEvent(JSON.stringify(data));
                            fetchSheetEntries();
                        } else {
                            accessToken = null;
                            Window.alert("There was an error authenticating with Google");
                        }
                    }
                }
            }
        });
    }

    function deauth() {
        accessToken = null;
        var data = {
            type: "deauthenticated"
        };
        webView.emitScriptEvent(JSON.stringify(data));
    }

    function fetchSheetEntries() {
        if (accessToken !== null) {
            var url = GOOGLE_SHEETS_ENDPOINT;
            url += "/" + gspreadsheetId + "/values:batchGet?ranges=A1:F";
            url += "&access_token=" + accessToken;

            var request = new XMLHttpRequest();
            request.open("GET", url, true);
            request.onreadystatechange = function() {
                if (request.readyState === request.DONE) {
                    if (request.status == 200) {
                        var response = JSON.parse(request.responseText);
                        var values = [];
                        if (response.valueRanges[0].values) {
                            values = response.valueRanges[0].values;
                        }
                        for (var i = 0; i < values.length; ++i) {
                            gspreadsheetEntriesJSON.push([values[i][4], values[i][5]]);
                        }
                        gspreadsheetEntryCount = values.length;
                        var data = {
                            type: "tableupdate",
                            entries: values
                        };
                        webView.emitScriptEvent(JSON.stringify(data));
                    }
                }                    
            };
            request.send();
        }
    }

    function storeEntities() {
        var entities = [];
        for (var i = 0; i < selectionManager.selections.length; ++i) {
            var properties = Entities.getEntityProperties(selectionManager.selections[i]);
            var newEntry = [];
            newEntry.push(properties.name);
            newEntry.push(properties.modelUrl);
            newEntry.push(properties.created);
            newEntry.push(1);
            var entityJSON = Entities.exportEntitiesToJSON(selectionManager.selections[i]);
            newEntry.push(entityJSON);
            newEntry.push(Clipboard.hash(entityJSON));
            entities.push(newEntry);
        }

        if (gspreadsheetEntryCount == null) {
            fetchSheetEntries();
        }

        var url = GOOGLE_SHEETS_ENDPOINT;
        url += "/" + gspreadsheetId + "/values:batchUpdate";
        url += "?access_token=" + accessToken;

        var request = new XMLHttpRequest();
        request.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
        request.open("POST", url, true);
        request.onreadystatechange = function() {
            if (request.readyState === request.DONE) {
                if (request.status == 200) {
                    fetchSheetEntries();
                }
            }
        };
        request.send(JSON.stringify({
            data: [{
                values: entities,
                range: "A" + (gspreadsheetEntryCount + 1) + ":F"
            }],
            valueInputOption: "RAW"
        }));
    }

    function rezEntity() {
        var json = gspreadsheetEntriesJSON[selectedEntityIndex][0];
        var checksum = gspreadsheetEntriesJSON[selectedEntityIndex][1];
        if (Clipboard.hash(json) == checksum) {
            var success = Entities.importEntitiesFromJSON(json);
            if (!success) {
                Window.alert("There was an error adding the requested entity.");
            }
        } else {
            Window.alert("The requested entity JSON does not match the checksum.");
        }
    }

    return that;
};
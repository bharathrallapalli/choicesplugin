define(["dojo/_base/declare", "ecm/widget/layout/_LaunchBarPane",
    "dojox/grid/EnhancedGrid", "dojo/data/ItemFileWriteStore",
    "dijit/form/TextBox", "ecm/model/Request", "dojo/_base/lang",
    "dojox/layout/TableContainer", "dijit/form/FilteringSelect",
    "dijit/form/Button", "dijit/layout/ContentPane", "dojo/store/Memory",
    "dojo/on", "ecm/widget/TitlePane", "dojo/dom-construct",
    "dojo/dom-style", "dojo/_base/array", "dojo/_base/connect",
    "ecm/widget/dialog/ConfirmationDialog", "dojo/_base/event",
    "ecm/widget/dialog/MessageDialog",
    "dojo/text!./templates/ChoicesFeature.html"
], function(declare,
    _LaunchBarPane, EnhancedGrid, ItemFileWriteStore, TextBox, Request,
    lang, TableContainer, FilteringSelect, Button, ContentPane, Memory,
    on, TitlePane, domConstruct, domStyle, array, connect, ConfirmationDialog,
    event, MessageDialog, template) {
    /**
     * @name choicesPluginDojo.ChoicesFeature
     * @class
     * @augments ecm.widget.layout._LaunchBarPane
     */
    return declare("choicesPluginDojo.ChoicesFeature", [_LaunchBarPane], {
        /** @lends choicesPluginDojo.ChoicesFeature.prototype */

        templateString: template,
        widgetsInTemplate: true,
        gridData: null,
        grid: null,
        gridStructure: null,
        tableContainer: null,
        objectTypeSelect: null,
        propertySelect: null,
        getDataButton: null,
        gridStore: null,
        criteriaTitlePane: null,
        resultsTitlePane: null,
        actionsPane: null,
        propertySelectValue: "",
        inProgressCheckPassed: false,

        _addActions: function() {
            var self = this;
            this.actionTableContainer = domConstruct.create("table", {});
            this.actionButtonCP = new ContentPane({
                content: this.actionTableContainer,
                style: "display:none"
            });
            this.resultsTitlePane.addChild(this.actionButtonCP);
            this.actionButtonTR = domConstruct.create("tr", {}, this.actionTableContainer);
            this.addButton = new Button({
                label: "Add",
                class: "solid searchTabButton",
                spanLabel: true,
                style: "margin-left:3%",
                onClick: lang.hitch(this, function() {
                    var inProgressEdits = array.filter(this.gridStore._arrayOfAllItems, function(item) {
                        return !item.VALUE[0] || !item.DISPNAME[0];
                    });

                    if (inProgressEdits.length > 0) {
                        this._showMessageDialog("Add Error", "Please add data to existing items before adding new ones");
                    } else {
                        this.grid.setSortIndex(1, false);
                        this.grid.sort();
                        var item = this.gridStore._arrayOfAllItems[0];
                        this.gridStore.newItem({
                            DEPON: item.DEPON,
                            DEPVALUE: item.DEPVALUE,
                            DISPNAME: "",
                            ISACTIVE: false,
                            ISUPDATED: true,
                            LANG: item.LANG,
                            LISTDISPNAME:item.LISTDISPNAME,
                            OBJECTSTORE: item.OBJECTSTORE,
                            OBJECTTYPE: item.OBJECTTYPE,
                            PROPERTY: item.PROPERTY,
                            VALUE: "",
                            id: this.gridStore._arrayOfAllItems.length + 1,
                            NEWINSERT: true
                        });
                        this.grid.sort();
                    }

                })
            });
            this._addTD(this.addButton.domNode, this.actionButtonTR, "margin-left:1%", "0%");
            this.saveButton = new Button({
                label: "Save",
                class: "solid searchTabButton",
                spanLabel: true,
                style: "margin-left:3%",
                onClick: lang.hitch(this, function() {

                    var inProgressEdits = array.filter(this.gridStore._arrayOfAllItems, function(item) {
                        return !item.VALUE[0] || !item.DISPNAME[0];
                    });
                    if (inProgressEdits.length > 0) {
                        this._showMessageDialog("Add Error", "Invalid Data! Please correct invalid records before saving");
                    } else {
                        var insertedRows = array.filter(this.gridStore._arrayOfAllItems, function(item) {
                            return item.NEWINSERT && item.NEWINSERT[0] == true;
                        });
                        var updatedRows = array.filter(this.gridStore._arrayOfAllItems, function(item) {
                            return item.NEWINSERT && item.NEWINSERT[0] == false && item.ISUPDATED && item.ISUPDATED[0] == true;
                        });
                        var requestParams = {
                            actionName: "setChoices",
                            objectType: this.objectTypeSelectValue,
                            property: this.propertySelectValue,
                            insertedRows: insertedRows,
                            updatedRows: updatedRows
                        };
                        console.log(requestParams);
                    }

                })
            });
            this._addTD(this.saveButton.domNode, this.actionButtonTR, "margin-left:1%", "0%");
            this.resetButton = new Button({
                label: "Reset",
                class: "solid searchTabButton",
                spanLabel: true,
                style: "margin-left:3%",
                onClick: lang.hitch(this, function() {
                    this._showConfirmationDialog("Are you sure you want to reset?", lang.hitch(this, function() {
                            this._resetGrid();
                            this._showMessageDialog("Reset", "Reset Successful");
                        }),
                        lang.hitch(this, function() {

                        }))
                })
            });
            this._addTD(this.resetButton.domNode, this.actionButtonTR, "margin-left:1%", "0%");
        },

        _resetGrid: function() {
            var requestParams = {
                actionName: "getChoices",
                objectType: this.objectTypeSelectValue,
                property: this.propertySelectValue
            };
            this._callService(requestParams, lang.hitch(this, function(response) {
                this._setGridStore(response.data);
            }));
        },

        createLayout: function() {
            this.logEntry("createLayout");
            this.borderContainerHeight = document.body.clientHeight - ((document.body.clientHeight * 5) / 100);
            this.screenWidth = window.screen.width - ((window.screen.width * 5) / 100);
            var topMargin = ((document.body.clientHeight * 5) / 100);
            var criteriaPaneHeight = (this.borderContainerHeight * 10) / 100;
            var gridPaneHeight = (this.borderContainerHeight * 71) / 100;
            this.mainContentPane = new ContentPane({
                region: "center",
                splitter: false,
                style: "height:" + this.borderContainerHeight + "px"
            });

            this.criteriaTitlePane = new TitlePane({
                title: 'Criteria',
                open: true
            });
            this.resultsTitlePane = new TitlePane({
                title: 'Results',
                open: false
            });
            this.gridContentPane = new ContentPane({
                style: "height:" + gridPaneHeight + "px; margin-top:1%"
            });
            this._addActions();
            this.resultsTitlePane.addChild(this.gridContentPane);
            this.mainContentPane.addChild(this.criteriaTitlePane);
            this.mainContentPane.addChild(this.resultsTitlePane);
            this.tableContainer = domConstruct.create("table", {
                style: "max-width:80%;height:" + criteriaPaneHeight + "px;margin-top: -1%;margin-left: 3%"
            });
            var tableCP = new ContentPane({
                content: this.tableContainer
            });
            this.criteriaTitlePane.addChild(tableCP);
            this.mainContentPane.placeAt(this.containerPane);
            this.logExit("createLayout");
        },

        postCreate: function() {
            this.logEntry("postCreate");
            this.inherited(arguments);
            this.createLayout();
            this._getObjectTypes();
            this._getProperties();
            this.getDataButton = new Button({
                label: "Get Choices",
                class: "solid searchTabButton",
                spanLabel: true,
                style: "margin-left:3%",
                onClick: lang.hitch(this, function() {
                    var requestParams = {
                        actionName: "getChoices",
                        objectType: this.objectTypeSelectValue,
                        property: this.propertySelectValue
                    };
                    this._callService(requestParams, lang.hitch(this, function(response) {
                        this._setGridStore(response.data);
                        this.gridStructure = this._getStructure();
                        this.grid = this._createGrid();
                        this.resultsTitlePane.set("open", true);
                        this.gridContentPane.set("content", this.grid);
                        this.grid.startup();
                        domStyle.set(this.actionButtonCP.domNode, "display", "");
                    }));
                })
            });
            this.logExit("postCreate");
        },

        _setGridStore: function(data) {
            this.gridData = {
                identifier: "id",
                items: data
            };
            this.gridStore = new ItemFileWriteStore({
                data: this.gridData
            });
            if (this.grid) {
                this.grid.setStore(this.gridStore);
            }
        },

        _createGrid: function() {
            this.logEntry("_createGrid");
            var self = this;
            dojo.require("dojox.grid.enhanced.plugins.IndirectSelection");
            var grid = new EnhancedGrid({
                store: this.gridStore,
                structure: this.gridStructure,
                onApplyCellEdit: function(inValue, inRowIndex, inField) {
                    self.grid.store._arrayOfAllItems[inRowIndex].ISUPDATED = true;
                },
                rowSelector: "20px",
            }, document.createElement('div'));
            return grid;
            this.logExit("_createGrid");
        },

        _getObjectTypes: function() {
            this.logEntry("_getObjectTypes");
            var self = this;
            var requestParams = {
                actionName: "getObjectTypes"
            };
            this._callService(requestParams, lang.hitch(this, function(response) {
                this.objectTypeSelect = this.getFilteringList(response.data, "Object Type", "objectType");
                on(this.objectTypeSelect, "change", lang.hitch(this, function(evt) {
                    if (!this.gridStore) {
                        self.propertySelect.set("value", "");
                        self._getProperties(evt);
                    }
                    if (this.gridStore && evt !== this.objectTypeSelectValue) {
                        if (this._checkForInProgressEdits()) {
                            this.inProgressCheckPassed = true;
                            this._showConfirmationDialog("Some changes have been made to current choices, Do you really want to change the Object Type ?",
                                lang.hitch(this, function() {
                                    this.objectTypeSelectValue = evt;
                                    self.propertySelect.set("value", "");
                                    this.propertySelectValue= "";
                                    var newStore = new dojo.data.ItemFileReadStore({data: {  identifier: "",  items: []}});
                                    this.grid.setStore(newStore);
                                    this.gridStore = null;
                                    self._getProperties(evt);
                                    domStyle.set(this.actionButtonCP.domNode, "display", "none");
                                }),
                                lang.hitch(this, function() {
                                    this.objectTypeSelect.set("value", this.propertySelectValue)
                                }));
                        } else {
                            self.propertySelect.set("value", "");
                            self._getProperties(evt);
                            this.objectTypeSelectValue = evt;
                        }
                    } else {
                        this.objectTypeSelectValue = evt;
                    }
                }));
                this.criteriaTr = domConstruct.create("tr", {}, this.tableContainer);
                this._addTD(this._createLabel("Object Type:").domNode, this.criteriaTr, "margin-left:1%", "3%");
                this._addTD(this.objectTypeSelect.domNode, this.criteriaTr, "margin-left:1%", "3%");
            }));
            this.logExit("_getObjectTypes");
        },

        _addTD: function(domNode, refNode, style, width) {
            this.logEntry("_addTD");
            var td = domConstruct.create("td", {
                style: style,
                width: width
            }, refNode);
            td.appendChild(domNode);
            this.logExit("_addTD");

        },

        _createLabel: function(labelName) {
            this.logEntry("_createLabel");
            var label = new ContentPane({
                content: labelName
            });
            return label;
            this.logExit("_createLabel");
        },

        _checkForInProgressEdits: function(message, node, evt, refNode) {
            var insertedRows = array.filter(this.gridStore._arrayOfAllItems, function(item) {
                return item.NEWINSERT && item.NEWINSERT[0] == true;
            });
            var updatedRows = array.filter(this.gridStore._arrayOfAllItems, function(item) {
                return item.NEWINSERT && item.NEWINSERT[0] == false && item.ISUPDATED && item.ISUPDATED[0] == true;
            });
            if (insertedRows.length > 0 || updatedRows.length > 0) {
                if (this.inProgressCheckPassed) {
                    this.inProgressCheckPassed = false;
                    return false;
                }
                return true;
            } else {
                return false;
            }
        },

        _getProperties: function(objectType) {
            this.logEntry("_getProperties");
            var self = this;
            var requestParams = {
                actionName: "getProperties",
                objectType: objectType
            };
            this._callService(requestParams, lang.hitch(this, function(response) {
                var self = this;
                if (!this.propertySelect) {
                    this.propertySelect = this.getFilteringList(response.data, "Property", "property");
                    on(this.propertySelect, "change", lang.hitch(this, function(evt) {
                        if (this.gridStore && evt !== this.propertySelectValue) {
                            if (this._checkForInProgressEdits()) {
                                this._showConfirmationDialog("Some changes have been made to current choices, Do you really want to change the Property?",
                                    lang.hitch(this, function() {
                                        this.propertySelectValue = evt;
                                        this._resetGrid();
                                    }),
                                    lang.hitch(this, function() {
                                        this.propertySelect.set("value", this.propertySelectValue)
                                    }));
                            } else {
                                this.propertySelectValue = evt;
                            }
                        } else {
                            this.propertySelectValue = evt;
                        }
                    }));
                    this._addTD(this._createLabel("Property:").domNode, this.criteriaTr, "margin-left:0%", "3%");
                    this._addTD(this.propertySelect.domNode, this.criteriaTr, "margin-left:0%", "3%");
                    this._addTD(this.getDataButton.domNode, this.criteriaTr, "margin-left:0%", "3%");
                } else {
                    var store = new Memory({
                        data: response.data
                    });
                    this.propertySelect.set("store", store);
                }

            }));
            this.logExit("_getProperties");
        },

        _showMessageDialog: function(title, text) {
            var messageDialog = new MessageDialog({
                title: title,
                text: text,
                style: "width:300px"
            });
            messageDialog.show();
        },

        _showConfirmationDialog: function(msg, onExecute, onCancel) {
            var dialog = new ConfirmationDialog({
                title: "Please Confirm",
                text: msg,
                onExecute: onExecute,
                onCancel: onCancel
            });
            dialog.show();
        },

        getFilteringList: function(data, labelval, name) {
            this.logEntry("getFilteringList");
            var store = new Memory({
                data: data
            });
            var list = new FilteringSelect({
                name: name,
                label: labelval,
                store: store,
                searchAttr: "name",
                style: "margin-left:3%"
            });
            return list;
            this.logExit("getFilteringList");
        },

        _getStructure: function() {
            this.logEntry("_getStructure");
            var structure = this.gridStructure = [
                [{
                    "name": "PROPERTY",
                    "field": "PROPERTY",
                    "editable": true,
                    "width": "10%"
                }, {
                    "name": "Column1",
                    "field": "id",
                    "hidden": true,
                    "width": "10%"
                }, {
                    "name": "LISTDISPNAME",
                    "field": "LISTDISPNAME",
                    "editable": true,
                    "hidden": true
                }, {
                    "name": "LANG",
                    "field": "LANG",
                    "editable": true,
                    "hidden": true
                }, {
                    "name": "DISPNAME",
                    "field": "DISPNAME",
                    "editable": true,
                    "width": "10%"
                }, {
                    "name": "VALUE",
                    "field": "VALUE",
                    "editable": true,
                    "width": "10%"
                }, {
                    "name": "DEPON",
                    "field": "DEPON",
                    "editable": true,
                    "hidden": true
                }, {
                    "name": "DEPVALUE",
                    "field": "DEPVALUE",
                    "editable": true,
                    "hidden": true
                }, {
                    "name": "ISACTIVE",
                    "field": "ISACTIVE",
                    "editable": true,
                    "width": "10%",
                    "type": dojox.grid.cells.Bool
                }, {
                    "name": "OBJECTSTORE",
                    "field": "OBJECTSTORE",
                    "editable": true,
                    "hidden": true
                }, {
                    "name": "OBJECTTYPE",
                    "field": "OBJECTTYPE",
                    "editable": true
                }, {
                    "name": "ISUPDATED",
                    "field": "ISUPDATED",
                    "value": false,
                    "hidden": true
                }, {
                    "name": "NEWINSERT",
                    "field": "NEWINSERT",
                    "hidden": true
                }]
            ];
            return structure;
            this.logExit("_getStructure");
        },

        _callService: function(requestParams, callbacks) {
            this.logEntry("_callService");
            requestParams.repositoryId = ecm.model.desktop.repositories[0].id;
            Request.invokePluginService("ChoicesPlugin", "GetDataService", {
                requestParams: requestParams,
                requestCompleteCallback: lang.hitch(this, function(response) {
                    if (callbacks)
                        callbacks(response);
                })
            });
            this.logExit("_callService");
        },

        setParams: function(params) {
            this.logEntry("setParams");
            this.logEntry("setParams", params);
            if (params) {
                if (!this.isLoaded && this.selected) {
                    this.loadContent();
                }
            }
            this.logExit("setParams");
        },

        loadContent: function() {
            this.logEntry("loadContent");
            if (!this.isLoaded) {
                this.isLoaded = true;
                this.needReset = false;
            }
            this.logExit("loadContent");
        },

        reset: function() {
            this.logEntry("reset");
            this.needReset = false;
            this.logExit("reset");
        }
    });
});
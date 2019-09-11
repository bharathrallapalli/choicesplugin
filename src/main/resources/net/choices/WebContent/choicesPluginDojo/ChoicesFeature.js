define(["dojo/_base/declare", "ecm/widget/layout/_LaunchBarPane",
    "dojox/grid/DataGrid", "dojo/data/ItemFileWriteStore",
    "dijit/form/TextBox", "ecm/model/Request", "dojo/_base/lang",
    "dojox/layout/TableContainer", "ecm/widget/FilteringSelect",
    "dijit/form/Button", "dijit/layout/ContentPane", "dojo/store/Memory",
    "dojo/on", "ecm/widget/TitlePane", "dojo/dom-construct",
    "dojo/dom-style", "dojo/_base/array", "dojo/_base/connect",
    "ecm/widget/dialog/ConfirmationDialog", "dojo/_base/event",
    "ecm/widget/dialog/MessageDialog", "dojo/aspect", "dijit/form/CheckBox",
    "dojo/text!./templates/ChoicesFeature.html"
], function(declare,
    _LaunchBarPane, DataGrid, ItemFileWriteStore, TextBox, Request,
    lang, TableContainer, FilteringSelect, Button, ContentPane, Memory,
    on, TitlePane, domConstruct, domStyle, array, connect, ConfirmationDialog,
    event, MessageDialog, aspect, CheckBox, template) {
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
        propertyTR: null,

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
                            DEPVALUE: "",
                            DISPNAME: "",
                            ISACTIVE: false,
                            ISUPDATED: true,
                            LANG: item.LANG,
                            LISTDISPNAME: item.LISTDISPNAME,
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
                        return !item.VALUE[0] || !item.DISPNAME[0] || !item.DEPVALUE[0];
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
                        var convertJSON = function(data) {
                            var valArray = [];
                            for (var i = 0; i < data.length; i++) {
                                var obj = {
                                    OBJECTTYPE: data[i].OBJECTTYPE[0],
                                    PROPERTY: data[i].PROPERTY[0],
                                    DISPNAME: data[i].DISPNAME[0],
                                    VALUE: data[i].VALUE[0],
                                    ISACTIVE: data[i].ISACTIVE[0],
                                    DEPVALUE: data[i].DEPVALUE[0],
                                    DEPON: data[i].DEPON[0]
                                };
                                valArray.push(obj);
                            }
                            return valArray;
                        }
                        var requestParams = {
                            actionName: "saveData",
                            objectType: this.objectTypeSelectValue,
                            property: this.propertySelectValue,
                            insertedRows: JSON.stringify(convertJSON(insertedRows)),
                            updatedRows: JSON.stringify(convertJSON(updatedRows))
                        };
                        this._callService(requestParams, lang.hitch(this, function(response) {
                            if (response.status && response.status === "success") {
                                this._showMessageDialog("Save Data", "Data saved successfully");
                                this._resetGrid();
                            } else {
                                this._showMessageDialog("Save Data", "Error saving data");
                            }
                        }));
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

        _createFilterTR: function() {
            var self = this;
            if (this.filerButtonTR) {
                this.filerButtonTR.innerHTML = "";
            } else {
                this.filterTableContainer = domConstruct.create("table", {
                    style: "margin-left:50%",
                    width: "50%"
                });
                this.actionButtonCP.domNode.appendChild(this.filterTableContainer);
                this.filerButtonTR = domConstruct.create("tr", {}, this.filterTableContainer);
            }

            var queryColumns = array.filter(this.gridStructure[0], function(column) {
                return !column.hidden;
            });
            var columnsToQuery = [];
            for (var i = 0; i < queryColumns.length; i++) {
                var columnTo = {};
                columnTo.id = queryColumns[i].name;
                columnTo.name = queryColumns[i].name;
                columnsToQuery.push(columnTo);
            }
            this.filterFieldSelect = this.getFilteringList(columnsToQuery, "Filter", "Filter", "margin-left:3%;");
            this._addTD(this.filterFieldSelect.domNode, this.filerButtonTR, "margin-left:1%", "0%");

            this.filterTextBox = new TextBox({
                placeholder: "Enter text to filter grid",
                value: "",
                style: "margin-left:0.5%; width:90%",
                onKeyUp: function(event) {
                    if (event.keyCode === 13) {
                        self.filterButton.onClick();
                    }
                }
            });
            this._addTD(this.filterTextBox.domNode, this.filerButtonTR, "margin-left:1%", "70%");

            this.filterButton = new Button({
                label: "Filter",
                class: "solid searchTabButton",
                spanLabel: true,
                style: "margin-left:1%",
                onClick: lang.hitch(this, function() {
                    console.log(this.filterTextBox.value);
                    var prop = this.filterFieldSelect.displayedValue;
                    var value = "*" + this.filterTextBox.value + "*";
                    var obj = {};
                    obj[prop] = value;
                    this.grid.filter(obj);
                })
            });
            this._addTD(this.filterButton.domNode, this.filerButtonTR, "margin-left:1%", "0%");
        },

        _resetGrid: function() {
            var requestParams = {
                actionName: "getChoices",
                objectType: this.objectTypeSelectValue,
                property: this.propertySelectValue
            };
            this._callService(requestParams, lang.hitch(this, function(response) {
                this._setGridStore(response.data);
                this._createFilterTR();
            }));
        },

        createLayout: function() {
            this.logEntry("createLayout");
            this.borderContainerHeight = document.body.clientHeight - ((document.body.clientHeight * 5) / 100);
            this.screenWidth = window.screen.width - ((window.screen.width * 5) / 100);
            var topMargin = ((document.body.clientHeight * 5) / 100);
            var criteriaPaneHeight = (this.borderContainerHeight * 15) / 100;
            var gridPaneHeight = (this.borderContainerHeight * 70) / 100;
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
                        this._setDEPONStore(response.deponData);
                        var setDepVal = true;
                        if (response.depValData && response.depValData.length > 0) {
                            setDepVal = false;
                            this._setDepvaluStore(response.depValData);
                        }
                        this.gridStructure = this._getStructure(setDepVal);
                        this.grid = this._createGrid();
                        connect.connect(this.grid, "onRowClick", this, function(row) {
                            row.target.focus();

                        })
                        this.resultsTitlePane.set("open", true);
                        this.gridContentPane.set("content", this.grid);
                        this.grid.startup();
                        domStyle.set(this.actionButtonCP.domNode, "display", "");
                    }));
                })
            });
            this.logExit("postCreate");
        },

        _setDEPONStore: function(data) {
            this.deponData = {
                identifier: "id",
                items: data
            };
            this.deponStore = new ItemFileWriteStore({
                data: this.deponData
            });
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
            var grid = new DataGrid({
                store: this.gridStore,
                structure: this.gridStructure,
                singleClickEdit: true,
                rowSelector: "20px",
            }, document.createElement('div'));
            this._createFilterTR();
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
                this.objectTypeSelect = this.getFilteringList(response.data, "Document Class", "objectType", "margin-left:3%; width:50%");
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
                                    this.propertySelectValue = "";
                                    var newStore = new dojo.data.ItemFileReadStore({
                                        data: {
                                            identifier: "",
                                            items: []
                                        }
                                    });
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
                this.propertyTR = domConstruct.create("tr", {}, this.tableContainer);
                this._addTD(this._createLabel("Object Type:").domNode, this.criteriaTr, "margin-left:1%", "3%");
                this._addTD(this.objectTypeSelect.domNode, this.criteriaTr, "margin-left:1%", "3%");
                this._getProperties();
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
                    this.propertySelect = this.getFilteringList(response.data, "Property", "property", "margin-left:3%; width:50%");
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
                    this._addTD(this._createLabel("Property:").domNode, this.propertyTR, "margin-left:0%", "3%");
                    this._addTD(this.propertySelect.domNode, this.propertyTR, "margin-left:0%", "3%");
                    this._addTD(this.getDataButton.domNode, this.propertyTR, "margin-left:-3%", "3%");
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

        getFilteringList: function(data, labelval, name, style) {
            this.logEntry("getFilteringList");
            var store = new Memory({
                data: data
            });
            var list = new FilteringSelect({
                name: name,
                label: labelval,
                store: store,
                searchAttr: "name",
                style: style
            });
            return list;
            this.logExit("getFilteringList");
        },

        _setDepvaluStore: function(data) {
            this.depvalueData = {
                identifier: "id",
                items: data
            };
            this.depvalueStore = new ItemFileWriteStore({
                data: this.depvalueData
            });
        },

        _getStructure: function(setDepVal) {
            this.logEntry("_getStructure");
            if (setDepVal) {
                this._setDepvaluStore([{
                    id: "",
                    value: ""
                }]);
            }
            var curObj = this;
            var textBoxFormatter = function(itemValue, rowId, cellId, cellField) {
                var readOnly = true;
                var item = curObj.grid.getItem(rowId);
                if (!item.NEWINSERT[0]) {
                    return itemValue;
                }
                if (!itemValue || item.NEWINSERT[0]) {
                    readOnly = false;
                }

                var editor = new TextBox({
                    value: itemValue,
                    style: "width:99%",
                    readOnly: readOnly,
                    onChange: function(value) {
                        var item = curObj.grid.getItem(rowId);
                        curObj.gridStore.setValue(item, cellId.field, value);
                    }
                });
                return editor;
            };

            var selectDEPONFormatter = function(itemValue, rowId, cellId, cellField) {
                var item = curObj.grid.getItem(rowId);
                if (itemValue && !item.NEWINSERT[0]) {
                    return itemValue;
                } else {
                    var editor = new FilteringSelect({
                        style: "width:99%",
                        value: itemValue,
                        store: curObj.deponStore,
                        searchAttr: "name",
                        onChange: function(value) {
                            var requestParams = {
                                actionName: "getDEPVALUE",
                                objectType: curObj.objectTypeSelectValue,
                                property: curObj.propertySelectValue,
                                depon: value
                            };
                            curObj._callService(requestParams, lang.hitch(this, function(response) {
                                curObj._setDepvaluStore(response.data);
                                var item = curObj.grid.getItem(rowId);
                                curObj.gridStore.setValue(item, cellId.field, value);
                            }));
                        }
                    });
                    var superClassCloseDropDown = ecm.widget.FilteringSelect.prototype.closeDropDown;
                    aspect.around(editor, 'closeDropDown', function(closeDropDown) {
                        return function(focus) {
                            if (focus == true) {
                                closeDropDown.apply(this, arguments);
                            }
                        }
                    });
                    editor.startup();
                    return editor;
                }
            };

            var selectDEPVALUEFormatter = function(itemValue, rowId, cellId, cellField) {
                var item = curObj.grid.getItem(rowId);
                if (itemValue && !item.NEWINSERT[0]) {
                    return itemValue;
                } else {
                    var editor = new FilteringSelect({
                        style: "width:99%",
                        store: curObj.depvalueStore,
                        value: itemValue,
                        searchAttr: "name",
                        onChange: function(value) {
                            var item = curObj.grid.getItem(rowId);
                            curObj.gridStore.setValue(item, cellId.field, value);
                        }
                    });
                    var superClassCloseDropDown = ecm.widget.FilteringSelect.prototype.closeDropDown;
                    aspect.around(editor, 'closeDropDown', function(closeDropDown) {
                        return function(focus) {
                            if (focus == true) {
                                closeDropDown.apply(this, arguments);
                            }
                        }
                    });
                    editor.startup();
                    return editor;
                }
            };

            var checkBoxFormatter = function(itemValue, rowId, cellId, cellField) {
                var editor = new CheckBox({
                    checked: itemValue,
                    onChange: function(newVal) {
                        var item = curObj.grid.getItem(rowId);
                        curObj.gridStore.setValue(item, cellId.field, newVal);
                        curObj.gridStore.setValue(item, "ISUPDATED", true);
                    }
                });
                editor.startup();
                return editor;
            };

            var structure = [
                [{
                    "name": "PROPERTY",
                    "field": "PROPERTY",
                    "hidden": true
                }, {
                    "name": "ID",
                    "field": "id",
                    "width": "10%",
                    "hidden": true
                }, {
                    "name": "LISTDISPNAME",
                    "field": "LISTDISPNAME",
                    "hidden": true
                }, {
                    "name": "LANG",
                    "field": "LANG",
                    "hidden": true
                }, {
                    "name": "DISPNAME",
                    "field": "DISPNAME",
                    "formatter": textBoxFormatter
                }, {
                    "name": "VALUE",
                    "field": "VALUE",
                    "formatter": textBoxFormatter
                }, {
                    "name": "DEPON",
                    "field": "DEPON",
                    "formatter": selectDEPONFormatter
                }, {
                    "name": "DEPVALUE",
                    "field": "DEPVALUE",
                    "formatter": selectDEPVALUEFormatter
                }, {
                    "name": "ISACTIVE",
                    "field": "ISACTIVE",
                    "formatter": checkBoxFormatter
                }, {
                    "name": "OBJECTTYPE",
                    "field": "OBJECTTYPE",
                    "hidden": true
                }, {
                    "name": "ISUPDATED",
                    "field": "ISUPDATED",
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
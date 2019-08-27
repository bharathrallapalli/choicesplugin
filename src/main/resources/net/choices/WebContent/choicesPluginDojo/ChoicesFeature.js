define(["dojo/_base/declare", "ecm/widget/layout/_LaunchBarPane",
        "dojox/grid/EnhancedGrid", "dojo/data/ItemFileWriteStore",
        "dijit/form/TextBox", "ecm/model/Request", "dojo/_base/lang",
        "dojox/layout/TableContainer", "dijit/form/FilteringSelect",
        "dijit/form/Button", "dijit/layout/ContentPane", "dojo/store/Memory",
        "dojo/on", "ecm/widget/TitlePane","dojo/dom-construct",
        "dojo/text!./templates/ChoicesFeature.html"], function (declare,
        _LaunchBarPane, EnhancedGrid, ItemFileWriteStore, TextBox, Request,
        lang, TableContainer, FilteringSelect, Button, ContentPane, Memory,
        on, TitlePane, domConstruct, template) {
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

        createLayout: function () {
            this.borderContainerHeight = document.body.clientHeight - ((document.body.clientHeight * 5) / 100);
            this.screenWidth = window.screen.width - ((window.screen.width * 5) / 100);
            var topMargin = ((document.body.clientHeight * 5) / 100);
            var criteriaPaneHeight = (this.borderContainerHeight*10)/100;
            var gridPaneHeight = (this.borderContainerHeight*70)/100;
            this.mainContentPane = new ContentPane({
                    region: "center",
                    splitter: false,
                    style: "height:" + this.borderContainerHeight + "px"
                });

            this.criteriaTitlePane = new TitlePane({
                    title: 'Criteria',
                    open: true,
                    style: "height:"+criteriaPaneHeight+"px"
                });
            this.resultsTitlePane = new TitlePane({
                    title: 'Results',
                    open: false
                });
            this.gridContentPane = new ContentPane({
                                    style: "height:"+criteriaPaneHeight+"px"
                                });
            this.resultsTitlePane.addChild(this.gridContentPane);
            this.mainContentPane.addChild(this.criteriaTitlePane);
            this.mainContentPane.addChild(this.resultsTitlePane);
            this.tableContainer = domConstruct.create("table",{style:"max-width:800px"});
            var tableCP = new ContentPane({
            content:this.tableContainer
            });
            this.criteriaTitlePane.addChild(tableCP);
            this.mainContentPane.placeAt(this.containerPane);
        },
        postCreate: function () {
            this.logEntry("postCreate");
            this.inherited(arguments);
            this.createLayout();
            this._getObjectTypes();
            this._getProperties();
            this.getDataButton = new Button({
                    label: "Get Choices",
                    class:"solid searchTabButton",
                    spanLabel:true,
                    style: "margin-left:3%",
                    onClick: lang.hitch(this, function () {
                        var requestParams = {
                            actionName: "getChoices",
                            objectType: this.objectTypeSelect.displayedValue,
                            property: this.propertySelect.displayedValue
                        };
                        this._callService(requestParams, lang.hitch(this, function (response) {
                                this.gridData = {
                                    identifier: "id",
                                    items: response.data
                                };
                                this.gridStore = new ItemFileWriteStore({
                                        data: this.gridData
                                    });
                                this.gridStructure = this._getStructure();
                                this.grid = this._createGrid();
                                this.resultsTitlePane.set("open", true);
                                this.gridContentPane.set("content", this.grid);
                                this.grid.startup();
                            }));
                    })
                });
            this.logExit("postCreate");
        },

        _createGrid: function () {
            var grid = new EnhancedGrid({
                    store: this.gridStore,
                    structure: this.gridStructure,
                    rowSelector: "20px"
                },document.createElement('div'));
            return grid;
        },

        _getObjectTypes: function () {
            var self = this;
            var requestParams = {
                actionName: "getObjectTypes"
            };
            this._callService(requestParams, lang.hitch(this, function (response) {
                    this.objectTypeSelect = this.getFilteringList(response.data, "Object Type", "objectType");
                    on(this.objectTypeSelect, "change", lang.hitch(this, function (evt) {
                            self._getProperties(self.objectTypeSelect.displayedValue);
                        }));
                    this.criteriaTr =  domConstruct.create("tr", {}, this.tableContainer);

                    this._addTD(this._createLabel("Object Type:").domNode);
                    this._addTD(this.objectTypeSelect.domNode);
                }));
        },

        _addTD: function(domNode){
           var td =  domConstruct.create("td", {style:"margin-left:1%",width:'5%'}, this.criteriaTr);
           td.appendChild(domNode);
        },

        _createLabel: function(labelName){
            var label = new ContentPane({
            content:labelName
            });
            return label;
        },

        _getProperties: function (objectType) {
            var self = this;
            var requestParams = {
                actionName: "getProperties",
                objectType: objectType
            };
            this._callService(requestParams, lang.hitch(this, function (response) {
                    if (!this.propertySelect) {
                        this.propertySelect = this.getFilteringList(response.data, "Property", "property");
                        this._addTD(this._createLabel("Property:").domNode);
                        this._addTD(this.propertySelect.domNode);
                        this._addTD(this.getDataButton.domNode);
                    } else {
                        var store = new Memory({
                                data: response.data
                            });
                        this.propertySelect.set("store", store);
                    }

                }));
        },

        getFilteringList: function (data, labelval, name) {
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
        },

        _getStructure: function () {
            var structure = this.gridStructure = [[{
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
                            "width": "10%"
                        }, {
                            "name": "LANG",
                            "field": "LANG",
                            "editable": true,
                            "width": "10%"
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
                            "width": "10%"
                        }, {
                            "name": "DEPVALUE",
                            "field": "DEPVALUE",
                            "editable": true,
                            "width": "10%"
                        }, {
                            "name": "ISACTIVE",
                            "field": "ISACTIVE",
                            "editable": true,
                            "width": "10%"
                        }, {
                            "name": "OBJECTSTORE",
                            "field": "OBJECTSTORE",
                            "editable": true,
                            "width": "10%"
                        }, {
                            "name": "OBJECTTYPE",
                            "field": "OBJECTTYPE",
                            "editable": true,
                            "width": "10%"
                        },
                    ]];
            return structure;
        },

        _callService: function (requestParams, callbacks) {
            Request.invokePluginService("ChoicesPlugin", "GetDataService", {
                requestParams: requestParams,
                requestCompleteCallback: lang.hitch(this, function (response) {
                    if (callbacks)
                        callbacks(response);
                })
            });
        },

        setParams: function (params) {
            this.logEntry("setParams", params);

            if (params) {

                if (!this.isLoaded && this.selected) {
                    this.loadContent();
                }
            }

            this.logExit("setParams");
        },

        loadContent: function () {
            this.logEntry("loadContent");

            if (!this.isLoaded) {
                this.isLoaded = true;
                this.needReset = false;
            }

            this.logExit("loadContent");
        },

        reset: function () {
            this.logEntry("reset");
            this.needReset = false;
            this.logExit("reset");
        }
    });
});
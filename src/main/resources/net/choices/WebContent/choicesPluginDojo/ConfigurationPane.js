define([
        "dojo/_base/declare",
        "dijit/_TemplatedMixin",
        "dijit/_WidgetsInTemplateMixin",
        "ecm/widget/admin/PluginConfigurationPane",
        "dojo/json",
        "dijit/form/Textarea",
        "dojo/text!./templates/ConfigurationPane.html"
    ],
    function(declare, _TemplatedMixin, _WidgetsInTemplateMixin, PluginConfigurationPane, dojoJSON, TextArea, template) {

        return declare("ChoicesPluginDojo.ConfigurationPane", [PluginConfigurationPane, _TemplatedMixin, _WidgetsInTemplateMixin], {

            templateString: template,
            widgetsInTemplate: true,

            load: function(callback) {
                if (this.configurationString) {
                    var configJSON = dojoJSON.parse(this.configurationString);
                    this.accessGroups.set("value", configJSON.configuration[0].value);
                }
            },
            _onParamChange: function() {
                var configArray = [];
                var accessGroupsVal = {
                    name: "accessGroups",
                    value: this.accessGroups.get('value')
                };
                configArray.push(accessGroupsVal);
                var configJson = {
                				"configuration" : configArray
                			};
                this.configurationString = JSON.stringify(configJson);
                this.onSaveNeeded(true);
            },
            validate: function() {
                return true;
            }
        });
    });
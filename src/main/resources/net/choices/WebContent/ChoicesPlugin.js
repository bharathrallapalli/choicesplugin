require(["dojo/_base/declare",
        "dojo/_base/lang",
        "ecm/model/Desktop",
        "dojo/_base/connect",
        "ecm/widget/SinglePropertyEditorFactory",
        "dojo/_base/array"
    ],
    function(declare, lang, Desktop, connect, SinglePropertyEditorFactory, array) {
        console.log("Entered Choice Plugin "+new Date());
        connect.connect(Desktop, "onLogin", function() {

            var superClassCreateEditorMethod = ecm.widget.SinglePropertyEditorFactory.prototype.createSinglePropertyEditor;
            lang.extend(SinglePropertyEditorFactory,{
                createSinglePropertyEditor: function(kwArgs, callback){
                    if(kwArgs.choiceList && kwArgs.choiceList.choices && kwArgs.values && kwArgs.values.length>0 && kwArgs.cardinality === "SINGLE"){
                        var value = kwArgs.values[0];
                        var choices = kwArgs.choiceList.choices;
                        var foundChoice = array.filter(choices, function(item){
                            return item.value === value;
                        });
                        if(foundChoice.length<1){
                            choices.push({
                                value:value,
                                name: value
                            });
                        }
                    }
                    return superClassCreateEditorMethod.apply(this,[kwArgs, callback]);
                }
            });

            var removeFeature = function(featureId) {
                var featuresAvailable = ecm.model.desktop.features;
                for (var j = 0; j < featuresAvailable.length; j++) {
                    var f = featuresAvailable[j];
                    if (f.id === featureId) {
                        ecm.model.desktop.layoutDijit.launchBarContainer.removeFeatureFromLayout(f);
                        ecm.model.desktop.removeFeature(f);
                    }
                }
            };

            var requestParams = {
                userId: ecm.model.desktop.userId,
                repositoryId: ecm.model.desktop.repositories[0].id
            };
            ecm.model.Request.invokePluginService("ChoicesPlugin", "UserProfileService", {
                requestParams: requestParams,
                requestCompleteCallback: lang.hitch(this, function(response) {
                    if(!(response && response.status == 'success' && response.data.featureAllowed)){
                        removeFeature("ChoicesFeature");
                    }
                    else{
                    console.log("feature stays");
                    }
                })
            });

        });
    });
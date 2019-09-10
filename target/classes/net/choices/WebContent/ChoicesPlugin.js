require(["dojo/_base/declare",
        "dojo/_base/lang",
        "ecm/model/Desktop",
        "dojo/_base/connect"
    ],
    function(declare, lang, Desktop, connect) {
        console.log("Entered Choice Plugin "+new Date());
        connect.connect(Desktop, "onLogin", function() {
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
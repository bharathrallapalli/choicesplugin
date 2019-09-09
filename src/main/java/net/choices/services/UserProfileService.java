package net.choices.services;

import com.ibm.ecm.extension.PluginLogger;
import com.ibm.ecm.extension.PluginResponseUtil;
import com.ibm.ecm.extension.PluginService;
import com.ibm.ecm.extension.PluginServiceCallbacks;
import com.ibm.ecm.json.JSONResponse;
import com.ibm.json.java.JSONArray;
import com.ibm.json.java.JSONObject;
import net.choices.util.CEUtil;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.ArrayList;
import java.util.List;

public class UserProfileService extends PluginService {
    @Override
    public String getId() {
        return "UserProfileService";
    }

    private PluginLogger logger = null;

    @Override
    public void execute(PluginServiceCallbacks callbacks, HttpServletRequest request, HttpServletResponse response) throws Exception {
        logger = callbacks.getLogger();
        logger.logInfo(this, "execute", "Entry");
        JSONResponse jsonResponse = new JSONResponse();
        CEUtil ceUtil = new CEUtil();
        try {
            String userId = request.getParameter("userId");
            String repositoryId = request.getParameter("repositoryId");
            JSONObject configurationObject = JSONObject.parse(callbacks.loadConfiguration());
            JSONArray configurations = (JSONArray) configurationObject.get("configuration");
            JSONObject accessGroupJSON = (JSONObject)configurations.get(0);
            List<String> accessGroups = new ArrayList<String>();
            for(String accessGroup: accessGroupJSON.get("value").toString().split(",")){
                System.out.printf("access group "+accessGroup.trim());
                accessGroups.add(accessGroup.trim());
            }
            JSONObject obj = new JSONObject();
            System.out.println("Domain "+callbacks.getP8Domain(repositoryId, null));
            System.out.println("Object Store "+callbacks.getP8ObjectStore(repositoryId));
            obj.put("featureAllowed",ceUtil.checkGroupMembership(userId, callbacks.getP8ObjectStore(repositoryId),accessGroups));
            jsonResponse.put("data",obj);
            jsonResponse.put("status","success");
        } catch (Exception e) {
            e.printStackTrace();
            jsonResponse.put("status", "error");
            jsonResponse.put("message", e.getMessage());
            logger.logError(this, "execute", e);
        }
        PluginResponseUtil.writeJSONResponse(request, response, jsonResponse, callbacks, "GetDataService");
        logger.logInfo(this, "execute", "Exit");
    }
}

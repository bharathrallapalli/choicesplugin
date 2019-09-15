package net.choices.services;

import com.filenet.api.core.ObjectStore;
import com.ibm.ecm.extension.PluginLogger;
import com.ibm.ecm.extension.PluginResponseUtil;
import com.ibm.ecm.extension.PluginService;
import com.ibm.ecm.extension.PluginServiceCallbacks;
import com.ibm.ecm.json.JSONResponse;
import com.ibm.json.java.JSONArray;
import com.ibm.json.java.JSONObject;
import net.choices.model.Choices;
import net.choices.util.CEUtil;
import net.choices.util.QueryOperations;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

public class GetDataService extends PluginService {

    public String getId() {
        return "GetDataService";
    }

    public String getOverriddenService() {
        return null;
    }

    private PluginLogger logger = null;

    public void execute(PluginServiceCallbacks callbacks,
                        HttpServletRequest request, HttpServletResponse response)
            throws Exception {
        logger = callbacks.getLogger();
        JSONResponse jsonResponse = new JSONResponse();
        CEUtil ceUtil = new CEUtil();
        try {
            logger.logInfo(this, "execute", "Enter");
            String actionName = request.getParameter("actionName");
            String repositoryId = request.getParameter("repositoryId");
            ObjectStore objectStore = callbacks.getP8ObjectStore(repositoryId);
            System.out.println("Repository ID "+repositoryId);
            String table_name = CEUtil.properties.getProperty(objectStore.get_SymbolicName()+"_TABLENAME");
            System.out.println("Table Name "+table_name);
            QueryOperations queryOperations = new QueryOperations(table_name);
            JSONArray returnArray = new JSONArray();
            if ("getObjectTypes".equals(actionName)) {
                logger.logDebug(this, "execute", "Getting objectTypes");
                System.out.println("OS Symbolic Name " + objectStore.get_SymbolicName());
                Map<String, String> classDefinitionsMap = ceUtil.getClassDefinitions(objectStore);
                Iterator it = classDefinitionsMap.entrySet().iterator();
                while (it.hasNext()) {
                    Map.Entry entry = (Map.Entry) it.next();
                    JSONObject jsonObject = new JSONObject();
                    jsonObject.put("name", entry.getValue());
                    jsonObject.put("id", entry.getKey());
                    returnArray.add(jsonObject);
                }
                logger.logDebug(this, "execute", "objectTypes returned " + returnArray.size());
            } else if ("getProperties".equals(actionName)) {
                String objectType = request.getParameter("objectType");
                logger.logDebug(this, "execute", "Getting properties for objectType " + objectType);
                List<String> properties = queryOperations.getProperties(objectType);
                Map<String, String> returnMap = ceUtil.getPropDisplayNames(objectStore, properties);
                Iterator it = returnMap.entrySet().iterator();
                while (it.hasNext()) {
                    Map.Entry entry = (Map.Entry) it.next();
                    JSONObject jsonObject = new JSONObject();
                    jsonObject.put("name", entry.getValue());
                    jsonObject.put("id", entry.getKey());
                    returnArray.add(jsonObject);
                }
                logger.logDebug(this, "execute", "Properties returned " + returnArray.size());
            } else if ("getDEPON".equals(actionName)) {
                String objectType = request.getParameter("objectType");
                String property = request.getParameter("property");
                logger.logDebug(this, "execute", "Getting DEPON for objectType and property " + objectType);
                List<String> deponList = queryOperations.getDEPON(objectType, property);
                for (String value : deponList) {
                    JSONObject jsonObject = new JSONObject();
                    jsonObject.put("name", value);
                    jsonObject.put("id", value);
                    returnArray.add(jsonObject);
                }
                logger.logDebug(this, "execute", "DEPON returned " + returnArray.size());
            } else if ("getDEPVALUE".equals(actionName)) {
                String objectType = request.getParameter("objectType");
                String property = request.getParameter("property");
                String depon = request.getParameter("depon");
                logger.logDebug(this, "execute", "Getting DEPVALUE for objectType, property and depon " + objectType);
                List<String> depvalueList = queryOperations.getDEPVALUES(objectType, property, depon);
                for (String value : depvalueList) {
                    JSONObject jsonObject = new JSONObject();
                    jsonObject.put("name", value);
                    jsonObject.put("id", value);
                    returnArray.add(jsonObject);
                }
                logger.logDebug(this, "execute", "DEPVALUE returned " + returnArray.size());
            } else if ("getChoices".equals(actionName)) {
                String objectType = request.getParameter("objectType");
                String property = request.getParameter("property");
                logger.logDebug(this, "execute", "Getting choices for objectType " + objectType + " and property " + property);
                List<Choices> choices = queryOperations.getChoices(objectType, property);
                for (int i = 0; i < choices.size(); i++) {
                    Choices choice = choices.get(i);
                    choice.setISUPDATED(false);
                    choice.setNEWINSERT(false);
                    JSONObject jsonObject = new JSONObject();
                    jsonObject.put("id", i + 1);
                    jsonObject.put("PROPERTY", choice.getPROPERTY());
                    jsonObject.put("LISTDISPNAME", choice.getLISTDISPNAME());
                    jsonObject.put("LANG", choice.getLANG());
                    jsonObject.put("DISPNAME", choice.getDISPNAME());
                    jsonObject.put("VALUE", choice.getVALUE());
                    jsonObject.put("DEPON", choice.getDEPON());
                    jsonObject.put("DEPVALUE", choice.getDEPVALUE());
                    jsonObject.put("ISUPDATED", choice.getISUPDATED());
                    jsonObject.put("NEWINSERT", choice.getISUPDATED());
                    if ("y".equals(choice.getISACTIVE())) {
                        jsonObject.put("ISACTIVE", true);
                    } else {
                        jsonObject.put("ISACTIVE", false);
                    }
                    jsonObject.put("OBJECTSTORE", choice.getOBJECTSTORE());
                    jsonObject.put("OBJECTTYPE", choice.getOBJECTTYPE());
                    returnArray.add(jsonObject);
                }
                List<String> deponList = queryOperations.getDEPON(objectType, property);
                List<String> depValList = null;
                if (deponList.size() == 1) {
                    depValList = queryOperations.getDEPVALUES(objectType, property, deponList.get(0));
                }
                JSONArray depValArray = new JSONArray();
                JSONArray deponArray = new JSONArray();
                for (String value : deponList) {
                    JSONObject jsonObject = new JSONObject();
                    jsonObject.put("name", value);
                    jsonObject.put("id", value);
                    deponArray.add(jsonObject);
                }
                for (String value : depValList) {
                    JSONObject jsonObject = new JSONObject();
                    jsonObject.put("name", value);
                    jsonObject.put("id", value);
                    depValArray.add(jsonObject);
                }
                jsonResponse.put("deponData", deponArray);
                jsonResponse.put("depValData", depValArray);
                logger.logDebug(this, "execute", "Returned choices for objectType " + objectType + " and property " + property + " = " + returnArray.size());
            }
            else if("saveData".equals(actionName)){
                JSONArray insertedRows = JSONArray.parse(request.getParameter("insertedRows"));
                JSONArray updatedRows = JSONArray.parse(request.getParameter("updatedRows"));
                List<Choices> choiceArray = new ArrayList<Choices>();
                for(int i=0; i<insertedRows.size(); i++){
                    JSONObject row = (JSONObject) insertedRows.get(i);
                    Choices choice = new Choices();
                    choice.setPROPERTY(row.get("PROPERTY").toString());
                    choice.setOBJECTTYPE(row.get("OBJECTTYPE").toString());
                    choice.setDISPNAME(row.get("DISPNAME").toString());
                    choice.setDEPON(row.get("DEPON").toString());
                    choice.setDEPVALUE(row.get("DEPVALUE").toString());
                    choice.setVALUE(row.get("VALUE").toString());
                    choice.setLISTDISPNAME(row.get("LISTDISPNAME").toString());
                    choice.setISACTIVE(row.get("ISACTIVE").toString());
                    choiceArray.add(choice);
                }
                if(choiceArray.size()>0)
                queryOperations.insertRecords(choiceArray);
                choiceArray = new ArrayList<Choices>();
                for(int i=0; i<updatedRows.size(); i++){
                    JSONObject row = (JSONObject) updatedRows.get(i);
                    Choices choice = new Choices();
                    choice.setPROPERTY(row.get("PROPERTY").toString());
                    choice.setOBJECTTYPE(row.get("OBJECTTYPE").toString());
                    choice.setDISPNAME(row.get("DISPNAME").toString());
                    choice.setDEPON(row.get("DEPON").toString());
                    choice.setDEPVALUE(row.get("DEPVALUE").toString());
                    choice.setVALUE(row.get("VALUE").toString());
                    choice.setVALUE(row.get("LISTDISPNAME").toString());
                    choice.setISACTIVE(row.get("ISACTIVE").toString());
                    choiceArray.add(choice);
                }
                if(choiceArray.size()>0)
                queryOperations.updateRecords(choiceArray);
                JSONObject jso = new JSONObject();
                jso.put("data","Records Inserted");
                returnArray.add(jso);
                jsonResponse.put("status","success");
            }
            jsonResponse.put("data", returnArray);
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

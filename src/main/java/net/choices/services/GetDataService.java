package net.choices.services;

import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import net.choices.model.Choices;
import net.choices.util.QueryOperations;

import com.ibm.ecm.extension.PluginResponseUtil;
import com.ibm.ecm.extension.PluginService;
import com.ibm.ecm.extension.PluginServiceCallbacks;
import com.ibm.ecm.json.JSONResponse;
import com.ibm.json.java.JSONArray;
import com.ibm.json.java.JSONObject;

public class GetDataService  extends PluginService {

	public String getId() {
		return "GetDataService";
	}

	public String getOverriddenService() {
		return null;
	}

	public void execute(PluginServiceCallbacks callbacks,
			HttpServletRequest request, HttpServletResponse response)
			throws Exception {
		String actionName = request.getParameter("actionName");
		QueryOperations queryOperatins = new QueryOperations();
		JSONResponse jsonResponse = new JSONResponse();
		JSONArray choiceArray = new JSONArray();
		if("getObjectTypes".equals(actionName)){
			List<Choices> choices = queryOperatins.getObjectTypes();
			for(Choices choice: choices){
				JSONObject jsonObject = new JSONObject();
				jsonObject.put("name", choice.getOBJECTTYPE());
				jsonObject.put("id", choice.getOBJECTTYPE());
				choiceArray.add(jsonObject);
			}
		}
		else if("getProperties".equals(actionName)){
			String objectType= request.getParameter("objectType");
			List<Choices> choices = queryOperatins.getProperties(objectType);
			for(Choices choice: choices){
				JSONObject jsonObject = new JSONObject();
				jsonObject.put("name", choice.getPROPERTY());
				jsonObject.put("id", choice.getPROPERTY());
				choiceArray.add(jsonObject);
			}
		}
		else if("getChoices".equals(actionName)){
			String objectType= request.getParameter("objectType");
			String property= request.getParameter("property");
			List<Choices> choices = queryOperatins.getChoices(objectType, property);
			for(int i=0;i<choices.size();i++){
                Choices choice= choices.get(i);
				JSONObject jsonObject = new JSONObject();
				jsonObject.put("id",i+1);
				jsonObject.put("PROPERTY", choice.getPROPERTY());
				jsonObject.put("LISTDISPNAME", choice.getLISTDISPNAME());
				jsonObject.put("LANG", choice.getLANG());
				jsonObject.put("DISPNAME", choice.getDISPNAME());
				jsonObject.put("VALUE", choice.getVALUE());
				jsonObject.put("DEPON", choice.getDEPON());
				jsonObject.put("DEPVALUE", choice.getDEPVALUE());
				jsonObject.put("ISACTIVE", choice.getISACTIVE());
				jsonObject.put("OBJECTSTORE", choice.getOBJECTSTORE());
				jsonObject.put("OBJECTTYPE", choice.getOBJECTTYPE());
				choiceArray.add(jsonObject);
			}
		}
		jsonResponse.put("data", choiceArray);
		PluginResponseUtil.writeJSONResponse(request, response, jsonResponse, callbacks, "GetDataService");
	}
}

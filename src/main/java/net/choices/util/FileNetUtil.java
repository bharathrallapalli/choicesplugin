package net.choices.util;

import com.filenet.api.admin.*;
import com.filenet.api.collection.ClassDescriptionSet;
import com.filenet.api.collection.PropertyDefinitionList;
import com.filenet.api.constants.Cardinality;
import com.filenet.api.constants.ChoiceType;
import com.filenet.api.constants.RefreshMode;
import com.filenet.api.constants.TypeID;
import com.filenet.api.core.Domain;
import com.filenet.api.core.Factory;
import com.filenet.api.core.ObjectStore;
import com.filenet.api.util.UserContext;

import javax.security.auth.Subject;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

public class FileNetUtil {
    //    public static List<String> getObjectTypes(ObjectStore objectStore){
//        ClassDescriptionSet classDescriptionSet = objectStore.get_ClassDescriptions();
//    }
    static ObjectStore os;
    static ClassDefinition documentClassDefinition;

    static {
        com.filenet.api.core.Connection conn = Factory.Connection.getConnection("http://192.168.56.101:9080/wsi/FNCEWS40MTOM");
        UserContext uc = UserContext.get();
        Subject sub = UserContext.createSubject(conn, "p8admin", "ecm@dmin1", null);
        uc.pushSubject(sub);
        Domain dom = Factory.Domain.getInstance(conn, null);
        os = Factory.ObjectStore.fetchInstance(dom, "CMTOS", null);
        documentClassDefinition = Factory.ClassDefinition.fetchInstance(os, "Document", null);
    }

    public static void main(String[] args) throws Exception {
        CEUtil ceUtil = new CEUtil();
        Map<String, String> classDefinitionsMap = ceUtil.getClassDefinitions(os);
        System.out.println(classDefinitionsMap.size());
        Iterator it = classDefinitionsMap.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry entry = (Map.Entry) it.next();
            System.out.println(entry.getKey()+" = "+entry.getValue());
        }
    }

    public ClassDefinition createClassDefinition(String className, String classDisplayName) {
        ClassDefinition subClass = documentClassDefinition.createSubclass();
        subClass.set_SymbolicName(className);
        LocalizedString objLocStrDisp = Factory.LocalizedString.createInstance();
        objLocStrDisp.set_LocalizedText(classDisplayName);
        objLocStrDisp.set_LocaleName(os.get_LocaleName());
        subClass.set_DisplayNames(Factory.LocalizedString.createList());
        subClass.get_DisplayNames().add(objLocStrDisp);
        subClass.save(RefreshMode.REFRESH);
        System.out.println("Class Created "+subClass.get_Name());
        return subClass;
    }

    public PropertyTemplateString createPropertyTemplate(ClassDefinition classDefinition, String propertyName) {
        PropertyTemplateString objPropTemplate = Factory.PropertyTemplateString.createInstance(os);
        objPropTemplate.set_Cardinality(Cardinality.SINGLE);
        LocalizedString locStr = Factory.LocalizedString.createInstance();
        locStr.set_LocalizedText(propertyName);
        locStr.set_LocaleName(os.get_LocaleName());
        objPropTemplate.set_DisplayNames(Factory.LocalizedString.createList());
        objPropTemplate.get_DisplayNames().add(locStr);
        objPropTemplate.save(RefreshMode.REFRESH);
        PropertyDefinitionString objPropDef = (PropertyDefinitionString) objPropTemplate.createClassProperty();
        PropertyDefinitionList objPropDefs = classDefinition.get_PropertyDefinitions();
        objPropDefs.add(objPropDef);
        classDefinition.save(RefreshMode.REFRESH);
        System.out.println("Property Created "+objPropTemplate.get_Name());
        return objPropTemplate;
    }

    public void setChoices(List<String> choiceList, PropertyTemplateString propertyTemplateString, String choiceListName){
        com.filenet.api.admin.ChoiceList objChoiceListStr = Factory.ChoiceList.createInstance(os);
        objChoiceListStr.set_DataType(TypeID.STRING);
        objChoiceListStr.set_ChoiceValues(Factory.Choice.createList());
        objChoiceListStr.set_DisplayName(choiceListName);
        for(String val: choiceList){
            Choice choice = Factory.Choice.createInstance();
            choice.set_ChoiceType(ChoiceType.STRING);
            choice.set_DisplayName(val);
            choice.set_ChoiceStringValue(val);
            objChoiceListStr.get_ChoiceValues().add(choice);
        }
        objChoiceListStr.save(RefreshMode.REFRESH);
        propertyTemplateString.set_ChoiceList(objChoiceListStr);
        propertyTemplateString.save(RefreshMode.REFRESH);
        System.out.println("Choices added "+objChoiceListStr.get_Name()+" for property "+propertyTemplateString.get_Name());
    }


}

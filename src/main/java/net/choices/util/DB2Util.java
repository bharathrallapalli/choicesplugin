package net.choices.util;



import com.filenet.api.admin.ClassDefinition;
import com.filenet.api.admin.PropertyTemplateString;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class DB2Util {

    static String getAlphaNumericString(int n)
    {

        // chose a Character random from this String
        String AlphaNumericString = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                + "0123456789"
                + "abcdefghijklmnopqrstuvxyz";

        // create StringBuffer size of AlphaNumericString
        StringBuilder sb = new StringBuilder(n);

        for (int i = 0; i < n; i++) {

            // generate a random number between
            // 0 to AlphaNumericString variable length
            int index
                    = (int)(AlphaNumericString.length()
                    * Math.random());

            // add Character one by one in end of sb
            sb.append(AlphaNumericString
                    .charAt(index));
        }

        return sb.toString();
    }
    public static void main(String[] args) {
        String jdbcClassName="com.ibm.db2.jcc.DB2Driver";
        String url="jdbc:db2://192.168.56.101:50000/CMTOS";
        String user="db2admin";
        String password="filenet@12";
        Connection connection = null;
        FileNetUtil fileNetUtil = new FileNetUtil();
        try {
            Class.forName(jdbcClassName);
            connection = DriverManager.getConnection(url, user, password);
            Statement stmt = connection.createStatement();
            for(int k=0; k<15; k++){
                String objectType = "VGRT_"+DB2Util.getAlphaNumericString(8);
                String objectTypeDisp = "VGRT "+DB2Util.getAlphaNumericString(8);
                ClassDefinition classDefinition = fileNetUtil.createClassDefinition(objectType, objectTypeDisp);
                for(int j=1; j<5; j++){
                    String prop = "Property"+DB2Util.getAlphaNumericString(7);
                    PropertyTemplateString propertyTemplateString = fileNetUtil.createPropertyTemplate(classDefinition, prop);
                    List<String> choices = new ArrayList<String>();
                    for(int i=2; i<7; i++){
                        String val =DB2Util.getAlphaNumericString(5);
                        int success=stmt.executeUpdate("insert into \"TOSCHEMA\".\"vgi_edschoices\" (OBJECTTYPE, PROPERTY, LISTDISPNAME, DISPNAME, VALUE, DEPON, DEPVALUE, ISACTIVE, OBJECTSTORE) " +
                                "values('"+objectType+"','"+prop+"','Annuities','"+val+"','"+val+"','VRGT_RMClient','Annuities','y',null)");
                        System.out.println("Inserted "+success);
                        choices.add(val);
                    }
                    String choiceListName = "ChoiceList_"+DB2Util.getAlphaNumericString(4);
                    fileNetUtil.setChoices(choices, propertyTemplateString, choiceListName);
                }
            }
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        } catch (SQLException e) {
            e.printStackTrace();
        }finally{
            if(connection!=null){
                try {
                    connection.close();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
        }
    }
}

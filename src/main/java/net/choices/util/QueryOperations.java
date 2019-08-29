package net.choices.util;

import net.choices.model.Choices;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class QueryOperations {

    private static Connection conn = null;

    static {
        try {
            conn = JDBCConnection.getConnection();
        } catch (Exception e) {
            System.out.printf("Failed to create JDBC Connection");
        }
    }

    public List<Choices> getObjectTypes() throws Exception{
		Statement stmt = null;
		List<Choices> choices = new ArrayList<Choices>();
		String query = "SELECT DISTINCT(OBJECTTYPE) FROM \"TOSCHEMA\".\"vgi_edschoices\"";
		try {
			stmt = conn.createStatement();
			ResultSet rs = stmt.executeQuery(query);
			while (rs.next()) {
				Choices choice = new Choices();
				String OBJECTTYPE = rs.getString("OBJECTTYPE");
				choice.setOBJECTTYPE(OBJECTTYPE);
				choices.add(choice);
			}
		} catch (Exception e) {
			e.printStackTrace();
		} finally {
			if (stmt != null) {
				stmt.close();
			}
		}
		return choices;
	}

	public List<Choices> getProperties(String objectType) throws Exception{
		Statement stmt = null;
		List<Choices> choices = new ArrayList<Choices>();
		String query = "SELECT DISTINCT(PROPERTY) FROM \"TOSCHEMA\".\"vgi_edschoices\" where OBJECTTYPE='"+objectType+"'";
		try {
			stmt = conn.createStatement();
			ResultSet rs = stmt.executeQuery(query);
			while (rs.next()) {
				Choices choice = new Choices();
				String PROPERTY = rs.getString("PROPERTY");
				choice.setPROPERTY(PROPERTY);
				choices.add(choice);
			}
		} catch (Exception e) {
			e.printStackTrace();
		} finally {
			if (stmt != null) {
				stmt.close();
			}
		}
		return choices;
	}

    public List<Choices> getChoices(String docClassName, String propertyName) throws Exception {
        Statement stmt = null;
        List<Choices> choices = new ArrayList<Choices>();
        String query = "SELECT OBJECTTYPE, PROPERTY, LISTDISPNAME, LANG, DISPNAME, VALUE, DEPON, DEPVALUE, " +
                "ISACTIVE, OBJECTSTORE FROM \"TOSCHEMA\".\"vgi_edschoices\" where " +
                "OBJECTTYPE='" + docClassName + "' \n" +
                "and PROPERTY='" + propertyName + "'";
        try {
            stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery(query);
            while (rs.next()) {
                Choices choice = new Choices();
                String OBJECTTYPE = rs.getString("OBJECTTYPE");
                String PROPERTY = rs.getString("PROPERTY");
                String LISTDISPNAME = rs.getString("LISTDISPNAME");
                String DISPNAME = rs.getString("DISPNAME");
                String LANG = rs.getString("LANG");
                String VALUE = rs.getString("VALUE");
                String DEPON = rs.getString("DEPON");
                String DEPVALUE = rs.getString("DEPVALUE");
                String ISACTIVE = rs.getString("ISACTIVE");
                String OBJECTSTORE = rs.getString("OBJECTSTORE");
                choice.setOBJECTSTORE(OBJECTSTORE);
                choice.setDEPON(DEPON);
                choice.setDEPVALUE(DEPVALUE);
                choice.setDISPNAME(DISPNAME);
                choice.setOBJECTTYPE(OBJECTTYPE);
                choice.setPROPERTY(PROPERTY);
                choice.setLANG(LANG);
                choice.setLISTDISPNAME(LISTDISPNAME);
                choice.setVALUE(VALUE);
                choice.setISACTIVE(ISACTIVE);
                choices.add(choice);
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (stmt != null) {
                stmt.close();
            }
        }
        return choices;
    }

}

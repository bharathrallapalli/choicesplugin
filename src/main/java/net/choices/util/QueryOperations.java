package net.choices.util;

import net.choices.model.Choices;

import java.sql.Connection;
import java.sql.PreparedStatement;
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

    public List<Choices> getObjectTypes() throws Exception {
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

    public List<String> filterClassDefinitions(List<String> classDefinitions) throws Exception {
        Statement stmt = null;
        List<Choices> choices = new ArrayList<Choices>();
        String query = "SELECT DISTINCT(OBJECTTYPE) FROM \"TOSCHEMA\".\"vgi_edschoices\" where OBJECTTYPE IN ";
        String whereClause = "(";
        for (String className : classDefinitions) {
            whereClause = whereClause + ("'"+className + "',");
        }
        StringBuilder queryBuilder = new StringBuilder(whereClause);
        queryBuilder.replace(whereClause.lastIndexOf(","), whereClause.lastIndexOf(",") + 1, ")");
        whereClause = queryBuilder.toString();
        query = query + whereClause;
        System.out.println("Class Definition Filter Query "+query);
        try {
            stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery(query);
            classDefinitions.clear();
            while (rs.next()) {
                String OBJECTTYPE = rs.getString("OBJECTTYPE");
                classDefinitions.add(OBJECTTYPE);
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (stmt != null) {
                stmt.close();
            }
        }

        return classDefinitions;
    }

    public List<Choices> getProperties(String objectType) throws Exception {
        Statement stmt = null;
        List<Choices> choices = new ArrayList<Choices>();
        String query = "SELECT DISTINCT(PROPERTY) FROM \"TOSCHEMA\".\"vgi_edschoices\" where OBJECTTYPE='" + objectType + "'";
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

    public boolean insertRecords(List<Choices> choices) throws Exception{
        boolean result = false;
        String query = "INSERT INTO \"TOSCHEMA\".\"vgi_edschoices\" " +
                "(OBJECTTYPE, PROPERTY, LISTDISPNAME, LANG, DISPNAME, VALUE, DEPON, DEPVALUE, ISACTIVE, c) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        PreparedStatement ps = conn.prepareStatement(query);
        try{
            for (Choices choice : choices) {
                ps.setString(1, choice.getOBJECTTYPE());
                ps.setString(2, choice.getPROPERTY());
                ps.setString(3, choice.getLISTDISPNAME());
                ps.setString(4, choice.getLANG());
                ps.setString(5, choice.getDISPNAME());
                ps.setString(6, choice.getVALUE());
                ps.setString(7, choice.getDEPON());
                ps.setString(8, choice.getDEPVALUE());
                ps.setString(9, choice.getISACTIVE());
                ps.setString(10, choice.getOBJECTSTORE());
                ps.addBatch();
            }
            ps.executeBatch();
            result = true;
        }
        catch (Exception e){
            e.printStackTrace();
        }
        finally {
            if (ps != null) {
                ps.close();
            }
        }
        return result;
    }

}

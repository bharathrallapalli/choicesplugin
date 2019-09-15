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
    public String table_name;

    static {
        try {
            conn = JDBCConnection.getConnection();
        } catch (Exception e) {
            System.out.printf("Failed to create JDBC Connection");
        }
    }

    public QueryOperations(String table_name) {
        this.table_name = table_name;
    }

    public QueryOperations() {

    }

    public List<Choices> getObjectTypes() throws Exception {
        Statement stmt = null;
        List<Choices> choices = new ArrayList<Choices>();
        String query = "SELECT DISTINCT(OBJECTTYPE) FROM " + table_name;
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
        String query = "SELECT DISTINCT(OBJECTTYPE) FROM " + table_name + " where OBJECTTYPE IN ";
        String whereClause = "(";
        for (String className : classDefinitions) {
            whereClause = whereClause + ("'" + className + "',");
        }
        StringBuilder queryBuilder = new StringBuilder(whereClause);
        queryBuilder.replace(whereClause.lastIndexOf(","), whereClause.lastIndexOf(",") + 1, ")");
        whereClause = queryBuilder.toString();
        query = query + whereClause;
        System.out.println("Class Definition Filter Query " + query);
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

    public List<String> getProperties(String objectType) throws Exception {
        Statement stmt = null;
        List<String> properties = new ArrayList<String>();
        String query = "SELECT DISTINCT(PROPERTY) FROM " + table_name + " where OBJECTTYPE='" + objectType + "'";
        System.out.println("Get Props Query " + query);
        try {
            stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery(query);
            while (rs.next()) {
                String PROPERTY = rs.getString("PROPERTY");
                properties.add(PROPERTY);
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (stmt != null) {
                stmt.close();
            }
        }
        return properties;
    }

    public List<String> getDEPON(String objectType, String property) throws Exception {
        Statement stmt = null;
        List<String> values = new ArrayList<String>();
        String query = "SELECT DISTINCT(DEPON) FROM " + table_name + " where " +
                "OBJECTTYPE='" + objectType + "' \n" +
                "and PROPERTY='" + property + "'";
        try {
            System.out.println("Getting DEPON " + query);
            stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery(query);
            while (rs.next()) {
                String DEPON = rs.getString("DEPON");
                values.add(DEPON);
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (stmt != null) {
                stmt.close();
            }
        }
        return values;
    }

    public List<String> getDEPVALUES(String objectType, String property, String depon) throws Exception {
        Statement stmt = null;
        List<String> values = new ArrayList<String>();
        String query = "SELECT DISTINCT(DEPVALUE) FROM " + table_name + " where " +
                "OBJECTTYPE='" + objectType + "' \n" +
                "and PROPERTY='" + property + "' and DEPON = '" + depon + "'";
        try {
            System.out.println("Getting DEPAVLUE " + query);
            stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery(query);
            while (rs.next()) {
                String DEPVALUE = rs.getString("DEPVALUE");
                values.add(DEPVALUE);
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (stmt != null) {
                stmt.close();
            }
        }
        return values;
    }

    public List<Choices> getChoices(String docClassName, String propertyName) throws Exception {
        Statement stmt = null;
        List<Choices> choices = new ArrayList<Choices>();
        String query = "SELECT OBJECTTYPE, PROPERTY, LISTDISPNAME, LANG, DISPNAME, VALUE, DEPON, DEPVALUE, " +
                "ISACTIVE, OBJECTSTORE FROM " + table_name + " where " +
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

    public boolean insertRecords(List<Choices> choices) throws Exception {
        boolean result = false;
        String query = "INSERT INTO " + table_name + " " +
                "(OBJECTTYPE, PROPERTY,  DISPNAME, VALUE, DEPON, DEPVALUE, ISACTIVE, LISTDISPNAME) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        PreparedStatement ps = conn.prepareStatement(query);
        try {
            for (Choices choice : choices) {
                ps.setString(1, choice.getOBJECTTYPE());
                ps.setString(2, choice.getPROPERTY());
                ps.setString(3, choice.getDISPNAME());
                ps.setString(4, choice.getVALUE());
                ps.setString(5, choice.getDEPON());
                ps.setString(6, choice.getDEPVALUE());
                if ("true".equals(choice.getISACTIVE())) {
                    ps.setString(7, "y");
                } else if ("false".equals(choice.getISACTIVE())) {
                    ps.setString(7, "n");
                }
                ps.setString(8, choice.getLISTDISPNAME());
                ps.addBatch();
            }
            ps.executeBatch();
            result = true;
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (ps != null) {
                ps.close();
            }
        }
        return result;
    }

    public boolean updateRecords(List<Choices> choices) throws Exception {
        boolean result = false;
        String query = "UPDATE " + table_name + " " +
                "SET ISACTIVE=? WHERE OBJECTTYPE = ? and PROPERTY = ? and DISPNAME = ? and VALUE = ?";
        PreparedStatement ps = conn.prepareStatement(query);
        try {
            for (Choices choice : choices) {
                if ("true".equals(choice.getISACTIVE())) {
                    ps.setString(1, "y");
                } else if ("false".equals(choice.getISACTIVE())) {
                    ps.setString(1, "n");
                }
                ps.setString(2, choice.getOBJECTTYPE());
                ps.setString(3, choice.getPROPERTY());
                ps.setString(4, choice.getDISPNAME());
                ps.setString(5, choice.getVALUE());
                ps.addBatch();
            }
            ps.executeBatch();
            result = true;
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (ps != null) {
                ps.close();
            }
        }
        return result;
    }

}

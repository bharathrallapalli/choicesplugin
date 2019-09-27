package net.choices.util;

import com.filenet.api.collection.RepositoryRowSet;
import com.filenet.api.collection.UserSet;
import com.filenet.api.core.Factory;
import com.filenet.api.core.ObjectStore;
import com.filenet.api.query.RepositoryRow;
import com.filenet.api.query.SearchSQL;
import com.filenet.api.query.SearchScope;
import com.filenet.api.security.Group;
import com.filenet.api.security.User;

import java.io.InputStream;
import java.util.*;

public class CEUtil {
    public static Properties properties;

    static {
        InputStream input = CEUtil.class.getClassLoader().getResourceAsStream("config.properties");
        try {
            System.out.println("Property input stream "+input);
            properties= new Properties();
            properties.load(input);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private SearchSQL getSearchSQL(String query) {
        SearchSQL sqlObject = new SearchSQL();
        sqlObject.setQueryString(query);
        return sqlObject;
    }


    public Map<String, String> getClassDefinitions(ObjectStore objectStore) throws Exception {

        SearchScope searchScope = new SearchScope(objectStore);
        QueryOperations queryOperations = new QueryOperations(CEUtil.properties.getProperty(objectStore.get_SymbolicName()+"_TABLENAME"));
        String query = "SELECT [Id], [Name], [DisplayName], [SymbolicName] FROM [ClassDefinition]";
        RepositoryRowSet rowSet = searchScope.fetchRows(getSearchSQL(query), null, null, new Boolean(true));
        Iterator<RepositoryRow> rowIterator = rowSet.iterator();
        Map<String, String> returnMap = new HashMap<String, String>();
        int count=0;
        List<String> symolicNameList = new ArrayList<String>();
        while (rowIterator.hasNext()) {
            count++;
            RepositoryRow row = rowIterator.next();
            String symbolicName = row.getProperties().getStringValue("SymbolicName");
            String displayName = row.getProperties().getStringValue("DisplayName");
            symolicNameList.add(symbolicName);
            returnMap.put(symbolicName, displayName);
        }
        symolicNameList = queryOperations.filterClassDefinitions(symolicNameList);
        returnMap.keySet().retainAll(symolicNameList);
        System.out.println("Query "+query);
        System.out.println("Results returned = "+count);
        return returnMap;
    }

    public Map<String, String> getPropDisplayNames(ObjectStore objectStore, List<String> symbolicNameList) throws Exception {

        SearchScope searchScope = new SearchScope(objectStore);
        QueryOperations queryOperations = new QueryOperations();
        String query = "SELECT [This], [DisplayName], [SymbolicName], [Id] FROM [PropertyTemplate] WHERE [SymbolicName] IN ";
        String whereClause = "(";
        for (String symbolicName : symbolicNameList) {
            whereClause = whereClause + ("'"+symbolicName + "',");
        }
        StringBuilder queryBuilder = new StringBuilder(whereClause);
        queryBuilder.replace(whereClause.lastIndexOf(","), whereClause.lastIndexOf(",") + 1, ")");
        whereClause = queryBuilder.toString();
        query = query + whereClause;
        RepositoryRowSet rowSet = searchScope.fetchRows(getSearchSQL(query), null, null, new Boolean(true));
        Iterator<RepositoryRow> rowIterator = rowSet.iterator();
        Map<String, String> returnMap = new HashMap<String, String>();
        int count=0;
        while (rowIterator.hasNext()) {
            count++;
            RepositoryRow row = rowIterator.next();
            String symbolicName = row.getProperties().getStringValue("SymbolicName");
            String displayName = row.getProperties().getStringValue("DisplayName");
            returnMap.put(symbolicName, displayName);
        }
        System.out.println("Query "+query);
        System.out.println("Results returned = "+count);
        return returnMap;
    }

    public boolean checkGroupMembership(String userId, ObjectStore objectStore, List<String> accessGroups) throws Exception{
        objectStore = Factory.ObjectStore.fetchInstance(objectStore.get_Domain(), objectStore.get_Id(), null);
        System.out.println("Connection "+objectStore.getConnection());
        for(String accessGroup: accessGroups){
            System.out.println("Group Name : "+accessGroup);
            Group group = Factory.Group.fetchInstance(objectStore.getConnection(), accessGroup, null);
            UserSet userSet = group.get_Users();
            Iterator<User> userIterator = userSet.iterator();
            System.out.println("Users :");
            while (userIterator.hasNext()){
                User user = userIterator.next();
                System.out.println(user.get_Name()+" "+ user.get_ShortName() + " "+user.get_Email());
                if(userId.equals(user.get_ShortName()) || userId.equals(user.get_Email())){
                    return true;
                }
            }
        }
        return false;
    }
}

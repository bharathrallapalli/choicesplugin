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
    static Properties properties;

    static {
        InputStream input = CEUtil.class.getClassLoader().getResourceAsStream("config.properties");
        try {
            properties.load(input);
            input.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private SearchSQL getSearchSQL(String query) {
        SearchSQL sqlObject = new SearchSQL();
        sqlObject.setQueryString(query);
        return sqlObject;
    }

    public Map<String, String> getClassDefinitions(ObjectStore objectStore) {

        SearchScope searchScope = new SearchScope(objectStore);
        String query = "SELECT [Id], [Name], [DisplayName], [SymbolicName] FROM [ClassDefinition] WHERE [SymbolicName] like 'VGRT_%'";
        RepositoryRowSet rowSet = searchScope.fetchRows(getSearchSQL(query), null, null, new Boolean(true));
        Iterator<RepositoryRow> rowIterator = rowSet.iterator();
        Map<String, String> returnMap = new HashMap<String, String>();
        int count=0;
        while (rowIterator.hasNext()) {
            count++;
            RepositoryRow row = rowIterator.next();
            returnMap.put(row.getProperties().getStringValue("SymbolicName"), row.getProperties().getStringValue("DisplayName"));
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
                System.out.println(user.get_Name()+" "+ user.get_ShortName());
                if(userId.equals(user.get_ShortName())){
                    return true;
                }
            }
        }
        return false;
    }
}

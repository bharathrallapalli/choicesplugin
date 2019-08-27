package net.choices.util;


import javax.naming.Context;
import javax.naming.InitialContext;
import javax.sql.DataSource;
import java.sql.Connection;


public class JDBCConnection  {
	
public static Connection getConnection() throws Exception{
	Connection conn=null;
	Context ctx=new InitialContext();                       
	DataSource ds=(DataSource)ctx.lookup("jdbc/EDSDB");   
	conn=ds.getConnection();
	return conn;
}
}

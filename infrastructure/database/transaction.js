import MySQLConnection from "./connection";

export async function withTransaction( callback ) {
    const connection = await MySQLConnection.getConnection();
    
    try {
        await connection.beginTransaction();

        const result = await callback(connection);

        await connection.commit();
        return result;
        
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}
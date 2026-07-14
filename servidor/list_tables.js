import mysql from 'mysql2/promise';

async function listTables() {
    const pool = mysql.createPool({ host: 'localhost', user: 'root', password: '', database: 'sgost' });
    const [tables] = await pool.query('SHOW TABLES');
    console.log('Tables:', tables);
    
    const [usuarios] = await pool.query('SELECT * FROM usuarios WHERE usuario = "admi1"');
    console.log('Admi1:', usuarios);
    
    process.exit(0);
}
listTables().catch(console.error);

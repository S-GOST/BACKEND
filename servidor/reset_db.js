import mysql from 'mysql2/promise';

async function resetDB() {
    const pool = mysql.createPool({ host: 'localhost', user: 'root', password: '', database: 'sgost' });
    
    await pool.query('SET FOREIGN_KEY_CHECKS = 0;');

    // Truncate transaction tables to reset IDs to 1
    const tablesToTruncate = [
        'historial',
        'informe',
        'detalles_orden_servicio',
        'orden_servicio',
        'comprobante',
        'motos'
    ];

    for (const table of tablesToTruncate) {
        await pool.query(`TRUNCATE TABLE ${table}`);
        console.log(`Truncated ${table}`);
    }

    // Delete users except Admi1
    await pool.query('DELETE FROM usuarios WHERE usuario != "Admi1"');
    console.log('Deleted all users except Admi1');
    
    // Reset AUTO_INCREMENT for usuarios. Since we don't know the exact max ID easily without logic,
    // we can just try to set it to 2.
    await pool.query('ALTER TABLE usuarios AUTO_INCREMENT = 1');
    console.log('Reset AUTO_INCREMENT for usuarios');

    await pool.query('SET FOREIGN_KEY_CHECKS = 1;');
    
    process.exit(0);
}
resetDB().catch(e => {
    console.error(e);
    process.exit(1);
});


import mysql from 'mysql2/promise';
const config = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'sgost'
};
(async () => {
  const connection = await mysql.createConnection(config);
  try {
    const [result] = await connection.query(
      \INSERT INTO productos (ID_PRODUCTOS, ID_CATEGORIA, Marca, Nombre, precio_venta, stock, Estado) VALUES (?, ?, ?, ?, ?, ?, ?)\,
      [4, 2, 'a', 'a', 10, 0, 'Activo']
    );
    console.log('Insert success:', result);
  } catch(e) {
    console.error('Insert error:', e.code, e.message);
  }
  process.exit();
})();


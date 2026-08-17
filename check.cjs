require('dotenv').config();
const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 20000 });
(async()=>{
  await c.connect();
  const o = await c.query('SELECT count(*) n FROM orders');
  const r = await c.query('SELECT count(*) n FROM order_returns');
  console.log('orders:', o.rows[0].n, '| returns:', r.rows[0].n);
  await c.end(); process.exit(0);
})().catch(e=>{console.error('ERR', e.message); process.exit(1);});

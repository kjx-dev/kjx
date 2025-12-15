const { PrismaClient } = require('@prisma/client');
(async ()=>{
  const p = new PrismaClient()
  await p.$connect()
  const tables = await p.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
  console.log('tables', tables.map(t=>t.name))
  const hasFav = Array.isArray(tables) && tables.some(t => String(t.name)==='favorites')
  if (!hasFav){
    console.log('creating favorites table')
    await p.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS favorites (\n'+
      '  fav_id INTEGER PRIMARY KEY AUTOINCREMENT,\n'+
      '  user_id INTEGER NOT NULL,\n'+
      '  post_id INTEGER NOT NULL,\n'+
      '  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n'+
      '  FOREIGN KEY(post_id) REFERENCES posts(post_id) ON DELETE CASCADE\n'+
      ')'
    )
    await p.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS favorites_unique ON favorites(user_id, post_id)')
    await p.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS favorites_user_idx ON favorites(user_id)')
    await p.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS favorites_post_idx ON favorites(post_id)')
    const tables2 = await p.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    console.log('tables_after', tables2.map(t=>t.name))
  }
  const email = `verif-${Date.now()}@example.com`
  const username = `verif-${Date.now()}`
  const u = await p.user.create({ data: { username, email, password_hash: 'test' } })
  console.log('created', u.user_id)
  await p.user.delete({ where: { user_id: u.user_id } })
  console.log('deleted')
  await p.$disconnect()
})().catch(e=>{ console.error('err', e && e.message || e); process.exit(1) })
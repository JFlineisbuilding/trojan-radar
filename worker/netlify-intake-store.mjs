// Append-only submission storage. This is deliberately not a general SQL database
// and never exposes a public listing or read API for submitted content.
const TABLES = new Set(['poster_submissions','text_submissions','organization_claims','organizer_requests','submissions']);
export function createNetlifyIntakeStore(store) {
  return {prepare(sql) {
    let values=[];
    return {
      bind(...args) { values=args; return this; },
      async run() {
        const create=sql.match(/^CREATE TABLE IF NOT EXISTS (\w+) /);
        if(create&&TABLES.has(create[1])) return {success:true,meta:{changes:0}};
        const insert=sql.match(/^INSERT INTO (\w+) \(([^)]+)\) VALUES \(([?,]+)\)$/);
        if(!insert||!TABLES.has(insert[1])) throw new Error('Unsupported intake storage operation');
        const columns=insert[2].split(',').map(c=>c.trim());
        if(columns.length!==values.length||columns.some(c=>!/^\w+$/.test(c))) throw new Error('Invalid intake record');
        const record=Object.fromEntries(columns.map((c,i)=>[c,values[i]]));
        if(!/^[a-f0-9-]{36}$/i.test(record.id||''))throw new Error('Invalid submission identifier');
        await store.setJSON(insert[1]+'/'+record.id,record,{onlyIfNew:true});
        return {success:true,meta:{changes:1}};
      }
    };
  }};
}

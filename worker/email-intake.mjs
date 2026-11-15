// An email delivery provider calls this endpoint. HMAC authenticates the provider;
// sender verification controls review status, never automatic publication.
const intakeJSON=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export async function handleEmailIntake(request,env){
 if(new URL(request.url).pathname!=='/api/inbound/email')return null;
 if(request.method!=='POST')return intakeJSON({error:'Method not allowed'},405);
 if(!env.RADAR_MAIL_WEBHOOK_SECRET||!env.DB)return intakeJSON({error:'Email intake has not been activated.'},503);
 const timestamp=request.headers.get('X-Radar-Timestamp')||'',signature=(request.headers.get('X-Radar-Signature')||'').replace(/^sha256=/,'');
 if(!/^\d+$/.test(timestamp)||Math.abs(Date.now()-Number(timestamp)*1000)>300000||!/^([a-f0-9]{64})$/i.test(signature))return intakeJSON({error:'Invalid delivery signature'},401);
 const raw=await request.text();if(raw.length>40000)return intakeJSON({error:'Email is too large'},413);
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.RADAR_MAIL_WEBHOOK_SECRET),{name:'HMAC',hash:'SHA-256'},false,['verify']);
 const bytes=Uint8Array.from(signature.match(/../g).map(x=>parseInt(x,16)));
 if(!await crypto.subtle.verify('HMAC',key,bytes,new TextEncoder().encode(timestamp+'.'+raw)))return intakeJSON({error:'Invalid delivery signature'},401);
 let input;try{input=JSON.parse(raw)}catch{return intakeJSON({error:'Invalid JSON'},400)}
 const validEmail=s=>typeof s==='string'&&/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(s);
 if(!validEmail(input.from)||!Array.isArray(input.to)||!input.to.some(x=>String(x).toLowerCase()===String(env.RADAR_INTAKE_EMAIL||'events@trojanradar.app').toLowerCase())||typeof input.messageId!=='string'||input.messageId.length>500||!input.messageId.trim()||typeof input.text!=='string'||!input.text.trim()||input.text.length>30000)return intakeJSON({error:'Missing valid sender, intake recipient, message ID or event text.'},400);
 const senders=String(env.RADAR_TRUSTED_SENDERS||'').toLowerCase().split(',').map(s=>s.trim());
 const verified=senders.includes(input.from.toLowerCase())&&input.auth?.dmarc==='pass'&&input.auth?.dkim==='pass';const status=verified?'ready_for_extraction':'held_for_verification';
 await env.DB.prepare('CREATE TABLE IF NOT EXISTS email_intake (id TEXT PRIMARY KEY, message_id TEXT UNIQUE NOT NULL, sender TEXT NOT NULL, subject TEXT NOT NULL, event_text TEXT NOT NULL, status TEXT NOT NULL, received_at TEXT NOT NULL)').run();
 const id=crypto.randomUUID();const result=await env.DB.prepare('INSERT OR IGNORE INTO email_intake (id,message_id,sender,subject,event_text,status,received_at) VALUES (?,?,?,?,?,?,?)').bind(id,input.messageId,input.from,String(input.subject||'').slice(0,500),input.text,status,new Date().toISOString()).run();
 return intakeJSON({received:true,status,duplicate:(result.meta?.changes??result.changes)===0,published:false},202);
}

const claimJSON=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export function validateOrganizationClaim(x){
 if(!x||!['student','department','brand','community'].includes(x.type))return 'Choose an organizer type.';
 if(typeof x.organization!=='string'||!x.organization.trim()||x.organization.length>200)return 'Enter your organization name.';
 if(typeof x.email!=='string'||x.email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x.email))return 'Enter a valid organization or work email.';
 let u;try{u=new URL(x.proofURL)}catch{return 'Add an HTTPS link to your directory profile or official website.'}
 if(u.protocol!=='https:'||u.username||u.password||x.proofURL.length>2000)return 'Use an HTTPS organization link without embedded credentials.';
 if(typeof x.role!=='string'||!x.role.trim()||x.role.length>1200)return 'Describe your role so the reviewer can confirm publishing authority.';
 return null;
}
export async function handleOrganizationClaim(request,env){
 if(new URL(request.url).pathname!=='/api/organization-claims')return null;
 if(request.method!=='POST')return claimJSON({error:'Method not allowed'},405);
 let x;try{x=await request.json()}catch{return claimJSON({error:'Invalid request'},400)}
 const error=validateOrganizationClaim(x);if(error)return claimJSON({error},400);
 if(!env.DB)return claimJSON({error:'Verification request storage is unavailable. Please try again.'},503);
 await env.DB.prepare('CREATE TABLE IF NOT EXISTS organization_claims (id TEXT PRIMARY KEY, organizer_type TEXT NOT NULL, organization TEXT NOT NULL, email TEXT NOT NULL, proof_url TEXT NOT NULL, role_evidence TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL)').run();
 const id=crypto.randomUUID(),createdAt=new Date().toISOString();
 await env.DB.prepare('INSERT INTO organization_claims (id,organizer_type,organization,email,proof_url,role_evidence,status,created_at) VALUES (?,?,?,?,?,?,?,?)').bind(id,x.type,x.organization.trim(),x.email.trim(),new URL(x.proofURL).href,x.role.trim(),'pending_review',createdAt).run();
 // A stored application is not email ownership, officer authorization or venue approval.
 // This route cannot issue a trusted badge, create an officer role, or publish an event.
 return claimJSON({id,status:'pending_review',verified:false,publishingEnabled:false,createdAt},201);
}

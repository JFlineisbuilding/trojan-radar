import test from 'node:test';import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {sourceEvidence} from '../public/trust.js';
import {handleOrganizationClaim} from '../worker/organization-claims.mjs';
test('source labels require both matching source and exact original platform domain',()=>{
 assert.equal(sourceEvidence({source:'EngageSC',url:'https://engage.usc.edu/events/a'}).label,'Listed on EngageSC');
 for(const url of ['https://engage.usc.edu.evil.test/a','https://engage.usc.edu@evil.test/a','javascript:alert(1)','https://instagram.com/a'])assert.equal(sourceEvidence({source:'EngageSC',url,verified:true}),null);
 assert.equal(sourceEvidence({source:'Instagram',url:'https://engage.usc.edu/events/a',verified:true}),null);
});
test('external brand claims persist for review and cannot self-verify or publish',async()=>{
 const db=new DatabaseSync(':memory:'),DB={prepare(sql){return {run:async()=>db.prepare(sql).run(),bind(...args){return {run:async()=>db.prepare(sql).run(...args)}}}}};
 const response=await handleOrganizationClaim(new Request('https://radar.test/api/organization-claims',{method:'POST',body:JSON.stringify({type:'brand',organization:'Test brand',email:'team@example.org',proofURL:'https://example.org',role:'Brand activation coordinator',status:'verified',verified:true,publishingEnabled:true})}),{DB});
 assert.equal(response.status,201);const result=await response.json();assert.equal(result.verified,false);assert.equal(result.publishingEnabled,false);assert.equal(db.prepare('SELECT status FROM organization_claims WHERE id=?').get(result.id).status,'pending_review');db.close();
});

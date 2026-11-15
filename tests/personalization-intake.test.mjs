import {eligibilityDecision} from '../public/eligibility.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {recommendEvents} from '../public/recommendation.js';
import {preferenceScore} from '../public/discovery.js';
import {createNetlifyIntakeStore} from '../worker/netlify-intake-store.mjs';
import {personalRecommendations} from '../worker/personal-recommendations.mjs';
const event=(id,title,description='')=>({id,title,description,type:'Talk',host:'USC',eligibility:'Open to the public',start:new Date(Date.now()+86400000).toISOString()});
test('AI and consulting preferences never backfill with unrelated history seminars',()=>{
 const events=[event('history','EMSI British History Seminar: Mid-Career Workshop'),event('ai','Artificial intelligence workshop'),event('consulting','Management consulting careers')];
 const profile={careerInterests:'AI, consulting'};
 assert.deepEqual(new Set(recommendEvents(events,profile,{score:e=>preferenceScore(e,profile)}).map(e=>e.id)),new Set(['ai','consulting']));
});
test('changing saved interests changes candidates, independently of ranking bonuses',()=>{
 const events=[event('ai','Artificial intelligence workshop'),event('finance','Investment banking information session')];
 assert.deepEqual(recommendEvents(events,{careerInterests:'AI'},{score:()=>100}).map(e=>e.id),['ai']);
 assert.deepEqual(recommendEvents(events,{careerInterests:'finance'},{score:()=>100}).map(e=>e.id),['finance']);
 assert.deepEqual(recommendEvents(events,{careerInterests:'consulting'},{score:()=>100}),[]);
});
test('matching interests do not override graduation restrictions',()=>{
 const e={...event('ai','AI consulting workshop'),attendance:{scope:'public',gradYears:[2029]}};
 assert.deepEqual(recommendEvents([e],{careerInterests:'AI, consulting',graduationYear:'2027'}),[]);
});
test('Netlify intake persists exact submitted records without exposing a read operation',async()=>{
 const saved=[];const db=createNetlifyIntakeStore({setJSON:async(...args)=>saved.push(args)});
 await db.prepare('CREATE TABLE IF NOT EXISTS text_submissions (id TEXT PRIMARY KEY)').run();
 const id='00000000-0000-4000-8000-000000000001';
 await db.prepare('INSERT INTO text_submissions (id,event_text,status,created_at) VALUES (?,?,?,?)').bind(id,'A real announcement','awaiting_review','2026-11-15').run();
 assert.equal(saved.length,1);assert.equal(saved[0][0],'text_submissions/'+id);assert.equal(saved[0][1].status,'awaiting_review');
 await assert.rejects(db.prepare('SELECT * FROM text_submissions').run(),/Unsupported/);
 await assert.rejects(db.prepare('INSERT INTO calendar_sessions (id) VALUES (?)').bind(id).run(),/Unsupported/);
});
test('Netlify storage failures reject the submission instead of claiming success',async()=>{
 const db=createNetlifyIntakeStore({setJSON:async()=>{throw Error('storage down')}});
 await assert.rejects(db.prepare('INSERT INTO text_submissions (id) VALUES (?)').bind('00000000-0000-4000-8000-000000000001').run(),/storage down/);
});
test('AI recommendations reject invented IDs, wrong sections and ineligible events',async()=>{
 const ai=event('ai','Artificial intelligence workshop');
 const denied={...event('denied','AI consulting workshop'),attendance:{scope:'public',gradYears:[2029]}};
 const result=await personalRecommendations({profile:{careerInterests:'AI',graduationYear:'2027'}},{},{events:[ai,denied]},async()=>({career:[{id:'invented',reason:'bad'},{id:'denied',reason:'bad'},{id:'ai',reason:'Learn applied AI'}],social:[{id:'ai',reason:'wrong section'}]}));
 assert.equal(result.engine,'ai');assert.deepEqual(result.career,['ai']);assert.deepEqual(result.social,[]);
});
test('AI is rerun after preferences change and receives topics rather than raw resumes',async()=>{
 let calls=0;let passed;
 const data={events:[event('ai2','AI workshop'),event('finance2','Finance workshop')]};
 const run=async(_env,_task,input)=>{calls++;passed=input;return {career:[],social:[]}};
 await personalRecommendations({profile:{careerInterests:'AI',careerDocuments:{resume:{text:'PRIVATE_ADDRESS marketing experience'}}}},{},data,run);
 assert.ok(!JSON.stringify(passed).includes('PRIVATE_ADDRESS'));
 await personalRecommendations({profile:{careerInterests:'finance'}},{},data,run);
 assert.equal(calls,2);
});


// The live USC Calendar explicitly marks eligible student audiences outside description text.
test('USC audience metadata enables student listings while restrictions remain hard gates',async()=>{
 const {normalizeUSC}=await import('../worker/data.mjs');
 const listing=description=>normalizeUSC({events:[{event:{id:1,title:'AI workshop',description_text:description,filters:{event_audience:[{name:'Students'}]},event_instances:[{event_instance:{id:2,start:'2026-11-20T10:00:00-08:00'}}]}}]})[0];
 assert.equal(eligibilityDecision(listing('AI workshop for students.'),{school:'Marshall',year:'Senior',graduationYear:'2027'}).eligible,true);
 assert.equal(eligibilityDecision(listing('Viterbi students only.'),{school:'Marshall'}).eligible,false);
 assert.equal(eligibilityDecision(listing('Must be a registered member.'),{school:'Marshall'}).eligible,false);
 assert.equal(eligibilityDecision(listing('Only for students graduating in 2029.'),{school:'Marshall',graduationYear:'2027'}).eligible,false);
});

/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.HTTP.NATIVE_REJOIN.TEST
TAG: LEEWAY.CONTINUUM.RUNTIME_HTTP.DEVICE_REJOIN.GATE_TEST.V1
5WH:
WHAT = Validate original Continuum HTTP route delegates only an authorized bounded device-rejoin request.
WHY = Prevent a browser from creating a second account authority or bypassing original native host enrollment.
WHO = Original Continuum owner; outside source reviewer, not Agent Lee.
WHERE = tests/continuum-device-rejoin-route.test.mjs.
WHEN = 2026-11-21.
HOW = Original Runtime route factory with loopback request fixtures, injected native host gate, strict owner matching.
LICENSE = MIT.
AUTHORITY = SOURCE_CI_FIXTURE_ONLY. No live deployment, native device execution, Veritas, receipt or speech playback.
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import {createContinuumRoutes} from '../compat/runtime-fabric/continuum-routes.mjs';
const payload={sessionRef:'host-session-01',deviceId:'iphone-device-01',bodyId:'ios-target-01',
 platform:'ios',recordId:'portable-record-01',workId:'runtime-work-01'};
const expectedOwner='continuum-owner-fixture-01';
async function send({request=payload,method='POST',host='127.0.0.1:4011',
 origin='http://127.0.0.1:4011',command='owner-device-rejoin',
 bound=true,handle=null}={}){
 const calls=[];let body='';
 const req={method,url:'/api/continuum/device-rejoin',socket:{remoteAddress:'127.0.0.1'},
  headers:{host,origin,'x-continuum-request':command,'content-type':'application/json'},
  async *[Symbol.asyncIterator](){yield Buffer.from(JSON.stringify(request));}};
 const res={statusCode:null,headers:null,
  writeHead(code,headers){this.statusCode=code;this.headers=headers;},
  end(value){body+=value??'';}};
 const deviceRejoin=bound?{async restoreOne(arg){
  calls.push(arg);
  if(handle)return handle(arg);
  return {state:'ORIGINAL_PROVIDER_TO_ENROLLED_DEVICE_READBACK_MATCH',
   ownerId:expectedOwner,targetBodyId:arg.bodyId,workId:arg.workId};
 }}:null;
 const handler=createContinuumRoutes({uiDirectory:'.',resolveProvider:async()=>({
  provider:{},context:{ownerId:expectedOwner,bodyId:'pc-primary'}
 }),deviceRejoin});
 const matched=await handler(req,res,new URL('http://127.0.0.1:4011/api/continuum/device-rejoin'));
 return {matched,statusCode:res.statusCode,body:JSON.parse(body),calls};
}
test('existing Runtime local HTTP route forwards bounded native rejoin with original trusted owner',async()=>{
 const o=await send();
 assert.equal(o.matched,true);assert.equal(o.statusCode,200);
 assert.equal(o.calls.length,1);
 assert.equal(o.calls[0].hostOwnerId,expectedOwner);
 assert.equal(o.calls[0].bodyId,payload.bodyId);
 assert.equal(o.body.result.state,'ORIGINAL_PROVIDER_TO_ENROLLED_DEVICE_READBACK_MATCH');
});
test('route is 503 when original Runtime has not injected a native rejoin host',async()=>{
 const o=await send({bound:false});assert.equal(o.statusCode,503);
 assert.equal(o.body.error,'CONTINUUM_DEVICE_REJOIN_HOST_UNBOUND');
});
test('cross-origin and unapproved request header fail before native host call',async()=>{
 for(const input of [{origin:'http://malicious.example'},{command:'other-request'}]){
  const o=await send(input);assert.equal(o.statusCode,403);
  assert.equal(o.calls.length,0);
 }
});
test('browser cannot provide a self-asserted owner or inject credentials into the rejoin request',async()=>{
 const o=await send({request:{...payload,ownerId:'forged-owner',password:'secret'}});
 assert.equal(o.statusCode,400);
 assert.equal(o.calls.length,0);
});
test('original owner mismatch or false target readback cannot be returned as success',async()=>{
 const o=await send({handle:async arg=>({state:'ORIGINAL_PROVIDER_TO_ENROLLED_DEVICE_READBACK_MATCH',
  ownerId:'different-owner',targetBodyId:arg.bodyId,workId:arg.workId})});
 assert.equal(o.statusCode,409);
 assert.equal(o.body.error,'CONTINUUM_DEVICE_REJOIN_RESULT_RECONCILIATION_REQUIRED');
 assert.equal(o.body.reconciliationRequired,true);
});

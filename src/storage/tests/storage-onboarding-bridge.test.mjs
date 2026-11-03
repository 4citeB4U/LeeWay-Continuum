import test from 'node:test';
import assert from 'node:assert/strict';
import {createStorageOnboardingBridge} from '../storage-onboarding-bridge.mjs';

const scope={ownerId:'creator-scope',bodyId:'body-fold6'};

test('onboarding forwards only scoped non-secret provider metadata',async()=>{
  let received;
  const bridge=createStorageOnboardingBridge({...scope,allowedRedirectOrigins:['https://accounts.example.test'],beginProviderConsent:async input=>{
    received=input;
    return {state:'PENDING',redirectUrl:'https://accounts.example.test/authorize',grantedScopes:['storage.read']};
  }});
  const result=await bridge.startStorageOnboarding({providerId:'google-drive'});
  assert.deepEqual(received,{providerId:'google-drive',...scope,authorityRef:'leeway.continuum',auth:'OAUTH2_USER_CONSENT'});
  assert.deepEqual(result,{state:'PENDING',providerId:'google-drive',redirectUrl:'https://accounts.example.test/authorize',grantedScopes:['storage.read']});
});

test('missing provider adapter fails closed without contacting an account',async()=>{
  const bridge=createStorageOnboardingBridge(scope);
  assert.deepEqual(await bridge.startStorageOnboarding({providerId:'mega'}),{state:'BLOCKED',providerId:'mega',reason:'PROVIDER_AUTH_ADAPTER_UNBOUND'});
});

test('local Continuum uses the existing local status callback',async()=>{
  let received;
  const bridge=createStorageOnboardingBridge({...scope,readLocalStatus:async input=>{
    received=input;
    return {state:'CONNECTED',resourceId:'local-scope'};
  }});
  assert.deepEqual(await bridge.startStorageOnboarding({providerId:'local-continuum'}),{state:'CONNECTED',providerId:'local-continuum',resourceId:'local-scope'});
  assert.deepEqual(received,{providerId:'local-continuum',...scope,authorityRef:'leeway.continuum'});
});

test('unexpected request fields and secret output are rejected',async()=>{
  const bridge=createStorageOnboardingBridge({...scope,beginProviderConsent:async()=>({state:'CONNECTED',accessToken:'secret'})});
  await assert.rejects(()=>bridge.startStorageOnboarding({providerId:'google-drive',password:'secret'}),/REQUEST_INVALID/);
  await assert.rejects(()=>bridge.startStorageOnboarding({providerId:'google-drive'}),/SECRET_OUTPUT_FORBIDDEN/);
});

test('redirects must be HTTPS or an explicitly allowed local origin',async()=>{
  const bridge=createStorageOnboardingBridge({...scope,allowedRedirectOrigins:['http://127.0.0.1:8890'],beginProviderConsent:async()=>({state:'PENDING',redirectUrl:'http://127.0.0.1:8890/callback'})});
  const result=await bridge.startStorageOnboarding({providerId:'google-drive'});
  assert.equal(result.redirectUrl,'http://127.0.0.1:8890/callback');
  const blocked=createStorageOnboardingBridge({...scope,beginProviderConsent:async()=>({state:'PENDING',redirectUrl:'http://evil.example.test/callback'})});
  await assert.rejects(()=>blocked.startStorageOnboarding({providerId:'google-drive'}),/REDIRECT_NOT_ALLOWED/);
});


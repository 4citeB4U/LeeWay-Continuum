/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.STORAGE.ONBOARDING_BRIDGE
TAG: LEEWAY.CONTINUUM.HOST_ONBOARDING_CONTRACT.V1
WHAT: Fail-closed host seam for one-screen provider onboarding.
WHY: Let a native/runtime host perform provider consent without moving credentials into browser code.
HOW: Validate scope and provider identity, forward only non-secret metadata, and return a safe status envelope.
AUTHORITY: SOURCE CONTRACT ONLY; an approved host must bind the consent and vault callbacks.
LICENSE: MIT
*/
import {assertContinuumScope,CONTINUUM_AUTHORITY_REF} from '../authority/continuum-authority.mjs';
import {listStorageProviderDefinitions} from './provider-catalog.mjs';

const fail=code=>{throw Object.assign(new Error(code),{code});};
const SECRET=/password|secret|token|credential|private.?key|api.?key/i;
const REQUEST_KEYS=new Set(['providerId']);
const RESULT_KEYS=new Set(['state','providerId','resourceId','credentialBindingRef','reason','message','redirectUrl','grantedScopes','expiresAt']);
const STATES=new Set(['CONNECTED','PENDING','BLOCKED','FAILED']);
const definitions=new Map(listStorageProviderDefinitions().map(definition=>[definition.providerId,definition]));

function exactObject(value,keys,code){
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(key=>!keys.has(key)))fail(code);
}

function safeString(value,code,max=256){
  if(value===undefined||value===null)return value;
  if(typeof value!=='string'||value.length<1||value.length>max||/[\x00-\x1f\x7f]/.test(value))fail(code);
  return value;
}

function safeRedirect(value,allowedOrigins){
  if(value===undefined||value===null)return undefined;
  const url=new URL(safeString(value,'CONTINUUM_ONBOARDING_RESULT_INVALID',4096));
  if(!allowedOrigins.has(url.origin))fail('CONTINUUM_ONBOARDING_REDIRECT_NOT_ALLOWED');
  return url.href;
}

function safeResult(value,{providerId,allowedOrigins}){
  if(!value||typeof value!=='object'||Array.isArray(value))fail('CONTINUUM_ONBOARDING_RESULT_INVALID');
  if(Object.keys(value).some(key=>SECRET.test(key)))fail('CONTINUUM_ONBOARDING_SECRET_OUTPUT_FORBIDDEN');
  exactObject(value,RESULT_KEYS,'CONTINUUM_ONBOARDING_RESULT_INVALID');
  const state=safeString(value.state,'CONTINUUM_ONBOARDING_RESULT_INVALID',32);
  if(!STATES.has(state))fail('CONTINUUM_ONBOARDING_RESULT_INVALID');
  if(value.providerId!==undefined&&value.providerId!==providerId)fail('CONTINUUM_ONBOARDING_SCOPE_MISMATCH');
  const result={state,providerId};
  for(const key of ['resourceId','credentialBindingRef','reason','message','expiresAt']){
    if(value[key]!==undefined)result[key]=safeString(value[key],'CONTINUUM_ONBOARDING_RESULT_INVALID',4096);
  }
  if(value.grantedScopes!==undefined){
    if(!Array.isArray(value.grantedScopes)||value.grantedScopes.length>32||value.grantedScopes.some(scope=>typeof scope!=='string'||scope.length>256||SECRET.test(scope)))fail('CONTINUUM_ONBOARDING_RESULT_INVALID');
    result.grantedScopes=Object.freeze([...value.grantedScopes]);
  }
  const redirectUrl=safeRedirect(value.redirectUrl,allowedOrigins);
  if(redirectUrl)result.redirectUrl=redirectUrl;
  return Object.freeze(result);
}

function validateRequest(request){
  exactObject(request,REQUEST_KEYS,'CONTINUUM_ONBOARDING_REQUEST_INVALID');
  const providerId=safeString(request.providerId,'CONTINUUM_ONBOARDING_REQUEST_INVALID');
  const definition=definitions.get(providerId);
  if(!definition)fail('CONTINUUM_ONBOARDING_PROVIDER_UNKNOWN');
  return {providerId,definition};
}

/**
 * Build the host callback exposed as window.LeeWayContinuumBridge.
 *
 * The host owns state/PKCE, provider-native consent and its approved vault.
 * Neither callback receives a browser credential, and this module never
 * accepts one. A missing callback is a truthful BLOCKED result.
 */
export function createStorageOnboardingBridge({ownerId,bodyId,beginProviderConsent,readLocalStatus,allowedRedirectOrigins=[]}={}){
  const scope=assertContinuumScope({ownerId,bodyId});
  if(!Array.isArray(allowedRedirectOrigins)||allowedRedirectOrigins.some(origin=>typeof origin!=='string'))fail('CONTINUUM_ONBOARDING_CONFIG_INVALID');
  const origins=new Set(allowedRedirectOrigins);
  return Object.freeze({
    async startStorageOnboarding(request={}){
      const {providerId,definition}=validateRequest(request);
      const base={providerId,ownerId:scope.ownerId,bodyId:scope.bodyId,authorityRef:CONTINUUM_AUTHORITY_REF};
      if(providerId==='local-continuum'){
        if(typeof readLocalStatus!=='function')return Object.freeze({state:'BLOCKED',providerId,reason:'LOCAL_PROVIDER_STATUS_UNBOUND'});
        return safeResult(await readLocalStatus(Object.freeze(base)),{providerId,allowedOrigins:origins});
      }
      if(typeof beginProviderConsent!=='function')return Object.freeze({state:'BLOCKED',providerId,reason:'PROVIDER_AUTH_ADAPTER_UNBOUND'});
      const result=await beginProviderConsent(Object.freeze({...base,auth:definition.auth}));
      return safeResult(result,{providerId,allowedOrigins:origins});
    }
  });
}


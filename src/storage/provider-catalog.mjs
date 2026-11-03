/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.STORAGE.PROVIDER_CATALOG
TAG: LEEWAY.CONTINUUM.PROVIDER_CATALOG.V1
WHAT: Deployment-independent catalog of subordinate storage provider contracts.
WHY: Keep user-linked storage, release artifacts and canonical Continuum authority separate.
HOW: Descriptors only; provider credentials and network adapters remain injected by an approved host.
AUTHORITY: SOURCE CONTRACT ONLY; no account creation, credential issuance or provider mutation.
*/
import {assertContinuumAuthorityRef,CONTINUUM_AUTHORITY_REF,CONTINUUM_AUTHORITY_MODE} from '../authority/continuum-authority.mjs';

const fail = message => { throw Object.assign(new Error(message),{code:message}); };
const id = value => typeof value==='string' && /^[A-Za-z0-9_.:@/-]{1,256}$/.test(value);
const SECRET_KEYS = new Set(['password','clientSecret','accessToken','refreshToken','privateKey','apiKey','sessionToken','credentials']);
// A descriptor is source metadata, never a host attestation.
const STATUSES = new Set(['UNBOUND','BOUND_SOURCE_ONLY']);
const INPUT_KEYS = new Set(['providerId','ownerId','bodyId','resourceId','status','credentialBindingRef','authorityRef']);
const DESCRIPTOR_KEYS = new Set([...INPUT_KEYS,'category','role','auth','offlineReady','writeMode','authorityMode','scopeKind','credentialSource','createsDatabase','grantsContinuumAuthority','productionQualified']);
const safeFields = (input,allowed) => Object.keys(input).every(key => allowed.has(key));

const DEFINITIONS = Object.freeze([
  Object.freeze({providerId:'local-continuum',category:'CANONICAL_LOCAL_BINDING',role:'CANONICAL_RECORDS',auth:'HOST_BOUND_SCOPE',offlineReady:true,writeMode:'CONTINUUM_GOVERNED'}),
  Object.freeze({providerId:'cloudflare-r2',category:'OBJECT_STORAGE',role:'ENCRYPTED_RECOVERY_COPY',auth:'TRUSTED_HOST_CREDENTIAL',offlineReady:false,writeMode:'VERITAS_GATED_ARCHIVE'}),
  Object.freeze({providerId:'oracle-oci-object',category:'OBJECT_STORAGE',role:'ENCRYPTED_RECOVERY_COPY',auth:'TRUSTED_HOST_CREDENTIAL',offlineReady:false,writeMode:'VERITAS_GATED_ARCHIVE'}),
  Object.freeze({providerId:'google-drive',category:'USER_LINKED_CLOUD',role:'USER_OBJECT_STORE',auth:'OAUTH2_USER_CONSENT',offlineReady:false,writeMode:'USER_AUTHORIZED_OBJECT'}),
  Object.freeze({providerId:'mega',category:'USER_LINKED_CLOUD',role:'USER_OBJECT_STORE',auth:'PROVIDER_AUTH_CONTRACT_REQUIRED',offlineReady:false,writeMode:'USER_AUTHORIZED_OBJECT'}),
  Object.freeze({providerId:'pcloud',category:'USER_LINKED_CLOUD',role:'USER_OBJECT_STORE',auth:'OAUTH2_USER_CONSENT',offlineReady:false,writeMode:'USER_AUTHORIZED_OBJECT'}),
  Object.freeze({providerId:'box',category:'USER_LINKED_CLOUD',role:'USER_OBJECT_STORE',auth:'OAUTH2_USER_CONSENT',offlineReady:false,writeMode:'USER_AUTHORIZED_OBJECT'}),
  Object.freeze({providerId:'icedrive',category:'USER_LINKED_CLOUD',role:'USER_OBJECT_STORE',auth:'PROVIDER_AUTH_CONTRACT_REQUIRED',offlineReady:false,writeMode:'USER_AUTHORIZED_OBJECT'}),
  Object.freeze({providerId:'internxt',category:'USER_LINKED_CLOUD',role:'USER_OBJECT_STORE',auth:'PROVIDER_AUTH_CONTRACT_REQUIRED',offlineReady:false,writeMode:'USER_AUTHORIZED_OBJECT'}),
  Object.freeze({providerId:'github-release',category:'RELEASE_INFRASTRUCTURE',role:'VERSIONED_RELEASE_ARTIFACT_OR_ENCRYPTED_EVIDENCE',auth:'GITHUB_OWNER_AUTHORIZATION',offlineReady:false,writeMode:'RELEASE_ONLY'})
]);
const DEFINITION_MAP = new Map(DEFINITIONS.map(definition=>[definition.providerId,definition]));

function validateInput(input,{descriptor=false}={}) {
  if(!input || typeof input!=='object' || Array.isArray(input) || !safeFields(input,descriptor?DESCRIPTOR_KEYS:INPUT_KEYS) || Array.from(Object.keys(input)).some(key=>SECRET_KEYS.has(key))) {
    fail('CONTINUUM_PROVIDER_DESCRIPTOR_SECRET_INPUT_FORBIDDEN');
  }
  try { assertContinuumAuthorityRef(input.authorityRef??CONTINUUM_AUTHORITY_REF); }
  catch { fail('CONTINUUM_PROVIDER_AUTHORITY_INVALID'); }
  const definition=DEFINITION_MAP.get(input.providerId);
  if(!definition || !id(input.ownerId) || !id(input.bodyId) ||
    (input.resourceId!==undefined && input.resourceId!==null && !id(input.resourceId)) ||
    !STATUSES.has(input.status??'UNBOUND') ||
    (input.credentialBindingRef!==undefined && input.credentialBindingRef!==null && !id(input.credentialBindingRef))) {
    fail('CONTINUUM_PROVIDER_DESCRIPTOR_INVALID');
  }
  if((input.status??'UNBOUND')!=='UNBOUND' && !id(input.resourceId)) fail('CONTINUUM_PROVIDER_RESOURCE_REQUIRED');
  return definition;
}

export function listStorageProviderDefinitions() { return DEFINITIONS.map(definition=>Object.freeze({...definition})); }

export function createStorageProviderDescriptor(input={}) {
  const {
    providerId,ownerId,bodyId,resourceId=null,status='UNBOUND',credentialBindingRef=null,
    authorityRef=CONTINUUM_AUTHORITY_REF
  }=input;
  const definition=validateInput(input);
  return Object.freeze({
    ...definition,
    authorityRef,
    authorityMode:CONTINUUM_AUTHORITY_MODE,
    scopeKind:'OWNER_BODY_SCOPE',
    ownerId,bodyId,resourceId,status,
    credentialBindingRef,
    credentialSource:'APPROVED_HOST_OR_USER_OAUTH_VAULT',
    createsDatabase:false,
    grantsContinuumAuthority:false,
    productionQualified:false
  });
}

export function assertProviderDescriptor(descriptor) {
  const definition=validateInput(descriptor,{descriptor:true});
  if(descriptor.authorityRef!==CONTINUUM_AUTHORITY_REF || descriptor.role!==definition.role ||
    descriptor.category!==definition.category || descriptor.grantsContinuumAuthority===true ||
    descriptor.createsDatabase===true) fail('CONTINUUM_PROVIDER_DESCRIPTOR_POLICY_INVALID');
  return true;
}

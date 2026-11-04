/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.CONTINUUM.UI.STORAGE_ONBOARDING
TAG: LEEWAY.CONTINUUM.ONE_SCREEN_PROVIDER_SETUP.V1
WHAT: Optional one-screen owner-facing storage connection surface.
WHY: Hide provider mechanics without hiding authority, consent or blocked state.
HOW: Delegate only a provider identifier to the approved host bridge; never handle secrets.
AUTHORITY: UI CONTRACT ONLY; the host must validate every provider request and scope.
*/
const $=id=>document.getElementById(id);
const dialog=$('storage-onboarding');
const statusBox=$('storage-onboarding-status');
const messageBox=$('storage-onboarding-message');
const moreProviders=$('storage-more-providers');
const providerIds=new Set(['local-continuum','google-drive','mega','pcloud','box','icedrive','internxt']);
const apiRoot=new URL(document.querySelector('meta[name="continuum-api"]')?.content||'/api/continuum',location.href);

function message(text,error=false){messageBox.textContent=text;messageBox.dataset.state=error?'error':'ok';}
function setProviderState(providerId,text){const node=document.querySelector(`[data-provider-state="${providerId}"]`);if(node)node.textContent=text;}
function providerStateRows(status){
  const rows=Array.isArray(status?.storageProviders)?status.storageProviders:[];
  return new Map(rows.filter(row=>row&&typeof row.providerId==='string').map(row=>[row.providerId,row]));
}
function renderObservedStatus(status){
  const rows=providerStateRows(status);
  const local=rows.get('local-continuum');
  if(local?.state)setProviderState('local-continuum',String(local.state));
  else if(status?.initialized===true&&status?.state==='CONNECTED')setProviderState('local-continuum','Available');
  else setProviderState('local-continuum','Needs setup');
  for(const id of ['google-drive','mega','pcloud','box','icedrive','internxt']){
    const row=rows.get(id);
    setProviderState(id,row?.state?String(row.state):'Not connected');
  }
  const moreConnected=['pcloud','box','icedrive','internxt'].some(id=>rows.get(id)?.state==='CONNECTED');
  setProviderState('more-storage',moreConnected?'Connected':'Choose a provider');
  const quota=status?.storageSummary;
  if(quota&&Number.isSafeInteger(quota.capacityBytes)&&Number.isSafeInteger(quota.usedBytes)){
    const available=Math.max(0,quota.capacityBytes-quota.usedBytes);
    statusBox.textContent=`${(available/1073741824).toFixed(1)} GB available across measured connected storage`;
  }else statusBox.textContent='Storage capacity will appear after an approved provider reports it.';
}
async function observeStatus(){
  try{
    const response=await fetch(new URL(apiRoot.pathname.replace(/\/$/,'')+'/status',apiRoot),{credentials:'same-origin',cache:'no-store'});
    const value=await response.json();
    if(!response.ok||value.ok===false)throw Error(value.error||'STATUS_UNAVAILABLE');
    renderObservedStatus(value.result??value);
  }catch{statusBox.textContent='This installation has not exposed a live storage status yet.';setProviderState('local-continuum','Needs setup');}
}
async function requestConnection(providerId){
  if(providerId==='more-storage'){
    if(moreProviders)moreProviders.hidden=!moreProviders.hidden;
    message(moreProviders?.hidden?'More storage choices hidden.':'Choose an approved provider below. Each provider will ask for its own permission.');
    return;
  }
  if(!providerIds.has(providerId)){message('That storage choice is not recognized.',true);return;}
  const bridge=window.LeeWayContinuumBridge??window.pywebview?.api;
  const providerWindow=providerId==='local'?null:window.open('about:blank','leeway-provider-consent','popup,width=520,height=720');
  message('Opening the provider’s secure sign-in…');
  try{
    let result;
    if(typeof bridge?.startStorageOnboarding==='function')result=await bridge.startStorageOnboarding(Object.freeze({providerId}));
    else{
      const response=await fetch(new URL(apiRoot.pathname.replace(/\/$/,'')+'/provider-onboarding',apiRoot),{method:'POST',headers:{'content-type':'application/json','x-continuum-provider-onboarding':'owner-connect'},credentials:'same-origin',cache:'no-store',body:JSON.stringify({providerId})});
      const value=await response.json().catch(()=>null);
      if(!response.ok||value?.ok===false)throw Error(value?.error||'PROVIDER_ONBOARDING_UNAVAILABLE');
      result=value?.result??value;
    }
    if(result?.redirectUrl){
      message(result?.message||'The official provider sign-in page is opening. Continuum will not report a connection until its approved adapter completes.');
      const target=new URL(String(result.redirectUrl),location.href);
      if(target.protocol!=='https:'&&target.origin!==location.origin)throw Error('UNTRUSTED_ONBOARDING_REDIRECT');
      if(location.hostname==='127.0.0.1'||location.hostname==='localhost'){if(providerWindow&&!providerWindow.closed)providerWindow.close();location.assign(target.href);return;}
      if(providerWindow&&!providerWindow.closed)providerWindow.location.replace(target.href);else location.assign(target.href);
      return;
    }
    if(result?.state==='CONNECTED'||result?.state==='PENDING'){
      message(result?.message|| (result.state==='CONNECTED'?'Storage connected. Refreshing verified status…':'Finish the provider sign-in, then return here.'));
      await observeStatus();return;
    }
    message(result?.message||'The provider did not complete the connection. Your existing storage was not changed.',true);
  }catch(error){if(providerWindow&&!providerWindow.closed)providerWindow.close();message(error?.message==='UNTRUSTED_ONBOARDING_REDIRECT'?'The connection was blocked because its return address was not trusted.':'The secure connection could not be completed. Your existing storage was not changed.',true);}
}
function open(){
  if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
  message('No password or API key is entered into this screen.');observeStatus();
}
function close(){if(typeof dialog.close==='function'&&dialog.open)dialog.close();else dialog.removeAttribute('open');}
$('connect-storage')?.addEventListener('click',open);
$('close-storage-onboarding')?.addEventListener('click',close);
document.querySelectorAll('[data-provider]').forEach(button=>button.addEventListener('click',()=>requestConnection(button.dataset.provider)));
dialog?.addEventListener('cancel',event=>{event.preventDefault();close();});
window.__continuumStorageOnboarding=Object.freeze({open,close,observeStatus});

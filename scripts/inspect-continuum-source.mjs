// LEEWAY HEADER — DO NOT REMOVE
// REGION: LEEWAY.CONTINUUM.OWNER_SOURCE.PROVENANCE
// TAG: LEEWAY.CONTINUUM.OWNER_SOURCE.READ_ONLY_CLOSURE.V1
// WHO: LeeWay Industries / Creator-authorized engineering
// WHAT: Read-only SHA-256 inspection of original owner-host Continuum source dependency candidates.
// WHY: Missing original service and import closure block the full authorized source transfer.
// WHERE: scripts/inspect-continuum-source.mjs
// WHEN: 2026-10-27
// HOW: Node.js built-ins inspect filenames, Git-independent SHA-256 and literal relative imports.
// AUTHORITY: READ_ONLY_SOURCE_DIAGNOSTIC; not a live runtime, Formula, Veritas or receipt gate.
// LICENSE: MIT
import {readdir,readFile,realpath,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,relative,dirname,extname,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
const REQUIRED=['pc-continuum.mjs','owner-retention.mjs'];
const OMIT=new Set(['node_modules','.git','data','databases','backup','backups','dist','build']);
const sha=b=>createHash('sha256').update(b).digest('hex');
const inside=(root,p)=>p===root||p.startsWith(root+sep);
const rel=(root,p)=>relative(root,p).split(sep).join('/');
export async function inspect(rootName){
 const root=await realpath(resolve(rootName));
 if(!(await stat(root)).isDirectory())throw Error('SOURCE_ROOT_NOT_DIRECTORY');
 const candidates=[],files=[],missing=[],external=[],dynamic=[],errors=[],seen=new Set();
 let scanned=0;
 async function walk(dir){
  for(const entry of await readdir(dir,{withFileTypes:true})){
   if(++scanned>120000)throw Error('SOURCE_SCAN_LIMIT_EXCEEDED');
   if(entry.isSymbolicLink())continue;
   const path=resolve(dir,entry.name);
   if(entry.isDirectory()){if(!OMIT.has(entry.name))await walk(path);}
   else if(entry.isFile()&&REQUIRED.includes(entry.name))candidates.push(path);
  }
 }
 await walk(root);
 async function visit(path){
  path=resolve(path);
  if(!inside(root,path)){missing.push({reason:'OUTSIDE_SOURCE_ROOT'});return;}
  if(seen.has(path))return;
  if(seen.size>=3000){errors.push('DEPENDENCY_SCAN_LIMIT_EXCEEDED');return;}
  seen.add(path);
  let body;
  try{
   const physical=await realpath(path);
   if(!inside(root,physical)){missing.push({source:rel(root,path),reason:'SYMLINK_ESCAPE'});return;}
   if((await stat(path)).size>5242880){errors.push('MODULE_EXCEEDS_SCAN_LIMIT:'+rel(root,path));return;}
   body=await readFile(path);
  }catch{missing.push({source:rel(root,path),reason:'MISSING_SOURCE_MODULE'});return;}
  const id=rel(root,path);
  files.push({path:id,sha256:sha(body),bytes:body.length});
  if(extname(path)==='.json')return;
  const code=body.toString('utf8');
  const patterns=[/\bimport\s+(?:[^'";]*?\s+from\s*)?['"]([^'"\n]+)['"]/g,/\bexport\s+[^'";]*?\s+from\s*['"]([^'"\n]+)['"]/g,/\brequire\s*\(\s*['"]([^'"\n]+)['"]\s*\)/g,/\bimport\s*\(\s*['"]([^'"\n]+)['"]\s*\)/g];
  const specs=new Set();
  for(const pattern of patterns)for(const match of code.matchAll(pattern))specs.add(match[1]);
  if(/\bimport\s*\(\s*(?!['"])/.test(code)||/\brequire\s*\(\s*(?!['"])/.test(code))dynamic.push({source:id,reason:'NON_LITERAL_LOAD_REQUIRES_MANUAL_PROVENANCE'});
  for(const spec of specs){
   if(!/^[a-zA-Z0-9_./@+~-]+$/.test(spec)){missing.push({source:id,reason:'UNSUPPORTED_MODULE_SPECIFIER'});continue;}
   if(!spec.startsWith('.')){external.push({source:id,specifier:spec});continue;}
   const target=resolve(dirname(path),spec);
   if(!inside(root,target)){missing.push({source:id,reason:'RELATIVE_IMPORT_OUTSIDE_ROOT'});continue;}
   const ext=extname(target);
   if(ext&&!['.mjs','.js','.cjs','.json','.ts','.mts'].includes(ext)){external.push({source:id,specifier:spec});continue;}
   const possible=ext?[target]:[target,target+'.mjs',target+'.js',target+'.cjs',target+'.json',resolve(target,'index.mjs'),resolve(target,'index.js')];
   let found=null;
   for(const candidate of possible){try{if((await stat(candidate)).isFile()){found=candidate;break;}}catch{}}
   if(found)await visit(found);else missing.push({source:id,specifier:spec,reason:'UNRESOLVED_RELATIVE_IMPORT'});
  }
 }
 for(const c of candidates)await visit(c);
 files.sort((a,b)=>a.path.localeCompare(b.path));
 const counts=Object.fromEntries(REQUIRED.map(n=>[n,candidates.filter(c=>c.endsWith(sep+n)).length]));
 const valid=REQUIRED.every(n=>counts[n]===1)&&!missing.length&&!dynamic.length&&!errors.length;
 return {schema:'leeway.continuum.owner-source-preflight.v1',status:valid?'SOURCE_CANDIDATES_OBSERVED_RUNTIME_UNVERIFIED':'BLOCKED_SOURCE_PROVENANCE_OR_CLOSURE',sourceCandidates:counts,files,unresolvedRelativeImports:missing,externalImports:external,dynamicLoads:dynamic,errors,examinedEntries:scanned,originalRuntimeBinding:'NOT_OBSERVED',sourceTransfer:'NOT_PERFORMED',productionAdmission:false,veritas:'NOT_EXECUTED',receipt:'NOT_CREATED',learning:'NOT_UPDATED'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const i=process.argv.indexOf('--root');
 if(i<0||!process.argv[i+1]){console.log(JSON.stringify({status:'BLOCKED',reason:'OWNER_ROOT_REQUIRED'}));process.exitCode=2;}
 else try{const result=await inspect(process.argv[i+1]);console.log(JSON.stringify(result,null,2));if(result.status.startsWith('BLOCKED'))process.exitCode=3;}
 catch(e){console.log(JSON.stringify({status:'BLOCKED',reason:String(e.message),receipt:'NOT_CREATED'}));process.exitCode=4;}
}

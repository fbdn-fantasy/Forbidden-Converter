"use strict";
const fs=require('node:fs/promises'),path=require('node:path');
function preferences(file){let state={};let pending=Promise.resolve();return {
 async load(){try{const s=JSON.parse(await fs.readFile(file,'utf8'));for(const k of ['inputDir','outputDir','watermarkDir'])if(typeof s[k]==='string')state[k]=s[k];}catch{}return {...state};},
 get(key){return state[key]||'';},
 async set(key,value){state[key]=value;const data=JSON.stringify(state);pending=pending.catch(()=>{}).then(async()=>{await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file+'.tmp',data);await fs.rename(file+'.tmp',file);});await pending;},
 async folder(key,fallback=''){const folder=state[key];if(folder)try{if((await fs.stat(folder)).isDirectory())return folder;}catch{}return fallback;}
};}
module.exports={preferences};

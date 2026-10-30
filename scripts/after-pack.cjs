const {execFileSync}=require('node:child_process');const path=require('node:path');
module.exports=async context=>{if(context.electronPlatformName==='win32')execFileSync(process.execPath,[path.join(__dirname,'apply-icon.mjs'),path.join(context.appOutDir,'Forbidden Converter.exe')],{cwd:path.resolve(__dirname,'..'),stdio:'inherit'});};

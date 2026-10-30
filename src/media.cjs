'use strict';
// This module deliberately knows nothing about Electron or the UI.
const {spawn}=require('node:child_process');
const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const FORMATS={webp:['libwebp_anim'],avif:['libaom-av1'],gif:['gif'],mp4:['libx264','libx265','libaom-av1'],webm:['libvpx-vp9','libaom-av1'],mkv:['libx264','libx265','libvpx-vp9','libaom-av1'],mov:['libx264'],avi:['mpeg4']};
function run(bin,args,{signal,onProgress}={}) { return new Promise((resolve,reject)=>{
 if(signal?.aborted)return reject(new Error('Cancelled'));
 const p=spawn(bin,args,{windowsHide:true,stdio:['ignore','pipe','pipe']});let out=[],err='',line='';
 const abort=()=>p.kill(); signal?.addEventListener('abort',abort,{once:true});
 p.stdout.on('data',b=>{if(onProgress){line+=b.toString();const lines=line.split('\n');line=lines.pop();for(const l of lines){const [k,v]=l.trim().split('=');if(k==='out_time_us')onProgress(Number(v)/1e6);}}else out.push(b);});
 p.stderr.on('data',b=>{err=(err+b.toString()).slice(-16000);});
 p.on('error',reject);p.on('close',code=>{signal?.removeEventListener('abort',abort);if(signal?.aborted)reject(new Error('Cancelled'));else if(code!==0)reject(new Error(err||`Media process exited ${code}`));else resolve(Buffer.concat(out));});
});}
async function probe(bin,file){const d=JSON.parse(await run(bin,['-v','error','-protocol_whitelist','file,pipe','-show_format','-show_streams','-show_data_hash','sha256','-of','json',file]));const v=d.streams.find(s=>s.codec_type==='video'&&!s.disposition?.attached_pic);if(!v)throw Error('No video stream found.');const rot=Math.abs(Number(v.side_data_list?.find(s=>s.rotation!==undefined)?.rotation||v.tags?.rotate||0))%180;const fps=s=>{const [a,b]=String(s).split('/').map(Number);return b?a/b:a||0;};let duration=[d.format.duration,v.duration].map(Number).find(n=>Number.isFinite(n)&&n>0);if(!duration){const packets=JSON.parse(await run(bin,['-v','error','-select_streams','v:0','-show_packets','-show_entries','packet=pts_time,duration_time','-of','json',file])).packets||[];duration=packets.reduce((n,p)=>Math.max(n,(Number(p.pts_time)||0)+(Number(p.duration_time)||0)),0);}if(!(duration>0&&v.width>0&&v.height>0))throw Error('This file has no readable video duration or dimensions.');return {container:d.format.format_name,streams:d.streams.filter(s=>['video','audio'].includes(s.codec_type)),fpsExact:v.avg_frame_rate,rotation:rot,path:file,name:path.basename(file),width:rot===90?v.height:v.width,height:rot===90?v.width:v.height,duration,fps:fps(v.avg_frame_rate)||fps(v.r_frame_rate),codec:v.codec_name,audio:d.streams.some(s=>s.codec_type==='audio'),bytes:Number(d.format.size)||0,bitrate:Number(d.format.bit_rate)||0};}
function number(x,def,min,max,label){if(x===''||x==null)return def;const n=Number(x);if(!Number.isFinite(n)||n<min||n>max)throw Error(`${label} must be between ${min} and ${max}.`);return n;}
function normalize(raw,meta){const s=raw.preset&&raw.preset!=='custom'?{...raw,...preset(raw.preset,meta)}:{...raw};if(!FORMATS[s.format])throw Error('Unsupported output format.');s.codec=s.codec||FORMATS[s.format][0];if(!FORMATS[s.format].includes(s.codec))throw Error('Codec is incompatible with this format.');s.start=number(s.start,0,0,meta.duration,'Start');s.end=number(s.end,meta.duration,0,meta.duration,'End');if(s.end<=s.start)throw Error('End must be after start.');s.duration=s.end-s.start;s.fps=number(s.fps,0,0,120,'FPS');s.width=Math.round(number(s.width,meta.width,16,7680,'Width'));s.width=Math.max(16,Math.round(s.width/2)*2);s.height=Math.max(2,Math.round((s.width*meta.height/meta.width)/2)*2);if(s.width*s.height>40000000)throw Error('Output dimensions are too large.');s.quality=number(s.quality,80,10,100,'Quality');s.bitrate=number(s.bitrate,0,0,200000,'Bitrate');s.targetMB=number(s.targetMB,0,0,20000,'Target size');s.loop=Math.round(number(s.loop,0,0,65535,'Loop count'));s.audio=s.audio!==false;return s;}
function command(input,out,s,watermark){const anim=['webp','avif','gif'].includes(s.format);const args=['-hide_banner','-loglevel','error','-nostdin','-y','-threads','2','-ss',String(s.start),'-protocol_whitelist','file,pipe','-i',input];if(watermark)args.push('-protocol_whitelist','file,pipe','-i',watermark);let filters=`[0:v:0]setpts=PTS-STARTPTS,scale=${s.width}:${s.height}:flags=lanczos,setsar=1${s.fps?`,fps=${s.fps}`:''}[base]`;
 if(watermark)filters+=`;[1:v:0]scale=${s.width}:${s.height}:flags=lanczos,format=rgba[wm];[base][wm]overlay=0:0:format=auto:eof_action=repeat[v]`;else filters+=';[base]null[v]';
 if(s.format==='gif')filters+=';[v]split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=sierra2_4a[out]';
 args.push('-filter_complex_threads','1','-filter_complex',filters,'-map',s.format==='gif'?'[out]':'[v]','-t',String(s.duration));
 if(!anim&&s.audio)args.push('-map','0:a:0?','-c:a',s.format==='webm'?'libopus':s.format==='avi'?'libmp3lame':'aac','-b:a','128k');else args.push('-an');
 args.push('-c:v',s.codec,'-threads','2');const crf=Math.round(51*(1-s.quality/100));
 if(s.format==='webp')args.push('-quality',String(s.quality),'-compression_level','4','-loop',String(s.loop));
 else if(s.format==='gif')args.push('-loop',s.loop===1?'-1':String(s.loop));
 else {args.push('-pix_fmt','yuv420p');if(s.codec==='libx264'||s.codec==='libx265')args.push('-preset','medium');if(s.codec==='libx265')args.push('-x265-params','pools=2:frame-threads=2');if(s.codec==='libaom-av1')args.push('-cpu-used','6','-row-mt','1');if(s.codec==='libvpx-vp9')args.push('-deadline','good','-cpu-used','3');
 if(s.bitrate&&!anim)args.push('-b:v',`${Math.round(s.bitrate)}k`);else if(s.codec==='mpeg4')args.push('-q:v',String(Math.max(2,Math.round(31*(1-s.quality/100)))));else args.push('-crf',String(s.codec==='libaom-av1'||s.codec==='libvpx-vp9'?Math.round(63*(1-s.quality/100)):crf),...(s.codec==='libaom-av1'||s.codec==='libvpx-vp9'?['-b:v','0']:[]));
 if(s.format==='avif')args.push('-loop',String(s.loop));if(['mp4','mov'].includes(s.format))args.push('-movflags','+faststart');}
 if(!s.fps && s.format!=='avi')args.push('-fps_mode','passthrough');
 args.push('-progress','pipe:1','-nostats',out);return args;}
async function thumbnail(bin,file,time=0){return run(bin,['-hide_banner','-loglevel','error','-ss',String(time),'-protocol_whitelist','file,pipe','-i',file,'-frames:v','1','-vf','scale=960:960:force_original_aspect_ratio=decrease','-threads','1','-f','image2pipe','-vcodec','png','pipe:1']);}
async function convert({ffmpeg,meta,raw,outputDir,watermark,signal,onProgress=()=>{}}){let s=normalize(raw,meta);const token=crypto.randomBytes(4).toString('hex');const base=path.parse(meta.name).name.replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').slice(0,100);const dest=path.join(outputDir,`${base}-converted-${token}.${s.format}`);const temp=path.join(outputDir,`.ff-${token}.partial.${s.format}`);let attempts=0,bytes=0;
 try{for(attempts=1;attempts<=12;attempts++){if(signal?.aborted)throw Error('Cancelled');onProgress({fraction:0,attempt:attempts});await run(ffmpeg,command(meta.path,temp,s,watermark),{signal,onProgress:t=>onProgress({fraction:Math.min(.99,t/s.duration),attempt:attempts})});bytes=(await fs.stat(temp)).size;if(!s.targetMB||bytes<=s.targetMB*1000000)break;if(attempts===12)break;
 const ratio=s.targetMB*1000000/bytes;if(['webp','avif'].includes(s.format)){if(s.quality>35)s.quality=Math.max(35,Math.round(s.quality*Math.min(.85,ratio*.95)));else {s.width=Math.max(16,Math.floor(s.width*Math.min(.85,Math.sqrt(ratio)*.9)/2)*2);s.height=Math.max(2,Math.round(s.width*meta.height/meta.width/2)*2);}}else if(s.format==='gif'){break;}else{s.bitrate=Math.max(20,Math.floor((s.targetMB*8000/s.duration-(s.audio?128:0))*.92*(attempts>1?.85**(attempts-1):1)));}}
 if(signal?.aborted)throw Error('Cancelled');await fs.rename(temp,dest);return {path:dest,bytes,attempts,settings:s,targetMet:!s.targetMB||bytes<=s.targetMB*1000000};}finally{await fs.rm(temp,{force:true}).catch(()=>{});}}
module.exports={FORMATS,run,probe,normalize,command,thumbnail,convert};

function preset(name,meta){
 const s={fps:0,width:'',targetMB:0,quality:80,bitrate:0,start:0,end:'',loop:0,audio:true};
 if(['webp','small','avif'].includes(name)){s.format=name==='avif'?'avif':'webp';s.width=Math.min(meta.width,640);if(name==='small')s.targetMB=5;}
 else if(name==='social')s.format='mp4';
 else if(name==='same'){s.format=path.extname(meta.name).slice(1).toLowerCase();if(s.format==='m4v')s.format='mp4';if(!FORMATS[s.format])throw Error('Source container is not an available output. Choose Custom settings.');}
 else throw Error('Unknown preset.');
 const encoder={h264:'libx264',hevc:'libx265',vp9:'libvpx-vp9',av1:'libaom-av1',mpeg4:'mpeg4'}[meta.codec];
 s.codec=name==='same'&&FORMATS[s.format].includes(encoder)?encoder:FORMATS[s.format][0];return s;
}
function validateMerge(metas){
 if(!Array.isArray(metas)||metas.length<2||metas.length>100)throw Error('Choose 2–100 videos to merge.');
 const first=metas[0],ext=path.extname(first.name).slice(1).toLowerCase();
 if(!['mp4','m4v','mov','mkv','webm','avi','ts'].includes(ext))throw Error('Merge supports MP4, M4V, MOV, MKV, WebM, AVI and TS videos.');
 const fields=['codec_type','codec_name','codec_tag_string','profile','level','width','height','pix_fmt','sample_aspect_ratio','r_frame_rate','time_base','sample_rate','channels','channel_layout','extradata_hash'];
 const signature=m=>JSON.stringify([m.rotation,m.streams.map(s=>fields.map(k=>s[k]??null))]);
 for(const m of metas.slice(1))if(path.extname(m.name).slice(1).toLowerCase()!==ext||m.container!==first.container||signature(m)!==signature(first))throw Error(`${m.name}: incompatible with the first clip. Use the same container, video codec/settings, dimensions, frame rate, rotation and audio layout. Convert clips to matching settings first.`);
 return ext;
}
async function merge({ffmpeg,metas,outputDir,signal,onProgress=()=>{}}){
 const ext=validateMerge(metas),token=crypto.randomBytes(6).toString('hex'),dest=path.join(outputDir,`merged-${token}.${ext}`),temp=path.join(outputDir,`.ff-${token}.partial.${ext}`),list=path.join(outputDir,`.ff-${token}.txt`);
 const duration=metas.reduce((n,m)=>n+m.duration,0);
 try {
 await fs.writeFile(list,metas.map(m=>"file '"+m.path.replace(/\\/g,'/').replace(/'/g,"'\\''")+"'").join('\n'));
 const args=['-hide_banner','-loglevel','error','-nostdin','-y','-f','concat','-safe','0','-protocol_whitelist','file,pipe','-i',list,'-map','0:v:0','-map','0:a?','-c','copy'];
 if(['mp4','m4v','mov'].includes(ext))args.push('-movflags','+faststart');
 args.push('-progress','pipe:1','-nostats',temp);
 await run(ffmpeg,args,{signal,onProgress:t=>onProgress({fraction:Math.min(.99,t/duration),attempt:1})});
 if(signal?.aborted)throw Error('Cancelled');
 const bytes=(await fs.stat(temp)).size;await fs.rename(temp,dest);return {path:dest,bytes,targetMet:true};
 }finally{await fs.rm(list,{force:true});await fs.rm(temp,{force:true});}
}
module.exports.preset=preset;module.exports.validateMerge=validateMerge;module.exports.merge=merge;

// Merge through lossless working clips so mixed containers/codecs can use one export.
function mergeMeta(metas){
 if(!Array.isArray(metas)||metas.length<2||metas.length>100)throw Error('Choose 2–100 clips to merge.');
 return {...metas[0],duration:metas.reduce((n,m)=>n+m.duration,0),audio:metas.some(m=>m.audio)};
}
async function mergeExport({ffmpeg,metas,raw,outputDir,watermark,signal,onProgress=()=>{}}){
 const os=require('node:os');const virtual=mergeMeta(metas),s=normalize(raw,virtual);
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'ff-merge-'));
 try{
 const clips=[];
 for(let i=0;i<metas.length;i++){
 const m=metas[i],out=path.join(dir,`clip-${i}.mkv`);clips.push(out);
 const args=['-hide_banner','-loglevel','error','-nostdin','-y','-threads','2','-protocol_whitelist','file,pipe','-i',m.path];
 if(!m.audio)args.push('-f','lavfi','-i','anullsrc=r=48000:cl=stereo');
 args.push('-map','0:v:0','-map',m.audio?'0:a:0':'1:a:0','-vf',`setpts=PTS-STARTPTS,scale=${s.width}:${s.height}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${s.width}:${s.height}:(ow-iw)/2:(oh-ih)/2,setsar=1`,'-af',`asetpts=PTS-STARTPTS,aresample=48000,apad,atrim=duration=${m.duration}`,'-t',String(m.duration),'-c:v','ffv1','-level','3','-pix_fmt','bgra','-threads','2','-fps_mode','passthrough','-c:a','pcm_s16le','-ar','48000','-ac','2','-progress','pipe:1',out);
 await run(ffmpeg,args,{signal,onProgress:t=>onProgress({fraction:.4*(i+Math.min(1,t/m.duration))/metas.length,attempt:1,phase:`Preparing clip ${i+1}/${metas.length}`})});
 }
 const list=path.join(dir,'clips.ffconcat');await fs.writeFile(list,clips.map((_,i)=>`file 'clip-${i}.mkv'\nduration ${metas[i].duration}`).join('\n'));
 const joined=path.join(dir,'joined.mkv');
 await run(ffmpeg,['-v','error','-nostdin','-y','-f','concat','-safe','0','-protocol_whitelist','file,pipe','-i',list,'-map','0:v:0','-map','0:a:0','-c','copy',joined],{signal});
 // Freeze preset choices resolved against the first source, then apply trim once to the combined timeline.
 return await convert({ffmpeg,meta:{...virtual,name:'merged.'+s.format,path:joined,width:s.width,height:s.height},raw:{...s,preset:'custom'},outputDir,watermark,signal,onProgress:p=>onProgress({...p,fraction:.4+.6*p.fraction,phase:'Encoding merged export'})});
 }finally{await fs.rm(dir,{recursive:true,force:true});}
}
module.exports.mergeMeta=mergeMeta;module.exports.mergeExport=mergeExport;

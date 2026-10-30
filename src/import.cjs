"use strict";
const fs=require('node:fs/promises'),path=require('node:path');
const sharp=require('sharp');const media=require('./media.cjs');
// Decode WebP with libwebp via libvips, including composited animated frames and delays.
async function prepareSource({file,ffmpeg,ffprobe,cacheDir}){
 const ext=path.extname(file).toLowerCase();
 if(!['.webp','.png','.jpg','.jpeg','.bmp','.tif','.tiff'].includes(ext))return media.probe(ffprobe,file);
 const decoder=sharp(file,{animated:true,limitInputPixels:1000000000});const info=await decoder.metadata();
 const pages=info.pages||1,height=info.pageHeight||info.height,width=info.width;
 if(!width||!height||width*height>40000000||width*height*pages>1000000000)throw Error('Image animation exceeds the import limit (40 million pixels per frame or one billion total pixels).');
 const dir=await fs.mkdtemp(path.join(cacheDir,'image-'));
 try{
 const rawPath=path.join(dir,'frames.rgba');let raw;const stream=decoder.ensureAlpha().raw();stream.on('info',value=>{raw=value;});await require('node:stream/promises').pipeline(stream,require('node:fs').createWriteStream(rawPath));const handle=await fs.open(rawPath,'r');
 try{
 const delays=pages===1?[5000]:Array.from({length:pages},(_,i)=>Math.max(1,Number(info.delay?.[i])||100));
 const lines=['ffconcat version 1.0'];
 for(let i=0;i<pages;i++){
 const stride=width*height*raw.channels;const frame=path.join(dir,`frame-${i}.png`);
 const frameData=Buffer.alloc(stride);const read=await handle.read(frameData,0,stride,i*stride);if(read.bytesRead!==stride)throw Error('Incomplete decoded image frame.');
 await sharp(frameData,{raw:{width,height,channels:raw.channels}}).png().toFile(frame);
 lines.push(`file 'frame-${i}.png'`,'option framerate 1000',`duration ${(i===pages-1?Math.max(1,delays[i]-1):delays[i])/1000}`);
 }
 lines.push(`file 'frame-${pages-1}.png'`,'option framerate 1000');
 const list=path.join(dir,'frames.ffconcat'),out=path.join(dir,'decoded.mkv'),duration=delays.reduce((n,d)=>n+d,0)/1000;
 await fs.writeFile(list,lines.join('\n'));
 await media.run(ffmpeg,['-v','error','-nostdin','-y','-f','concat','-safe','0','-protocol_whitelist','file,pipe','-i',list,'-t',String(duration),'-fps_mode','passthrough','-c:v','ffv1','-pix_fmt','bgra','-threads','2',out]);
 const meta=await media.probe(ffprobe,out);
 for(let i=0;i<pages;i++)await fs.rm(path.join(dir,`frame-${i}.png`));await fs.rm(list);
 return {...meta,originalPath:file,name:path.basename(file),duration,fps:pages===1?1:pages/duration,codec:info.format,bytes:(await fs.stat(file)).size,still:pages===1};
 }finally{await handle.close();await fs.rm(rawPath,{force:true});}
 }catch(e){await fs.rm(dir,{recursive:true,force:true});throw e;}
}
module.exports={prepareSource};

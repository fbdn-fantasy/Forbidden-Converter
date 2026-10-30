const {contextBridge,ipcRenderer,webUtils}=require('electron');
contextBridge.exposeInMainWorld('studio',{
 supportKofi:()=>ipcRenderer.invoke('support-kofi'),
 merge:request=>ipcRenderer.invoke('merge',request),
 health:()=>ipcRenderer.invoke('health'),pickInputs:()=>ipcRenderer.invoke('pick-inputs'),
 dropInputs:files=>ipcRenderer.invoke('drop-inputs',Array.from(files).map(f=>webUtils.getPathForFile(f))),
 thumbnail:(id,time)=>ipcRenderer.invoke('thumbnail',id,time),outputFolder:()=>ipcRenderer.invoke('output-folder'),
 pickWatermark:()=>ipcRenderer.invoke('pick-watermark'),enqueue:jobs=>ipcRenderer.invoke('enqueue',jobs),
 cancel:id=>ipcRenderer.invoke('cancel',id),reveal:id=>ipcRenderer.invoke('reveal',id),openResult:id=>ipcRenderer.invoke('open-result',id),
 onJob:fn=>{ipcRenderer.on('job',(_e,data)=>fn(data));}
});

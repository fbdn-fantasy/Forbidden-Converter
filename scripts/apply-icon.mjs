import * as PE from 'pe-library';
import * as RE from 'resedit';
import fs from 'node:fs';
const target=process.argv[2]||'dist/win-unpacked/Forbidden Converter.exe';
const exe=PE.NtExecutable.from(fs.readFileSync(target),{ignoreCert:true});const resource=PE.NtExecutableResource.from(exe);
const ico=RE.Data.IconFile.from(fs.readFileSync('src/assets/icon.ico'));
for(const group of RE.Resource.IconGroupEntry.fromEntries(resource.entries))RE.Resource.IconGroupEntry.replaceIconsForResource(resource.entries,group.id,group.lang,ico.icons.map(i=>i.data));
for(const vi of RE.Resource.VersionInfo.fromEntries(resource.entries)){vi.setFileVersion(0,3,1,0,1033);vi.setProductVersion(0,3,1,0,1033);vi.setStringValues({lang:1033,codepage:1200},{ProductName:'Forbidden Converter',FileDescription:'Forbidden Converter',CompanyName:'ForbiddenFantasy'});vi.outputToResourceEntries(resource.entries);}
resource.outputResource(exe);fs.writeFileSync(target,Buffer.from(exe.generate()));
const check=PE.NtExecutableResource.from(PE.NtExecutable.from(fs.readFileSync(target)));const groups=RE.Resource.IconGroupEntry.fromEntries(check.entries);if(!groups.length||groups[0].icons.length!==ico.icons.length)throw Error('Icon verification failed');console.log('Applied and verified app icon ('+ico.icons.length+' sizes).');

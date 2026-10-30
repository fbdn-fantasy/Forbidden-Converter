'use strict';
// Alternative NSIS packaging path, useful on Linux without Wine.
// First: npx electron-builder --win --dir --x64
// Then: MAKENSIS=/path/to/makensis node scripts/build-installer.cjs
const fs=require('node:fs');const path=require('node:path');const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),dist=path.join(root,process.env.BUILD_OUTPUT||'dist'),input=path.join(dist,'win-unpacked');
const files=[],dirs=[];function walk(dir,rel=''){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(rel,e.name);if(e.isDirectory()){dirs.push(p);walk(path.join(dir,e.name),p);}else files.push(p);}}walk(input);
const nsisPath=s=>s.replace(/\$/g,'$$').replace(/"/g,'$\\"');const winPath=s=>s.split(path.sep).join('\\');
const body=`Unicode true
!include "MUI2.nsh"
!include "x64.nsh"
!include "WinVer.nsh"
Name "Forbidden Converter"
OutFile "${nsisPath(path.join(dist,'Forbidden-Converter-v4-Windows-x64-Setup.exe'))}"
InstallDir "$LOCALAPPDATA\\Programs\\Forbidden Converter"
InstallDirRegKey HKCU "Software\\ForbiddenFantasy\\Converter" "InstallDir"
RequestExecutionLevel user
SetCompressor /SOLID zlib
VIProductVersion "0.4.0.0"
VIAddVersionKey /LANG=1033 "ProductName" "Forbidden Converter"
VIAddVersionKey /LANG=1033 "FileDescription" "Forbidden Converter offline installer"
VIAddVersionKey /LANG=1033 "FileVersion" "0.4.0"
VIAddVersionKey /LANG=1033 "LegalCopyright" "Copyright 2026 ForbiddenFantasy"
!define MUI_ICON "${nsisPath(path.join(root,'src/assets/icon.ico'))}"
!define MUI_UNICON "${nsisPath(path.join(root,'src/assets/icon.ico'))}"
!define MUI_ABORTWARNING
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "${nsisPath(path.join(root,'LICENSE'))}"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
Function .onInit
  \${IfNot} \${RunningX64}
    MessageBox MB_OK "This release requires 64-bit Windows."
    Abort
  \${EndIf}
  \${IfNot} \${AtLeastWin10}
    MessageBox MB_OK "This release requires Windows 10 or later."
    Abort
  \${EndIf}
FunctionEnd
Section "Install"
SetOutPath "$INSTDIR"
File /r "${nsisPath(input)}/*"
WriteUninstaller "$INSTDIR\\Uninstall.exe"
CreateDirectory "$SMPROGRAMS\\Forbidden Converter"
CreateShortcut "$SMPROGRAMS\\Forbidden Converter\\Forbidden Converter.lnk" "$INSTDIR\\Forbidden Converter.exe"
CreateShortcut "$SMPROGRAMS\\Forbidden Converter\\Uninstall.lnk" "$INSTDIR\\Uninstall.exe"
CreateShortcut "$DESKTOP\\Forbidden Converter.lnk" "$INSTDIR\\Forbidden Converter.exe"
WriteRegStr HKCU "Software\\ForbiddenFantasy\\Converter" "InstallDir" "$INSTDIR"
WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\ForbiddenConverter" "DisplayName" "Forbidden Converter"
WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\ForbiddenConverter" "DisplayVersion" "0.4.0"
WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\ForbiddenConverter" "Publisher" "ForbiddenFantasy"
WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\ForbiddenConverter" "UninstallString" '$\\"$INSTDIR\\Uninstall.exe$\\"'
WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\ForbiddenConverter" "DisplayIcon" "$INSTDIR\\Forbidden Converter.exe"
SectionEnd
Section "Uninstall"
${files.map(f=>'Delete "$INSTDIR\\'+nsisPath(winPath(f))+'"').join('\n')}
${dirs.reverse().map(d=>'RMDir "$INSTDIR\\'+nsisPath(winPath(d))+'"').join('\n')}
Delete "$INSTDIR\\Uninstall.exe"
RMDir "$INSTDIR"
Delete "$DESKTOP\\Forbidden Converter.lnk"
Delete "$SMPROGRAMS\\Forbidden Converter\\Forbidden Converter.lnk"
Delete "$SMPROGRAMS\\Forbidden Converter\\Uninstall.lnk"
RMDir "$SMPROGRAMS\\Forbidden Converter"
DeleteRegKey HKCU "Software\\ForbiddenFantasy\\Converter"
DeleteRegKey HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\ForbiddenConverter"
SectionEnd
`;
const script=path.join(dist,'installer.nsi');fs.writeFileSync(script,body);execFileSync(process.env.MAKENSIS||'makensis',['-V2',script],{stdio:'inherit'});

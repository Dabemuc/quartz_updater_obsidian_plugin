/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source, please visit the github repository of this plugin
*/

var w=Object.defineProperty;var U=Object.getOwnPropertyDescriptor;var A=Object.getOwnPropertyNames;var M=Object.prototype.hasOwnProperty;var F=(r,a)=>{for(var t in a)w(r,t,{get:a[t],enumerable:!0})},P=(r,a,t,e)=>{if(a&&typeof a=="object"||typeof a=="function")for(let n of A(a))!M.call(r,n)&&n!==t&&w(r,n,{get:()=>a[n],enumerable:!(e=U(a,n))||e.enumerable});return r};var q=r=>P(w({},"__esModule",{value:!0}),r);var L={};F(L,{default:()=>f});module.exports=q(L);var i=require("obsidian"),E=require("crypto"),R={backendUrl:""},f=class extends i.Plugin{async onload(){await this.loadSettings();let t=this.addRibbonIcon("folder-sync","Quartz Sync",e=>{new b(this.app,this.settings).open()});this.addCommand({id:"open-quartz-sync-modal",name:"Open quartz sync modal",callback:()=>{new b(this.app,this.settings).open()}}),this.addSettingTab(new S(this.app,this))}onunload(){}async loadSettings(){this.settings=Object.assign({},R,await this.loadData())}async saveSettings(){this.settings.backendUrl.endsWith("/")&&(this.settings.backendUrl=this.settings.backendUrl.slice(0,-1)),await this.saveData(this.settings)}},o="not-started",m="",u="",b=class extends i.Modal{constructor(t,e){super(t);this.hashContent=t=>(0,E.createHash)("sha256").update(t).digest("hex");this.settings=e}onOpen(){let{contentEl:t}=this,e=t.createDiv("quartz-sync-modal");e.createEl("h2",{text:"Quartz Sync"}),e.createEl("p",{text:"This will attempt to sync all files marked with the quartz-sync=true frontmatter to the configured quartz_updater backend."});let n=e.createEl("button",{text:"Start sync"});e.createEl("h3",{text:"Sync status:"});let l=e.createEl("p",{text:o});e.createEl("h3",{text:"Client manifest generated:"});let c=e.createEl("p",{text:"..."});e.createEl("h3",{text:"Server response:"});let y=e.createEl("p",{text:"..."});n.addEventListener("click",()=>this.handleSync(l,n,y,c))}async handleSync(t,e,n,l){this.startStatusUpdate(t,e),m="",u="",o="started";try{if(!this.settings.backendUrl||this.settings.backendUrl==="")throw new Error("Backend URL is not set");l.innerText+=`All files found by getMarkdownFiles: 
`+this.app.vault.getMarkdownFiles().map(s=>s.path).join(`
`),l.innerText+=`All files found by getFiles
`+this.app.vault.getFiles().map(s=>s.path).join(`
`);let c=this.app.vault.getMarkdownFiles().filter(s=>{var h;let d=(h=this.app.metadataCache.getFileCache(s))==null?void 0:h.frontmatter;return l.innerText+=`
 Frontmatter for File ${s.path}: 
 ${JSON.stringify(d)}`,d&&d["quartz-sync"]===!0});l.innerText+=`
 Files to sync: 
 ${c.map(s=>s.path).join(`
`)}`;let y=await Promise.all(c.map(async s=>{let d=this.app.vault.getAbstractFileByPath(s.path);if(!(d instanceof i.TFile))throw new Error(`File ${s.path} could not be read`);return{path:s.path,hash:this.hashContent(await this.app.vault.read(d))}}));o="manifest-built",l.innerText+=`
 Generated Manifest: 
 ${JSON.stringify(y)}`;let T=await fetch(this.settings.backendUrl+"/request-update",{method:"POST",mode:"cors",headers:{Accept:"application/json","Content-Type":"application/json"},body:JSON.stringify({manifest:y})});o="manifest-sent";let g=await T.json();if(n.innerText=JSON.stringify(g),T.status!==200)throw new Error("An Error occurred while sending the manifest");if(!g.body||!g.body.updateSessions)throw new Error("Response body is invalid");let x=g.body.updateSessions;if(!Array.isArray(x))throw new Error("Update sessions not found in response body");o="update-sessions-received",n.innerText="",await Promise.all(x.map(async s=>{let d=await Promise.all(s.permittedChanges.map(async p=>{let v=this.app.vault.getAbstractFileByPath(p.path);if(!(v instanceof i.TFile))throw new Error(`File ${p.path} could not be read`);return{type:p.type,path:p.path,content:await this.app.vault.read(v)}})),h=await fetch(this.settings.backendUrl+"/update-batch",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:s.id,updates:d})});if(n.innerText=n.innerText+`
`+s.id+`: 
`+JSON.stringify(await h.json()),h.status!==200)throw new Error("An Error occurred while sending updates");let k=(await h.json()).body;if(!Array.isArray(k))throw new Error("Invalid response body");k.forEach(p=>{u+=`${p.path}: ${p.status}
`})})),o="results-received"}catch(c){m=`Message: ${c.message} 
Stack: ${c.stack} 
Error: ${c}`,o="error"}}async startStatusUpdate(t,e){let n=setInterval(()=>{switch(t.innerText=o,o){case"started":t.innerText="Sending manifest",e.setAttribute("disabled","true"),e.innerText="Syncing...";break;case"manifest-sent":t.innerText="Waiting for update sessions";break;case"update-sessions-received":t.innerText=u;break;case"results-received":t.innerText=u,t.style.color="green",clearInterval(n),e.removeAttribute("disabled"),e.innerText="Restart sync";break;case"error":t.innerText=m,t.style.color="red",clearInterval(n),e.removeAttribute("disabled"),e.innerText="Restart sync";break}},1e3)}onClose(){let{contentEl:t}=this;t.empty(),o="not-started",m="",u=""}},S=class extends i.PluginSettingTab{constructor(t,e){super(t,e);this.plugin=e}display(){let{containerEl:t}=this;t.empty(),new i.Setting(t).setName("Backend URL").setDesc("URL of the quartz_updater backend").addText(e=>e.setPlaceholder("Required!").setValue(this.plugin.settings.backendUrl).onChange(async n=>{this.plugin.settings.backendUrl=n,await this.plugin.saveSettings()}))}};

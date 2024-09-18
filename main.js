/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source, please visit the github repository of this plugin
*/

var k=Object.defineProperty;var z=Object.getOwnPropertyDescriptor;var L=Object.getOwnPropertyNames;var D=Object.prototype.hasOwnProperty;var R=(i,n)=>{for(var t in n)k(i,t,{get:n[t],enumerable:!0})},q=(i,n,t,e)=>{if(n&&typeof n=="object"||typeof n=="function")for(let s of L(n))!D.call(i,s)&&s!==t&&k(i,s,{get:()=>n[s],enumerable:!(e=z(n,s))||e.enumerable});return i};var O=i=>q(k({},"__esModule",{value:!0}),i);var Q={};R(Q,{default:()=>T});module.exports=O(Q);var l=require("obsidian"),P=require("crypto");var I=[1518500249,1859775393,-1894007588,-899497514],M={sha1:1};function B(i){if(i&&!M[i]&&!M[i.toLowerCase()])throw new Error("Digest method not supported");return new v}var v=class{constructor(){this.A=1732584193,this.B=-271733879,this.C=-1732584194,this.D=271733878,this.E=-1009589776,this._size=0,this._sp=0,(!_||w>=8e3)&&(_=new ArrayBuffer(8e3),w=0),this._byte=new Uint8Array(_,w,80),this._word=new Int32Array(_,w,20),w+=80}update(n){if(typeof n=="string")return this._utf8(n);if(n==null)throw new TypeError("Invalid type: "+typeof n);let t=n.byteOffset,e=n.byteLength,s=e/64|0,a=0;if(s&&!(t&3)&&!(this._size%64)){let o=new Int32Array(n.buffer,t,s*16);for(;s--;)this._int32(o,a>>2),a+=64;this._size+=a}if(n.BYTES_PER_ELEMENT!==1&&n.buffer){let o=new Uint8Array(n.buffer,t+a,e-a);return this._uint8(o)}return a===e?this:this._uint8(n,a)}_uint8(n,t){let{_byte:e,_word:s}=this,a=n.length;for(t=t|0;t<a;){let c=this._size%64,o=c;for(;t<a&&o<64;)e[o++]=n[t++];o>=64&&this._int32(s),this._size+=o-c}return this}_utf8(n){let{_byte:t,_word:e}=this,s=n.length,a=this._sp;for(let c=0;c<s;){let o=this._size%64,r=o;for(;c<s&&r<64;){let h=n.charCodeAt(c++)|0;h<128?t[r++]=h:h<2048?(t[r++]=192|h>>>6,t[r++]=128|h&63):h<55296||h>57343?(t[r++]=224|h>>>12,t[r++]=128|h>>>6&63,t[r++]=128|h&63):a?(h=((a&1023)<<10)+(h&1023)+65536,t[r++]=240|h>>>18,t[r++]=128|h>>>12&63,t[r++]=128|h>>>6&63,t[r++]=128|h&63,a=0):a=h}r>=64&&(this._int32(e),e[0]=e[16]),this._size+=r-o}return this._sp=a,this}_int32(n,t){let{A:e,B:s,C:a,D:c,E:o}=this,r=0;for(t=t|0;r<16;)g[r++]=u(n[t++]);for(r=16;r<80;r++)g[r]=$(g[r-3]^g[r-8]^g[r-14]^g[r-16]);for(r=0;r<80;r++){let h=r/20|0,m=J(e)+W(h,s,a,c)+o+g[r]+I[h]|0;o=c,c=a,a=j(s),s=e,e=m}this.A=e+this.A|0,this.B=s+this.B|0,this.C=a+this.C|0,this.D=c+this.D|0,this.E=o+this.E|0}digest(n){let{_byte:t,_word:e}=this,s=this._size%64|0;for(t[s++]=128;s&3;)t[s++]=0;if(s>>=2,s>14){for(;s<16;)e[s++]=0;s=0,this._int32(e)}for(;s<16;)e[s++]=0;let a=this._size*8,c=(a&4294967295)>>>0,o=(a-c)/4294967296;return o&&(e[14]=u(o)),c&&(e[15]=u(c)),this._int32(e),n==="hex"?this._hex():this._bin()}_hex(){let{A:n,B:t,C:e,D:s,E:a}=this;return b(n)+b(t)+b(e)+b(s)+b(a)}_bin(){let{A:n,B:t,C:e,D:s,E:a,_byte:c,_word:o}=this;return o[0]=u(n),o[1]=u(t),o[2]=u(e),o[3]=u(s),o[4]=u(a),c.slice(0,20)}},g=new Int32Array(80),_,w=0,b=i=>(i+4294967296).toString(16).substr(-8),N=i=>i<<24&4278190080|i<<8&16711680|i>>8&65280|i>>24&255,H=i=>i,u=Y()?H:N,$=i=>i<<1|i>>>31,J=i=>i<<5|i>>>27,j=i=>i<<30|i>>>2;function W(i,n,t,e){return i===0?n&t|~n&e:i===2?n&t|n&e|t&e:n^t^e}function Y(){return new Uint8Array(new Uint16Array([65279]).buffer)[0]===254}var G={backendUrl:""},T=class extends l.Plugin{async onload(){await this.loadSettings();let t=this.addRibbonIcon("folder-sync","Quartz Sync",e=>{new A(this.app,this.settings).open()});this.addCommand({id:"open-quartz-sync-modal",name:"Open quartz sync modal",callback:()=>{new A(this.app,this.settings).open()}}),this.addSettingTab(new F(this.app,this))}onunload(){}async loadSettings(){this.settings=Object.assign({},G,await this.loadData())}async saveSettings(){this.settings.backendUrl.endsWith("/")&&(this.settings.backendUrl=this.settings.backendUrl.slice(0,-1)),await this.saveData(this.settings)}},d="not-started",S="",E="",A=class extends l.Modal{constructor(t,e){super(t);this.settings=e}onOpen(){let{contentEl:t}=this,e=t.createDiv("quartz-sync-modal");e.createEl("h2",{text:"Quartz Sync"}),e.createEl("p",{text:"This will attempt to sync all files marked with the quartz-sync=true frontmatter to the configured quartz_updater backend."});let s=e.createEl("button",{text:"Start sync"});e.createEl("h3",{text:"Sync status:"});let a=e.createEl("p",{text:d});e.createEl("h3",{text:"Client manifest generated:"});let c=e.createEl("p",{text:"..."});e.createEl("h3",{text:"Server response:"});let o=e.createEl("p",{text:"..."});s.addEventListener("click",()=>this.handleSync(a,s,o,c))}async handleSync(t,e,s,a){this.startStatusUpdate(t,e),S="",E="",d="started";try{if(!this.settings.backendUrl||this.settings.backendUrl==="")throw new Error("Backend URL is not set");let c=this.app.vault.getFiles().filter(p=>{var f;let y=(f=this.app.metadataCache.getFileCache(p))==null?void 0:f.frontmatter;return y&&y["quartz-sync"]==="true"}),o=await Promise.all(c.map(async p=>{let y=await this.app.vault.read(p);a.innerText+=`
 Content of ${p.path}: 
 ${y}`;let f=this.hashContent(y);return{path:p.path,hash:f}}));d="manifest-built",a.innerText+=`
 Generated Manifest: 
 ${JSON.stringify(o)}`;let r=await fetch(this.settings.backendUrl+"/request-update",{method:"POST",mode:"cors",headers:{Accept:"application/json","Content-Type":"application/json"},body:JSON.stringify({manifest:o})});d="manifest-sent";let h=await r.json();if(s.innerText=JSON.stringify(r),r.status!==200)throw new Error("An Error occurred while sending the manifest");if(!r.body||!h.updateSessions)throw new Error("Response body is invalid");let m=h.updateSessions;if(!Array.isArray(m))throw new Error("Update sessions not found in response body");d="update-sessions-received",s.innerText="",await Promise.all(m.map(async p=>{let y=await Promise.all(p.permittedChanges.map(async x=>{let C=this.app.vault.getAbstractFileByPath(x.path);if(!(C instanceof l.TFile))throw new Error(`File ${x.path} could not be read`);return{type:x.type,path:x.path,content:await this.app.vault.read(C)}})),f=await fetch(this.settings.backendUrl+"/update-batch",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:p.id,updates:y})});if(s.innerText=s.innerText+`
`+p.id+`: 
`+JSON.stringify(await f.json()),f.status!==200)throw new Error("An Error occurred while sending updates");let U=(await f.json()).body;if(!Array.isArray(U))throw new Error("Invalid response body");U.forEach(x=>{E+=`${x.path}: ${x.status}
`})})),d="results-received"}catch(c){S=`Message: ${c.message} 
Stack: ${c.stack} 
Error: ${c}`,d="error"}}hashContent(t){return l.Platform.isMobileApp?B().update(t).digest("hex"):(0,P.createHash)("sha1").update(t).digest("hex")}async startStatusUpdate(t,e){let s=setInterval(()=>{switch(t.innerText=d,d){case"started":t.innerText="Sending manifest",e.setAttribute("disabled","true"),e.innerText="Syncing...";break;case"manifest-sent":t.innerText="Waiting for update sessions";break;case"update-sessions-received":t.innerText=E;break;case"results-received":t.innerText=E,t.style.color="green",clearInterval(s),e.removeAttribute("disabled"),e.innerText="Restart sync";break;case"error":t.innerText=S,t.style.color="red",clearInterval(s),e.removeAttribute("disabled"),e.innerText="Restart sync";break}},1e3)}onClose(){let{contentEl:t}=this;t.empty(),d="not-started",S="",E=""}},F=class extends l.PluginSettingTab{constructor(t,e){super(t,e);this.plugin=e}display(){let{containerEl:t}=this;t.empty(),new l.Setting(t).setName("Backend URL").setDesc("URL of the quartz_updater backend").addText(e=>e.setPlaceholder("Required!").setValue(this.plugin.settings.backendUrl).onChange(async s=>{this.plugin.settings.backendUrl=s,await this.plugin.saveSettings()}))}};

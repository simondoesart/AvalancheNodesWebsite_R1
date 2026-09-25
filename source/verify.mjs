process.on('uncaughtException',error=>{console.error(error.message);process.exit(1);});
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
// Minimal host shim for mathematical and drawing-command verification.
// This does not substitute for an actual browser rendering test.
const noop=()=>{};
const makeCanvas=()=>({style:{},getContext:()=>new Proxy({measureText:s=>({width:s.length*6})},{get:(o,k)=>o[k]??noop})});
globalThis.HTMLElement=class {constructor(){this.isConnected=true;this.events=[];} attachShadow(){const scene={style:{}},view={style:{}},canvases=[makeCanvas(),makeCanvas(),makeCanvas(),makeCanvas(),makeCanvas()];return this.shadowRoot={querySelector:s=>(s==='.extra-host'||s==='.rich-labels')?null:s==='.scene'?scene:view,querySelectorAll:()=>canvases};}dispatchEvent(e){this.events.push(e);}getBoundingClientRect(){return {width:1120,height:660};}};
globalThis.CustomEvent=class {constructor(type,options){this.type=type;this.detail=options.detail;}};
globalThis.customElements={get:()=>false,define:noop};globalThis.devicePixelRatio=2;
const src=await readFile(new URL('./parallax-grid.js',import.meta.url),'utf8');
const {ParallaxGrid}=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
const g=new ParallaxGrid();g.config={rows:50,columns:10,cellRows:2,cellColumns:10,pattern:'all'};
const geom=g.events.filter(e=>e.type==='geometrychange').at(-1).detail;
assert.equal(geom.columns,100);assert.equal(geom.rows,100);assert.equal(geom.width,geom.height);assert.equal(geom.rectangleWidth/geom.rectangleHeight,5);
const c=g.config;for(let i=0;i<3;i++){const z=(i-1)*c.depth,scale=(c.perspective-z)/c.perspective;assert.ok(Math.abs(scale*c.perspective/(c.perspective-z)-1)<1e-12);}
g.config={pattern:'random',seed:345};const first=Array.from({length:50},(_,i)=>g._active(i,2));g.config={color:'#123456'};assert.deepEqual(first,Array.from({length:50},(_,i)=>g._active(i,2)));
g.setPattern(({row,column})=>row===column);assert.equal(g._active(2,2),true);assert.equal(g._active(2,3),false);g.setPattern(null);
g.config={rows:100000,columns:-5,depth:Infinity,color:'oops'};assert.equal(g.config.rows,100);assert.equal(g.config.columns,1);assert.equal(g.config.depth,70);assert.equal(g.config.color,'#ff394a');
g.config={rows:3,columns:4};g._current=[1,-1];g._pose();assert.equal(g._scene.style.transform,'rotateX(7deg) rotateY(7deg)');
for(const file of ['demo.html','parallax-grid-preview.html']){const html=await readFile(new URL(file,import.meta.url),'utf8');const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1].replace(/^import .*;$/m,'');new Function(script);assert.ok(!script.includes('undefined%'));}
console.log('PASS: 100 × 100 alignment, square cells, 5:1 modules, neutral depth compensation, stable seeded patterns, custom patterns, bounds validation, cursor direction, and both demo scripts parse.');
// V2: empty initial state, 1px gutters, inset stroke bounds, pulse envelope,
// perspective picking, viewport coverage and ordered preset scheduling.
const v=new ParallaxGrid();v._draw();assert.equal(v._pulses.size,0);
assert.ok(v._size[0]>=1120&&v._size[1]>=660);
const box=v._cellBox(1,1),next=v._cellBox(1,2),down=v._cellBox(2,1);
assert.ok(Math.abs(next.x-(box.x+box.w)-1)<1e-9);
assert.ok(Math.abs(down.y-(box.y+box.h)-1)<1e-9);
let strokes=[];v._contexts[1]={clearRect(){},save(){},restore(){},fillRect(){},measureText(s){return {width:s.length*6};},beginPath(){},rect(){},clip(){},fillText(){},strokeRect(...args){strokes.push(args);}};
v._trigger(1,1,1000);v._drawMiddle(1200);assert.equal(strokes.length,1);
const [sx,sy,sw,sh]=strokes[0];assert.equal(sx-.5,box.x);assert.equal(sy-.5,box.y);assert.equal(sx+sw+.5,box.x+box.w);assert.equal(sy+sh+.5,box.y+box.h);
const pulse=v._pulses.values().next().value;
assert.equal(v._opacity(pulse,1000),0);assert.equal(v._opacity(pulse,1050),.5);assert.equal(v._opacity(pulse,1300),1);assert.equal(v._opacity(pulse,1900),.5);v._drawMiddle(2250);assert.equal(v._pulses.size,0);
// Project selected points with Rx*Ry, then recover with inverse picking.
v.getBoundingClientRect=()=>({left:25,top:40,width:1120,height:660});
for(const angle of [[0,0],[1,.8],[-.7,1]]){v._current=angle;const a=-angle[1]*v.config.tilt*Math.PI/180,b=angle[0]*v.config.tilt*Math.PI/180,p=v.config.perspective;for(const [x,y] of [[0,0],[123,-99],[-310,210]]){const X=Math.cos(b)*x,Y=Math.sin(a)*Math.sin(b)*x+Math.cos(a)*y,Z=-Math.cos(a)*Math.sin(b)*x+Math.sin(a)*y;const recovered=v._localPoint(25+560+p*X/(p-Z),40+330+p*Y/(p-Z));assert.ok(Math.abs(recovered[0]-v._size[0]/2-x)<1e-8);assert.ok(Math.abs(recovered[1]-v._size[1]/2-y)<1e-8);}}
for(const preset of ['row','sweep','raster','diagonal']){v._queue=[];v._playingPreset=preset;v._schedule(1000);assert.equal(v._queue.length,preset==='row'?v.config.columns:v.config.columns*v.config.rows);assert.ok(v._queue.every((e,i,a)=>i===0||e.time>=a[i-1].time));const firstRow=v._queue.filter(e=>e.row===Math.floor(v.config.rows/2));assert.equal(firstRow.at(-1).column,v.config.columns-1);}
v.stop();assert.equal(v._queue.length,0);assert.equal(v._pulses.size,0);assert.equal(v._playing,false);
console.log('PASS: fullscreen coverage, initially hidden cells, exact 1px gutters, fully inset 1px strokes, reveal/hold/fade lifecycle, tilted perspective picking, four ordered LTR presets and stop/clear.');
const t=new ParallaxGrid();t.config={fill:1,glow:.6,glowRadius:18};assert.equal(t.config.fill,1);assert.equal(t.config.glow,.6);
const ids=Array.from({length:1000},(_,i)=>t.getNodeId(Math.floor(i/20),i%20));assert.ok(ids.every(id=>/^\d[A-Z]\d\d\.\.\.$/.test(id)));assert.ok(new Set(ids).size>900);
const before=t.getNodeId(3,7);t.config={fill:.3,color:'#abcdef',labelTitle:'VALIDATOR'};assert.equal(t.getNodeId(3,7),before);t.config={labelSeed:123};assert.notEqual(t.getNodeId(3,7),before);
const texts=[];const labelCtx={measureText:s=>({width:s.length*6}),beginPath(){},rect(){},clip(){},fillText(...a){texts.push(a);}};
t._drawLabel(labelCtx,0,0,10,20,150,60);assert.equal(texts[0][0],'VALIDATOR');assert.match(texts[1][0],/^\d[A-Z]\d\d\.\.\.$/);assert.equal(labelCtx.textAlign,'right');assert.equal(texts[0][1],154);assert.equal(texts[1][1],154);assert.equal(texts[0][2],26);assert.ok(texts[1][2]>texts[0][2]);assert.match(labelCtx.font,/Aeonik Fono/);
console.log('PASS: 100% fill, glow controls, ID format/distribution/stability, independent ID seed, editable heading, Aeonik Fono and top-right two-line text placement.');
const demoSource=await readFile(new URL('./demo.html',import.meta.url),'utf8');
const parserSource=demoSource.slice(demoSource.indexOf('function parseSettings(input){'),demoSource.indexOf("const presetsKey="));
const parseSettings=new Function('ParallaxGrid',parserSource+';return parseSettings;')(ParallaxGrid);
const packageValue={schema:'avalanche-parallax-grid',version:1,name:'Custom setup 🏔',config:t.config};
assert.deepEqual(parseSettings(JSON.stringify(packageValue)),{name:packageValue.name,config:t.config});
assert.deepEqual(parseSettings(JSON.stringify(t.config)).config,t.config);
assert.equal(parseSettings('{"rows":4}').config.rows,4);assert.equal(parseSettings('{"rows":4}').config.fontSize,10);
for(const invalid of ['{bad','[]','null','{"oops":1}','{"rows":"bad"}','{"motion":"false"}','{"color":"red"}','{"preset":"unknown"}','{"schema":"avalanche-parallax-grid","version":2,"config":{}}',' '.repeat(1048577)])assert.throws(()=>parseSettings(invalid));
assert.equal(Object.hasOwn(parseSettings('{"rows":4,"__proto__":{"bad":true}}').config,'__proto__'),false);
console.log('PASS: named/Unicode settings roundtrip, legacy config imports, default merging, malformed/version/type/color rejection, size limit, and unknown-key exclusion.');
// V5: color isolation, label model/rendering and portable page roundtrips.
const u=new ParallaxGrid();u.config={fillColor:'#123456',guideColor:'#abcdef',color:'#112233',columnLabels:[{enabled:true,size:14,weight:700,color:'#aabbcc',lines:[{text:'ALPHA'},{text:'hidden',enabled:false},{text:'OMEGA'}]}]};
assert.equal(u.config.fillColor,'#123456');assert.equal(u.config.guideColor,'#abcdef');
const copy=u.config;copy.columnLabels[0].lines[0].text='changed';assert.equal(u.config.columnLabels[0].lines[0].text,'ALPHA');
const drawn=[];const context={save:noop,restore:noop,beginPath:noop,rect:noop,clip:noop,fillText:(...x)=>drawn.push(x)};
u._drawColumnLabels(context,150,660,660);assert.equal(context.textAlign,'left');assert.match(context.font,/700 14px/);assert.deepEqual(drawn.map(x=>x[0]),['ALPHA','OMEGA']);assert.equal(drawn[0][1],6);assert.ok(drawn[1][2]>drawn[0][2]);
u.config={columnLabels:[{enabled:true,size:999,weight:900,offset:-5,lines:[{text:'A\nB'}]}],mediaLevel:2.125,depth:80,mediaX:25,mediaY:75};assert.equal(u.config.columnLabels[0].size,320);assert.equal(u.config.columnLabels[0].weight,400);assert.equal(u.config.columnLabels[0].lines[0].text,'A B');assert.match(u._media.style.transform,/translateZ\(170px\)/);assert.equal(u._media.style.left,'25%');
const preview=await readFile(new URL('./parallax-grid-preview.html',import.meta.url),'utf8');
const encoded=preview.match(/<script id="page-template" type="application\/octet-stream">([^<]+)<\/script>/)[1];const base=Buffer.from(encoded,'base64').toString('utf8');
assert.ok(!base.includes('type="application/octet-stream">PC'));assert.ok(!base.includes("import {ParallaxGrid}"));
const safeJSON=new Function(demoSource.match(/function safeJSON\(value\)\{[^\n]+/)[0]+';return safeJSON;')();
const project={config:{...u.config,labelTitle:'</script><script>bad</script> ☃'},media:{type:'image',src:'data:image/png;base64,YWJj',name:'image.png'},tileAsset:null};
const payload='<script id="project-data" type="application/json">'+safeJSON(project)+'</script>';
const exported=base.replace('<!--PROJECT_PAYLOAD-->',payload+'<script id="page-template" type="application/octet-stream">'+encoded+'</script>');
assert.deepEqual(JSON.parse(exported.match(/<script id="project-data" type="application\/json">([^<]+)<\/script>/)[1]),project);
new Function(exported.match(/<script type="module">([\s\S]*?)<\/script>/)[1]);
assert.equal(exported.match(/<script id="page-template" type="application\/octet-stream">([^<]+)<\/script>/)[1],encoded);
assert.ok(demoSource.includes('localStorage.setItem(defaultKey,JSON.stringify(settingsPackage()))'));
console.log('PASS: separate colors, column text toggles/styles/copy safety, foreground depth/position, safe offline media/settings export and stable re-export template.');

const spaced=new ParallaxGrid();spaced.config={columnLabels:[{enabled:true,size:120,offset:1200,lineSpacing:180,letterSpacing:4,lines:[{text:'AB'},{text:'CD'}]}]};
const glyphs=[];spaced._drawColumnLabels({...context,measureText:()=>({width:50}),fillText:(...args)=>glyphs.push(args)},150,3000,3000);
assert.equal(glyphs[1][1]-glyphs[0][1],54);assert.equal(glyphs[2][2]-glyphs[0][2],336);assert.equal(glyphs[0][2],1200);assert.ok(glyphs.every(a=>a.length===3));
assert.equal(parseSettings(JSON.stringify(spaced.config)).config.columnLabels[0].letterSpacing,4);
console.log('PASS: large column text, expanded vertical offset, letter advances, extra line spacing and settings roundtrip.');

// V6: depth separation, nonzero cell-plane picking, mobile geometry and extra layers.
const layers=new ParallaxGrid();layers.config={dotLevel:-3,cellLevel:2,guideLevel:4,labelLevel:5,mediaLevel:6};
assert.match(layers._canvases[2].style.transform,/translateZ\(280px\)/);assert.match(layers._canvases[3].style.transform,/translateZ\(350px\)/);assert.match(layers._media.style.transform,/translateZ\(420px\)/);
layers.getBoundingClientRect=()=>({left:0,top:0,width:1120,height:660});layers._current=[.6,-.4];
{const p=layers.config.perspective,z=layers._z(2),scale=(p-z)/p,a=.4*layers.config.tilt*Math.PI/180,b=.6*layers.config.tilt*Math.PI/180,x=80*scale,y=-70*scale;const X=Math.cos(b)*x+Math.sin(b)*z,Y=Math.sin(a)*Math.sin(b)*x+Math.cos(a)*y-Math.sin(a)*Math.cos(b)*z,Z=-Math.cos(a)*Math.sin(b)*x+Math.sin(a)*y+Math.cos(a)*Math.cos(b)*z;const hit=layers._localPoint(560+p*X/(p-Z),330+p*Y/(p-Z));assert.ok(Math.abs(hit[0]-layers._size[0]/2-80)<1e-8);assert.ok(Math.abs(hit[1]-layers._size[1]/2+70)<1e-8);}
layers.config={mobileMode:'mobile',mobileColumns:3};assert.equal(layers._effectiveConfig().columns,3);assert.equal(layers._effectiveConfig().fill,1);assert.equal(layers.config.columns,8);assert.equal(layers._effectiveConfig().labels,false);
const makeElement=()=>({style:{},children:[],append(el){this.children.push(el);this.firstElementChild=this.children[0];},replaceChildren(...els){this.children=els;this.firstElementChild=els[0];},querySelector(){return null;},remove(){this.removed=true;},decode:async()=>{}});
globalThis.document={createElement:makeElement};const host=makeElement();const query=layers.shadowRoot.querySelector;layers.shadowRoot.querySelector=s=>s==='.extra-host'?host:query(s);
layers.config={extraLayers:[{id:'title',type:'text',text:'Avalanche',level:3,x:20,y:30},{id:'film',type:'media',level:5}]};
assert.equal(layers._extraElements.get('title').textContent,'Avalanche');assert.equal(host.children.length,2);await layers.setLayerMedia('film','data:image/png;base64,YWJj','image');assert.equal(layers.layerMedia.film.src,'data:image/png;base64,YWJj');
const cfg=layers.config;cfg.extraLayers[0].text='mutated';assert.equal(layers.config.extraLayers[0].text,'Avalanche');layers.config={extraLayers:[layers.config.extraLayers[0]]};assert.equal(layers._extraElements.size,1);assert.equal(layers.layerMedia.film,undefined);
assert.deepEqual(parseSettings(JSON.stringify(layers.config)).config.extraLayers,layers.config.extraLayers);
console.log('PASS: independent depths, picking at elevated Cell Field, mobile override isolation, extra text/media lifecycle and saved-layer roundtrip.');

// V6.1: negative leading and an independent, strictly capped overlay.
const overlay=new ParallaxGrid();overlay.config={columnLabels:[{enabled:true,size:100,lineSpacing:-60,lines:[{text:'ONE'},{text:'TWO'}]}],overlaySelection:.2};
const lines=[];overlay._drawColumnLabels({...context,fillText:(...args)=>lines.push(args)},200,660,660);assert.equal(lines[1][2]-lines[0][2],70);
for(let t=0;t<20000;t+=120){overlay._seedOverlay(t);assert.ok(overlay._overlayPulses.size<=4);}assert.equal(overlay._pulses.size,0);
overlay.config={overlayMax:2,mediaLevel:5};for(let t=0;t<5000;t+=240){overlay._seedOverlay(t);assert.ok(overlay._overlayPulses.size<=2);}assert.ok(overlay._overlayZ()>overlay._z(5));
overlay.config={overlaySelection:0};overlay._seedOverlay(1000);assert.equal(overlay._overlayPulses.size,0);overlay.config={overlaySelection:.2};overlay._seedOverlay(2000);assert.ok(overlay._overlayPulses.size>0);overlay._drawOverlay(20000);assert.equal(overlay._overlayPulses.size,0);
overlay.config={overlayEnabled:false};overlay._seedOverlay(21000);assert.equal(overlay._overlayPulses.size,0);
assert.equal(parseSettings(JSON.stringify(overlay.config)).config.overlayMax,2);
console.log('PASS: negative column leading, sparse overlay hard cap, independence, above-media depth, zero-selection, fade expiry and saved settings.');

// V6.2: delayed cursor input, independent reveal, cap and queue cancellation.
const trail=new ParallaxGrid();trail.config={overlayDelay:200,overlayReveal:300,overlayCooldown:0,overlayHoverRate:1};trail._pointer=[500,300];trail._localPoint=()=>[trail._tileSize[0]*1.5,trail._tileSize[1]*1.5];trail._hoverOverlay(1000);assert.equal(trail._overlayQueue.length,1);assert.equal(trail._overlayPulses.size,0);trail._processOverlayQueue(1199);assert.equal(trail._overlayPulses.size,0);trail._processOverlayQueue(1200);assert.equal(trail._overlayPulses.size,1);trail._drawOverlay(1300);assert.ok(Math.abs(trail._contexts[4].globalAlpha-1/3)<1e-9);
trail._overlayQueue=Array.from({length:10},(_,key)=>({key,time:1400}));trail._processOverlayQueue(1400);assert.equal(trail._overlayPulses.size,4);assert.equal(trail._overlayQueue.length,0);trail._overlayQueue.push({key:20,time:2000});trail.stop();assert.equal(trail._overlayQueue.length,0);assert.equal(trail._overlayPulses.size,0);
trail.config={overlayMode:'noise'};trail._hoverOverlay(3000);assert.equal(trail._overlayQueue.length,0);assert.equal(parseSettings(JSON.stringify(trail.config)).config.overlayDelay,200);
console.log('PASS: delayed cursor activation, reveal alpha, four-cell trail cap, dropped overflow, stop cancellation and noise-only mode.');

const fonts=new ParallaxGrid();fonts.config={labelFont:'aeonik-black',columnLabels:[{enabled:true,font:'aeonik-black',lines:[{text:'BLACK'}]}]};const fontCtx={...context,fillText:noop};fonts._drawColumnLabels(fontCtx,150,660,660);assert.match(fontCtx.font,/900 .*Aeonik Black/);assert.equal(parseSettings(JSON.stringify(fonts.config)).config.labelFont,'aeonik-black');fonts.config={labelFont:'invalid'};assert.equal(fonts.config.labelFont,'fono');assert.ok(src.includes("const AEONIK_BLACK='data:font/woff2;base64,"));
console.log('PASS: actual Aeonik Black embedding, font selection/weight, settings roundtrip and invalid-family fallback.');

const rich=new ParallaxGrid();rich.config={columnLabels:[{enabled:true,rich:true,html:'<div><b>AVALANCHE</b><br><span style="color:#ff394a">NETWORK</span></div>',lineSpacing:-10}]};assert.equal(rich.config.columnLabels[0].rich,true);assert.equal(parseSettings(JSON.stringify(rich.config)).config.columnLabels[0].html,rich.config.columnLabels[0].html);const noPlain=[];rich._drawColumnLabels({...context,fillText:(...a)=>noPlain.push(a)},150,660,660);assert.equal(noPlain.length,0);assert.ok(demoSource.includes('contenteditable="true"'));assert.ok(demoSource.includes('data-rich-command="bold"'));assert.ok(demoSource.includes('<details class="section"'));assert.ok(!demoSource.includes('<details class="section" open'));assert.ok(!demoSource.includes('<section class="section"'));
console.log('PASS: rich label serialization, separate DOM rendering path, collapsible controls and editor markup.');

assert.ok(!demoSource.includes('id="rich-enabled"'));assert.ok(!demoSource.includes('id="column-lines"'));assert.ok(demoSource.includes("querySelectorAll('input[id^=\"column-\"],select[id^=\"column-\"]')"));assert.ok(demoSource.includes('enabled:true,rich:true,html:'));assert.ok(demoSource.includes('justify-content:flex-start;text-align:left'));
console.log('PASS: rich editor always available, legacy inputs removed, scoped control listeners, edit-to-show labels, collapsed sections and left-aligned headers.');

const leadingTest=new ParallaxGrid();leadingTest.config={columnLabels:[{rich:true,size:320,lineSpacing:-400}]};assert.equal(leadingTest.config.columnLabels[0].leading,16);leadingTest.config={columnLabels:[{rich:true,size:320,leading:24}]};assert.equal(leadingTest.config.columnLabels[0].leading,24);assert.equal(parseSettings(JSON.stringify(leadingTest.config)).config.columnLabels[0].leading,24);
// Exercise line extraction with DOM-shaped nodes; this is not a browser layout test.
const textNode=text=>({nodeType:3,textContent:text});const element=(tag,children=[])=>({nodeType:1,tagName:tag.toUpperCase(),style:{cssText:''},childNodes:children,append(n){this.childNodes.push(n);},hasChildNodes(){return this.childNodes.length>0;}});
const fixture=[element('div',[element('b',[textNode('FIRST')])]),element('div',[element('br')]),element('div',[element('span',[textNode('THIRD')])])];
const priorDocument=globalThis.document,priorSanitize=ParallaxGrid.sanitizeHTML;globalThis.document={createElement:tag=>tag==='template'?{content:{childNodes:fixture}}:element(tag),createTextNode:textNode};ParallaxGrid.sanitizeHTML=s=>s;const extracted=ParallaxGrid.richTextLines('fixture');assert.equal(extracted.length,3);assert.equal(extracted[1].hasChildNodes(),false);ParallaxGrid.sanitizeHTML=priorSanitize;globalThis.document=priorDocument;
assert.ok(src.includes('top:index*leading+'));console.log('PASS: direct leading, legacy migration, saved spacing, styled line extraction and explicit blank lines.');

const blur=new ParallaxGrid();blur.config={glowRadius:200,mediaBlur:200,extraLayers:[{id:'blur',type:'media',blur:200}]};assert.equal(blur.config.glowRadius,200);assert.equal(blur.config.mediaBlur,200);assert.equal(blur.config.extraLayers[0].blur,200);assert.equal(parseSettings(JSON.stringify(blur.config)).config.mediaBlur,200);console.log('PASS: 200px glow/media blur and settings roundtrip.');

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const TAU = Math.PI * 2;
function seeded(seed = 4193) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

// A thin, cupped botanical surface: each rose is assembled from overlapping
// spiral whorls of these petals, rather than approximating flowers with spheres.
function rosePetal(detail = 10) {
  const mesh = new THREE.PlaneGeometry(1, 1, detail, detail);
  const p = mesh.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) * 2, v = p.getY(i) + .5;
    const breadth = Math.pow(Math.sin(Math.PI * v * .62), .65) * .66;
    const edge = Math.pow(Math.abs(u), 4);
    const x = u * breadth;
    const y = .14 * Math.sin(v * Math.PI) + .56 * v * v + .17 * u * u * Math.sin(v * Math.PI) - .11 * Math.pow(v, 8) + edge * Math.sin(v * 17 + u * 3) * .035;
    const z = v * 1.07 * (1 - .2 * u * u) - .14;
    p.setXYZ(i, x, y, z);
  }
  mesh.computeVertexNormals(); return mesh;
}

function foliage() {
  const geometry = new THREE.PlaneGeometry(1, 1, 5, 12), p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) * 2, v = p.getY(i) + .5;
    const edge = Math.pow(Math.sin(v * Math.PI), .72);
    p.setXYZ(i, u * edge * .26, v, Math.sin(v * Math.PI) * .16 - Math.abs(u) * edge * .11);
  }
  geometry.computeVertexNormals(); return geometry;
}

function surfaceTexture(random, kind) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d'), pixels = ctx.createImageData(128, 128);
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    const weave = kind === 'silk' ? Math.sin(x * Math.PI * .5) * 13 + Math.sin(y * Math.PI * .5) * 11 : Math.sin(x * .43 + Math.sin(y * .09) * 2) * 9;
    const value = Math.min(255, Math.max(0, 150 + weave + (random() - .5) * 27));
    const k = (y * 128 + x) * 4; pixels.data[k] = pixels.data[k + 1] = pixels.data[k + 2] = value; pixels.data[k + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  const texture = new THREE.CanvasTexture(canvas); texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(kind === 'silk' ? 5 : 1, kind === 'silk' ? 16 : 1); return texture;
}

function haloTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d'), gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,215,143,1)'); gradient.addColorStop(.14, 'rgba(255,190,92,.55)'); gradient.addColorStop(.5, 'rgba(221,144,62,.09)'); gradient.addColorStop(1, 'rgba(255,170,70,0)');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(canvas);
}

function shadowTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d'), gradient = ctx.createRadialGradient(64,64,2,64,64,64);
  gradient.addColorStop(0,'rgba(0,0,0,.65)');gradient.addColorStop(.4,'rgba(0,0,0,.4)');gradient.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);return new THREE.CanvasTexture(canvas);
}

function curtain(side) {
  const geometry = new THREE.PlaneGeometry(1,1,30,60), p=geometry.attributes.position;
  const base=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++) {
    const u=p.getX(i)+.5,v=.5-p.getY(i);
    const flare=.42+.73*v*v*v;
    const x=side*(1.42+.1*Math.sin(v*5)-.2*v)+(u-.5)*flare;
    const y=1.74-v*4.05+.08*Math.cos(u*8)*v*v;
    const z=-.09+Math.sin(u*TAU*4.5)*(.065+.045*v)+.3*v*v+Math.sin(v*3)*.06;
    p.setXYZ(i,x,y,z);base.set([x,y,z],i*3);
  }
  geometry.userData.base=base;geometry.computeVertexNormals();return geometry;
}

export function buildScene(container, initiallyMobile, options = {}) {
  const random=seeded(), scene=new THREE.Scene();
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:!initiallyMobile,powerPreference:'high-performance'});
  const gl=renderer.getContext(), info=gl.getExtension('WEBGL_debug_renderer_info');
  const software=!!info&&/SwiftShader|llvmpipe|Software/i.test(gl.getParameter(info.UNMASKED_RENDERER_WEBGL));
  const light=initiallyMobile||software;
  const shadowCapable=!initiallyMobile&&(!software||options.studio===true);
  renderer.setPixelRatio(Math.min(devicePixelRatio,software?.85:initiallyMobile?1.3:1.8));
  renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.93;
  renderer.shadowMap.enabled=shadowCapable;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-hidden','true');container.appendChild(renderer.domElement);
  const camera=new THREE.PerspectiveCamera(36,1,.1,80);
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();
  const env=pmrem.fromScene(room,.02);scene.environment=env.texture;scene.environmentIntensity=.42;room.dispose();pmrem.dispose();
  const textures=[surfaceTexture(random,'petal'),surfaceTexture(random,'silk'),haloTexture(),shadowTexture()];
  const gold=new THREE.MeshPhysicalMaterial({color:0xd6af65,metalness:1,roughness:.17,clearcoat:.4,envMapIntensity:2.1});
  const frameMaterial=new THREE.MeshStandardMaterial({color:0x8c7144,metalness:.86,roughness:.31});
  const ivory=new THREE.MeshPhysicalMaterial({color:0xf1dfc7,roughness:.6,side:THREE.DoubleSide,sheen:.6,sheenColor:0xffe8dc,bumpMap:textures[0],bumpScale:.008});
  const blush=new THREE.MeshPhysicalMaterial({color:0xd3a18e,roughness:.64,side:THREE.DoubleSide,sheen:.5,sheenColor:0xffd1bd,bumpMap:textures[0],bumpScale:.008});
  const green=new THREE.MeshStandardMaterial({color:0x334632,roughness:.67,side:THREE.DoubleSide,bumpMap:textures[0],bumpScale:.014});
  const silk=new THREE.MeshPhysicalMaterial({color:0xe6d8bf,roughness:.38,side:THREE.DoubleSide,sheen:1,sheenColor:0xffe5c3,sheenRoughness:.4,bumpMap:textures[1],bumpScale:.009});
  const stemMaterial=new THREE.MeshStandardMaterial({color:0x3e4430,roughness:.88});
  const root=new THREE.Group(),installation=new THREE.Group();scene.add(root);root.add(installation);

  // A deep, elliptical metal structure supports arrangements on both sides.
  // It is sculptural from the back too, so the installation can genuinely turn.
  const archPoints=[];
  for(let i=0;i<=100;i++) {
    const t=i/100;
    let x,y;
    if(t<.23){x=-1.45;y=-2.15+t/.23*2.83;}
    else if(t>.77){x=1.45;y=.68-(t-.77)/.23*2.83;}
    else {const a=Math.PI-(t-.23)/.54*Math.PI;x=Math.cos(a)*1.45;y=.68+Math.sin(a)*1.56;}
    archPoints.push(new THREE.Vector3(x,y,0));
  }
  const archCurve=new THREE.CatmullRomCurve3(archPoints);
  const railGeometry=new THREE.TubeGeometry(archCurve,120,.018,8,false);
  for(const z of [-.25,.2]){const rail=new THREE.Mesh(railGeometry,frameMaterial);rail.position.z=z;installation.add(rail);}
  for(const y of [-1.8,-.8,.4])for(const side of [-1,1]){const cross=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.45,6),frameMaterial);cross.rotation.x=Math.PI/2;cross.position.set(side*1.45,y,-.025);installation.add(cross);}

  const whites=new THREE.InstancedMesh(rosePetal(light?7:12),ivory,10000);
  const pinks=new THREE.InstancedMesh(whites.geometry,blush,5000);
  const leaves=new THREE.InstancedMesh(foliage(),green,2200);
  whites.castShadow=pinks.castShadow=shadowCapable;whites.receiveShadow=pinks.receiveShadow=true;
  installation.add(whites,pinks,leaves);
  let whiteIndex=0,pinkIndex=0,leafIndex=0;
  const transform=new THREE.Object3D(),bloomRoot=new THREE.Object3D(),petal=new THREE.Object3D();
  const normal=new THREE.Vector3(),up=new THREE.Vector3(0,1,0),color=new THREE.Color();
  const outerColor=new THREE.Color(),innerColor=new THREE.Color();
  function addRose(position,size,isPink,face) {
    bloomRoot.position.copy(position);bloomRoot.quaternion.setFromUnitVectors(up,face.normalize());bloomRoot.rotateY(random()*TAU);bloomRoot.scale.setScalar(size);bloomRoot.updateMatrix();
    const whorls=light?[9,7,6,4]:[11,9,8,6,4];
    outerColor.set(isPink?0xffe0cf:0xfff2df);innerColor.set(isPink?0xaa6e56:0xc5a47f);
    whorls.forEach((count,layer)=>{
      const scale=1-layer*(light?.2:.17),radius=.15*scale;
      for(let i=0;i<count;i++){
        const angle=i/count*TAU+layer*2.39996;
        petal.position.set(Math.sin(angle)*radius,layer*.105,Math.cos(angle)*radius);
        petal.rotation.set(.12-layer*.055,angle,Math.sin(angle+layer)*.07);
        petal.scale.set(scale,scale,scale);petal.updateMatrix();transform.matrix.multiplyMatrices(bloomRoot.matrix,petal.matrix);
        const mesh=isPink?pinks:whites,index=isPink?pinkIndex++:whiteIndex++;
        mesh.setMatrixAt(index,transform.matrix);color.copy(outerColor).lerp(innerColor,Math.pow(layer/(whorls.length-1),1.5)*.58);mesh.setColorAt(index,color);
      }
    });
  }
  const flowerCount=light?130:205;
  for(let i=0;i<flowerCount;i++){
    const t=.08+random()*.84,p=archCurve.getPoint(t);
    const theta=random()*TAU,depth=.19+random()*.12;
    p.x+=Math.cos(theta)*(.16+random()*.11);p.y+=(random()-.5)*.28;p.z=Math.sin(theta)*depth;
    normal.set((p.x/2)*.25,Math.max(.05,p.y)*.12,Math.sin(theta)>.05?1:-1).add(new THREE.Vector3((random()-.5)*.75,(random()-.5)*.6,0));
    addRose(p,.14+random()*.095,random()<.2,normal);
    for(let j=0;j<4;j++){
      transform.position.copy(p).add(new THREE.Vector3((random()-.5)*.5,(random()-.35)*.55,(random()-.5)*.5));
      transform.rotation.set((random()-.5)*2,random()*TAU,(random()-.5)*2.5);const s=.13+random()*.19;transform.scale.set(s,s*1.55,s);transform.updateMatrix();leaves.setMatrixAt(leafIndex++,transform.matrix);
    }
    if(i%5===0){
      const a=p.clone(),b=p.clone().add(new THREE.Vector3((random()-.5)*.6,.3+random()*.2,-.2)),c=b.clone().add(new THREE.Vector3((random()-.5)*.3,.15,0));
      const branch=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a,b,c]),6,.008,4),stemMaterial);installation.add(branch);
    }
  }
  for(const side of [-1,1])for(let i=0;i<20;i++){
    const p=new THREE.Vector3(side*(1.38+(random()-.5)*.6),-2.15+random()*.27,(random()-.5)*.7);
    normal.set((random()-.5)*.8,.7,random()-.3);addRose(p,.16+random()*.08,random()<.22,normal);
  }
  whites.count=whiteIndex;pinks.count=pinkIndex;leaves.count=leafIndex;
  for(const mesh of [whites,pinks,leaves]){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();}

  const fabrics=[-1,1].map(side=>{const mesh=new THREE.Mesh(curtain(side),silk);mesh.castShadow=shadowCapable;mesh.receiveShadow=true;installation.add(mesh);return mesh;});
  // A long, asymmetric ribbon makes the air movement visible across the opening.
  const ribbonGeometry=new THREE.PlaneGeometry(1,1,65,8),rp=ribbonGeometry.attributes.position;
  const ribbonBase=new Float32Array(rp.count*3);
  for(let i=0;i<rp.count;i++){
    const u=rp.getX(i)+.5,v=rp.getY(i);
    const x=-1.45+u*2.9,y=1.78-Math.sin(u*Math.PI)*1.02+v*(.2+.2*Math.sin(u*Math.PI)),z=.05+Math.sin(u*TAU)*.28+v*.18;
    rp.setXYZ(i,x,y,z);ribbonBase.set([x,y,z],i*3);
  }
  ribbonGeometry.userData.base=ribbonBase;ribbonGeometry.computeVertexNormals();
  const ribbon=new THREE.Mesh(ribbonGeometry,silk);ribbon.castShadow=!light;installation.add(ribbon);fabrics.push(ribbon);

  // Ground, not a toy display disc: a dark stone plinth and a soft contact shadow.
  const plinth=new THREE.Mesh(new THREE.CylinderGeometry(2.08,2.12,.055,96),new THREE.MeshStandardMaterial({color:0x342b24,roughness:.48,metalness:.13}));plinth.position.y=-2.31;plinth.receiveShadow=true;installation.add(plinth);
  const contact=new THREE.Mesh(new THREE.PlaneGeometry(6.5,4.5),new THREE.MeshBasicMaterial({map:textures[3],transparent:true,depthWrite:false,opacity:.65}));contact.rotation.x=-Math.PI/2;contact.position.y=-2.35;root.add(contact);
  const floorShadow=new THREE.Mesh(new THREE.PlaneGeometry(80,80),new THREE.ShadowMaterial({opacity:.45}));floorShadow.rotation.x=-Math.PI/2;floorShadow.position.y=-2.37;scene.add(floorShadow);

  const flames=[],wax=new THREE.MeshPhysicalMaterial({color:0xe0c8a1,roughness:.5});
  const glass=new THREE.MeshPhysicalMaterial({color:0xd3b78c,metalness:.02,roughness:.05,transparent:true,opacity:.19,side:THREE.DoubleSide,depthWrite:false});
  const candlePoints=[[-1.05,.48,.42],[-.77,.76,.29],[-1.36,.85,.24],[1.1,.45,.57],[1.37,.78,.36],[.85,.93,.23]];
  candlePoints.forEach(([x,z,h],i)=>{
    const candle=new THREE.Mesh(new THREE.CylinderGeometry(.068,.07,h,24),wax);candle.position.set(x,-2.25+h/2,z);installation.add(candle);
    const tube=new THREE.Mesh(new THREE.CylinderGeometry(.093,.093,h+.1,28,1,true),glass);tube.position.copy(candle.position);tube.position.y+=.04;installation.add(tube);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(.093,.005,5,28),frameMaterial);rim.rotation.x=Math.PI/2;rim.position.set(x,-2.2+h,z);installation.add(rim);
    const wick=new THREE.Mesh(new THREE.CylinderGeometry(.003,.003,.035,5),new THREE.MeshBasicMaterial({color:0x34251b}));wick.position.set(x,-2.24+h,z);installation.add(wick);
    const flame=new THREE.Mesh(new THREE.SphereGeometry(.015,8,8),new THREE.MeshBasicMaterial({color:0xffe4a0}));flame.position.set(x,-2.21+h,z);flame.scale.set(.7,2.6,.7);installation.add(flame);flames.push(flame);
    const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:textures[2],transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.5}));glow.position.copy(flame.position);glow.scale.set(.31,.43,1);installation.add(glow);
    if(!light&&i%3===0){const lamp=new THREE.PointLight(0xffb05d,.9,2.5,2);lamp.position.copy(flame.position);installation.add(lamp);}
  });

  function createRing(solitaire=false){
    const group=new THREE.Group();
    const profile=[];for(let i=0;i<=14;i++){const a=i/14*TAU;profile.push(new THREE.Vector2(.4+Math.cos(a)*.037,Math.sin(a)*.06));}
    const band=new THREE.Mesh(new THREE.LatheGeometry(profile,80),gold);band.rotation.x=Math.PI/2;group.add(band);
    if(solitaire){
      const diamondGeometry=new THREE.CylinderGeometry(.085,.018,.11,8,1,false);diamondGeometry.rotateX(Math.PI/2);
      const diamond=new THREE.Mesh(diamondGeometry,new THREE.MeshPhysicalMaterial({color:0xf8fbff,metalness:.1,roughness:0,transmission:light?.12:.85,thickness:.18,ior:2.417,clearcoat:1,envMapIntensity:3}));diamond.position.y=.46;group.add(diamond);
      const crown=new THREE.Mesh(new THREE.TorusGeometry(.074,.008,6,8),gold);crown.position.y=.41;crown.rotation.x=Math.PI/2;group.add(crown);
      for(let i=0;i<4;i++){const prong=new THREE.Mesh(new THREE.CylinderGeometry(.008,.01,.13,6),gold);prong.position.set(Math.sin(i/4*TAU)*.065,.43,Math.cos(i/4*TAU)*.065);group.add(prong);}
    }
    return group;
  }
  const jewellery=new THREE.Group(),engagement=createRing(true),band=createRing();
  engagement.rotation.set(.3,-.4,.25);band.rotation.set(.78,.4,-.5);band.position.set(.4,-.18,.08);jewellery.add(engagement,band);jewellery.position.set(-1.9,.05,1.2);root.add(jewellery);
  const looseRing=createRing();looseRing.position.set(2.0,1.6,.2);looseRing.scale.setScalar(.57);root.add(looseRing);
  const driftCount=light?24:48,drift=new THREE.InstancedMesh(rosePetal(4),blush,driftCount);root.add(drift);
  const drifting=Array.from({length:driftCount},()=>({x:(random()-.5)*6,y:random()*6-3,z:(random()-.3)*4,s:.035+random()*.035,phase:random()*TAU,speed:.12+random()*.12}));
  const dustGeometry=new THREE.BufferGeometry(),dustPositions=new Float32Array((light?65:140)*3);
  for(let i=0;i<dustPositions.length;i++)dustPositions[i]=(random()-.5)*(i%3===1?6:8);
  dustGeometry.setAttribute('position',new THREE.BufferAttribute(dustPositions,3));
  const dust=new THREE.Points(dustGeometry,new THREE.PointsMaterial({color:0xe2ba73,size:.012,transparent:true,opacity:.7,depthWrite:false}));root.add(dust);

  scene.add(new THREE.HemisphereLight(0xe4d9c8,0x19130f,.65));
  const key=new THREE.SpotLight(0xffead4,95,28,.55,.9,1.5);key.position.set(-2,5,7);key.target=installation;key.castShadow=shadowCapable;key.shadow.mapSize.set(software?768:2048,software?768:2048);key.shadow.bias=-.0001;key.shadow.normalBias=.025;scene.add(key);
  const rimLight=new THREE.DirectionalLight(0xffcc87,3.4);rimLight.position.set(3,4,-4);scene.add(rimLight);
  const fill=new THREE.DirectionalLight(0xc8d2e2,.6);fill.position.set(-4,1,4);scene.add(fill);
  const target=new THREE.Vector3(),pointer=new THREE.Vector2(),desiredPointer=new THREE.Vector2();
  let mobile=initiallyMobile,dirty=true,frames=0,lost=false;
  const resize=()=>{const{width,height}=container.getBoundingClientRect();mobile=width<760;renderer.setSize(width,height,false);camera.aspect=width/height;camera.fov=mobile?43:36;camera.updateProjectionMatrix();dirty=true;};
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  const move=e=>desiredPointer.set(e.clientX/innerWidth*2-1,e.clientY/innerHeight*2-1);window.addEventListener('pointermove',move,{passive:true});
  function render(time,motion){
    dirty=false;frames++;pointer.lerp(motion?desiredPointer:new THREE.Vector2(),.045);
    const scroll=motion?Math.min(window.scrollY/(container.offsetHeight||800),1):0;
    root.position.set(mobile?0:1.9,mobile?-.3:.05,0);
    // One full, unbroken turn in 32 seconds. This is a rotating 3D installation,
    // not a front-facing arrangement with an almost imperceptible camera wobble.
    installation.rotation.y=time*TAU/32-.12+(motion?pointer.x*.04+scroll*.2:0);
    camera.position.set(pointer.x*.28,.65-pointer.y*.15,(mobile?9.7:10.4)-scroll*.6);target.set(0,-.08-scroll*.25,0);camera.lookAt(target);
    jewellery.position.set(mobile?-1.35:-1.94,.03+Math.sin(time*.55)*.15,1.1);jewellery.scale.setScalar(mobile?.8:1.02);jewellery.rotation.set(Math.sin(time*.21)*.2,time*.22,.12*Math.sin(time*.35));
    looseRing.position.x=mobile?1.5:2.03;looseRing.position.y=1.7+Math.sin(time*.6)*.13;looseRing.rotation.set(.3,time*.3,-.25);
    dust.rotation.y=time*.018;
    drifting.forEach((p,i)=>{transform.position.set(p.x+Math.sin(time*.4+p.phase)*.35,((p.y+3-time*p.speed)%6+6)%6-3,p.z);transform.rotation.set(time*.4+p.phase,time*.22+p.phase,time*.14);transform.scale.setScalar(p.s);transform.updateMatrix();drift.setMatrixAt(i,transform.matrix);});drift.instanceMatrix.needsUpdate=true;
    if(frames%2===0)fabrics.forEach((mesh,k)=>{const p=mesh.geometry.attributes.position,base=mesh.geometry.userData.base;for(let i=0;i<p.count;i++){const y=base[i*3+1],drop=Math.max(.05,(1.8-y)/4);p.setZ(i,base[i*3+2]+Math.sin(time*.8+y*1.8+k)*.055*drop);}p.needsUpdate=true;if(frames%10===0)mesh.geometry.computeVertexNormals();});
    flames.forEach((flame,i)=>{flame.scale.y=2.6+Math.sin(time*5+i)*.22;flame.rotation.z=Math.sin(time*3+i)*.15;});
    if(!lost)renderer.render(scene,camera);
  }
  const contextLost=e=>{e.preventDefault();lost=true;};renderer.domElement.addEventListener('webglcontextlost',contextLost);
  function dispose(){observer.disconnect();window.removeEventListener('pointermove',move);renderer.domElement.removeEventListener('webglcontextlost',contextLost);const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());env.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}
  return{exportRoot:root,render,dispose,canvas:renderer.domElement,needsRender:()=>dirty,minimumFrameTime:software?1000/12:mobile?1000/30:1000/60};
}

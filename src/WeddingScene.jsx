import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// All floral, fabric and jewellery assets are built locally. No remote models or textures.
function randomGenerator(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

function petalGeometry(light = false) {
  const geometry = new THREE.SphereGeometry(1, light ? 8 : 12, light ? 6 : 9, 0, Math.PI * 2, 0, Math.PI * .78);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
    positions.setXYZ(i, x * .65, (y - .25) * .42 + Math.pow(Math.abs(x), 2) * .16, z * .72);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function leafGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0); shape.bezierCurveTo(-.28, .18, -.30, .59, 0, 1); shape.bezierCurveTo(.30, .59, .28, .18, 0, 0);
  const geometry = new THREE.ShapeGeometry(shape, 7);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) { const x = positions.getX(i), y = positions.getY(i); positions.setZ(i, Math.sin(y * Math.PI) * .16 + Math.abs(x) * .35); }
  geometry.computeVertexNormals();
  return geometry;
}

function fabricGeometry(side) {
  const geometry = new THREE.PlaneGeometry(1, 1, 22, 38);
  const positions = geometry.attributes.position;
  const base = new Float32Array(positions.count * 3);
  for (let i = 0; i < positions.count; i++) {
    const u = positions.getX(i) + .5, v = .5 - positions.getY(i);
    const width = .58 + .72 * Math.pow(v, 3);
    const x = side * (1.27 + .12 * Math.sin(v * Math.PI) + .26 * v * v) + (u - .5) * width;
    const y = 1.8 - v * 3.96 + .12 * Math.sin(u * Math.PI) * v;
    const z = .17 + Math.sin(u * Math.PI * 8) * (.052 + v * .025) + .15 * v * v;
    positions.setXYZ(i, x, y, z);
    base.set([x, y, z], i * 3);
  }
  geometry.userData.base = base;
  geometry.computeVertexNormals();
  return geometry;
}

function buildScene(container, isMobile) {
  const random = randomGenerator(8246);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(isMobile ? 42 : 36, 1, .1, 70);
  const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true, powerPreference: 'high-performance' });
  const context = renderer.getContext();
  const rendererInfo = context.getExtension('WEBGL_debug_renderer_info');
  const software = rendererInfo && /SwiftShader|llvmpipe|Software/i.test(context.getParameter(rendererInfo.UNMASKED_RENDERER_WEBGL));
  const lowPower = isMobile || software;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, software ? .75 : isMobile ? 1.35 : 1.65));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = !lowPower;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.appendChild(renderer.domElement);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environmentTarget = pmrem.fromScene(room, .025);
  scene.environment = environmentTarget.texture;
  scene.environmentIntensity = .55;
  room.dispose(); pmrem.dispose();

  const root = new THREE.Group();
  scene.add(root);
  const architectural = new THREE.Group(); root.add(architectural);

  const gold = new THREE.MeshStandardMaterial({ color: 0xc6a165, roughness: .19, metalness: 1, envMapIntensity: 1.8 });
  const antiqueGold = new THREE.MeshStandardMaterial({ color: 0xaa8c59, roughness: .33, metalness: .8 });
  const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x53604a, roughness: .9 });
  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x66715a, side: THREE.DoubleSide, roughness: .79, metalness: .04 });
  const flowerMaterial = new THREE.MeshPhysicalMaterial({ color: 0xf0e4d1, roughness: .74, side: THREE.DoubleSide, sheen: .38, sheenColor: 0xffe1cc });
  const roseMaterial = new THREE.MeshPhysicalMaterial({ color: 0xe7b4a6, roughness: .7, side: THREE.DoubleSide, sheen: .38, sheenColor: 0xffdfce });
  const smallFlowerMaterial = new THREE.MeshStandardMaterial({ color: 0xfff8e7, roughness: .8 });

  // Two thin metal rails form the arch, with botanical stems growing around them.
  const archPoints = [];
  for (let i = 0; i <= 80; i++) {
    const t = i / 80;
    let x, y;
    if (t < .25) { x = -1.53; y = -2.2 + t * 11.6; }
    else if (t > .75) { x = 1.53; y = .7 - (t - .75) * 11.6; }
    else { const a = Math.PI - (t - .25) * Math.PI * 2; x = Math.cos(a) * 1.53; y = .7 + Math.sin(a) * 1.53; }
    archPoints.push(new THREE.Vector3(x, y, -.02));
  }
  const archCurve = new THREE.CatmullRomCurve3(archPoints);
  const arch = new THREE.Mesh(new THREE.TubeGeometry(archCurve, 100, .027, 7, false), antiqueGold);
  architectural.add(arch);
  const secondRail = arch.clone(); secondRail.position.z = -.28; architectural.add(secondRail);

  const drapes = [-1, 1].map(side => {
    const mesh = new THREE.Mesh(fabricGeometry(side), new THREE.MeshPhysicalMaterial({ color: 0xf2e8d6, side: THREE.DoubleSide, roughness: .88, metalness: 0, sheen: .85, sheenColor: 0xfff3df, transparent: true, opacity: .94 }));
    mesh.castShadow = !isMobile; mesh.receiveShadow = true; architectural.add(mesh); return mesh;
  });
  // A soft fabric swag below the flower crown, gathered at both shoulders.
  const swagGeometry = new THREE.PlaneGeometry(2.9, .54, 42, 9);
  const swagPositions = swagGeometry.attributes.position;
  for (let i = 0; i < swagPositions.count; i++) {
    const x = swagPositions.getX(i), y = swagPositions.getY(i);
    swagPositions.setXYZ(i, x, 1.5 + y - .75 * (1 - Math.pow(x / 1.45, 2)), -.04 + .035 * Math.sin(x * 30 + y * 14));
  }
  swagGeometry.computeVertexNormals();
  const swag = new THREE.Mesh(swagGeometry, drapes[0].material); architectural.add(swag);

  const petals = new THREE.InstancedMesh(petalGeometry(lowPower), flowerMaterial, 4600);
  const blushPetals = new THREE.InstancedMesh(petals.geometry, roseMaterial, 2200);
  const leaves = new THREE.InstancedMesh(leafGeometry(), leafMaterial, 1600);
  const smallFlowers = new THREE.InstancedMesh(new THREE.SphereGeometry(.028, 6, 4), smallFlowerMaterial, 650);
  petals.castShadow = !isMobile; blushPetals.castShadow = !isMobile;
  petals.receiveShadow = true; blushPetals.receiveShadow = true;
  architectural.add(petals, blushPetals, leaves, smallFlowers);
  const dummy = new THREE.Object3D();
  const flowerRoot = new THREE.Object3D();
  const flowerPetal = new THREE.Object3D();
  const petalColor = new THREE.Color();
  let petalIndex = 0, blushIndex = 0, leafIndex = 0, smallIndex = 0;

  function bloom(position, size, blush = false) {
    flowerRoot.position.copy(position);
    flowerRoot.rotation.set(Math.PI * .40 + (random() - .5) * 1.15, (random() - .5) * 1.3, random() * Math.PI * 2);
    flowerRoot.scale.setScalar(size); flowerRoot.updateMatrix();
    const mesh = blush ? blushPetals : petals;
    for (let layer = 0; layer < 3; layer++) {
      const count = layer === 0 ? 7 : layer === 1 ? 5 : 4;
      const scale = 1 - layer * .24;
      for (let p = 0; p < count; p++) {
        const a = p / count * Math.PI * 2 + layer * .68;
        flowerPetal.position.set(Math.cos(a) * .27 * scale, layer * .13, Math.sin(a) * .27 * scale);
        flowerPetal.rotation.set(Math.sin(a) * .5, -a, Math.cos(a) * -.5);
        flowerPetal.scale.set(scale, scale, scale);
        flowerPetal.updateMatrix();
        dummy.matrix.multiplyMatrices(flowerRoot.matrix, flowerPetal.matrix);
        const index = blush ? blushIndex++ : petalIndex++;
        mesh.setMatrixAt(index, dummy.matrix);
        petalColor.set(blush ? (layer === 2 ? 0xc89a88 : layer === 1 ? 0xe7c3b4 : 0xffece0) : (layer === 2 ? 0xd3ba98 : layer === 1 ? 0xead8bf : 0xfff4e2));
        mesh.setColorAt(index, petalColor);
      }
    }
  }

  const clusters = lowPower ? 100 : 152;
  for (let i = 0; i < clusters; i++) {
    // An asymmetric, generous floral crown with a trailing left arrangement.
    const t = .10 + random() * .79;
    const point = archCurve.getPoint(t);
    const thickness = .12 + .13 * Math.sin(t * Math.PI);
    point.x += (random() - .5) * thickness * 2.5;
    point.y += (random() - .5) * thickness * 1.7;
    point.z += (random() - .45) * .45;
    const size = .14 + random() * .13;
    bloom(point, size, random() < .25);
    for (let k = 0; k < 5; k++) {
      dummy.position.copy(point).add(new THREE.Vector3((random() - .5) * .6, (random() - .3) * .48, -.1 + (random() - .5) * .27));
      dummy.rotation.set((random() - .5) * 1.5, (random() - .5) * Math.PI, random() * Math.PI * 2);
      const scale = .15 + random() * .17; dummy.scale.set(scale, scale * 1.2, scale); dummy.updateMatrix();
      leaves.setMatrixAt(leafIndex++, dummy.matrix);
    }
    if (i % 2 === 0) for (let k = 0; k < 5; k++) {
      dummy.position.copy(point).add(new THREE.Vector3((random() - .5) * .65, (random() - .5) * .55, random() * .3));
      dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(.6 + random() * .6); dummy.updateMatrix(); smallFlowers.setMatrixAt(smallIndex++, dummy.matrix);
    }
  }
  // Ground arrangements anchor the arch rather than leaving it floating in space.
  for (let side of [-1, 1]) for (let i = 0; i < 19; i++) {
    const pos = new THREE.Vector3(side * (1.37 + random() * .5), -2.1 + random() * .33, .1 + random() * .48);
    bloom(pos, .17 + random() * .11, random() < .26);
  }
  petals.count = petalIndex; blushPetals.count = blushIndex; leaves.count = leafIndex; smallFlowers.count = smallIndex;
  petals.instanceMatrix.needsUpdate = true; blushPetals.instanceMatrix.needsUpdate = true; leaves.instanceMatrix.needsUpdate = true; smallFlowers.instanceMatrix.needsUpdate = true;
  [petals, blushPetals, leaves, smallFlowers].forEach(mesh => { mesh.computeBoundingSphere(); });

  const stageMaterial = new THREE.MeshStandardMaterial({ color: 0x9d8b73, roughness: .85 });
  const stage = new THREE.Mesh(new THREE.CylinderGeometry(2.35, 2.43, .12, 80), stageMaterial);
  stage.position.set(0, -2.3, .05); stage.receiveShadow = true; architectural.add(stage);
  const stageRim = new THREE.Mesh(new THREE.TorusGeometry(2.39, .012, 6, 100), antiqueGold); stageRim.rotation.x = Math.PI / 2; stageRim.position.set(0, -2.31, .05); architectural.add(stageRim);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: .16 }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -2.39; scene.add(shadow);

  const flames = [];
  const wax = new THREE.MeshStandardMaterial({ color: 0xffefd3, roughness: .8 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xfff1db, roughness: .08, metalness: .1, transparent: true, opacity: .25, side: THREE.DoubleSide, depthWrite: false });
  const flameMaterial = new THREE.MeshBasicMaterial({ color: 0xffd487, transparent: true, opacity: .9 });
  const candlePositions = [[-1.2,.7,.45],[-.96,.9,.29],[-1.6,.93,.26],[1.22,.6,.52],[1.5,.95,.31],[1.0,1.05,.23]];
  candlePositions.forEach(([x,z,h]) => {
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(.087,.09,h,20),wax); candle.position.set(x,-2.22+h/2,z); candle.castShadow = !isMobile; architectural.add(candle);
    const vessel = new THREE.Mesh(new THREE.CylinderGeometry(.115,.115,h+.08,24,1,true),glass); vessel.position.copy(candle.position); vessel.position.y += .035; architectural.add(vessel);
    const holder = new THREE.Mesh(new THREE.CylinderGeometry(.12,.13,.035,24),antiqueGold); holder.position.set(x,-2.21,z); architectural.add(holder);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(.027,8,8),flameMaterial); flame.scale.set(.6,1.8,.6); flame.position.set(x,-2.19+h,z); architectural.add(flame); flames.push(flame);
    if (!isMobile && h > .4) { const light = new THREE.PointLight(0xffb85c,.35,1.4,2); light.position.copy(flame.position); architectural.add(light); }
  });

  function ring(diamond = false) {
    const group = new THREE.Group();
    const band = new THREE.Mesh(new THREE.TorusGeometry(.35, .045, 20, 80),gold); band.castShadow = true; group.add(band);
    const inner = new THREE.Mesh(new THREE.TorusGeometry(.35,.026,12,80),gold); inner.position.z = .03; group.add(inner);
    if (diamond) {
      const stone = new THREE.Mesh(new THREE.OctahedronGeometry(.105,0), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .02, metalness: .15, transmission: .72, thickness: .3, ior: 2.42, envMapIntensity: 2, clearcoat: 1 }));
      stone.position.y = .39; stone.rotation.z = Math.PI/4; group.add(stone);
      for (let i = 0; i < 4; i++) { const prong = new THREE.Mesh(new THREE.CylinderGeometry(.009,.011,.13,6),gold); prong.position.set(Math.cos(i*Math.PI/2)*.057,.38,Math.sin(i*Math.PI/2)*.057); group.add(prong); }
    }
    return group;
  }
  const rings = new THREE.Group();
  const ring1 = ring(true), ring2 = ring();
  ring1.rotation.set(.35,-.4,.3); ring2.rotation.set(.8,.6,-.5); ring2.position.set(.37,-.14,.08);
  rings.add(ring1,ring2); rings.position.set(-2.07,.12,1.03); rings.scale.setScalar(1.24); root.add(rings);
  const upperRing = ring(); upperRing.position.set(2.02,1.8,.3); upperRing.rotation.set(.6,.3,-.3); upperRing.scale.setScalar(.62); root.add(upperRing);

  const driftCount = isMobile ? 20 : 42;
  const drift = new THREE.InstancedMesh(petalGeometry(),new THREE.MeshPhysicalMaterial({ color:0xeac9bb, roughness:.67, side:THREE.DoubleSide, sheen:.6 }),driftCount);
  root.add(drift);
  const driftData = Array.from({length:driftCount},()=>({x:(random()-.5)*6.7,y:(random()-.5)*5.9,z:(random()-.2)*3.5,s:.035+random()*.055,speed:.12+random()*.18,phase:random()*Math.PI*2}));
  const dustGeometry = new THREE.BufferGeometry();
  const dustPositions = new Float32Array((isMobile?55:105)*3);
  for(let i=0;i<dustPositions.length;i+=3) { dustPositions[i]=(random()-.5)*8;dustPositions[i+1]=(random()-.5)*6;dustPositions[i+2]=(random()-.5)*5; }
  dustGeometry.setAttribute('position',new THREE.BufferAttribute(dustPositions,3));
  const dust = new THREE.Points(dustGeometry,new THREE.PointsMaterial({color:0xc2a16b,size:.017,transparent:true,opacity:.65,depthWrite:false})); root.add(dust);

  const ambient = new THREE.HemisphereLight(0xfff8ed,0x5b4635,1.1); scene.add(ambient);
  const key = new THREE.DirectionalLight(0xfff0d9,2.8); key.position.set(-3,7,6); key.castShadow = !isMobile; key.shadow.mapSize.set(1024,1024); key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=5;key.shadow.camera.bottom=-5;key.shadow.normalBias=.035; key.shadow.bias=-.0002; key.shadow.radius=4; scene.add(key);
  const rim = new THREE.DirectionalLight(0xffe1b7,2.3); rim.position.set(4,4,-4);scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffffff,.7); fill.position.set(1,0,7);scene.add(fill);

  const pointer = new THREE.Vector2();
  const pointerTarget = new THREE.Vector2();
  const target = new THREE.Vector3();
  let mobile = isMobile;
  let dirty = true;
  const resize = () => {
    const {width,height}=container.getBoundingClientRect();
    mobile=width<760;
    renderer.setSize(width,height,false); camera.aspect=width/height; camera.fov=mobile?43:36; camera.updateProjectionMatrix();dirty=true;
  };
  const onPointer = e => { pointerTarget.set((e.clientX/window.innerWidth-.5)*2,(e.clientY/window.innerHeight-.5)*2); };
  const resizeObserver = new ResizeObserver(resize);resizeObserver.observe(container);resize();
  window.addEventListener('pointermove',onPointer,{passive:true});
  let frames = 0;
  let hasLostContext = false;
  const render = (time, activeMotion) => {
    dirty = false;
    frames++;
    if(activeMotion) pointer.lerp(pointerTarget,.035);
    else pointer.set(0,0);
    const scroll=Math.min(window.scrollY/(container.offsetHeight||800),1);
    root.position.set(mobile?0:1.9,mobile?-.3:.07,0);
    root.rotation.y=activeMotion?Math.sin(time*.09)*.025+scroll*.11:0;
    const distance=mobile?9.7:10.5;
    camera.position.set((activeMotion?pointer.x*.19:0)+scroll*.28,mobile?1.1:.7+(activeMotion?-pointer.y*.12:0),distance-scroll*.55);
    target.set(mobile?0:0,mobile?-.15:-.05-scroll*.25,0);camera.lookAt(target);
    rings.rotation.y=time*.16; rings.rotation.z=Math.sin(time*.2)*.12;
    rings.position.x=mobile?-1.42:-2.07;rings.scale.setScalar(mobile?.83:1.24);
    rings.position.y=.17+Math.sin(time*.55)*.09;
    upperRing.rotation.y=time*.13;upperRing.position.y=1.8+Math.cos(time*.45)*.08;upperRing.position.x=mobile?1.55:2.02;
    dust.rotation.y=time*.014;
    driftData.forEach((p,i)=>{
      const y=((p.y+3-time*p.speed)%6+6)%6-3;
      dummy.position.set(p.x+Math.sin(time*.3+p.phase)*.24,y,p.z);
      dummy.rotation.set(time*.4+p.phase,time*.23+p.phase,Math.sin(time*.35+p.phase));dummy.scale.setScalar(p.s);dummy.updateMatrix();drift.setMatrixAt(i,dummy.matrix);
    }); drift.instanceMatrix.needsUpdate=true;
    if(frames%2===0) drapes.forEach((mesh,j)=>{
      const positions=mesh.geometry.attributes.position,base=mesh.geometry.userData.base;
      for(let i=0;i<positions.count;i++) {
        const drop=(1.8-base[i*3+1])/4;
        positions.setZ(i,base[i*3+2]+Math.sin(time*.65+base[i*3+1]*1.5+j)*.035*drop);
      }
      positions.needsUpdate=true;
      if(frames%12===0) mesh.geometry.computeVertexNormals();
    });
    flames.forEach((flame,i)=>{flame.scale.y=1.65+Math.sin(time*4+i)*.16;flame.rotation.z=Math.sin(time*3+i)*.12;});
    if(!hasLostContext) renderer.render(scene,camera);
  };
  const contextLost = e => {e.preventDefault();hasLostContext=true;};
  renderer.domElement.addEventListener('webglcontextlost',contextLost);
  const dispose=()=>{
    resizeObserver.disconnect();window.removeEventListener('pointermove',onPointer);renderer.domElement.removeEventListener('webglcontextlost',contextLost);
    const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material){const list=Array.isArray(o.material)?o.material:[o.material];list.forEach(m=>materials.add(m));}});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());environmentTarget.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();
  };
  return {render,dispose,needsRender:()=>dirty,minimumFrameTime:software?1000/15:isMobile?1000/30:1000/60,canvas:renderer.domElement};
}

export default function WeddingScene({paused,onStatus}) {
  const containerRef=useRef();
  const pausedRef=useRef(paused);
  useEffect(()=>{pausedRef.current=paused;},[paused]);
  useEffect(()=>{
    const container=containerRef.current;
    let scene,frame,visible=true,disposed=false,time=0,last=0,lastRender=0,previousPaused=pausedRef.current;
    try {
      scene=buildScene(container,window.innerWidth<760);
      scene.render(0,false);
      onStatus('ready');
    } catch(error) {
      console.warn('The 3D scene is unavailable; showing the photographic alternative.',error);
      scene?.dispose();container.replaceChildren();onStatus('fallback');return;
    }
    const lost=()=>{cancelAnimationFrame(frame);onStatus('fallback');};
    scene.canvas.addEventListener('webglcontextlost',lost);
    const visibility=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{rootMargin:'100px'});visibility.observe(container);
    const tick=now=>{
      if(disposed)return;
      const delta=last?Math.min((now-last)/1000,.05):0;last=now;
      if(visible&&!document.hidden) {
        if(!pausedRef.current)time+=delta;
        if((!pausedRef.current&&now-lastRender>=scene.minimumFrameTime)||previousPaused!==pausedRef.current||scene.needsRender()){
          scene.render(time,!pausedRef.current);lastRender=now;
        }
        previousPaused=pausedRef.current;
      }
      frame=requestAnimationFrame(tick);
    };
    frame=requestAnimationFrame(tick);
    return()=>{disposed=true;cancelAnimationFrame(frame);visibility.disconnect();scene.canvas.removeEventListener('webglcontextlost',lost);scene.dispose();};
  },[onStatus]);
  return <div className="webgl-scene" ref={containerRef}/>;
}

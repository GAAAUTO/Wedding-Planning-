import { useEffect, useRef } from 'react';
import { buildScene } from './CinematicScene.js';

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
      const delta=last?Math.min((now-last)/1000,.25):0;last=now;
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

(function(){'use strict';
  const root=document.querySelector('[data-player]');
  if(!root)return;
  const iframe=root.querySelector('[data-iframe]');
  const video=root.querySelector('[data-video]');
  const errorBox=root.querySelector('[data-player-error]');
  const status=root.querySelector('[data-player-status]');
  const buttons=[...root.querySelectorAll('[data-server]')];
  let hls=null;
  let fallbackUsed=false;

  const episodeMatch=location.pathname.match(/episode-(\d+)\.html$/);
  const episode=episodeMatch?Number(episodeMatch[1]):null;
  const releaseDates={1:'2026-01-08',2:'2026-01-08',3:'2026-01-15',4:'2026-01-22',5:'2026-01-29',6:'2026-02-05',7:'2026-02-12',8:'2026-02-26',9:'2026-03-05',10:'2026-03-12',11:'2026-03-19',12:'2026-03-26'};

  function setStatus(text){if(status)status.textContent=text||'';}
  function showError(text){if(errorBox){errorBox.textContent=text;errorBox.classList.add('show')}}
  function clearError(){if(errorBox)errorBox.classList.remove('show')}
  function destroyHls(){if(hls){hls.destroy();hls=null}}
  function showOnly(kind){
    if(iframe){iframe.hidden=kind!=='iframe';}
    if(video){video.hidden=kind!=='video';}
  }
  function fallbackServer(){
    if(fallbackUsed)return;
    fallbackUsed=true;
    const fallback=buttons.find(btn=>btn.dataset.type==='iframe');
    if(fallback){
      clearError();
      setStatus('جاري فتح السيرفر البديل…');
      useServer(fallback);
    }else{
      showError('تعذر تشغيل السيرفر السريع ولا يوجد سيرفر بديل متاح.');
      setStatus('تعذر التشغيل');
    }
  }

  function injectVideoSchema(){
    if(!episode || document.querySelector('script[data-video-schema]'))return;
    const h1=document.querySelector('h1');
    const description=document.querySelector('meta[name="description"]');
    const poster=video&&video.getAttribute('poster');
    const title=h1?h1.textContent.trim():`جوجوتسو كايسن الموسم الثالث الحلقة ${episode}`;
    const descriptionText=description?description.getAttribute('content')||title:title;
    const data={
      '@context':'https://schema.org',
      '@type':'VideoObject',
      'name':title,
      'description':descriptionText,
      'thumbnailUrl':poster?[poster]:[],
      'uploadDate':`${releaseDates[episode]||'2026-01-08'}T00:00:00+03:00`
    };
    const defaultButton=root.querySelector('[data-default="true"]')||buttons[0];
    if(defaultButton&&defaultButton.dataset.url){
      if(defaultButton.dataset.type==='iframe'){
        data.embedUrl=defaultButton.dataset.url;
      }else if(defaultButton.dataset.type==='hls'){
        data.contentUrl=defaultButton.dataset.url;
      }
    }
    const script=document.createElement('script');
    script.type='application/ld+json';
    script.dataset.videoSchema='true';
    script.textContent=JSON.stringify(data);
    document.head.appendChild(script);
  }

  function mediaReady(){setStatus('');}
  function bindVideoReady(){
    if(!video)return;
    video.addEventListener('loadedmetadata',mediaReady,{once:true});
    video.addEventListener('canplay',mediaReady,{once:true});
    video.addEventListener('playing',mediaReady,{once:true});
  }

  function loadHls(url){
    clearError();
    destroyHls();
    if(iframe)iframe.src='';
    showOnly('video');
    setStatus('جاري تجهيز السيرفر السريع…');
    bindVideoReady();
    if(window.Hls&&window.Hls.isSupported()){
      hls=new window.Hls({enableWorker:true,lowLatencyMode:false});
      hls.on(window.Hls.Events.MANIFEST_PARSED,mediaReady);
      hls.on(window.Hls.Events.ERROR,function(_e,data){
        if(data&&data.fatal){
          destroyHls();
          fallbackServer();
        }
      });
      hls.attachMedia(video);
      hls.on(window.Hls.Events.MEDIA_ATTACHED,function(){hls.loadSource(url)});
    }else if(video.canPlayType('application/vnd.apple.mpegurl')){
      video.src=url;
      video.addEventListener('error',()=>fallbackServer(),{once:true});
    }else{
      fallbackServer();
    }
  }

  function loadHlsLibraryThen(url){
    showOnly('video');
    setStatus('جاري تحميل المشغل…');
    const existing=document.querySelector('script[data-hls-loader]');
    if(existing){
      existing.addEventListener('load',()=>loadHls(url),{once:true});
      existing.addEventListener('error',fallbackServer,{once:true});
      return;
    }
    const s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js';
    s.async=true;
    s.dataset.hlsLoader='true';
    s.onload=()=>loadHls(url);
    s.onerror=fallbackServer;
    document.head.appendChild(s);
  }

  function useServer(btn){
    const url=btn.dataset.url||'';
    const type=btn.dataset.type||'iframe';
    if(!url)return;
    buttons.forEach(b=>b.classList.toggle('active',b===btn));
    clearError();

    if(type==='hls'){
      fallbackUsed=false;
      try{video.pause()}catch(_e){}
      video.removeAttribute('src');
      if(window.Hls||video.canPlayType('application/vnd.apple.mpegurl'))loadHls(url);
      else loadHlsLibraryThen(url);
      return;
    }

    destroyHls();
    try{video.pause()}catch(_e){}
    video.removeAttribute('src');
    video.load();
    showOnly('iframe');
    iframe.src=url;
    setStatus('');
  }

  buttons.forEach(btn=>btn.addEventListener('click',()=>useServer(btn)));

  const first=root.querySelector('[data-default="true"]')||buttons[0];
  if(first)useServer(first);
  injectVideoSchema();
})();
(function(){'use strict';
  const root=document.querySelector('[data-player]');
  if(!root)return;
  const iframe=root.querySelector('[data-iframe]');
  const video=root.querySelector('[data-video]');
  const errorBox=root.querySelector('[data-player-error]');
  const status=root.querySelector('[data-player-status]');
  const buttons=[...root.querySelectorAll('[data-server]')];
  let hls=null;

  const episodeMatch=location.pathname.match(/episode-(\d+)\.html$/);
  const episode=episodeMatch?Number(episodeMatch[1]):null;
  const releaseDates={1:'2026-01-08',2:'2026-01-08',3:'2026-01-15',4:'2026-01-22',5:'2026-01-29',6:'2026-02-05',7:'2026-02-12',8:'2026-02-26',9:'2026-03-05',10:'2026-03-12',11:'2026-03-19',12:'2026-03-26'};

  function setStatus(text){if(status)status.textContent=text||'';}
  function showError(text){if(errorBox){errorBox.textContent=text;errorBox.classList.add('show')}}
  function clearError(){if(errorBox)errorBox.classList.remove('show')}
  function destroyHls(){if(hls){hls.destroy();hls=null}}

  function injectVideoSchema(){
    if(!episode || document.querySelector('script[data-video-schema]'))return;
    const h1=document.querySelector('h1');
    const description=document.querySelector('meta[name="description"]');
    const poster=video&&video.getAttribute('poster');
    const title=h1?h1.textContent.trim():`جوجوتسو كايسن الموسم الثالث الحلقة ${episode}`;
    const descriptionText=description?description.getAttribute('content')||title:title;
    const data={'@context':'https://schema.org','@type':'VideoObject','name':title,'description':descriptionText,'thumbnailUrl':poster?[poster]:[],'uploadDate':releaseDates[episode]||'2026-01-08'};
    const defaultButton=root.querySelector('[data-default="true"]')||buttons[0];
    if(defaultButton&&defaultButton.dataset.type==='iframe'&&defaultButton.dataset.url){data.embedUrl=defaultButton.dataset.url}
    const script=document.createElement('script');script.type='application/ld+json';script.dataset.videoSchema='true';script.textContent=JSON.stringify(data);document.head.appendChild(script);
  }

  async function loadHls(url){
    clearError();iframe.hidden=true;video.hidden=false;setStatus('جاري تجهيز مشغل الفيديو…');
    if(window.Hls&&window.Hls.isSupported()){
      destroyHls();hls=new window.Hls({enableWorker:true,lowLatencyMode:false});
      hls.on(window.Hls.Events.ERROR,function(_e,data){if(data&&data.fatal){destroyHls();showError('تعذر تشغيل هذا السيرفر. جرّب سيرفرًا آخر من الأزرار أسفل المشغل.');setStatus('تعذر التشغيل')}});
      hls.attachMedia(video);hls.on(window.Hls.Events.MEDIA_ATTACHED,function(){hls.loadSource(url)});
    }else if(video.canPlayType('application/vnd.apple.mpegurl')){
      video.src=url;video.addEventListener('loadedmetadata',()=>setStatus('جاهز للتشغيل'),{once:true});video.addEventListener('error',()=>{showError('تعذر تشغيل هذا السيرفر. جرّب سيرفرًا آخر.');setStatus('تعذر التشغيل')},{once:true});
    }else{showError('المتصفح الحالي لا يدعم هذا النوع من البث. جرّب سيرفرًا آخر.');setStatus('تعذر التشغيل')}
  }

  function useServer(btn){
    const url=btn.dataset.url||'';const type=btn.dataset.type||'iframe';if(!url)return;
    buttons.forEach(b=>b.classList.toggle('active',b===btn));clearError();
    if(type==='hls'){
      if(window.Hls){loadHls(url)}else{setStatus('جاري تحميل المشغل…');const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/hls.js@latest';s.async=true;s.onload=()=>loadHls(url);s.onerror=()=>{showError('تعذر تحميل مشغل الفيديو. جرّب سيرفرًا آخر.');setStatus('تعذر التشغيل')};document.head.appendChild(s)}
    }else{
      destroyHls();try{video.pause()}catch(_e){}video.removeAttribute('src');video.hidden=true;iframe.hidden=false;iframe.src=url;setStatus(`${btn.textContent.trim()} — جاهز للمشاهدة`)
    }
  }

  buttons.forEach(btn=>btn.addEventListener('click',()=>useServer(btn)));
  const first=root.querySelector('[data-default="true"]')||buttons[0];
  if(first)useServer(first);
  injectVideoSchema();
})();
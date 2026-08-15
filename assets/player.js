(function(){'use strict';
  const root=document.querySelector('[data-player]');
  if(!root)return;
  const iframe=root.querySelector('[data-iframe]');
  const video=root.querySelector('[data-video]');
  const errorBox=root.querySelector('[data-player-error]');
  const status=root.querySelector('[data-player-status]');
  const buttons=[...root.querySelectorAll('[data-server]')];
  let hls=null;
  function setStatus(text){if(status)status.textContent=text||'';}
  function showError(text){if(errorBox){errorBox.textContent=text;errorBox.classList.add('show')}}
  function clearError(){if(errorBox)errorBox.classList.remove('show')}
  function destroyHls(){if(hls){hls.destroy();hls=null}}
  async function loadHls(url){
    clearError();
    iframe.hidden=true; video.hidden=false;
    setStatus('جاري تجهيز مشغل الفيديو…');
    if(window.Hls && window.Hls.isSupported()){
      destroyHls(); hls=new window.Hls({enableWorker:true,lowLatencyMode:false});
      hls.on(window.Hls.Events.ERROR,function(_e,data){if(data && data.fatal){destroyHls();showError('تعذر تشغيل هذا السيرفر. جرّب سيرفرًا آخر من الأزرار أسفل المشغل.');setStatus('تعذر التشغيل')}});
      hls.attachMedia(video); hls.on(window.Hls.Events.MEDIA_ATTACHED,function(){hls.loadSource(url);});
    }else if(video.canPlayType('application/vnd.apple.mpegurl')){
      video.src=url;
      video.addEventListener('loadedmetadata',()=>setStatus('جاهز للتشغيل'),{once:true});
      video.addEventListener('error',()=>showError('تعذر تشغيل هذا السيرفر. جرّب سيرفرًا آخر.'),{once:true});
    }else{
      showError('المتصفح الحالي لا يدعم هذا النوع من البث. جرّب سيرفرًا آخر.');
    }
  }
  function useServer(btn){
    const url=btn.dataset.url||''; const type=btn.dataset.type||'iframe';
    if(!url)return;
    buttons.forEach(b=>b.classList.toggle('active',b===btn));
    clearError();
    if(type==='hls'){
      if(window.Hls){loadHls(url);}
      else{
        setStatus('جاري تحميل المشغل…');
        const s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/hls.js@latest'; s.async=true;
        s.onload=()=>loadHls(url); s.onerror=()=>showError('تعذر تحميل مشغل الفيديو. جرّب سيرفرًا آخر.'); document.head.appendChild(s);
      }
    }else{
      destroyHls(); video.pause(); video.removeAttribute('src'); video.hidden=true; iframe.hidden=false; iframe.src=url; setStatus('سيرفر خارجي');
    }
  }
  buttons.forEach(btn=>btn.addEventListener('click',()=>useServer(btn)));
  const first=root.querySelector('[data-default="true"]')||buttons[0];
  if(first)useServer(first);
})();
// Canvas setup
    const canvas = document.getElementById('sketch');
    const ctx = canvas.getContext('2d');
    function resizeCanvas(){
      const ratio = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * ratio);
      canvas.height = Math.floor(rect.height * ratio);
      ctx.scale(ratio, ratio);
    }
    // set an initial CSS size for canvas area
    function setCanvasHeight(){
      const vh = Math.min(window.innerHeight - 120, 900);
      canvas.style.height = vh + 'px';
    }
    setCanvasHeight();

    window.addEventListener('resize', ()=>{ setCanvasHeight(); resizeCanvas(); });
    // wait a tick then resize
    requestAnimationFrame(()=>{ resizeCanvas(); drawBackground(); });

    // tools and UI elements
    const penBtn = document.getElementById('penBtn');
    const brushBtn = document.getElementById('brushBtn');
    const clearBtn = document.getElementById('clearBtn');
    const saveBtn = document.getElementById('saveBtn');
    const sizeRange = document.getElementById('sizeRange');
    const sizeVal = document.getElementById('sizeVal');
    const colorPocket = document.getElementById('colorPocket');
    const palette = document.getElementById('palette');
    const swatches = document.getElementById('swatches');
    const currentColor = document.getElementById('currentColor');
    const customColor = document.getElementById('customColor');
    const applyCustom = document.getElementById('applyCustom');

    // default state
    let tool = 'pen';
    let color = '#000000';
    let size = Number(sizeRange.value);
    let drawing = false;
    let last = {x:0,y:0};

    // fill swatches
    const paletteColors = ['#000000','#444444','#7b1fa2','#1e88e5','#0d9488','#16a34a','#f59e0b','#ef4444','#ffffff','#f8fafc','#ff7ab6','#8b5cf6'];
    function makeSwatches(){
      paletteColors.forEach(c=>{
        const d = document.createElement('div');
        d.className = 'swatch';
        d.style.background = c;
        d.addEventListener('click', ()=>{ setColor(c); togglePalette(false); });
        swatches.appendChild(d);
      });
    }
    makeSwatches();

    function setColor(c){ color = c; currentColor.style.background = c; }
    setColor(color);

    // tool toggles
    function setActiveButton(btn){ [penBtn,brushBtn].forEach(b=>b.classList.remove('active')); btn.classList.add('active'); }
    penBtn.addEventListener('click', ()=>{ tool='pen'; setActiveButton(penBtn); });
    brushBtn.addEventListener('click', ()=>{ tool='brush'; setActiveButton(brushBtn); });

    sizeRange.addEventListener('input', ()=>{ size = Number(sizeRange.value); sizeVal.textContent = size; });

    clearBtn.addEventListener('click', ()=>{ if(confirm('Clear the canvas?')){ drawBackground(true); } });
    saveBtn.addEventListener('click', ()=>{
      const data = canvas.toDataURL('image/png');
      const a = document.createElement('a'); a.href = data; a.download = 'sketch.png'; a.click();
    });

    // palette toggling
    function togglePalette(show){ palette.style.display = show? 'block' : 'none'; palette.setAttribute('aria-hidden', !show); }
    colorPocket.addEventListener('click', ()=>{ togglePalette(palette.style.display !== 'block'); });
    applyCustom.addEventListener('click', ()=>{ setColor(customColor.value); togglePalette(false); });
    // close palette when clicking outside
    document.addEventListener('click', (e)=>{
      if(!colorPocket.contains(e.target) && !palette.contains(e.target)) togglePalette(false);
    });

    // drawing handlers (mouse + touch)
    function getXY(evt){
      const rect = canvas.getBoundingClientRect();
      let clientX = evt.clientX, clientY = evt.clientY;
      if(evt.touches && evt.touches[0]){ clientX = evt.touches[0].clientX; clientY = evt.touches[0].clientY; }
      return {x: clientX - rect.left, y: clientY - rect.top};
    }

    function startDraw(e){ e.preventDefault(); drawing = true; last = getXY(e); drawPoint(last.x,last.y,true); }
    function stopDraw(e){ if(!drawing) return; drawing = false; }
    function draw(e){ if(!drawing) return; e.preventDefault(); const p = getXY(e); strokeLine(last.x,last.y,p.x,p.y); last = p; }

    canvas.addEventListener('mousedown', startDraw); canvas.addEventListener('touchstart', startDraw,{passive:false});
    window.addEventListener('mouseup', stopDraw); window.addEventListener('touchend', stopDraw);
    canvas.addEventListener('mousemove', draw); canvas.addEventListener('touchmove', draw,{passive:false});

    function strokeLine(x1,y1,x2,y2){
      ctx.save();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      if(tool === 'brush'){
        ctx.globalAlpha = 0.35; // softer brush
        // draw several overlapping strokes for a softer look
        for(let i=0;i<2;i++){
          ctx.beginPath(); ctx.moveTo(x1 + (Math.random()-0.5)*1.4, y1 + (Math.random()-0.5)*1.4);
          ctx.lineTo(x2 + (Math.random()-0.5)*1.4, y2 + (Math.random()-0.5)*1.4);
          ctx.stroke();
        }
      } else {
        ctx.globalAlpha = 1.0;
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
      }
      ctx.restore();
    }

    function drawPoint(x,y,force){ // dot on click
      ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = (tool==='brush')?0.6:1; ctx.beginPath(); ctx.arc(x,y,size/2,0,Math.PI*2); ctx.fill(); ctx.restore();
    }

    // initial paper background
    function drawBackground(clearOnly){
      ctx.save();
      // clear
      ctx.clearRect(0,0,canvas.width,canvas.height);
      // draw a subtle paper texture (simple dots)
      const cw = canvas.width; const ch = canvas.height;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0,0,cw, ch);
      // tiny grid-like pattern
      ctx.strokeStyle = 'rgba(0,0,0,0.02)'; ctx.lineWidth = 1;
      const step = 18;
      for(let x=0;x<cw;x+=step){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,ch); ctx.stroke(); }
      for(let y=0;y<ch;y+=step){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(cw,y); ctx.stroke(); }
      ctx.restore();
    }

    // set initial size text
    sizeVal.textContent = sizeRange.value;

    // make sure canvas is resized and background re-drawn properly after load
    window.addEventListener('load', ()=>{ resizeCanvas(); drawBackground(); });

    // improve crispness on high dpi
    (function ensureHiDPI(){
      // handled in resizeCanvas() which uses devicePixelRatio
      resizeCanvas();
    })();
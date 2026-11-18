// Win95-style window dragging shared by every page on alenlvovich.com.
// Any .win[data-win] with a .ttl[data-drag] title bar can be dragged by that bar.
// Offsets are kept per window id so they survive re-renders.
window.Win95 = (function(){
  const pos = {};
  let z = 10, active = null;

  function place(w){
    const p = pos[w.dataset.win];
    if (p){ w.style.transform = `translate(${p.x}px,${p.y}px)`; w.style.zIndex = p.z; }
    w.classList.toggle('inactive', active !== null && active !== w.dataset.win);
  }
  function restore(root){ root.querySelectorAll('.win[data-win]').forEach(place); }

  function focus(w){
    const id = w.dataset.win, p = pos[id] || (pos[id] = {x:0,y:0,z:0});
    p.z = ++z; active = id;
    document.querySelectorAll('.win[data-win]').forEach(place);
  }

  function enableDrag(root){
    root.addEventListener('pointerdown', e => {
      const w = e.target.closest('.win[data-win]'); if (!w) return;
      focus(w);
      const bar = e.target.closest('.ttl[data-drag]');
      if (!bar || e.target.closest('button') || e.button > 0) return;
      e.preventDefault();
      const p = pos[w.dataset.win], sx = e.clientX - p.x, sy = e.clientY - p.y;
      w.classList.add('dragging');
      bar.setPointerCapture(e.pointerId);
      const move = ev => {
        p.x = ev.clientX - sx;
        p.y = Math.max(ev.clientY - sy, -w.offsetTop);
        w.style.transform = `translate(${p.x}px,${p.y}px)`;
      };
      const up = () => {
        w.classList.remove('dragging');
        bar.removeEventListener('pointermove', move);
        bar.removeEventListener('pointerup', up);
        bar.removeEventListener('pointercancel', up);
      };
      bar.addEventListener('pointermove', move);
      bar.addEventListener('pointerup', up);
      bar.addEventListener('pointercancel', up);
    });
    root.addEventListener('dblclick', e => {
      const bar = e.target.closest('.ttl[data-drag]'); if (!bar) return;
      const w = bar.closest('.win[data-win]'); const p = pos[w.dataset.win];
      if (p){ p.x = 0; p.y = 0; place(w); w.style.transform = ''; }
    });
  }

  function clock(el){
    const tick = () => el.textContent = new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
    tick(); setInterval(tick, 30000);
  }
  return { restore, enableDrag, clock, front: focus };
})();

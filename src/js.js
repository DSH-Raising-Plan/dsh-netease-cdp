/**
 * JS snippets injected into the NetEase Cloud Music page.
 * Kept byte-stable with canyueY/netease-cdp where possible.
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export const FIBER_STORE_JS = `
function _ensureStore() {
  if (!window.__debug_store_log) window.__debug_store_log = [];
  try {
    if (window._reduxStore) return true;
    const rootEl = document.querySelector('#root');
    let root = window._fiberRoot
      || (rootEl && rootEl._reactRootContainer && rootEl._reactRootContainer._internalRoot);
    if (!root && rootEl) {
      const rk = Object.keys(rootEl).find(function(k) {
        return k.indexOf('__reactContainer') === 0 || k.indexOf('__reactFiber') === 0;
      });
      if (rk) {
        const holder = rootEl[rk];
        root = (holder && (holder._reactRootContainer || holder)) || null;
        if (root && root._internalRoot) root = root._internalRoot;
      }
    }
    if (!root) return false;
    let queue = [root.current || root];
    let visited = 0;
    while (queue.length > 0) {
      let node = queue.shift();
      if (!node) continue;
      visited++;
      if (visited > 20000) break;
      if (node.memoizedProps && node.memoizedProps.store) {
        window._reduxStore = node.memoizedProps.store;
        return true;
      }
      if (node.pendingProps && node.pendingProps.store) {
        window._reduxStore = node.pendingProps.store;
        return true;
      }
      if (node.stateNode && node.stateNode.store) {
        window._reduxStore = node.stateNode.store;
        return true;
      }
      let child = node.child;
      while (child) { queue.push(child); child = child.sibling; }
    }
    return false;
  } catch (err) {
    return false;
  }
}
`;

export function wrap(body) {
  return `(function(){\n${FIBER_STORE_JS}\n${body}\n})()`;
}

export function dispatchBody(actionId, dataJs) {
  return (
    `if(_ensureStore()){window._reduxStore.dispatch({type:'async:action/doAction',` +
    `payload:{actionId:'${actionId}',data:${dataJs}}});return true;}` +
    `return false;`
  );
}

export function playTrackData(songId) {
  return `{resource:{id:String(${Number(songId)})},resourceType:'track',eventType:'dblclick'}`;
}

export function insertNextData(songId) {
  return (
    `{resource:{id:String(${Number(songId)}),duration:0},` +
    `resourceType:'track',eventType:'click'}`
  );
}

export const PLAY_NEXT_DATA = `{eventType:'click'}`;
export const PLAY_PREV_DATA = `{eventType:'click'}`;

export const IS_PLAYING_BODY =
  "if(_ensureStore()){const s=window._reduxStore.getState();" +
  "const id=s.playing?.resourceTrackId||s.playing?.onlineResourceId;" +
  "return !!(id&&(s.playing?.playing!==false));}" +
  "return false;";

export const CURRENT_TRACK_ID_BODY =
  "if(_ensureStore()){const s=window._reduxStore.getState();" +
  "const id=s.playing?.resourceTrackId||s.playing?.onlineResourceId;" +
  "return id?String(id):'';}" +
  "return '';";

export const CURRENT_TRACK_BODY =
  "if(_ensureStore()){" +
  "var s=window._reduxStore.getState();" +
  "var pl=s.playing||{};" +
  "var id=pl.resourceTrackId||pl.onlineResourceId||'';" +
  "var track=(s.entities&&s.entities.tracks&&s.entities.tracks[id])" +
  "||(s.track&&s.track.entities&&s.track.entities[id])||null;" +
  "var name=(track&&(track.name||track.title))||pl.resourceName||'';" +
  "function pickName(a){" +
  "if(!a)return '';" +
  "if(typeof a==='string')return a;" +
  "if(typeof a!=='object')return '';" +
  "return a.name||a.nickname||a.title||'';" +
  "}" +
  "function joinArtists(v){" +
  "if(!v)return '';" +
  "if(typeof v==='string')return v;" +
  "if(typeof v!=='object')return '';" +
  "if(!Array.isArray(v))v=[v];" +
  "return v.map(pickName).filter(Boolean).join('/');" +
  "}" +
  "var artists='';" +
  "artists=joinArtists(pl.resourceArtists);" +
  "if(!artists&&track){" +
  "var cands=[track.ar,track.artists,track.singer,track.singers,track.artist];" +
  "for(var i=0;i<cands.length;i++){" +
  "var got=joinArtists(cands[i]);" +
  "if(got){artists=got;break;}" +
  "}" +
  "}" +
  "return {id:String(id||''),name:String(name||''),artists:artists," +
  "playing:!!(id&&pl.playing!==false)," +
  "duration:Number(pl.resourceDuration||0)||0};" +
  "}" +
  "return {id:'',name:'',artists:'',playing:false};";

export const NEXT_DOM_JS = `
(function() {
  const nextBtn = document.querySelector('.prv[data-action="next"]')
    || document.querySelector('.btn-next');
  if (nextBtn) { nextBtn.click(); return true; }
  return false;
})()
`;

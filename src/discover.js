/**
 * Discover-page personal cards (daily / radar / heart…).
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { evaluate } from './client.js';
import { navigateHashBody, wrap } from './js.js';

export const CARD_KEYWORDS = {
  daily: ['每日歌曲推荐', '每日推荐'],
  private_radar: ['私人雷达'],
  heart_mode: ['心动模式', '心动'],
  private_roam: ['私人漫游'],
};

const DISCOVER_CLICK_CARD_JS = `
(function(keywords){
  function norm(t){return String(t||'').replace(/\\s+/g,'');}
  function findSection(){
    var nodes=document.querySelectorAll(
      'h2,h3,h4,.tit,.hd h2,.tit-txt,[class*="title"],[class*="Title"],[class*="header"]'
    );
    for(var i=0;i<nodes.length;i++){
      var t=norm(nodes[i].textContent);
      if(t.indexOf('个性化推荐')>=0){
        var sec=nodes[i].closest('section')
          ||nodes[i].closest('[class*="recommend"]')
          ||nodes[i].closest('[class*="Recommend"]')
          ||nodes[i].parentElement;
        for(var d=0;d<8&&sec;d++){
          var cnt=sec.querySelectorAll(
            'li,[class*="item"],[class*="card"],[class*="Rec"],[class*="rec-"]'
          ).length;
          if(cnt>=2) return sec;
          sec=sec.parentElement;
        }
      }
    }
    return document.querySelector('.n-recommend')
      ||document.querySelector('[class*="personalized"]')
      ||document.querySelector('[id*="recommend"]')
      ||document.body;
  }
  function pickCard(root, kws){
    var nodes=root.querySelectorAll(
      'li,[class*="item"],[class*="card"],[class*="RecItem"],[class*="rec-item"],[class*="m-rec"]'
    );
    var best=null, bestScore=-1;
    for(var i=0;i<nodes.length;i++){
      var el=nodes[i];
      var text=norm(el.textContent);
      for(var j=0;j<kws.length;j++){
        var kw=norm(kws[j]);
        if(!kw||text.indexOf(kw)<0) continue;
        var score=kw.length*12;
        if(kw.indexOf('每日')>=0&&text.indexOf('根据你的口味')>=0) score+=20;
        if(kw.indexOf('私人雷达')>=0&&text.indexOf('猜你喜欢')>=0) score+=20;
        if(kw.indexOf('心动')>=0&&text.indexOf('红心')>=0) score+=20;
        if(kw.indexOf('私人漫游')>=0&&(text.indexOf('银河')>=0||text.indexOf('漫游')>=0)) score+=20;
        if(score>bestScore){bestScore=score;best=el;}
      }
    }
    return best;
  }
  function clickPlay(card){
    var root=card.closest('li')||card.closest('[class*="item"]')||card;
    try{root.scrollIntoView({block:'center',inline:'nearest'});}catch(e){}
    var sel='.icon-play,.u-coverplay,[class*="coverplay"],[class*="CoverPlay"],'
      +'.ply,.btn-play,[data-action="play"],[class*="play-btn"]';
    var btn=root.querySelector(sel);
    if(btn){btn.click();return {ok:true,how:'play-btn',label:norm(root.textContent).slice(0,40)};}
    var cover=root.querySelector('.u-cover, [class*="cover"] img, [class*="cover"]');
    if(cover){cover.click();return {ok:true,how:'cover',label:norm(root.textContent).slice(0,40)};}
    root.click();
    return {ok:true,how:'card',label:norm(root.textContent).slice(0,40)};
  }
  var sec=findSection();
  var card=pickCard(sec, keywords);
  if(!card) return {ok:false,reason:'card-not-found',section:!!sec};
  return clickPlay(card);
})
`;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function playDiscoverCard(client, cardKey, { waitSec = 2.0 } = {}) {
  const kws = CARD_KEYWORDS[cardKey];
  if (!kws) throw new Error(`未知卡片: ${cardKey}（可选: ${Object.keys(CARD_KEYWORDS).join(', ')}）`);
  await evaluate(wrap(navigateHashBody('#/discover')), client.config);
  await sleep(800);
  const raw = await evaluate(
    `${DISCOVER_CLICK_CARD_JS}${JSON.stringify(kws)})`,
    client.config,
  );
  await sleep(Math.max(0.5, waitSec) * 1000);
  const track = await client.currentTrack();
  return {
    ok: Boolean(raw?.ok),
    card: cardKey,
    how: raw?.how || '',
    label: raw?.label || '',
    reason: raw?.reason || '',
    track,
  };
}

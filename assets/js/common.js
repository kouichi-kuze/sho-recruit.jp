
(function(){
  // 名前空間
  window.SHO = window.SHO || {};

  // ========= 共通: DOM Ready =========
  function onReady(fn){
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  // ========= 1) ヘッダーメニュー =========
  function initHeaderMenu(){
    var BP = 992;
    var header = document.querySelector('.site-header');
    if (!header) return;

    var burger  = header.querySelector('.hamburger');
    var nav     = header.querySelector('.global-nav');
    if (!burger || !nav) return;

    var toggles = nav.querySelectorAll('.has-dropdown > .nav-first-layer');

    function isSP(){ return window.innerWidth <= BP; }

    function closeAllSubmenus(){
      nav.querySelectorAll('.has-dropdown.is-open').forEach(function(li){
        li.classList.remove('is-open');
        var a = li.querySelector('.nav-first-layer');
        if (a) a.setAttribute('aria-expanded','false');
      });
    }

    function openMenu(open){
      nav.classList.toggle('is-open', open);
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
      document.body.classList.toggle('no-scroll', open);
      if (!open) closeAllSubmenus();
    }

    burger.addEventListener('click', function () {
      openMenu(!nav.classList.contains('is-open'));
    });

    // SP: サブメニュー（複数同時OK）
    toggles.forEach(function(a){
      a.addEventListener('click', function(e){
        if (!isSP()) return;
        e.preventDefault();
        var li = a.closest('.has-dropdown');
        if (!li) return;
        var willOpen = !li.classList.contains('is-open');
        li.classList.toggle('is-open', willOpen);
        a.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      });

      a.addEventListener('keydown', function(e){
        if (!isSP()) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          a.click();
        }
      });
    });

    // ESCでメニュー閉じ
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        openMenu(false);
      }
    });

    // SP: 子リンクでメニュー閉じ（必要なければ削除可）
    nav.addEventListener('click', function(e){
      if (!isSP()) return;
      var link = e.target.closest('a[href]');
      if (!link) return;
      if (!link.classList.contains('nav-first-layer')) {
        openMenu(false);
      }
    });

    // 外側クリックで閉じる
    document.addEventListener('click', function(e){
      if (!isSP()) return;
      if (!nav.contains(e.target) && !burger.contains(e.target)) {
        openMenu(false);
      }
    });

    // PC幅へ戻ったら状態リセット
    window.addEventListener('resize', function(){
      if (!isSP()) {
        openMenu(false);
      }
    });
  }

  // ========= 2) イントロ動画（ポスター切替） =========
  function initIntroMovie(){
    var wrap = document.querySelector('.p-intro__movie');
    if (!wrap) return;

    var btn    = wrap.querySelector('.movie__poster');
    if (!btn) return;

    var mp4    = wrap.getAttribute('data-src');
    var poster = wrap.getAttribute('data-poster') || '';
    var title  = wrap.getAttribute('data-title')  || '動画';

    function resetToPoster(v) {
      if (v) {
        v.pause();
        v.removeAttribute('src');
        var s = v.querySelector('source');
        if (s) s.removeAttribute('src');
        v.load();
        v.remove();
      }
      wrap.classList.remove('is-playing');
      btn.focus();
    }

    function play() {
      if (!mp4 || wrap.querySelector('video')) return;

      var v = document.createElement('video');
      v.setAttribute('controls', 'controls');
      v.setAttribute('playsinline', 'playsinline');
      v.setAttribute('preload', 'metadata');
      if (poster) v.setAttribute('poster', poster);
      v.setAttribute('aria-label', title);

      var src = document.createElement('source');
      src.src  = mp4;
      src.type = 'video/mp4';
      v.appendChild(src);

      wrap.appendChild(v);
      wrap.classList.add('is-playing');

      // v.addEventListener('pause',  function(){ resetToPoster(v); });
      v.addEventListener('ended', function(){ resetToPoster(v); });

      var p = v.play();
      if (p && typeof p.catch === 'function') p.catch(function(){});
    }

    btn.addEventListener('click',   function(e){ e.preventDefault(); play(); });
    btn.addEventListener('keydown', function(e){
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); }
    });
  }

  // ========= 3) Interview Swiper =========
  function initInterviewSwiper() {
    var el = document.querySelector('.js-interview-swiper');
    if (!el || typeof Swiper === 'undefined') return;

    var swiper = new Swiper('.js-interview-swiper', {
      slidesPerView: 'auto',       // ← ここを変更
      spaceBetween: 30,
      centeredSlides: false,
      loop: false,
      watchOverflow: true,
      grabCursor: true,
      speed: 500,
      resistanceRatio: 0.85,
      slidesPerGroup: 1,
      navigation: {
        nextEl: document.querySelector('.js-interview-next') || null,
        prevEl: document.querySelector('.js-interview-prev') || null
      },
      a11y: { enabled: true },
      keyboard: { enabled: true },
      breakpoints: {
        768: {
          spaceBetween: 24
        }
      }
    });
    window.SHO.interviewSwiper = swiper;
  }

  // ========= 4) FAQ アコーディオン =========
  function initFaqAccordion(){
    var items = document.querySelectorAll('.p-faq__item');
    if (!items.length) return;

    var singleOpen = false; // trueで常に1つだけ開く

    items.forEach(function(item, i){
      var btn   = item.querySelector('.p-faq__question');
      var panel = item.querySelector('.p-faq__answer');
      if (!btn || !panel) return;

      var panelId = panel.id || ("faq-panel-" + (i+1));
      panel.id = panelId;
      btn.setAttribute('aria-controls', panelId);
      btn.setAttribute('aria-expanded', 'false');

      // 初期は閉
      panel.style.height = '0px';
      panel.style.overflow = panel.style.overflow || 'hidden';

      btn.addEventListener('click', function(){
        var isOpen = item.classList.contains('is-open');

        if (singleOpen && !isOpen) {
          items.forEach(function(it){
            if (it !== item && it.classList.contains('is-open')) {
              collapse(it);
            }
          });
        }
        isOpen ? collapse(item) : expand(item);
      });

      function expand(targetItem){
        var button  = targetItem.querySelector('.p-faq__question');
        var content = targetItem.querySelector('.p-faq__answer');
        if (!button || !content) return;

        targetItem.classList.add('is-open');
        button.setAttribute('aria-expanded','true');

        content.style.height = 'auto';
        var h = content.scrollHeight;
        content.style.height = '0px';
        requestAnimationFrame(function(){
          content.style.height = h + 'px';
        });

        function onEnd(e){
          if (e.propertyName === 'height') {
            content.style.height = 'auto';
            content.removeEventListener('transitionend', onEnd);
          }
        }
        content.addEventListener('transitionend', onEnd);
      }

      function collapse(targetItem){
        var button  = targetItem.querySelector('.p-faq__question');
        var content = targetItem.querySelector('.p-faq__answer');
        if (!button || !content) return;

        button.setAttribute('aria-expanded','false');
        targetItem.classList.remove('is-open');

        content.style.height = content.scrollHeight + 'px';
        requestAnimationFrame(function(){
          content.style.height = '0px';
        });
      }
    });
  }

  // ========= 初期化呼び出し =========
  onReady(function(){
    initHeaderMenu();
    initIntroMovie();
    initInterviewSwiper();
    initFaqAccordion();
  });

})();

document.addEventListener('DOMContentLoaded', function () {
  const pageTop = document.querySelector('.fixed-page-top');
  if (!pageTop) return;

  const showPoint = 300; // 表示開始スクロール量(px)

  window.addEventListener('scroll', () => {
    if (window.scrollY > showPoint) {
      pageTop.classList.add('is-show');
    } else {
      pageTop.classList.remove('is-show');
    }
  });

  // アンカークリックでスムーズスクロール
  pageTop.querySelector('a').addEventListener('click', function (e) {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
});

window.addEventListener('load', function () {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  // 1) 「残りテキスト」をJSでラップ（.title-shosekkei-group の後ろ全部）
  (function wrapLeadRemainder() {
    const lead = document.querySelector('.p-intro__lead');
    if (!lead) return;
    const title = lead.querySelector('.title-shosekkei-group');
    if (!title) return;

    // 既に作成済みなら何もしない
    if (lead.querySelector('.lead-rest')) return;

    const restWrapper = document.createElement('span');
    restWrapper.className = 'lead-rest';

    // title の次の兄弟ノード以降をすべて lead-rest に移動
    let node = title.nextSibling;
    const buffer = [];
    while (node) {
      const next = node.nextSibling;
      buffer.push(node);
      node = next;
    }
    buffer.forEach(n => restWrapper.appendChild(n));
    lead.appendChild(restWrapper);
  })();

  // 2) ビルが建つ順番
  const order = [
    '.p-intro-parts-04',
    '.p-intro-parts-03',
    '.p-intro-parts-05',
    '.p-intro-parts-06',
    '.p-intro-parts-02',
    '.p-intro-parts-01'
  ];

  // 初期セット（FOUC対策）
  const lead = document.querySelector('.p-intro__lead');
  const title = document.querySelector('.p-intro__lead .title-shosekkei-group');
  const rest  = document.querySelector('.p-intro__lead .lead-rest');

  if (lead)  gsap.set(lead,  { visibility: 'visible' });
  if (title) gsap.set(title, { opacity: 0, y: 0 });
  if (rest)  gsap.set(rest,  { clipPath: 'inset(0 0 100% 0)' }); // 上→下

  order.forEach(sel => {
    const el = document.querySelector(sel);
    if (el) gsap.set(el, { y: '100vh', opacity: 0 });
  });

  //gsap.set(['.p-intro__text', '.p-intro__movie-wrap', '.p-intro__btn'], { opacity: 0, y: 12 });
  gsap.set(['.p-intro__text', '.p-intro__movie-wrap', '.p-intro__btn'], { opacity: 0, y: 0 });

  // 3) タイムライン：.p-section--intro で発火
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.p-section--intro',
      start: 'top 80%',
      toggleActions: 'play none none reverse',
      // markers: true,
    }
  });

  // 3-1) 04→03→05→06→02→01 を 100vh→0 で順に
  order.forEach((sel, i) => {
    const el = document.querySelector(sel);
    if (!el) return;
    tl.to(el, {
      y: 0,
      opacity: 1,
      //duration: 1.0,
      duration: 0.8,
      ease: 'power2.out'
    //}, i * 0.25); // 着工の間隔
      }, i * 0.15);
  });

  // 3-2) タイトル（英字）フェードイン
  if (title) {
    tl.to(title, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: 'power2.out'
    }, '>-0.05'); // 直前とほぼ連続で
  }

  // 3-3) 残りの見出しを上→下にマスク解除
  if (rest) {
    tl.to(rest, {
      clipPath: 'inset(0 0 0% 0)',
      duration: 0.6,
      ease: 'power2.out'
    }, '>-0.1'); // タイトル直後に重ね気味で
  }

  // 3-4) 残り要素をフェードイン（本文→動画→ボタン等）
  tl.to('.p-intro__text',       { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, '+=0.05')
    .to('.p-intro__movie-wrap', { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, '+=0.05')
    .to('.p-intro__btn',        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '+=0.05');
});

window.addEventListener('load', function () {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  // 先に .text-en をラップ
  (function wrapTextEn() {
    document.querySelectorAll('.text-en').forEach(el => {
      if (el.querySelector(':scope > .reveal')) return;
      const html = el.innerHTML;
      el.innerHTML = `<span class="reveal">${html}</span>`;
    });
  })();

  // --- パララックス ---
  gsap.utils.toArray('.bg-parts-item').forEach(el => {
    const speed = parseFloat(el.getAttribute('data-speed') || -2.5);
    gsap.fromTo(el, { yPercent: 0 }, {
      yPercent: speed * 300,
      ease: "none",
      scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 5 }
    });
  });

  // --- 見出しマスク連動（roundtable除外） ---
  gsap.utils.toArray(
    '.title-work-headding, .title-interview-headding, .title-data-headding, .title-environment-headding, .title-faq-headding'
  ).forEach((wrap) => {
    const jpList = wrap.querySelectorAll('.text-jp');
    const enList = wrap.querySelectorAll('.text-en');

    jpList.forEach((jp) => {
      gsap.set(jp, { css: { '--reveal': '0%' } });
      gsap.to(jp, {
        css: { '--reveal': '100%' },
        duration: 1.0,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: jp,
          start: 'top 65%',
          once: true,
          onEnter: () => {
            // JP 入場後に EN を発火している箇所
            wrap.querySelectorAll('.text-en').forEach((en, idx) => {
              const target = en.querySelector(':scope > .reveal');   // ← 追加
              gsap.set(target, { css: { '--reveal': '0%' } });       // ← 置換
              gsap.to(target, {
                css: { '--reveal': '100%' },
                duration: 1.0,
                ease: 'power2.out',
                delay: 0.2 + idx * 0.08
              });
            });
          }
        }
      });
    });

    if (jpList.length === 0) {
      enList.forEach((en) => {
        const target = en.querySelector(':scope > .reveal');   // ← 追加
        gsap.set(target, { css: { '--reveal': '0%' } });       // ← 置換
        gsap.to(target, {
          css: { '--reveal': '100%' },
          duration: 1.2,                                       // ← 0.8 → 1.2 に統一
          ease: 'power2.out',
          scrollTrigger: { trigger: en, start: 'top 80%', once: true }
        });
      });
    }
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
});

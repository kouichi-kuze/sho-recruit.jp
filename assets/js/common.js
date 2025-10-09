
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
  function initInterviewSwiper(){
    var el = document.querySelector('.js-interview-swiper');
    if (!el) return;
    if (typeof Swiper === 'undefined') return; // 依存関係ガード

    // ナビ要素が無いページでも落ちないように
    var nextEl = document.querySelector('.js-interview-next') || null;
    var prevEl = document.querySelector('.js-interview-prev') || null;

    var swiper = new Swiper('.js-interview-swiper', {
      slidesPerView: 1.5,
      spaceBetween: 20,
      centeredSlides: false,
      loop: false,
      watchOverflow: true,
      grabCursor: true,
      speed: 500,
      resistanceRatio: 0.85,
      slidesOffsetBefore: 65,
      slidesOffsetAfter: 65,
      slidesPerGroup: 1,

      navigation: {
        nextEl: nextEl,
        prevEl: prevEl
      },

      keyboard: { enabled: true },
      a11y: { enabled: true },

      breakpoints: {
        768: {
          slidesPerView: 3.6,
          spaceBetween: 24,
          slidesOffsetBefore: 200,
          slidesOffsetAfter: 200,
          slidesPerGroup: 1.4
        }
      }
    });

    // 必要であれば外から参照可能に
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
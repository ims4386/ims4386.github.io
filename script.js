/* =========================================================
   아이엠에스(IMS) — 1차 시안 스크립트
   헤더 · 모바일 메뉴 · 스크롤 등장 · 복사 · 견적 메일 작성
   ========================================================= */
(function () {
  'use strict';

  var EMAIL = 'ims4386@daum.net';

  /* ---------- 토스트 ---------- */
  var toastEl = document.getElementById('toast');
  var toastTimer = null;
  function toast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('is-visible');
    }, 2200);
  }

  /* ---------- 헤더 스크롤 상태 ---------- */
  var header = document.getElementById('siteHeader');
  function onScroll() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 모바일 메뉴 ---------- */
  var navToggle = document.getElementById('navToggle');
  var nav = document.getElementById('primaryNav');

  function setNav(open) {
    document.body.classList.toggle('nav-open', open);
    if (navToggle) {
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    }
  }

  if (navToggle) {
    navToggle.addEventListener('click', function () {
      setNav(!document.body.classList.contains('nav-open'));
    });
  }
  if (nav) {
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setNav(false);
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
      setNav(false);
      if (navToggle) navToggle.focus();
    }
  });
  document.addEventListener('click', function (e) {
    if (!document.body.classList.contains('nav-open')) return;
    if (e.target.closest('#primaryNav') || e.target.closest('#navToggle')) return;
    setNav(false);
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 900) setNav(false);
  });

  /* ---------- 스크롤 등장 애니메이션 ---------- */
  var reveals = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && reveals.length) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var siblings = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
        el.style.transitionDelay = Math.min(siblings, 6) * 60 + 'ms';
        el.classList.add('is-visible');
        revealObserver.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { revealObserver.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- 현재 섹션 표시 ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__list a'));
  var sections = navLinks
    .map(function (link) { return document.querySelector(link.getAttribute('href')); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { sectionObserver.observe(s); });
  }

  /* ---------- 클립보드 복사 ---------- */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '-1000px';
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        ok ? resolve() : reject(new Error('copy failed'));
      } catch (err) {
        reject(err);
      }
    });
  }

  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var value = btn.getAttribute('data-copy') || '';
      copyText(value).then(function () {
        toast('복사했습니다 — ' + value);
        btn.classList.add('is-done');
        setTimeout(function () { btn.classList.remove('is-done'); }, 1400);
      }).catch(function () {
        toast('복사가 되지 않았습니다. 길게 눌러 직접 복사해 주세요.');
      });
    });
  });

  /* ---------- 견적 문의 작성 ---------- */
  var form = document.getElementById('quoteForm');
  if (!form) return;

  function val(id) {
    var el = document.getElementById(id);
    return el ? String(el.value || '').trim() : '';
  }

  function buildBody() {
    var lines = [
      '안녕하세요, 아이엠에스에 인쇄 견적을 문의드립니다.',
      '',
      '· 품목: ' + (val('qItem') || '-'),
      '· 수량: ' + (val('qQty') || '-'),
      '· 규격/사이즈: ' + (val('qSize') || '-'),
      '· 희망 납기: ' + (val('qDue') || '-'),
      '· 담당자/연락처: ' + (val('qWho') || '-')
    ];
    var memo = val('qMemo');
    if (memo) {
      lines.push('', '· 요청 사항:', memo);
    }
    lines.push('', '감사합니다.');
    return lines.join('\n');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var subject = '[아이엠에스] 인쇄 견적 문의 — ' + (val('qItem') || '품목 미정');
    var url = 'mailto:' + EMAIL +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(buildBody());
    window.location.href = url;
    toast('메일 앱으로 문의 내용을 전달했습니다.');
  });

  var copyQuote = document.getElementById('copyQuote');
  if (copyQuote) {
    copyQuote.addEventListener('click', function () {
      copyText(buildBody()).then(function () {
        toast('문의 내용을 복사했습니다.');
      }).catch(function () {
        toast('복사가 되지 않았습니다. 직접 선택해 복사해 주세요.');
      });
    });
  }

  /* ---------- 연도 ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();

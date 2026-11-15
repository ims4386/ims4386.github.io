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

  /* ---------- 연도 ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- 견적 문의 작성 · 전송 ---------- */
  var form = document.getElementById('quoteForm');
  if (!form) return;

  var ENDPOINT = 'https://formsubmit.co/ajax/' + EMAIL;
  var statusEl = document.getElementById('quoteStatus');
  var submitBtn = document.getElementById('quoteSubmit');
  var submitLabel = submitBtn ? submitBtn.querySelector('.btn__label') : null;
  var actionsEl = form.querySelector('.quote-form__actions');
  var whoField = document.getElementById('qWho');
  var whoWrap = whoField ? whoField.closest('.field') : null;
  var whoError = document.getElementById('qWhoError');
  var isSending = false;

  function val(id) {
    var el = document.getElementById(id);
    return el ? String(el.value || '').trim() : '';
  }

  function setStatus(kind, message) {
    if (!statusEl) return;
    statusEl.classList.remove('is-busy', 'is-success', 'is-error');
    statusEl.textContent = message || '';
    if (message) statusEl.classList.add('is-' + kind);
  }

  function clearWhoError() {
    if (!whoWrap) return;
    whoWrap.classList.remove('has-error');
    if (whoField) whoField.removeAttribute('aria-invalid');
    if (whoError) whoError.hidden = true;
  }

  function showWhoError() {
    if (!whoWrap || !whoField) return;
    whoWrap.classList.add('has-error');
    whoField.setAttribute('aria-invalid', 'true');
    if (whoError) whoError.hidden = false;
    whoField.focus();
  }

  function setBusy(busy) {
    isSending = busy;
    if (!submitBtn) return;
    submitBtn.disabled = busy;
    submitBtn.setAttribute('aria-busy', busy ? 'true' : 'false');
    if (submitLabel) submitLabel.textContent = busy ? '접수 중…' : '웹에서 바로 보내기';
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

  function buildPayload() {
    var item = val('qItem') || '품목 미정';
    return {
      _subject: '[아이엠에스 홈페이지] 견적 문의 - ' + item,
      _template: 'table',
      _captcha: 'false',
      _honey: '',
      '품목': item,
      '수량': val('qQty') || '-',
      '규격/사이즈': val('qSize') || '-',
      '희망 납기': val('qDue') || '-',
      '담당자/연락처': val('qWho'),
      '요청 사항': val('qMemo') || '-',
      '접수 경로': '아이엠에스 홈페이지 견적 문의 폼'
    };
  }

  function buildMailtoUrl() {
    var subject = '[아이엠에스] 인쇄 견적 문의 — ' + (val('qItem') || '품목 미정');
    return 'mailto:' + EMAIL +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(buildBody());
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (isSending) return;

    if (!val('qWho')) {
      showWhoError();
      setStatus('error', '연락받으실 담당자와 연락처를 적어 주세요. 연락처가 있어야 견적을 안내드릴 수 있습니다.');
      return;
    }
    clearWhoError();
    setStatus('busy', '견적 문의를 접수하는 중입니다… 잠시만 기다려 주세요.');
    setBusy(true);
    if (actionsEl) actionsEl.classList.remove('is-hint');

    var controller = null;
    var timer = null;
    if (typeof AbortController !== 'undefined') {
      controller = new AbortController();
      timer = setTimeout(function () { controller.abort(); }, 20000);
    }

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(buildPayload()),
      signal: controller ? controller.signal : undefined
    }).then(function (res) {
      return res.text().then(function (text) {
        var data = null;
        try { data = JSON.parse(text); } catch (err) { data = null; }
        if (!res.ok) throw new Error('HTTP ' + res.status);
        if (data && String(data.success).toLowerCase() === 'false') {
          throw new Error(data.message || 'rejected');
        }
        return data;
      });
    }).then(function () {
      if (timer) clearTimeout(timer);
      setBusy(false);
      setStatus('success', '견적 문의가 접수되었습니다. 확인 후 빠르게 연락드리겠습니다.');
      toast('견적 문의가 접수되었습니다.');
      form.reset();
      clearWhoError();
    }).catch(function (err) {
      if (timer) clearTimeout(timer);
      setBusy(false);
      var timedOut = err && err.name === 'AbortError';
      setStatus('error', timedOut
        ? '연결이 지연되어 접수가 끝나지 않았습니다. 잠시 후 다시 시도하시거나, ‘이메일 앱으로’ 또는 ‘내용 복사’로 보내주세요.'
        : '전송하지 못했습니다. 잠시 후 다시 시도하시거나, ‘이메일 앱으로’ 또는 ‘내용 복사’로 보내주세요.');
      if (actionsEl) actionsEl.classList.add('is-hint');
    });
  });

  var mailQuote = document.getElementById('mailQuote');
  if (mailQuote) {
    mailQuote.addEventListener('click', function () {
      if (val('qWho')) clearWhoError();
      window.location.href = buildMailtoUrl();
      toast('메일 앱을 엽니다. 디자인 파일을 첨부해 보내주세요.');
    });
  }

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

  if (whoField) whoField.addEventListener('input', clearWhoError);
  form.addEventListener('input', function () {
    if (!statusEl || !statusEl.classList.contains('is-error')) return;
    setStatus('', '');
    if (actionsEl) actionsEl.classList.remove('is-hint');
  });
})();

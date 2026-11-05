/* PROMAXX Engineering — site behaviour
   Navigation, scroll reveals, hero parallax, ambient image motion, contact form. */
(function () {
  'use strict';
  window.__promaxx = true;

  var root = document.documentElement;
  var EASE = 'cubic-bezier(.2,.7,.2,1)';
  var motion = root.classList.contains('motion');

  /* ---------------------------------------------------------- year */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------------------------------------------------------- nav */
  var nav = document.querySelector('.nav');
  var burger = document.querySelector('.nav-burger');
  var menu = document.getElementById('mobile-menu');

  function onScrollNav() { if (nav) nav.classList.toggle('scrolled', window.scrollY > 40); }
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  function setMenu(open) {
    if (!menu || !burger) return;
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  if (burger) burger.addEventListener('click', function (e) { e.stopPropagation(); setMenu(!menu.classList.contains('open')); });
  if (menu) menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('click', function (e) { if (menu && menu.classList.contains('open') && !menu.contains(e.target)) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  window.addEventListener('resize', function () { if (window.innerWidth >= 900) setMenu(false); });

  /* ---------------------------------------------------------- ambient image motion */
  if (motion) {
    document.querySelectorAll('.slot.ambient img').forEach(function (img, i) {
      img.style.animationDelay = (-(i * 1.3)) + 's';
    });
  }

  /* ---------------------------------------------------------- hero parallax */
  if (motion) {
    document.querySelectorAll('[data-parallax-root]').forEach(function (heroEl) {
      var targets = heroEl.querySelectorAll('[data-parallax]');
      var mx = 0, sx = 0;
      function apply() { targets.forEach(function (t) { t.style.translate = (mx + sx).toFixed(1) + 'px 0'; }); }
      window.addEventListener('scroll', function () { sx = Math.min(window.scrollY, 900) * -0.03; apply(); }, { passive: true });
      if (window.matchMedia('(pointer: coarse)').matches) return;
      heroEl.addEventListener('mousemove', function (e) {
        var r = heroEl.getBoundingClientRect();
        mx = ((e.clientX - r.left) / r.width - 0.5) * -18; apply();
      });
      heroEl.addEventListener('mouseleave', function () { mx = 0; apply(); });
    });
  }

  /* ---------------------------------------------------------- scroll reveal */
  if (motion) {
    var OFF = { up: '0 36px', down: '0 -24px', left: '-36px 0', right: '36px 0', fade: '0 0', scale: '0 0' };
    var seen = new Set();
    var items = [];
    function add(el, type, delay) { if (seen.has(el)) return; seen.add(el); items.push({ el: el, t: type, d: delay }); }

    document.querySelectorAll('[data-reveal]').forEach(function (el) { add(el, el.dataset.reveal, +(el.dataset.revealDelay || 0)); });
    document.querySelectorAll('[data-reveal-stagger]').forEach(function (p) {
      var base = +(p.dataset.revealDelay || 0), step = +(p.dataset.revealStep || 120), i = 0;
      Array.prototype.forEach.call(p.children, function (c) {
        // non-visual children (hidden inputs, honeypot, status line) are not part of the stagger
        if (c.matches('input[type="hidden"], .hp, .form-status')) { c.classList.add('rv-done'); return; }
        add(c, p.dataset.revealStagger, base + i * step); i++;
      });
    });
    document.querySelectorAll('[data-mask]').forEach(function (el) { add(el, 'mask', +(el.dataset.mask || 0)); });

    function play(it) {
      var el = it.el, t = it.t, kf, dur;
      if (t === 'mask') { kf = [{ translate: '0 110%' }, { translate: '0 0' }]; dur = 900; }
      else if (t === 'mask-x') { kf = [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }]; dur = 1100; }
      else {
        kf = [{ opacity: 0, translate: OFF[t] || OFF.up, scale: t === 'scale' ? 0.94 : 1 }, { opacity: 1, translate: '0 0', scale: 1 }];
        dur = 800;
      }
      if (!el.animate) { el.classList.add('rv-done'); return; }
      var a = el.animate(kf, { duration: dur, delay: it.d, easing: EASE, fill: 'both' });
      el.classList.add('rv-done'); // the backwards fill holds the start frame through the delay
      a.onfinish = function () { a.cancel(); };
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        play(e.target.__rv);
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -15% 0px' });

    items.forEach(function (it) {
      it.el.__rv = it;
      if (it.t === 'mask' || it.t === 'mask-x') {
        // masked elements start out of view inside their clip box, so watch the parent
        var target = it.el.parentElement || it.el;
        var po = new IntersectionObserver(function (es) {
          if (!es[0].isIntersecting) return;
          po.disconnect(); play(it);
        }, { threshold: 0.01 });
        po.observe(target);
      } else {
        io.observe(it.el);
      }
    });
  }

  /* ---------------------------------------------------------- contact form */
  var form = document.getElementById('contact-form');
  if (!form) return;

  var sent = document.getElementById('form-sent');
  var statusEl = form.querySelector('.form-status');
  var btn = form.querySelector('.btn-submit');
  var btnLabel = form.querySelector('.btn-label');
  var MAIL = form.dataset.mailto || 'info@promaxxeng.com';

  var RULES = {
    name: function (v) { return v.trim() ? '' : 'Please enter your full name.'; },
    email: function (v) { return /^\S+@\S+\.\S+$/.test(v.trim()) ? '' : 'Please enter a valid email address.'; },
    phone: function (v) { return v.replace(/\D/g, '').length >= 7 ? '' : 'Please enter a valid phone number.'; }
  };

  function fieldOf(name) { return form.querySelector('[data-field="' + name + '"]'); }
  function setError(name, msg) {
    var f = fieldOf(name); if (!f) return;
    f.classList.toggle('has-error', !!msg);
    var input = f.querySelector('.input');
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    f.querySelector('.err').textContent = msg;
  }
  Object.keys(RULES).forEach(function (name) {
    form.elements[name].addEventListener('input', function () { setError(name, ''); });
  });

  function setStatus(html) {
    statusEl.innerHTML = html || '';
    form.classList.toggle('show-status', !!html);
  }
  function setLoading(on, label) {
    btn.disabled = on;
    btnLabel.textContent = on ? (label || 'Sending…') : 'Submit';
  }
  function showSent(name, msg) {
    sent.querySelector('[data-sent-name]').textContent = name;
    sent.querySelector('[data-sent-msg]').textContent = msg;
    form.hidden = true; sent.hidden = false;
    sent.focus({ preventScroll: true });
    sent.scrollIntoView({ behavior: motion ? 'smooth' : 'auto', block: 'center' });
  }
  function mailtoHref(d) {
    var body = 'Name: ' + d.name + '\nEmail: ' + d.email + '\nPhone: ' + d.phone + '\n\n' + (d.message || '');
    return 'mailto:' + MAIL + '?subject=' + encodeURIComponent('Enquiry from ' + d.name + ' (promaxxeng.com)') + '&body=' + encodeURIComponent(body);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    setStatus('');
    var d = {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      phone: form.elements.phone.value.trim(),
      message: form.elements.message.value.trim()
    };
    var firstBad = null;
    Object.keys(RULES).forEach(function (name) {
      var msg = RULES[name](d[name]); setError(name, msg);
      if (msg && !firstBad) firstBad = form.elements[name];
    });
    if (firstBad) { firstBad.focus(); return; }
    if (form.elements.botcheck && form.elements.botcheck.checked) return; // bot

    var endpoint = (form.dataset.endpoint || '').trim();

    if (!endpoint) {
      // No form backend configured: hand the message to the visitor's email app.
      setLoading(true, 'Opening email…');
      window.location.href = mailtoHref(d);
      setTimeout(function () {
        setLoading(false);
        showSent(d.name, 'Your email app has opened with your message to ' + MAIL + '. Press send there and our team will get back to you at ' + d.email + '.');
      }, 600);
      return;
    }

    setLoading(true);
    fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok || j.success === false) {
            var err = new Error('server'); err.serverMessage = j.message || (j.errors && j.errors[0] && j.errors[0].message) || ''; throw err;
          }
        });
      })
      .then(function () {
        setLoading(false);
        showSent(d.name, 'Your message has been received. Our team will get back to you at ' + d.email + '.');
      })
      .catch(function (err) {
        setLoading(false);
        var why = err instanceof Error && err.serverMessage ? ' (' + err.serverMessage.replace(/[<>&]/g, '') + ')' : '';
        setStatus('Sorry — your message could not be sent' + why + '. Please email us at <a href="' + mailtoHref(d) + '">' + MAIL + '</a> or call <a href="tel:+919967574403">+91 99675 74403</a>.');
      });
  });

  sent.querySelector('[data-reset]').addEventListener('click', function () {
    form.reset();
    Object.keys(RULES).forEach(function (n) { setError(n, ''); });
    setStatus('');
    sent.hidden = true; form.hidden = false;
    form.elements.name.focus();
  });
})();

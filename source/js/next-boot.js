/* global NexT, CONFIG */

NexT.boot = {};

// 1つの処理が失敗しても他の登録が巻き添えで止まらないよう、処理ごとに個別にtry-catchする
const guard = (label, fn) => {
  try {
    fn();
  } catch (error) {
    console.warn(`Something went wrong while ${label}`, error);
  }
};

NexT.boot.registerEvents = function() {
  guard('registering scroll percent', () => NexT.utils.registerScrollPercent());
  guard('registering CanIUse tag', () => NexT.utils.registerCanIUseTag());
  guard('updating footer position', () => NexT.utils.updateFooterPosition());

  guard('registering mobile nav toggle', () => {
    // Mobile top menu bar.
    document.querySelector('.site-nav-toggle').addEventListener('click', event => {
      const siteNav = document.querySelector('.site-nav');
      if (!siteNav) return;
      siteNav.style.setProperty('--scroll-height', siteNav.scrollHeight + 'px');
      document.body.classList.toggle('site-nav-on');
    });
  });

  guard('registering sidebar panel toggle', () => {
    document.querySelectorAll('.sidebar-nav li').forEach((element, index) => {
      element.addEventListener('click', () => {
        NexT.utils.activateSidebarPanel(index);
      });
    });
  });

  guard('registering hashchange handler', () => {
    window.addEventListener('hashchange', () => {
      const tHash = location.hash;
      if (tHash !== '' && !tHash.match(/%\S{2}/)) {
        const target = document.querySelector(`.tabs ul.nav-tabs li a[href="${tHash}"]`);
        target?.click();
      }
    });
  });

  guard('registering tabs:click handler', () => {
    window.addEventListener('tabs:click', e => {
      NexT.utils.registerCodeblock(e.target);
    });
  });
};

NexT.boot.refresh = function() {
  // Register JS handlers by condition option.
  // Need to add config option in Front-End at 'scripts/helpers/next-config.js' file.
  // ライブラリ本体の読み込み失敗(CDN障害等)が他の初期化処理を巻き添えにしないよう個別にguardする
  guard('running Prism', () => CONFIG.prism && window.Prism.highlightAll());
  guard('running mediumZoom', () => CONFIG.mediumzoom && window.mediumZoom('.post-body :not(a) > img, .post-body > img', {
    background: 'var(--content-bg-color)'
  }));
  guard('running lozad', () => CONFIG.lazyload && window.lozad('.post-body img').observe());
  guard('running pangu', () => {
    if (!CONFIG.pangu) return;
    // Polyfill for requestIdleCallback if not supported
    if (!window.requestIdleCallback) {
      window.requestIdleCallback = function(cb) {
        cb({
          didTimeout   : false,
          timeRemaining: () => 100
        });
      };
    }
    [...document.getElementsByTagName('main')].forEach(e => window.pangu.spacingNode(e));
  });

  guard('registering external url', () => CONFIG.exturl && NexT.utils.registerExtURL());
  guard('wrapping table with box', () => NexT.utils.wrapTableWithBox());
  guard('registering codeblock', () => NexT.utils.registerCodeblock());
  guard('registering tabs tag', () => NexT.utils.registerTabsTag());
  guard('registering active menu item', () => NexT.utils.registerActiveMenuItem());
  guard('registering lang select', () => NexT.utils.registerLangSelect());
  guard('registering sidebar TOC', () => NexT.utils.registerSidebarTOC());
  guard('registering post reward', () => NexT.utils.registerPostReward());
  guard('registering video iframe', () => NexT.utils.registerVideoIframe());
  guard('registering a11y buttons', () => NexT.utils.registerA11yButtons());
};

NexT.boot.motion = function() {
  // Define Motion Sequence & Bootstrap Motion.
  if (CONFIG.motion.enable) {
    try {
      NexT.motion.integrator
        .add(NexT.motion.middleWares.header)
        .add(NexT.motion.middleWares.sidebar)
        .add(NexT.motion.middleWares.postList)
        .add(NexT.motion.middleWares.footer)
        .bootstrap();
    } catch (error) {
      console.warn('NexT Motion Error, fallback to static mode', error);
      document.body.classList.remove('use-motion');
      CONFIG.motion.enable = false;
    }
  }
  NexT.utils.updateSidebarPosition();
};

document.addEventListener('DOMContentLoaded', () => {
  NexT.boot.registerEvents();
  NexT.boot.refresh();
  NexT.boot.motion();
});

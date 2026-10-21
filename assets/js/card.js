/**
 * Interactive Birthday Card Experience
 * Adapted and personalized for Kawsar
 * Based on Happy-Birthday-Card by Anshuman Mahato
 */

(function () {
  'use strict';

  // Audio elements
  const audios = {
    switch: new Audio('./assets/sfx/switch.mp3'),
    door: new Audio('./assets/sfx/door.mp3'),
    haunt: new Audio('./assets/sfx/haunted-bgm.mp3'),
    blast: new Audio('./assets/sfx/blast.mp3'),
    hbd: new Audio('./assets/sfx/hbd.mp3')
  };

  audios.haunt.loop = true;
  audios.hbd.loop = true;

  let isCardMuted = false;
  let currentStep = 'darkroom'; // darkroom -> emptyroom -> hallway -> giftroom -> grandcard
  let textTimeouts = [];

  function playSound(audioKey) {
    if (isCardMuted) return;
    try {
      const audio = audios[audioKey];
      if (audio) {
        audio.currentTime = 0;
        const p = audio.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {});
        }
      }
    } catch (e) {
      // Audio autoplay policy handled
    }
  }

  function stopAllCardAudio() {
    Object.keys(audios).forEach((key) => {
      try {
        audios[key].pause();
        audios[key].currentTime = 0;
      } catch (e) {}
    });
  }

  function clearSceneTimeouts() {
    textTimeouts.forEach((id) => clearTimeout(id));
    textTimeouts = [];
  }

  // Story Sequencer
  function playTextSequence(sceneElement, onComplete) {
    const textEls = sceneElement.querySelectorAll('.story-text');
    const btnWrapper = sceneElement.querySelector('.card-action-btn-wrapper');
    
    // Reset classes
    textEls.forEach((el) => el.classList.remove('active'));
    if (btnWrapper) btnWrapper.classList.remove('visible');

    const delay = 1800; // Time per sentence

    textEls.forEach((el, index) => {
      const tId = setTimeout(() => {
        el.classList.add('active');
        if (index === textEls.length - 1) {
          if (btnWrapper) {
            const btnId = setTimeout(() => {
              btnWrapper.classList.add('visible');
              if (typeof onComplete === 'function') onComplete();
            }, 600);
            textTimeouts.push(btnId);
          }
        }
      }, delay * index);
      textTimeouts.push(tId);
    });
  }

  function setupScene(sceneName) {
    clearSceneTimeouts();
    currentStep = sceneName;

    const overlay = document.getElementById('cardOverlay');
    if (!overlay) return;

    const darkroom = overlay.querySelector('.scene-darkroom');
    const emptyroom = overlay.querySelector('.scene-emptyroom');
    const hallway = overlay.querySelector('.scene-hallway');
    const giftroom = overlay.querySelector('.scene-giftroom');
    const flash = overlay.querySelector('.scene-flash');
    const grandcard = overlay.querySelector('.scene-grandcard');

    if (sceneName === 'darkroom') {
      stopAllCardAudio();
      darkroom.classList.remove('hidden');
      emptyroom.classList.add('hidden');
      hallway.classList.add('hidden');
      giftroom.classList.add('hidden');
      grandcard.classList.add('hidden');
      if (flash) flash.classList.remove('flashing');
      playTextSequence(darkroom);
    } else if (sceneName === 'emptyroom') {
      playSound('switch');
      darkroom.classList.add('hidden');
      emptyroom.classList.remove('hidden');
      playTextSequence(emptyroom);
    } else if (sceneName === 'hallway') {
      playSound('door');
      emptyroom.classList.add('hidden');
      hallway.classList.remove('hidden');
      setTimeout(() => {
        playSound('haunt');
      }, 500);
      playTextSequence(hallway);
    } else if (sceneName === 'giftroom') {
      playSound('door');
      audios.haunt.pause();
      hallway.classList.add('hidden');
      giftroom.classList.remove('hidden');
      playTextSequence(giftroom);
    } else if (sceneName === 'grandcard') {
      audios.haunt.pause();
      playSound('blast');
      
      // Flash explosion
      if (flash) {
        flash.classList.add('flashing');
        setTimeout(() => {
          flash.classList.remove('flashing');
        }, 800);
      }

      giftroom.classList.add('hidden');
      grandcard.classList.remove('hidden');

      // Play celebratory song
      setTimeout(() => {
        playSound('hbd');
      }, 400);

      // Trigger celebratory bursts in global canvases if available
      if (typeof window.burst === 'function' && typeof window.burstFW === 'function') {
        const w = window.innerWidth;
        const h = window.innerHeight;
        window.burst(w / 2, h * 0.35, 120);
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            window.burstFW(Math.random() * w, h * 0.2 + Math.random() * h * 0.4);
          }, i * 350);
        }
      }
    }
  }

  // Public methods on window
  window.openCardExperience = function () {
    const overlay = document.getElementById('cardOverlay');
    if (!overlay) return;

    // Pause main site synthesized music if active
    if (window.playing && typeof window.toggleM === 'function') {
      window.toggleM();
    }

    overlay.style.display = 'block';
    // Force reflow
    void overlay.offsetWidth;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    setupScene('darkroom');
  };

  window.closeCardExperience = function () {
    const overlay = document.getElementById('cardOverlay');
    if (!overlay) return;

    clearSceneTimeouts();
    stopAllCardAudio();

    overlay.classList.remove('active');
    setTimeout(() => {
      overlay.style.display = 'none';
      document.body.style.overflow = '';
    }, 400);
  };

  window.restartCardExperience = function () {
    setupScene('darkroom');
  };

  window.readLetterFromCard = function () {
    window.closeCardExperience();
    setTimeout(() => {
      const letterSection = document.querySelector('.letter-section') || document.querySelector('.card');
      if (letterSection) {
        letterSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 450);
  };

  window.toggleCardAudio = function () {
    isCardMuted = !isCardMuted;
    const btn = document.getElementById('cardAudioToggleBtn');
    if (btn) {
      btn.innerHTML = isCardMuted ? '🔇 Sound Off' : '🔊 Sound On';
    }
    if (isCardMuted) {
      stopAllCardAudio();
    } else {
      if (currentStep === 'hallway') playSound('haunt');
      if (currentStep === 'grandcard') playSound('hbd');
    }
  };

  // Scene Progression Click Handlers
  window.handleCardAction = function (actionType) {
    if (actionType === 'switch') {
      setupScene('emptyroom');
    } else if (actionType === 'door-out') {
      setupScene('hallway');
    } else if (actionType === 'door-in') {
      setupScene('giftroom');
    } else if (actionType === 'gift') {
      setupScene('grandcard');
    }
  };

  // Keyboard accessibility (Escape key to exit)
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      const overlay = document.getElementById('cardOverlay');
      if (overlay && overlay.classList.contains('active')) {
        window.closeCardExperience();
      }
    }
  });

  // URL hash trigger: e.g. #card opens experience directly
  window.addEventListener('DOMContentLoaded', function () {
    if (window.location.hash === '#card') {
      setTimeout(window.openCardExperience, 800);
    }
  });
})();


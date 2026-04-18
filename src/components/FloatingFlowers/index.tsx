'use client';

import { useEffect, useRef } from 'react';
import { playFlowerBurst, FLOWER_SOUNDS, startTheremin, updateTheremin, stopTheremin } from '@/lib/audio';

function getFlowerNum(el: HTMLElement): number {
  for (let i = 1; i <= 6; i++) {
    if (el.classList.contains(`cf-pos-${i}`)) return i;
  }
  return 1;
}

function spawnSparkles(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const symbols = ['✦', '★', '✿', '✨', '♥'];
  const colors = ['#ec4899', '#fde047', '#f97316', '#a78bfa'];

  for (let i = 0; i < 10; i++) {
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle-burst';
    sparkle.textContent = symbols[i % symbols.length];
    sparkle.style.color = colors[i % colors.length];
    const angle = (i / 10) * Math.PI * 2;
    const dist = 40 + Math.random() * 40;
    sparkle.style.left = `${cx}px`;
    sparkle.style.top = `${cy}px`;
    sparkle.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    sparkle.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
    document.body.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 1000);
  }
}

export default function FloatingFlowers() {
  const activeDrag = useRef<{
    el: HTMLElement;
    offsetX: number;
    offsetY: number;
    dragMoved: boolean;
    flowerNum: number;
  } | null>(null);


  // Global drag listeners
  useEffect(() => {
    function onMove(e: MouseEvent | TouchEvent) {
      const drag = activeDrag.current;
      if (!drag) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      drag.dragMoved = true;
      drag.el.style.left = `${clientX - drag.offsetX}px`;
      drag.el.style.top = `${clientY - drag.offsetY}px`;
      const yPct = 1 - (clientY / window.innerHeight);
      const baseFreq = FLOWER_SOUNDS[drag.flowerNum]?.baseFreq || 523;
      updateTheremin(baseFreq * (0.6 + yPct * 1.6));
    }

    function onEnd() {
      const drag = activeDrag.current;
      if (!drag) return;
      drag.el.classList.remove('dragging');
      stopTheremin();
      if (!drag.dragMoved) {
        playFlowerBurst(drag.flowerNum);
        spawnSparkles(drag.el);
      }
      activeDrag.current = null;
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, []);

  function handleFlowerDown(e: React.MouseEvent | React.TouchEvent) {
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    const flowerNum = getFlowerNum(el);

    el.style.position = 'fixed';
    el.style.left = `${rect.left}px`;
    el.style.top = `${rect.top}px`;
    el.style.right = 'auto';
    el.style.bottom = 'auto';
    el.classList.add('dragging');

    activeDrag.current = {
      el,
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top,
      dragMoved: false,
      flowerNum,
    };

    startTheremin(FLOWER_SOUNDS[flowerNum]?.baseFreq || 523);
  }

  return (
    <>
      {/* Botanical background SVGs */}
      <div className="botanical b1">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#ec4899" strokeWidth="2">
          <circle cx="100" cy="100" r="14"/>
          <ellipse cx="100" cy="60" rx="20" ry="34"/>
          <ellipse cx="140" cy="100" rx="34" ry="20"/>
          <ellipse cx="100" cy="140" rx="20" ry="34"/>
          <ellipse cx="60" cy="100" rx="34" ry="20"/>
          <ellipse cx="128" cy="72" rx="14" ry="26" transform="rotate(45 128 72)"/>
          <ellipse cx="128" cy="128" rx="14" ry="26" transform="rotate(-45 128 128)"/>
          <ellipse cx="72" cy="128" rx="14" ry="26" transform="rotate(45 72 128)"/>
          <ellipse cx="72" cy="72" rx="14" ry="26" transform="rotate(-45 72 72)"/>
        </svg>
      </div>
      <div className="botanical b2">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#f97316" strokeWidth="2">
          <path d="M100 100 Q70 70 60 40 Q90 50 100 100" />
          <path d="M100 100 Q130 70 140 40 Q110 50 100 100" />
          <path d="M100 100 Q70 130 60 160 Q90 150 100 100" />
          <path d="M100 100 Q130 130 140 160 Q110 150 100 100" />
          <path d="M100 100 Q60 100 30 110 Q50 80 100 100" />
          <path d="M100 100 Q140 100 170 110 Q150 80 100 100" />
          <circle cx="100" cy="100" r="9"/>
        </svg>
      </div>
      <div className="botanical b3">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#ec4899" strokeWidth="2">
          <ellipse cx="100" cy="60" rx="24" ry="40"/>
          <ellipse cx="135" cy="85" rx="24" ry="40" transform="rotate(60 135 85)"/>
          <ellipse cx="135" cy="125" rx="24" ry="40" transform="rotate(120 135 125)"/>
          <ellipse cx="100" cy="150" rx="24" ry="40"/>
          <ellipse cx="65" cy="125" rx="24" ry="40" transform="rotate(60 65 125)"/>
          <ellipse cx="65" cy="85" rx="24" ry="40" transform="rotate(120 65 85)"/>
          <circle cx="100" cy="105" r="14"/>
        </svg>
      </div>
      <div className="botanical b4">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#f97316" strokeWidth="2">
          <path d="M100 30 Q80 60 100 90 Q120 60 100 30"/>
          <path d="M100 50 Q70 80 100 110 Q130 80 100 50"/>
          <path d="M100 70 Q60 100 100 130 Q140 100 100 70"/>
          <path d="M100 90 Q50 120 100 150 Q150 120 100 90"/>
        </svg>
      </div>
      <div className="botanical b5">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#ec4899" strokeWidth="2">
          <circle cx="100" cy="100" r="11"/>
          <ellipse cx="100" cy="65" rx="16" ry="30"/>
          <ellipse cx="135" cy="100" rx="30" ry="16"/>
          <ellipse cx="100" cy="135" rx="16" ry="30"/>
          <ellipse cx="65" cy="100" rx="30" ry="16"/>
        </svg>
      </div>

      {/* Flower 1 */}
      <div className="click-flower cf-pos-1" onMouseDown={handleFlowerDown} onTouchStart={handleFlowerDown}>
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="50" cy="22" rx="14" ry="22" fill="#ec4899" stroke="#2a2418" strokeWidth="2.5"/>
          <ellipse cx="78" cy="50" rx="22" ry="14" fill="#ec4899" stroke="#2a2418" strokeWidth="2.5"/>
          <ellipse cx="50" cy="78" rx="14" ry="22" fill="#ec4899" stroke="#2a2418" strokeWidth="2.5"/>
          <ellipse cx="22" cy="50" rx="22" ry="14" fill="#ec4899" stroke="#2a2418" strokeWidth="2.5"/>
          <circle cx="50" cy="50" r="11" fill="#fde047" stroke="#2a2418" strokeWidth="2.5"/>
        </svg>
      </div>

      {/* Flower 2 */}
      <div className="click-flower cf-pos-2" onMouseDown={handleFlowerDown} onTouchStart={handleFlowerDown}>
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="50" cy="22" rx="13" ry="20" fill="#db2777" stroke="#2a2418" strokeWidth="2.5"/>
          <ellipse cx="76" cy="36" rx="13" ry="20" fill="#db2777" stroke="#2a2418" strokeWidth="2.5" transform="rotate(60 76 36)"/>
          <ellipse cx="76" cy="64" rx="13" ry="20" fill="#db2777" stroke="#2a2418" strokeWidth="2.5" transform="rotate(120 76 64)"/>
          <ellipse cx="50" cy="78" rx="13" ry="20" fill="#db2777" stroke="#2a2418" strokeWidth="2.5"/>
          <ellipse cx="24" cy="64" rx="13" ry="20" fill="#db2777" stroke="#2a2418" strokeWidth="2.5" transform="rotate(60 24 64)"/>
          <ellipse cx="24" cy="36" rx="13" ry="20" fill="#db2777" stroke="#2a2418" strokeWidth="2.5" transform="rotate(120 24 36)"/>
          <circle cx="50" cy="50" r="10" fill="#fde047" stroke="#2a2418" strokeWidth="2.5"/>
        </svg>
      </div>

      {/* Flower 3 */}
      <div className="click-flower cf-pos-3" onMouseDown={handleFlowerDown} onTouchStart={handleFlowerDown}>
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 8 Q70 25 70 45 Q70 60 50 55 Q30 60 30 45 Q30 25 50 8" fill="#ec4899" stroke="#2a2418" strokeWidth="2.5"/>
          <path d="M92 50 Q75 70 55 70 Q40 70 45 50 Q40 30 55 30 Q75 30 92 50" fill="#ec4899" stroke="#2a2418" strokeWidth="2.5"/>
          <path d="M50 92 Q30 75 30 55 Q30 40 50 45 Q70 40 70 55 Q70 75 50 92" fill="#ec4899" stroke="#2a2418" strokeWidth="2.5"/>
          <path d="M8 50 Q25 30 45 30 Q60 30 55 50 Q60 70 45 70 Q25 70 8 50" fill="#ec4899" stroke="#2a2418" strokeWidth="2.5"/>
          <circle cx="50" cy="50" r="12" fill="#fde047" stroke="#2a2418" strokeWidth="2.5"/>
        </svg>
      </div>

      {/* Flower 4 */}
      <div className="click-flower cf-pos-4" onMouseDown={handleFlowerDown} onTouchStart={handleFlowerDown}>
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="50" cy="22" rx="14" ry="22" fill="#f472b6" stroke="#2a2418" strokeWidth="2.5"/>
          <ellipse cx="78" cy="50" rx="22" ry="14" fill="#f472b6" stroke="#2a2418" strokeWidth="2.5"/>
          <ellipse cx="50" cy="78" rx="14" ry="22" fill="#f472b6" stroke="#2a2418" strokeWidth="2.5"/>
          <ellipse cx="22" cy="50" rx="22" ry="14" fill="#f472b6" stroke="#2a2418" strokeWidth="2.5"/>
          <circle cx="50" cy="50" r="11" fill="#fde047" stroke="#2a2418" strokeWidth="2.5"/>
        </svg>
      </div>

      {/* Flower 5 */}
      <div className="click-flower cf-pos-5" onMouseDown={handleFlowerDown} onTouchStart={handleFlowerDown}>
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="50" cy="22" rx="13" ry="20" fill="#ec4899" stroke="#2a2418" strokeWidth="2.5"/>
          <ellipse cx="76" cy="36" rx="13" ry="20" fill="#ec4899" stroke="#2a2418" strokeWidth="2.5" transform="rotate(60 76 36)"/>
          <ellipse cx="76" cy="64" rx="13" ry="20" fill="#ec4899" stroke="#2a2418" strokeWidth="2.5" transform="rotate(120 76 64)"/>
          <ellipse cx="50" cy="78" rx="13" ry="20" fill="#ec4899" stroke="#2a2418" strokeWidth="2.5"/>
          <ellipse cx="24" cy="64" rx="13" ry="20" fill="#ec4899" stroke="#2a2418" strokeWidth="2.5" transform="rotate(60 24 64)"/>
          <ellipse cx="24" cy="36" rx="13" ry="20" fill="#ec4899" stroke="#2a2418" strokeWidth="2.5" transform="rotate(120 24 36)"/>
          <circle cx="50" cy="50" r="10" fill="#fde047" stroke="#2a2418" strokeWidth="2.5"/>
        </svg>
      </div>

      {/* Flower 6 */}
      <div className="click-flower cf-pos-6" onMouseDown={handleFlowerDown} onTouchStart={handleFlowerDown}>
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="50" cy="22" rx="14" ry="22" fill="#db2777" stroke="#2a2418" strokeWidth="2.5"/>
          <ellipse cx="78" cy="50" rx="22" ry="14" fill="#db2777" stroke="#2a2418" strokeWidth="2.5"/>
          <ellipse cx="50" cy="78" rx="14" ry="22" fill="#db2777" stroke="#2a2418" strokeWidth="2.5"/>
          <ellipse cx="22" cy="50" rx="22" ry="14" fill="#db2777" stroke="#2a2418" strokeWidth="2.5"/>
          <circle cx="50" cy="50" r="11" fill="#fde047" stroke="#2a2418" strokeWidth="2.5"/>
        </svg>
      </div>

    </>
  );
}

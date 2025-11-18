/* global React, ReactDOM, htm */
const { useState, useEffect, useCallback, Fragment } = React;
const html = htm.bind(React.createElement);

// ==================== 공통 유틸리티 ====================

const shuffleArray = (list) => {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// ==================== 공통 컴포넌트 ====================

const Icon = ({ path, extra }) =>
  html`<svg xmlns="http://www.w3.org/2000/svg" className=${extra} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d=${path} />
  </svg>`;

function Block({ block, onDragStart, isGhost = false, index, totalBlocks, onQuickAction, quickActionLabel, iconPath, onTimeChange }) {
  const stackPath = 'M 0 0 H 80 V 5 H 100 V 0 H 200 V 45 H 100 V 50 H 80 V 45 H 0 Z';
  const colorMap = {
    'bg-cyan-500': 'fill-cyan-500',
    'bg-cyan-600': 'fill-cyan-600',
    'bg-emerald-500': 'fill-emerald-500',
    'bg-emerald-600': 'fill-emerald-600',
    'bg-amber-500': 'fill-amber-500',
    'bg-rose-500': 'fill-rose-500',
    'bg-orange-500': 'fill-orange-500',
    'bg-purple-500': 'fill-purple-500',
    'bg-blue-500': 'fill-blue-500',
    'bg-green-500': 'fill-green-500',
    'bg-red-500': 'fill-red-500',
    'bg-pink-500': 'fill-pink-500',
    'bg-gray-500': 'fill-gray-500',
  };

  const style = {
    filter: 'drop-shadow(0 2px 2px rgb(0 0 0 / 0.2))',
    zIndex: typeof index === 'number' && typeof totalBlocks === 'number' ? totalBlocks - index : undefined,
  };

  const handleQuickAction = (e) => {
    if (!onQuickAction) return;
    e.preventDefault();
    e.stopPropagation();
    onQuickAction();
  };

  const handleTimeClick = (e) => {
    if (!onTimeChange) return;
    e.preventDefault();
    e.stopPropagation();
    onTimeChange();
  };

  return html`
    <div
      id=${block.id}
      draggable="true"
      onDragStart=${onDragStart}
      onDoubleClick=${onQuickAction ? handleQuickAction : undefined}
      className=${`relative h-[50px] ${typeof index === 'number' ? '-mt-[5px]' : 'my-1'} cursor-grab active:cursor-grabbing font-bold transition-all duration-200 transform hover:scale-105 ${isGhost ? 'opacity-50' : ''}`}
      style=${style}
    >
      <svg viewBox="0 0 200 50" className="absolute w-full h-full" preserveAspectRatio="none">
        <path d=${stackPath} className=${colorMap[block.color]} />
      </svg>
      <div className="absolute inset-0 flex items-center pl-6 ${onQuickAction ? 'pr-12' : 'pr-4'} text-white gap-2">
        ${iconPath ? html`<${Icon} path=${iconPath} extra="h-6 w-6" />` : null}
        <span className="flex-1 truncate">${block.text}</span>
      </div>
      ${onTimeChange
        ? html`
            <button
              type="button"
              className="absolute right-${onQuickAction ? '10' : '2'} top-1/2 -translate-y-1/2 bg-white/90 text-pink-600 text-xs font-bold px-1.5 py-0.5 rounded shadow-sm hover:bg-white border border-pink-300"
              onClick=${handleTimeClick}
              title="클릭하여 시간 선택"
            >
              ⏱️
            </button>
          `
        : null}
      ${onQuickAction
        ? html`
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 text-gray-800 text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm hover:bg-white"
              onClick=${handleQuickAction}
            >
              ${quickActionLabel}
            </button>
          `
        : null}
    </div>
  `;
}

function BlockPalette({ blocks, onDragStart, onDrop, onQuickAdd, iconPaths, onTimeChange }) {
  const handleDragOver = (e) => e.preventDefault();
  return html`
    <div
      onDrop=${onDrop}
      onDragOver=${handleDragOver}
      className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4 border-2 border-gray-200 h-full flex flex-col min-h-[500px]"
    >
      <div className="flex items-center justify-between border-b-2 pb-2 mb-2 flex-shrink-0">
        <h2 className="text-2xl font-bold text-gray-800">블록 꾸러미</h2>
        <span className="text-xs text-gray-500">더블클릭 또는 버튼으로 추가</span>
      </div>
      <div className="flex-grow overflow-y-auto p-2">
        ${blocks.length
          ? blocks.map((block, idx) =>
              html`<${Block}
                key=${block.id + '-' + idx}
                block=${block}
                onDragStart=${(e) => onDragStart(e, block.id)}
                onQuickAction=${() => onQuickAdd(block.id)}
                quickActionLabel="＋"
                iconPath=${iconPaths ? iconPaths[block.id] : null}
                onTimeChange=${block.id === 'waitBoil' && onTimeChange ? () => onTimeChange(idx) : null}
              />`,
            )
          : html`<div className="flex items-center justify-center h-full text-gray-500">
              <p>모든 블록을 사용했어요!</p>
            </div>`}
      </div>
    </div>
  `;
}

function ExecutionSequence({ blocks, onDragStart, onDrop, onExecute, onReset, onQuickRemove, iconPaths, onTimeChange, executeLabel = "실행하기! 🚀", showStartBlock = false, startBlockText = "등교하기 버튼을 눌렀을 때", startBlockColor = "green" }) {
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    const blockId = e.dataTransfer.getData('blockId');
    if (!blockId) return;

    const dropZone = e.currentTarget;
    const draggableElements = Array.from(dropZone.querySelectorAll('[draggable="true"]'));

    if (draggableElements.length === 0) {
      setDragOverIndex(0);
      return;
    }

    const mouseY = e.clientY;
    let newIndex = draggableElements.length;

    for (let i = 0; i < draggableElements.length; i++) {
      const child = draggableElements[i];
      const rect = child.getBoundingClientRect();
      const midY = rect.top + (50 - 5) / 2;
      if (mouseY < midY) {
        newIndex = i;
        break;
      }
    }
    setDragOverIndex(newIndex);
  };

  const handleDragLeave = () => setDragOverIndex(null);

  const handleDrop = (e) => {
    e.preventDefault();
    const blockId = e.dataTransfer.getData('blockId');
    if (!blockId) {
      setDragOverIndex(null);
      return;
    }

    const dropZone = e.currentTarget;
    const draggableElements = Array.from(dropZone.querySelectorAll('[draggable="true"]'));

    let targetIndex = draggableElements.length;
    if (draggableElements.length === 0) {
      targetIndex = 0;
    } else {
      const mouseY = e.clientY;
      for (let i = 0; i < draggableElements.length; i++) {
        const child = draggableElements[i];
        const rect = child.getBoundingClientRect();
        const midY = rect.top + (50 - 5) / 2;
        if (mouseY < midY) {
          targetIndex = i;
          break;
        }
      }
    }

    onDrop(blockId, targetIndex);
    setDragOverIndex(null);
  };

  const DropIndicator = () => html`<div className="h-2 my-1 bg-blue-400 rounded-full" />`;

  const StartBlock = () => {
    const hatPath = 'M 0 10 C 0 0, 200 0, 200 10 V 45 H 100 V 50 H 80 V 45 H 0 Z';
    const colorMap = {
      green: { fill: 'fill-green-500', iconColor: 'text-green-600' },
      orange: { fill: 'fill-orange-500', iconColor: 'text-orange-600' },
      blue: { fill: 'fill-blue-500', iconColor: 'text-blue-600' },
    };
    const colors = colorMap[startBlockColor] || colorMap.green;

    return html`
      <div className="relative h-[50px]" style=${{ filter: 'drop-shadow(0 2px 2px rgb(0 0 0 / 0.2))', zIndex: 50 }}>
        <svg viewBox="0 0 200 50" className="absolute w-full h-full" preserveAspectRatio="none">
          <path d=${hatPath} className=${colors.fill} />
        </svg>
        <div className="absolute inset-0 flex items-center text-white font-bold pl-3">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-2 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className=${`h-5 w-5 ${colors.iconColor}`} fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8.002v3.996a1 1 0 001.555.832l3.197-2a1 1 0 000-1.664l-3.197-2z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <span>${startBlockText}</span>
        </div>
      </div>
    `;
  };

  return html`
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4 border-2 border-gray-200 h-full flex flex-col min-h-[500px]">
      <div className="border-b-2 pb-2 mb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">
            ${showStartBlock ? html`나의 ${startBlockColor === 'orange' ? '라면 끓이기' : '등교'} 절차 <span key="block-count" className="text-base font-normal text-gray-500 ml-2">(블록: ${blocks.length}개)</span>` : '실행 순서'}
          </h2>
          ${showStartBlock ? html`<span className="text-xs text-gray-500">더블클릭으로 되돌릴 수 있어요</span>` : null}
        </div>
        ${showStartBlock
          ? html`<p className="text-sm text-gray-500 mt-2">
              블록 꾸러미에서 원하는 블록을 <strong className="text-gray-700">드래그 & 드롭</strong>해 점선 영역에 연결해 보세요.
            </p>`
          : null}
      </div>
      <div
        onDrop=${handleDrop}
        onDragOver=${handleDragOver}
        onDragLeave=${handleDragLeave}
        className=${`flex-grow overflow-y-auto p-${showStartBlock ? '6' : '2'} min-h-[300px] border-2 border-dashed ${showStartBlock ? (startBlockColor === 'orange' ? 'border-orange-200 bg-orange-50' : 'border-blue-200 bg-sky-50') : 'border-gray-300'} rounded-lg relative`}
        style=${showStartBlock ? {
          backgroundImage: startBlockColor === 'orange'
            ? 'radial-gradient(circle, rgba(249,115,22,0.18) 2px, transparent 2px)'
            : 'radial-gradient(circle, rgba(59,130,246,0.18) 2px, transparent 2px)',
          backgroundSize: '22px 22px',
        } : {}}
      >
        ${showStartBlock ? html`<${StartBlock} />` : null}
        ${blocks.length === 0 && dragOverIndex === 0 && showStartBlock ? html`<${DropIndicator} key=${'drop-0'} />` : null}
        ${blocks.length === 0 && !showStartBlock
          ? html`
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>블록을 여기로 드래그하세요</p>
              </div>
            `
          : blocks.map((block, idx) =>
              showStartBlock
                ? html`<${Fragment} key=${`${block.id}-${idx}`}>
                    ${dragOverIndex === idx ? html`<${DropIndicator} key=${'drop-' + idx} />` : null}
                    <${Block}
                      key=${`block-${block.id}-${idx}`}
                      block=${block}
                      index=${idx}
                      totalBlocks=${blocks.length}
                      onDragStart=${(e) => onDragStart(e, block.id, idx)}
                      onQuickAction=${() => onQuickRemove(idx)}
                      quickActionLabel="↩"
                      iconPath=${iconPaths ? iconPaths[block.id] : null}
                      onTimeChange=${block.id === 'waitBoil' && onTimeChange ? () => onTimeChange(idx) : null}
                    />
                  </>`
                : html`<${Block}
                    key=${`${block.id}-${idx}`}
                    block=${block}
                    index=${idx}
                    totalBlocks=${blocks.length}
                    onDragStart=${(e) => onDragStart(e, block.id, idx)}
                    onQuickAction=${() => onQuickRemove(idx)}
                    quickActionLabel="✕"
                    iconPath=${iconPaths ? iconPaths[block.id] : null}
                    onTimeChange=${block.id === 'waitBoil' && onTimeChange ? () => onTimeChange(idx) : null}
                  />`
            )}
        ${dragOverIndex === blocks.length && showStartBlock ? html`<${DropIndicator} key=${'drop-end'} />` : null}
        ${blocks.length === 0 && dragOverIndex === null && showStartBlock
          ? html`<div className="flex items-center justify-center h-full text-gray-400 text-center">
              <p className="p-4">왼쪽 꾸러미에서<br />블록을 가져와<br />여기에 연결하세요!</p>
            </div>`
          : null}
        ${dragOverIndex !== null && !showStartBlock
          ? html`
              <div
                className="absolute left-2 right-2 h-1 bg-blue-500 rounded-full"
                style=${{ top: `${dragOverIndex * 45 + 10}px` }}
              />
            `
          : null}
      </div>
      <div className="flex gap-2 mt-4 flex-shrink-0">
        <button
          onClick=${onExecute}
          className=${`flex-1 ${showStartBlock ? (startBlockColor === 'orange' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700') : 'bg-gradient-to-r from-blue-500 to-purple-600'} text-white px-6 py-3 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105`}
        >
          ${executeLabel}
        </button>
        <button
          onClick=${onReset}
          className=${`${showStartBlock ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-500'} text-white px-6 py-3 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105`}
        >
          ${showStartBlock ? '처음부터' : '초기화'}
        </button>
      </div>
    </div>
  `;
}

// ==================== 라면 끓이기 게임 ====================

const RAMEN_BLOCKS = {
  water: { id: 'water', text: '냄비에 물 받기', color: 'bg-blue-500' },
  fire: { id: 'fire', text: '냄비에 불켜기', color: 'bg-red-500' },
  waitBoil: { id: 'waitBoil', text: '30초 기다리기', color: 'bg-pink-500', seconds: 30 },
  noodle: { id: 'noodle', text: '면 넣기', color: 'bg-orange-500' },
  soup: { id: 'soup', text: '스프 넣기', color: 'bg-green-500' },
  fireOff: { id: 'fireOff', text: '불끄기', color: 'bg-gray-500' },
};

// 시간 설정 옵션: 30초 단위로 30초 ~ 4분 (240초)
const TIME_OPTIONS = [30, 60, 90, 120, 150, 180, 210, 240];

// 시간을 텍스트로 변환하는 함수
const formatTimeText = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes > 0 && secs > 0) {
    return `${minutes}분 ${secs}초 기다리기`;
  } else if (minutes > 0) {
    return `${minutes}분 기다리기`;
  } else {
    return `${secs}초 기다리기`;
  }
};

// 시간 선택 모달
function TimeSelectModal({ isOpen, onClose, onSelect, currentSeconds }) {
  if (!isOpen) return null;

  return html`
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick=${onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full" onClick=${(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">⏱️ 시간 선택하기</h2>
        <p className="text-sm text-gray-600 mb-6 text-center">원하는 시간을 선택해주세요</p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          ${TIME_OPTIONS.map(seconds => {
            const isSelected = seconds === currentSeconds;
            return html`
              <button
                key=${seconds}
                onClick=${() => onSelect(seconds)}
                className=${`py-4 px-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${
                  isSelected
                    ? 'bg-pink-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-pink-100'
                }`}
              >
                ${formatTimeText(seconds)}
              </button>
            `;
          })}
        </div>

        <button
          onClick=${onClose}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-bold transition-all"
        >
          취소
        </button>
      </div>
    </div>
  `;
}

const RAMEN_INITIAL_PALETTE = [
  RAMEN_BLOCKS.water,
  RAMEN_BLOCKS.fire,
  { ...RAMEN_BLOCKS.waitBoil, seconds: 30, text: '30초 기다리기' }, // 기다리기 블록 1
  { ...RAMEN_BLOCKS.waitBoil, seconds: 30, text: '30초 기다리기' }, // 기다리기 블록 2
  RAMEN_BLOCKS.noodle,
  RAMEN_BLOCKS.soup,
  RAMEN_BLOCKS.fireOff,
];

const getResultImage = (resultType) => {
  const imageMap = {
    'empty': './images/ramen/emptybowl.png',
    'incomplete': './images/ramen/emptybowl.png',
    'cold': './images/ramen/coldramensouprawnoodlebowl.png',
    'no_noodle': './images/ramen/hotsoupbowl.png',
    'no_soup': './images/ramen/hotwaterramenbowl.png',
    'burned': './images/ramen/burntrawnoodlesouppot.png',
    'useless_wait': './images/ramen/coldramensouprawnoodlebowl.png',
    'imperfect_success': './images/ramen/finishedramen.png',
    'very_undercooked': './images/ramen/hotsouprawnoodlebowl.png',
    'undercooked': './images/ramen/finishedramen.png',
    'overcooked': './images/ramen/finishedramen.png',
    'late_soup': './images/ramen/finishedramen.png',
    'soup_after_fireoff': './images/ramen/finishedramen.png',
    'perfect': './images/ramen/finishedramen.png',
  };

  return imageMap[resultType] || './images/ramen/emptypot.png';
};

const evaluateRamen = (sequence) => {
  const seqIds = sequence.map((b) => b.id);
  const indexOf = (id) => seqIds.indexOf(id);
  const has = (id) => seqIds.includes(id);

  const waterIdx = indexOf('water');
  const fireIdx = indexOf('fire');
  const noodleIdx = indexOf('noodle');
  const soupIdx = indexOf('soup');
  const fireOffIdx = indexOf('fireOff');

  // 아무것도 안 했을 때
  if (sequence.length === 0) {
    return {
      success: false,
      message: '🍜 라면을 만들지 않았어요!',
      description: '블록을 조립해서 라면을 끓여보세요!',
      emoji: '🤔',
      resultType: 'empty'
    };
  }

  // 필수 재료 체크 (순서를 맨 앞으로 이동)
  if (!has('water')) {
    return {
      success: false,
      message: '💧 물이 없어요!',
      description: '물 없이는 라면을 끓일 수 없어요!',
      emoji: '😰',
      resultType: 'incomplete'
    };
  }

  if (!has('fire')) {
    return {
      success: false,
      message: '❄️ 차가운 라면!',
      description: '불을 켜지 않아서 차가운 물에 그냥 면을 담갔어요!',
      emoji: '🥶',
      resultType: 'cold'
    };
  }

  if (!has('noodle')) {
    return {
      success: false,
      message: '🥤 스프물이에요!',
      description: '면이 없으면 라면이 아니라 그냥 스프물이에요!',
      emoji: '😅',
      resultType: 'no_noodle'
    };
  }

  if (!has('soup')) {
    return {
      success: false,
      message: '😐 간이 안 된 라면!',
      description: '스프를 넣지 않아서 맛이 없어요!',
      emoji: '🙁',
      resultType: 'no_soup'
    };
  }

  // 순서 체크
  if (fireIdx < waterIdx) {
    // 냄비가 탔지만, 이후에 물/면/스프를 넣었는지 확인
    // 타버린 냄비에 재료를 넣은 상황
    return {
      success: false,
      message: '🔥 냄비가 타버렸어요!',
      description: '물을 넣기 전에 불을 켜서 냄비가 타버렸어요!',
      emoji: '💥',
      resultType: 'burned'
    };
  }

  if (noodleIdx < fireIdx) {
    return {
      success: false,
      message: '🥶 차가운 면!',
      description: '불을 켜기 전에 면을 넣어서 딱딱한 차가운 면이에요!',
      emoji: '🥶',
      resultType: 'cold'
    };
  }

  if (has('fireOff') && fireOffIdx < noodleIdx) {
    return {
      success: false,
      message: '❄️ 불을 너무 일찍 껐어요!',
      description: '면을 넣기도 전에 불을 꺼서 차가운 라면이 됐어요!',
      emoji: '🥶',
      resultType: 'cold'
    };
  }

  // 3분 체크 (초 단위로 계산)
  if (has('noodle')) {
    const noodlePos = indexOf('noodle');
    const waterPos = indexOf('water');
    const firePos = indexOf('fire');

    // 면 넣은 후 기다린 시간 (면 익히기)
    let secondsAfterNoodle = 0;
    if (has('fireOff')) {
      // 불을 끈 경우: 면 넣은 후 ~ 불 끄기 전까지만 카운트
      const fireOffPos = indexOf('fireOff');
      sequence.slice(noodlePos + 1, fireOffPos).forEach(block => {
        if (block.id === 'waitBoil') secondsAfterNoodle += (block.seconds || 30);
      });
    } else {
      // 불을 안 끈 경우: 면 넣은 후 끝까지 카운트
      sequence.slice(noodlePos + 1).forEach(block => {
        if (block.id === 'waitBoil') secondsAfterNoodle += (block.seconds || 30);
      });
    }

    // 물 + 불 후 ~ 면 넣기 전까지 기다린 시간 (물 끓이기)
    const boilingStart = Math.max(waterPos, firePos);
    let secondsForBoiling = 0;
    sequence.slice(boilingStart + 1, noodlePos).forEach(block => {
      if (block.id === 'waitBoil') secondsForBoiling += (block.seconds || 30);
    });

    // 의미 없는 곳에 기다리기 블록 사용 체크
    // 1. 물 받기 전 기다림
    let secondsBeforeWater = 0;
    sequence.slice(0, waterPos).forEach(block => {
      if (block.id === 'waitBoil') secondsBeforeWater += (block.seconds || 30);
    });

    // 2. 불 켜기 전 기다림 (물 받은 후 ~ 불 켜기 전)
    let secondsBeforeFire = 0;
    if (waterPos < firePos) {
      sequence.slice(waterPos + 1, firePos).forEach(block => {
        if (block.id === 'waitBoil') secondsBeforeFire += (block.seconds || 30);
      });
    }

    // 3. 불 끈 후 기다림
    let secondsAfterFireOff = 0;
    if (has('fireOff')) {
      sequence.slice(indexOf('fireOff') + 1).forEach(block => {
        if (block.id === 'waitBoil') secondsAfterFireOff += (block.seconds || 30);
      });
    }

    const uselessSeconds = secondsBeforeWater + secondsBeforeFire + secondsAfterFireOff;

    // 의미 없는 곳에 기다리기 블록을 사용한 경우
    if (uselessSeconds > 0) {
      return {
        success: false,
        message: '⏰ 쓸데없이 기다렸어요!',
        description: `라면 끓이는 것과 상관없는 타이밍에 ${uselessSeconds}초나 기다렸어요! 기다리기 블록은 물을 끓이거나 면을 익힐 때만 사용해야 해요!`,
        emoji: '😅',
        resultType: 'useless_wait'
      };
    }

    // 물을 끓이지 않고 바로 면을 넣은 경우 (비완벽하지만 성공 가능)
    if (secondsForBoiling === 0 && secondsAfterNoodle === 180) {
      return {
        success: true,
        message: '🍜 라면 완성!',
        description: '라면이 완성됐어요! 하지만... 물이 끓기 전에 면을 넣었던 거 같아요. 더 맛있게 만드는 방법이 있을 거예요!',
        emoji: '🍜',
        resultType: 'imperfect_success',
      };
    }

    // 면이 설익은 경우
    if (secondsAfterNoodle < 180) {
      const remainingTime = 180 - secondsAfterNoodle;
      // 너무 짧게 익힌 경우 (60초 이하) - 생면으로 표현
      if (secondsAfterNoodle <= 60) {
        return {
          success: false,
          message: '😣 면이 설익었어요!',
          description: `면을 ${secondsAfterNoodle}초만 끓였어요! ${remainingTime}초 더 기다려야 해요! 딱딱해요!`,
          emoji: '😖',
          resultType: 'very_undercooked',
          cookedTime: secondsAfterNoodle,
          remainingTime
        };
      }
      // 어느 정도 익었지만 덜 익은 경우 (60초 초과) - 익은 라면으로 표현
      return {
        success: false,
        message: '😣 면이 설익었어요!',
        description: `면을 ${secondsAfterNoodle}초만 끓였어요! ${remainingTime}초 더 기다려야 해요! 딱딱해요!`,
        emoji: '😖',
        resultType: 'undercooked',
        cookedTime: secondsAfterNoodle,
        remainingTime
      };
    }

    // 면이 불은 경우
    if (secondsAfterNoodle > 180) {
      const extraTime = secondsAfterNoodle - 180;
      return {
        success: false,
        message: '😭 라면이 불었어요!',
        description: `면을 ${secondsAfterNoodle}초나 끓였어요! ${extraTime}초 더 끓여서 라면이 불어버렸어요!`,
        emoji: '💦',
        resultType: 'overcooked',
        cookedTime: secondsAfterNoodle,
        extraTime
      };
    }

    // secondsAfterNoodle === 180인 경우는 아래로 계속 진행 (스프 체크 등)
  }

  // 스프를 너무 늦게 넣은 경우 체크 (면 넣고 3분 끓인 후 스프 넣기)
  if (has('noodle') && has('soup')) {
    const noodlePos = indexOf('noodle');
    const soupPos = indexOf('soup');
    const fireOffPos = indexOf('fireOff');

    // 면 넣은 후 스프 넣기 전까지 기다린 시간 (초 단위)
    let secondsBeforeSoup = 0;
    sequence.slice(noodlePos + 1, soupPos).forEach(block => {
      if (block.id === 'waitBoil') secondsBeforeSoup += (block.seconds || 30);
    });

    // 스프를 면 넣고 180초(3분) 기다린 후에 넣은 경우 (너무 늦음)
    if (secondsBeforeSoup >= 180 && soupPos < fireOffPos) {
      return {
        success: true,
        message: '🍜 라면 완성!',
        description: '라면이 완성됐어요! 하지만... 스프가 뭉쳐있어요. 면에 스프 맛이 잘 스며들지 않았어요!',
        emoji: '🍜',
        resultType: 'late_soup',
      };
    }

    // 불을 끈 후에 스프를 넣은 경우
    if (has('fireOff') && soupPos > fireOffPos) {
      return {
        success: false,
        message: '🧊 차가운 스프!',
        description: '불을 끈 후에 스프를 넣어서 스프가 차갑게 녹지 않았어요! 스프는 뜨거울 때 넣어야 해요!',
        emoji: '❄️',
        resultType: 'soup_after_fireoff'
      };
    }
  }

  // 모든 조건 통과!
  return {
    success: true,
    message: '🎉 완벽한 라면 완성!',
    description: '맛있는 라면이 완성됐어요! 3분 동안 완벽하게 끓였어요!',
    emoji: '🍜',
    resultType: 'perfect'
  };
};

const determineRamenState = (sequence) => {
  const ids = sequence.map((b) => b.id);
  const has = (id) => ids.includes(id);

  // 라면 봉지 상태: 기본, 물, 끓는물, 조리중, 완성
  if (has('noodle')) {
    const noodleIdx = ids.indexOf('noodle');
    const waitsAfterNoodle = ids.slice(noodleIdx + 1).filter(id => id === 'waitBoil').length;

    if (waitsAfterNoodle >= 6) {
      return 'cooked'; // 완성된 라면 (3분 이상)
    } else {
      return 'cooking'; // 조리 중
    }
  } else if (has('waitBoil') || has('fire')) {
    return 'boiling'; // 끓는 물
  } else if (has('water')) {
    return 'water'; // 물만
  } else {
    return 'package'; // 라면 봉지
  }
};

function RamenDisplay({ sequence, isAnimating }) {
  const state = determineRamenState(sequence);

  const getDisplayContent = () => {
    let imagePath = '';

    switch(state) {
      case 'package':
        imagePath = './images/ramen/emptypot.png';
        return {
          imagePath,
          title: '라면 봉지',
          bgColor: 'bg-orange-100',
          borderColor: 'border-orange-300'
        };
      case 'water':
        imagePath = './images/ramen/coldwaterfilledpot.png';
        return {
          imagePath,
          title: '냄비에 물',
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-300'
        };
      case 'boiling':
        imagePath = './images/ramen/boilingwaterfilledpot.png';
        return {
          imagePath,
          title: '끓는 물',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-300'
        };
      case 'cooking':
        imagePath = './images/ramen/cookingpot.png';
        return {
          imagePath,
          title: '조리 중',
          bgColor: 'bg-yellow-100',
          borderColor: 'border-yellow-300'
        };
      case 'cooked':
        imagePath = './images/ramen/finishedramen.png';
        return {
          imagePath,
          title: '완성!',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-300'
        };
      default:
        imagePath = './images/ramen/emptypot.png';
        return {
          imagePath,
          title: '라면 봉지',
          bgColor: 'bg-orange-100',
          borderColor: 'border-orange-300'
        };
    }
  };

  const content = getDisplayContent();

  return html`
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border-2 border-orange-200 flex flex-col items-center w-full h-full">
      <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3 mb-4 w-full">
        <p className="text-base font-bold text-orange-700 text-center">
          ⏱️ 3분 동안 끓여야 해요!
        </p>
      </div>
      <div className=${`w-full flex-grow flex flex-col items-center justify-center rounded-xl p-8 ${content.bgColor} border-4 ${content.borderColor}`}>
        <img src=${content.imagePath} alt=${content.title} className="w-full h-full object-contain" />
      </div>
      ${isAnimating
        ? html`<p className="text-xs text-orange-500 mt-4 animate-pulse">조리 중... 🔥</p>`
        : null}
    </div>
  `;
}

function RamenResultModal({ isOpen, onClose, result, animationFrames, isDebugMode }) {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    if (!isOpen || !animationFrames || animationFrames.length === 0) return;
    setFrameIndex(0);
    if (animationFrames.length <= 1) return;

    let idx = 1;
    const timer = setInterval(() => {
      setFrameIndex(idx);
      idx += 1;
      if (idx >= animationFrames.length) {
        clearInterval(timer);
      }
    }, 800);
    return () => clearInterval(timer);
  }, [isOpen, animationFrames]);

  if (!isOpen || !result) return null;

  const currentSequence = animationFrames && animationFrames[frameIndex] ? animationFrames[frameIndex] : [];
  const currentState = determineRamenState(currentSequence);

  // Get image for current animation frame
  const getCurrentFrameImage = () => {
    switch(currentState) {
      case 'package': return './images/ramen/emptypot.png';
      case 'water': return './images/ramen/coldwaterfilledpot.png';
      case 'boiling': return './images/ramen/boilingwaterfilledpot.png';
      case 'cooking': return './images/ramen/cookingpot.png';
      case 'cooked': return './images/ramen/finishedramen.png';
      default: return './images/ramen/emptypot.png';
    }
  };

  const isAnimating = frameIndex < (animationFrames?.length || 0) - 1;
  const finalImage = getResultImage(result.resultType);
  const displayImage = isAnimating ? getCurrentFrameImage() : finalImage;

  return html`
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className=${`bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full border-4 ${result.success ? 'border-green-500' : 'border-red-500'}`}>
        <div className="text-center mb-6">
          <div className="relative">
            <img
              src=${displayImage}
              alt=${result.message}
              className="w-64 h-64 object-contain mx-auto mb-4"
            />
            ${isAnimating
              ? html`<div className="absolute top-2 right-2 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                  조리 중... 🔥
                </div>`
              : null}
          </div>
          <h2 className=${`text-3xl font-bold mb-4 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
            ${result.message}
          </h2>
          <p className="text-xl text-gray-700 leading-relaxed">
            ${result.description}
          </p>
        </div>
        ${result.success
          ? html`
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6 text-center">
                <p className="text-green-700 text-lg font-semibold">🎊 절차를 완벽하게 이해했어요! 👍</p>
              </div>
            `
          : html`
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6 text-center">
                <p className="text-red-700 text-base">💡 힌트: 올바른 순서를 생각해보세요!</p>
              </div>
            `}
        <button
          onClick=${onClose}
          className=${`w-full ${result.success ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'} text-white px-6 py-3 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all`}
        >
          ${isDebugMode && !result.success ? '🔧 코드 수정하기' : '다시 도전하기'}
        </button>
      </div>
    </div>
  `;
}

function RamenIntroScreen({ onStartGame }) {
  const steamBubbles = Array.from({ length: 30 }).map((_, i) => {
    const style = {
      left: `${40 + Math.random() * 20}%`,
      bottom: '35%',
      width: `${Math.random() * 8 + 4}px`,
      height: `${Math.random() * 8 + 4}px`,
      animationDelay: `${Math.random() * 3}s`,
      animationDuration: `${Math.random() * 2 + 2}s`,
    };
    return { style, key: i };
  });

  return html`
    <div className="min-h-screen bg-gradient-to-br from-orange-200 via-red-100 to-yellow-200 flex items-center justify-center relative overflow-hidden p-4">
      <div className="absolute inset-0">
        ${steamBubbles.map(
          ({ style, key }) => html`
            <div
              key=${key}
              className="absolute bg-white/40 rounded-full animate-steam-rise blur-sm"
              style=${style}
            />
          `,
        )}
      </div>

      <div className="relative z-10 text-center bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 sm:p-12 max-w-2xl mx-auto border-4 border-orange-300">
        <div className="text-7xl sm:text-9xl mb-4 sm:mb-6 animate-bounce">🍜</div>
        <h1 className="text-4xl sm:text-6xl font-bold mb-3 sm:mb-4 text-orange-800">라면 끓이기</h1>
        <h2 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-6 text-red-700">마스터!</h2>
        <p className="text-lg sm:text-xl text-gray-700 mb-3 sm:mb-4 leading-relaxed">
          배가 고픈데 집에는 라면밖에 없어요!
        </p>
        <p className="text-lg sm:text-xl text-gray-700 mb-3 sm:mb-4 leading-relaxed">
          맛있는 라면을 끓이려면<br />
          <strong className="text-orange-700">올바른 순서</strong>로 요리해야 해요!
        </p>
        <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-3 sm:p-4 mb-6 sm:mb-8">
          <p className="text-base sm:text-lg text-gray-800">
            ⏱️ <strong className="text-orange-700">이 라면은 3분 동안 끓여야 해요!</strong>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick=${() => onStartGame('normal')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xl sm:text-2xl font-bold px-8 sm:px-10 py-4 sm:py-5 rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 border-4 border-blue-300"
          >
            📝 일반 모드
          </button>
          <button
            onClick=${() => onStartGame('debug')}
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xl sm:text-2xl font-bold px-8 sm:px-10 py-4 sm:py-5 rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 border-4 border-purple-300"
          >
            🔧 오류수정 모드
          </button>
        </div>
      </div>

      <style>${`
        @keyframes steam-rise {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          50% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(-200px) scale(1.5);
            opacity: 0;
          }
        }
        .animate-steam-rise {
          animation: steam-rise linear infinite;
        }
      `}</style>
    </div>
  `;
}

// 라면 오류 패턴 생성 함수
const generateRamenBuggySequence = () => {
  const patterns = [
    // 패턴 1: 불을 먼저 켜고 물을 나중에
    [
      { ...RAMEN_BLOCKS.fire },
      { ...RAMEN_BLOCKS.water },
      { ...RAMEN_BLOCKS.waitBoil, seconds: 60, text: '1분 기다리기' },
      { ...RAMEN_BLOCKS.noodle },
      { ...RAMEN_BLOCKS.soup },
      { ...RAMEN_BLOCKS.waitBoil, seconds: 180, text: '3분 기다리기' },
      { ...RAMEN_BLOCKS.fireOff },
    ],
    // 패턴 2: 스프 없이
    [
      { ...RAMEN_BLOCKS.water },
      { ...RAMEN_BLOCKS.fire },
      { ...RAMEN_BLOCKS.waitBoil, seconds: 30, text: '30초 기다리기' },
      { ...RAMEN_BLOCKS.noodle },
      { ...RAMEN_BLOCKS.waitBoil, seconds: 180, text: '3분 기다리기' },
      { ...RAMEN_BLOCKS.fireOff },
    ],
    // 패턴 3: 면을 너무 오래 끓임
    [
      { ...RAMEN_BLOCKS.water },
      { ...RAMEN_BLOCKS.fire },
      { ...RAMEN_BLOCKS.noodle },
      { ...RAMEN_BLOCKS.soup },
      { ...RAMEN_BLOCKS.waitBoil, seconds: 240, text: '4분 기다리기' },
      { ...RAMEN_BLOCKS.fireOff },
    ],
    // 패턴 4: 불 끈 후 스프
    [
      { ...RAMEN_BLOCKS.water },
      { ...RAMEN_BLOCKS.fire },
      { ...RAMEN_BLOCKS.waitBoil, seconds: 30, text: '30초 기다리기' },
      { ...RAMEN_BLOCKS.noodle },
      { ...RAMEN_BLOCKS.waitBoil, seconds: 180, text: '3분 기다리기' },
      { ...RAMEN_BLOCKS.fireOff },
      { ...RAMEN_BLOCKS.soup },
    ],
    // 패턴 5: 면이 설익음
    [
      { ...RAMEN_BLOCKS.water },
      { ...RAMEN_BLOCKS.fire },
      { ...RAMEN_BLOCKS.noodle },
      { ...RAMEN_BLOCKS.soup },
      { ...RAMEN_BLOCKS.waitBoil, seconds: 60, text: '1분 기다리기' },
      { ...RAMEN_BLOCKS.fireOff },
    ],
  ];

  const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
  return randomPattern.map(block => ({ ...block }));
};

function RamenGame({ onBack }) {
  const [showIntro, setShowIntro] = useState(true);
  const [gameMode, setGameMode] = useState('normal');
  const [palette, setPalette] = useState(() => [
    { ...RAMEN_BLOCKS.water },
    { ...RAMEN_BLOCKS.fire },
    { ...RAMEN_BLOCKS.waitBoil, seconds: 30, text: '30초 기다리기' },
    { ...RAMEN_BLOCKS.waitBoil, seconds: 30, text: '30초 기다리기' },
    { ...RAMEN_BLOCKS.noodle },
    { ...RAMEN_BLOCKS.soup },
    { ...RAMEN_BLOCKS.fireOff },
  ]);
  const [sequence, setSequence] = useState([]);
  const [displaySequence, setDisplaySequence] = useState([]);
  const [animationFrames, setAnimationFrames] = useState([]);
  const [savedAnimationFrames, setSavedAnimationFrames] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [result, setResult] = useState(null);
  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [timeModalTarget, setTimeModalTarget] = useState(null); // { type: 'palette' | 'sequence', index: number, currentSeconds: number }

  useEffect(() => {
    if (animationFrames.length === 0) return;
    if (animationFrames.length === 1) {
      setDisplaySequence(animationFrames[0]);
      setAnimationFrames([]);
      setIsAnimating(false);
      return;
    }
    setIsAnimating(true);
    let frameIndex = 0;
    setDisplaySequence(animationFrames[frameIndex]);
    frameIndex += 1;
    const timer = setInterval(() => {
      if (frameIndex >= animationFrames.length) {
        clearInterval(timer);
        setIsAnimating(false);
        setAnimationFrames([]);
        return;
      }
      setDisplaySequence(animationFrames[frameIndex]);
      frameIndex += 1;
    }, 800);
    return () => clearInterval(timer);
  }, [animationFrames]);

  const handlePaletteDragStart = (e, blockId) => {
    e.dataTransfer.setData('blockId', blockId);
    e.dataTransfer.setData('source', 'palette');
  };

  const handleSequenceDragStart = (e, blockId, index) => {
    e.dataTransfer.setData('blockId', blockId);
    e.dataTransfer.setData('source', 'sequence');
    e.dataTransfer.setData('index', index.toString());
  };

  const handlePaletteDrop = (e) => {
    e.preventDefault();
    const blockId = e.dataTransfer.getData('blockId');
    const source = e.dataTransfer.getData('source');

    if (source === 'sequence') {
      const sourceIndex = parseInt(e.dataTransfer.getData('index'));
      const block = sequence[sourceIndex];
      setSequence((prev) => prev.filter((_, i) => i !== sourceIndex));
      setPalette((prev) => [...prev, { ...block }]);
    }
  };

  const handleSequenceDrop = (blockId, targetIndex) => {
    const source = event.dataTransfer.getData('source');

    if (source === 'palette') {
      const block = palette.find((b) => b.id === blockId);
      if (!block) return;

      setPalette((prev) => {
        const index = prev.findIndex((b) => b.id === blockId);
        if (index === -1) return prev;
        return [...prev.slice(0, index), ...prev.slice(index + 1)];
      });
      setSequence((prev) => {
        const newSeq = [...prev];
        newSeq.splice(targetIndex, 0, block);
        return newSeq;
      });
    } else if (source === 'sequence') {
      const sourceIndex = parseInt(event.dataTransfer.getData('index'));
      if (sourceIndex === targetIndex) return;

      setSequence((prev) => {
        const newSeq = [...prev];
        const [block] = newSeq.splice(sourceIndex, 1);
        const adjustedTarget = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
        newSeq.splice(adjustedTarget, 0, block);
        return newSeq;
      });
    }
  };

  const handleQuickAdd = (blockId) => {
    const block = palette.find((b) => b.id === blockId);
    if (!block) return;
    setPalette((prev) => {
      const index = prev.findIndex((b) => b.id === blockId);
      if (index === -1) return prev;
      return [...prev.slice(0, index), ...prev.slice(index + 1)];
    });
    setSequence((prev) => [...prev, block]);
  };

  const handleQuickRemove = (index) => {
    const block = sequence[index];
    setSequence((prev) => prev.filter((_, i) => i !== index));
    setPalette((prev) => [...prev, { ...block }]);
  };

  // 시간 변경 핸들러 (팔레트에 있는 블록) - 모달 열기
  const handlePaletteTimeChange = (blockIndex) => {
    const block = palette[blockIndex];
    if (block.id === 'waitBoil') {
      setTimeModalTarget({
        type: 'palette',
        index: blockIndex,
        currentSeconds: block.seconds || 30
      });
      setTimeModalOpen(true);
    }
  };

  // 시간 변경 핸들러 (시퀀스에 있는 블록) - 모달 열기
  const handleSequenceTimeChange = (blockIndex) => {
    const block = sequence[blockIndex];
    if (block.id === 'waitBoil') {
      setTimeModalTarget({
        type: 'sequence',
        index: blockIndex,
        currentSeconds: block.seconds || 30
      });
      setTimeModalOpen(true);
    }
  };

  // 시간 선택 완료
  const handleTimeSelect = (selectedSeconds) => {
    if (!timeModalTarget) return;

    const timeText = formatTimeText(selectedSeconds);

    if (timeModalTarget.type === 'palette') {
      setPalette((prev) => {
        const newPalette = [...prev];
        const block = newPalette[timeModalTarget.index];
        newPalette[timeModalTarget.index] = { ...block, seconds: selectedSeconds, text: timeText };
        return newPalette;
      });
    } else if (timeModalTarget.type === 'sequence') {
      setSequence((prev) => {
        const newSequence = [...prev];
        const block = newSequence[timeModalTarget.index];
        newSequence[timeModalTarget.index] = { ...block, seconds: selectedSeconds, text: timeText };
        return newSequence;
      });
    }

    setTimeModalOpen(false);
    setTimeModalTarget(null);
  };

  const handleExecute = () => {
    const frames = (() => {
      const cookingIds = ['water', 'fire', 'waitBoil', 'noodle', 'soup', 'fireOff'];
      const snapshots = [[]];
      const current = [];
      sequence.forEach((block) => {
        if (cookingIds.includes(block.id)) {
          current.push(block);
          snapshots.push([...current]);
        }
      });
      return snapshots;
    })();
    setDisplaySequence([]);
    setAnimationFrames(frames);
    setSavedAnimationFrames(frames);

    const evaluation = evaluateRamen(sequence);
    setResult(evaluation);
  };

  const handleReset = () => {
    const newPalette = [
      { ...RAMEN_BLOCKS.water },
      { ...RAMEN_BLOCKS.fire },
      { ...RAMEN_BLOCKS.waitBoil, seconds: 30, text: '30초 기다리기' },
      { ...RAMEN_BLOCKS.waitBoil, seconds: 30, text: '30초 기다리기' },
      { ...RAMEN_BLOCKS.noodle },
      { ...RAMEN_BLOCKS.soup },
      { ...RAMEN_BLOCKS.fireOff },
    ];
    setPalette(newPalette);
    setSequence([]);
    setDisplaySequence([]);
    setAnimationFrames([]);
    setSavedAnimationFrames([]);
    setIsAnimating(false);
    setResult(null);
  };

  const handleCloseResult = () => {
    setResult(null);
  };

  const handleResultModalClose = () => {
    if (gameMode === 'debug') {
      // 오류수정 모드: 모달만 닫고 블록 유지
      setResult(null);
    } else {
      // 일반 모드: 완전 초기화
      handleReset();
    }
  };

  const handleStartGame = (mode) => {
    setGameMode(mode);
    setShowIntro(false);

    if (mode === 'debug') {
      // 인트로를 먼저 닫고, 약간의 딜레이 후 디버그 모드 초기화
      setTimeout(() => {
        const buggySeq = generateRamenBuggySequence();
        setSequence(buggySeq);

        // 팔레트에서 사용된 블록 제거
        const usedBlockIds = buggySeq.map(b => b.id);
        setPalette(prev => {
          let remaining = [...prev];
          usedBlockIds.forEach(id => {
            const idx = remaining.findIndex(b => b.id === id);
            if (idx !== -1) {
              remaining.splice(idx, 1);
            }
          });
          return remaining;
        });

        // 조립된 블록을 보여주고 나서 결과 실행
        setTimeout(() => {
          // 오류수정 모드: 즉시 결과 실행해서 보여주기
          const frames = (() => {
            const cookingIds = ['water', 'fire', 'waitBoil', 'noodle', 'soup', 'fireOff'];
            const snapshots = [[]];
            const current = [];
            buggySeq.forEach((block) => {
              if (cookingIds.includes(block.id)) {
                current.push(block);
                snapshots.push([...current]);
              }
            });
            return snapshots;
          })();

          setSavedAnimationFrames(frames);
          const evaluation = evaluateRamen(buggySeq);
          setResult(evaluation);
        }, 500);
      }, 100);
    }
  };

  if (showIntro) {
    return html`<${RamenIntroScreen} onStartGame=${handleStartGame} />`;
  }

  return html`
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-red-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 flex justify-between items-center">
          <button
            onClick=${onBack}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg hover:bg-gray-700 transition-all"
          >
            ← 메뉴로 돌아가기
          </button>
          <h1 className="text-4xl font-bold text-center text-orange-800">🍜 라면 끓이기 마스터!</h1>
          <div className="w-32"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3">
            <${BlockPalette}
              blocks=${palette}
              onDragStart=${handlePaletteDragStart}
              onDrop=${handlePaletteDrop}
              onQuickAdd=${handleQuickAdd}
              onTimeChange=${handlePaletteTimeChange}
            />
          </div>
          <div className="lg:col-span-5">
            <${ExecutionSequence}
              blocks=${sequence}
              onDragStart=${handleSequenceDragStart}
              onDrop=${handleSequenceDrop}
              onExecute=${handleExecute}
              onReset=${handleReset}
              onQuickRemove=${handleQuickRemove}
              onTimeChange=${handleSequenceTimeChange}
              executeLabel="라면 끓이기! 🍜"
              showStartBlock=${true}
              startBlockText="라면 끓이기 버튼을 눌렀을 때"
              startBlockColor="orange"
            />
          </div>
          <div className="lg:col-span-4">
            <${RamenDisplay} sequence=${displaySequence} isAnimating=${isAnimating} />
          </div>
        </div>
      </div>

      <${RamenResultModal}
        isOpen=${result !== null}
        onClose=${handleResultModalClose}
        result=${result}
        animationFrames=${savedAnimationFrames}
        isDebugMode=${gameMode === 'debug'}
      />

      <${TimeSelectModal}
        isOpen=${timeModalOpen}
        onClose=${() => { setTimeModalOpen(false); setTimeModalTarget(null); }}
        onSelect=${handleTimeSelect}
        currentSeconds=${timeModalTarget?.currentSeconds || 30}
      />
    </div>
  `;
}

// ==================== 비오는날 등교 게임 ====================

const RAINY_DAY_BLOCKS = {
  socks: { id: 'socks', text: '양말 신기', color: 'bg-cyan-500', isDistraction: false },
  shoes: { id: 'shoes', text: '운동화 신기', color: 'bg-cyan-600', isDistraction: false },
  bag: { id: 'bag', text: '가방 메기', color: 'bg-emerald-500', isDistraction: false },
  raincoat: { id: 'raincoat', text: '비옷 입기', color: 'bg-emerald-600', isDistraction: false },
  tv: { id: 'tv', text: 'TV 보기', color: 'bg-amber-500', isDistraction: true },
  game: { id: 'game', text: '게임하기', color: 'bg-rose-500', isDistraction: true },
};

const RAINY_DAY_ICON_PATHS = {
  socks: 'M7 17l-4 4m14-4l-4 4M7 7l4-4 4 4M7 7v10m10-10v10',
  shoes: 'M4 7a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7zm5 0l-1-4 4 4-3 1zm6 0l1-4-4 4 3 1z',
  bag: 'M12 6.253v11.494m-5.46-3.89l5.46 3.89 5.46-3.89M3.75 9.405L12 15.25l8.25-5.845M3.75 9.405l8.25-5.845L20.25 9.405',
  raincoat: 'M5.636 18.364a9 9 0 010-12.728M18.364 5.636a9 9 0 010 12.728m-12.728 0L12 22l6.364-6.364M12 3v9',
  tv: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  game: 'M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0 1.172 1.953 1.172 5.119 0 7.072z',
};

const RAINY_DAY_INITIAL_PALETTE = Object.values(RAINY_DAY_BLOCKS);

const FEET_STATE_MAP = {
  bare: '',
  socks: '양말',
  shoes: '운동화',
  socks_shoes: '양말_운동화',
  shoes_socks: '운동화_양말',
};

const BODY_STATE_MAP = {
  bare: '',
  bag: '가방',
  raincoat: '비옷',
  bag_raincoat: '가방_비옷',
  raincoat_bag: '비옷_가방',
};

const FILENAME_MAP = {
  기본: '1.기본.png',
  양말: '2.양말.png',
  운동화: '3.운동화.png',
  양말_운동화: '4.양말_운동화.png',
  운동화_양말: '5.운동화_양말.png',
  가방: '6.가방.png',
  비옷: '7.비옷.png',
  가방_비옷: '8.가방_비옷.png',
  비옷_가방: '9.비옷_가방.png',
  가방_양말: '10.가방_양말.png',
  가방_운동화: '11.가방_운동화.png',
  가방_양말_운동화: '12.가방_양말_운동화.png',
  가방_운동화_양말: '13.가방_운동화_양말.png',
  비옷_양말: '14.비옷_양말.png',
  비옷_운동화: '15.비옷_운동화.png',
  비옷_양말_운동화: '16.비옷_양말_운동화.png',
  비옷_운동화_양말: '17.비옷_운동화_양말.png',
  가방_비옷_양말: '18.가방_비옷_양말.png',
  가방_비옷_운동화: '19.가방_비옷_운동화.png',
  가방_비옷_양말_운동화: '20.가방_비옷_양말_운동화.png',
  가방_비옷_운동화_양말: '21.가방_비옷_운동화_양말.png',
  비옷_가방_양말: '22.비옷_가방_양말.png',
  비옷_가방_운동화: '23.비옷_가방_운동화.png',
  비옷_가방_운동화_양말: '24.비옷_가방_운동화_양말.png',
  비옷_가방_양말_운동화: '25.비옷_가방_양말_운동화.png',
};

const determineCharacterState = (sequence) => {
  const ids = sequence.map((b) => b.id);
  const has = (id) => ids.includes(id);

  const socksIndex = ids.indexOf('socks');
  const shoesIndex = ids.indexOf('shoes');
  const bagIndex = ids.indexOf('bag');
  const raincoatIndex = ids.indexOf('raincoat');

  let feetKey = 'bare';
  if (has('socks') && !has('shoes')) feetKey = 'socks';
  else if (!has('socks') && has('shoes')) feetKey = 'shoes';
  else if (has('socks') && has('shoes')) feetKey = socksIndex < shoesIndex ? 'socks_shoes' : 'shoes_socks';

  let bodyKey = 'bare';
  if (has('bag') && !has('raincoat')) bodyKey = 'bag';
  else if (!has('bag') && has('raincoat')) bodyKey = 'raincoat';
  else if (has('bag') && has('raincoat')) bodyKey = bagIndex < raincoatIndex ? 'bag_raincoat' : 'raincoat_bag';

  return { feetKey, bodyKey };
};

const getImageInfo = (sequence) => {
  const { feetKey, bodyKey } = determineCharacterState(sequence);
  const imageNameKey = [BODY_STATE_MAP[bodyKey], FEET_STATE_MAP[feetKey]].filter(Boolean).join('_') || '기본';
  const finalImageName = FILENAME_MAP[imageNameKey] || '1.기본.png';
  const imageUrl = `images/rainy-day/${finalImageName}`;
  const caption = imageNameKey === '기본' ? '기본' : imageNameKey.replace(/_/g, ' + ');
  return { imageUrl, altText: `캐릭터 상태: ${caption}`, caption };
};

const evaluateRainyDay = (sequence) => {
  const seqIds = sequence.map((b) => b.id);
  const has = (id) => seqIds.includes(id);

  const socksIndex = seqIds.indexOf('socks');
  const shoesIndex = seqIds.indexOf('shoes');
  const bagIndex = seqIds.indexOf('bag');
  const raincoatIndex = seqIds.indexOf('raincoat');

  const orderIssues = [];

  // 시간 낭비 체크 (TV 시청, 게임하기)
  const distractionBlocks = sequence.filter(b => b.isDistraction);
  if (distractionBlocks.length > 0) {
    const distractionNames = distractionBlocks.map(b => b.text).join(', ');
    if (distractionBlocks.length === 1) {
      orderIssues.push(`${distractionNames}를 해서 등교 시간에 늦었어요! ⏰`);
    } else {
      orderIssues.push(`${distractionNames}를 해서 등교 시간에 많이 늦었어요! ⏰`);
    }
  }

  if (has('shoes') && has('socks') && shoesIndex < socksIndex) {
    orderIssues.push('양말이 흙탕물에 젖어버렸어요. 🧦');
  }
  if (has('raincoat') && has('bag') && raincoatIndex < bagIndex) {
    orderIssues.push('가방이 비에 젖어버렸어요. 🎒');
  }
  if (has('socks') && !has('shoes')) {
    orderIssues.push('신발을 안 신어서 양말이 젖고 지저분해졌어요. 🧦');
  }
  if (!has('raincoat')) {
    orderIssues.push('비옷을 안 입어서 온몸이 다 젖었어요. 🌧️');
  }
  if (!has('socks') && !has('shoes')) {
    orderIssues.push('맨발이라 발이 다 젖었어요. 🦶');
  }
  if (!has('socks') && has('shoes')) {
    orderIssues.push('양말을 안 신어서 신발 속이 끈적하고 불편해요. 🥿');
  }
  if (!has('bag')) {
    orderIssues.push('가방을 안 메서 준비물을 챙기지 못했어요. 🎒');
  }

  return {
    success: orderIssues.length === 0,
    orderIssues,
  };
};

function CharacterDisplay({ sequence, isAnimating }) {
  const [imageError, setImageError] = useState(false);
  const { imageUrl, altText } = getImageInfo(sequence);

  useEffect(() => setImageError(false), [imageUrl]);

  const ImagePanel = () =>
    html`
      <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-lg">
        <img
          src=${imageUrl}
          alt=${altText}
          className="object-contain w-full h-full"
          onError=${() => setImageError(true)}
        />
      </div>
    `;

  const ErrorPanel = () =>
    html`
      <div className="w-full h-full flex flex-col items-center justify-center bg-red-100 border-2 border-dashed border-red-400 rounded-lg p-4 text-center">
        <p className="text-red-700 font-bold text-lg mb-2">😭<br />이미지 로딩 실패!</p>
        <p className="text-red-600 text-sm">아래 경로에 파일이 있는지 확인해주세요:</p>
        <code className="text-xs font-mono bg-red-200 text-red-900 px-2 py-1 rounded mt-1 break-all w-full block">${imageUrl}</code>
      </div>
    `;

  return html`
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-5 border-2 border-blue-200 flex flex-col items-center w-full lg:h-[360px]">
      <div className="w-full max-w-[260px] h-[280px] mx-auto mb-3">
        ${imageError ? html`<${ErrorPanel} />` : html`<${ImagePanel} />`}
      </div>
      <p className="font-semibold text-center text-gray-700 p-2 bg-yellow-100 rounded-lg border border-yellow-300 w-full">
        "오늘은 내가 뭘 입어야 할까?"
      </p>
      ${isAnimating
        ? html`<p className="text-xs text-blue-500 mt-2 animate-pulse">등교 준비 중... 👟</p>`
        : null}
    </div>
  `;
}

function RainyDayResultModal({ isOpen, onClose, result, frameImages, isDebugMode }) {
  if (!isOpen || !result) return null;
  const bgColor = result.status === 'success' ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500';
  const textColor = result.status === 'success' ? 'text-green-800' : 'text-red-800';
  const timeline = frameImages && frameImages.length ? frameImages : [getImageInfo([])];
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    setFrameIndex(0);
    if (timeline.length <= 1) return;
    let idx = 1;
    const timer = setInterval(() => {
      setFrameIndex(idx);
      idx += 1;
      if (idx >= timeline.length) {
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, timeline]);

  const currentFrame = timeline[frameIndex] || timeline[0];

  return html`
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className=${`relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 border-4 ${bgColor} transform transition-all duration-300 scale-95 animate-modal-pop`}>
        <h2 className=${`text-3xl font-bold mb-4 ${textColor}`}>${result.title}</h2>
        <div className="flex justify-center mb-4">
          <img src=${currentFrame.imageUrl} alt=${currentFrame.altText} className="w-48 h-48 object-contain rounded-2xl border border-white shadow-inner bg-gray-50" />
        </div>
        ${timeline.length > 1
          ? html`
              <div className="mb-5">
                <p className="text-sm font-semibold text-gray-600 mb-2">입은 순서</p>
                <div className="grid grid-cols-5 gap-1.5 max-h-40 overflow-y-auto">
                  ${timeline.map(
                    (frame, idx) => html`
                      <div className="bg-gray-50 rounded-lg p-2 border border-gray-200 flex flex-col items-center text-center text-[10px] text-gray-600 w-[92px]">
                        <div className="w-full h-12 mb-1 flex items-center justify-center">
                          <img src=${frame.imageUrl} alt=${frame.altText} className="max-h-full object-contain" />
                        </div>
                        <span className="font-semibold text-gray-700 text-[11px]">STEP ${idx}</span>
                        <span>${frame.caption}</span>
                      </div>
                    `,
                  )}
                </div>
              </div>
            `
          : null}
        <div className="space-y-3 text-lg text-gray-700">
          ${result.messages.map((msg, index) => html`<p key=${index}>${msg}</p>`)}
        </div>
        <button
          onClick=${onClose}
          className="mt-8 w-full bg-blue-500 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-blue-600 transition-colors"
        >
          ${isDebugMode && result.status === 'failure' ? '🔧 코드 수정하기' : '다시 해보기'}
        </button>
      </div>
      <style>${`
        @keyframes modal-pop {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-modal-pop { animation: modal-pop 0.3s ease-out forwards; }
      `}</style>
    </div>
  `;
}

function IntroScreen({ onStartGame }) {
  const raindrops = Array.from({ length: 50 }).map((_, i) => {
    const style = {
      left: `${Math.random() * 100}%`,
      top: '-10%',
      width: `${Math.random() * 2 + 1}px`,
      height: `${Math.random() * 20 + 10}px`,
      animationDelay: `${Math.random() * 5}s`,
      animationDuration: `${Math.random() * 1 + 0.5}s`,
    };
    return html`<div key=${i} className="absolute bg-blue-300 rounded-full animate-fall" style=${style}></div>`;
  });

  return html`
    <div className="relative min-h-screen bg-sky-800 text-white flex flex-col items-center justify-center overflow-hidden p-4">
      ${raindrops}
      <div className="relative z-10 text-center bg-black/30 backdrop-blur-sm p-8 md:p-12 rounded-2xl shadow-lg border border-sky-400 max-w-2xl">
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 animate-fade-in-down">비오는날 등교 성공하기!</h1>
        <p className="text-base sm:text-lg md:text-2xl mb-6 sm:mb-8 animate-fade-in-up">
          창밖에 비가 와요! ☔<br />
          젖지 않고 학교에 갈 준비를 해볼까요?
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick=${() => onStartGame('normal')}
            className="bg-blue-500 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-full text-lg sm:text-xl shadow-lg hover:bg-blue-600 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-400"
          >
            📝 일반 모드
          </button>
          <button
            onClick=${() => onStartGame('debug')}
            className="bg-purple-500 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-full text-lg sm:text-xl shadow-lg hover:bg-purple-600 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-400"
          >
            🔧 오류수정 모드
          </button>
        </div>
      </div>
      <style>${`
        @keyframes fall {
          to { transform: translateY(110vh); opacity: 0; }
        }
        .animate-fall { animation: fall linear infinite; }

        @keyframes fade-in-down {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down { animation: fade-in-down 0.8s ease-out forwards; }

        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out 0.3s forwards; opacity: 0; }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      `}</style>
    </div>
  `;
}

// 비오는 날 등교 오류 패턴 생성 함수
const generateRainyDayBuggySequence = () => {
  const patterns = [
    // 패턴 1: 신발 먼저 신고 양말 나중에
    [
      { ...RAINY_DAY_BLOCKS.shoes },
      { ...RAINY_DAY_BLOCKS.socks },
      { ...RAINY_DAY_BLOCKS.bag },
      { ...RAINY_DAY_BLOCKS.raincoat },
    ],
    // 패턴 2: 가방 먼저 메고 비옷 나중에
    [
      { ...RAINY_DAY_BLOCKS.socks },
      { ...RAINY_DAY_BLOCKS.bag },
      { ...RAINY_DAY_BLOCKS.shoes },
      { ...RAINY_DAY_BLOCKS.raincoat },
    ],
    // 패턴 3: 양말 안 신음
    [
      { ...RAINY_DAY_BLOCKS.shoes },
      { ...RAINY_DAY_BLOCKS.bag },
      { ...RAINY_DAY_BLOCKS.raincoat },
    ],
    // 패턴 4: 비옷 안 입음
    [
      { ...RAINY_DAY_BLOCKS.socks },
      { ...RAINY_DAY_BLOCKS.shoes },
      { ...RAINY_DAY_BLOCKS.bag },
    ],
    // 패턴 5: TV 보기, 게임하기 포함
    [
      { ...RAINY_DAY_BLOCKS.tv },
      { ...RAINY_DAY_BLOCKS.socks },
      { ...RAINY_DAY_BLOCKS.shoes },
      { ...RAINY_DAY_BLOCKS.game },
      { ...RAINY_DAY_BLOCKS.bag },
      { ...RAINY_DAY_BLOCKS.raincoat },
    ],
  ];

  const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
  return randomPattern.map(block => ({ ...block }));
};

function RainyDayGame({ onBack }) {
  const [showIntro, setShowIntro] = useState(true);
  const [gameMode, setGameMode] = useState('normal');
  const [palette, setPalette] = useState(shuffleArray(RAINY_DAY_INITIAL_PALETTE));
  const [sequence, setSequence] = useState([]);
  const [displaySequence, setDisplaySequence] = useState([]);
  const [animationFrames, setAnimationFrames] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [resultFrameImages, setResultFrameImages] = useState([]);
  const [result, setResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (animationFrames.length === 0) return;
    if (animationFrames.length === 1) {
      setDisplaySequence(animationFrames[0]);
      setAnimationFrames([]);
      setIsAnimating(false);
      return;
    }
    setIsAnimating(true);
    let frameIndex = 0;
    setDisplaySequence(animationFrames[frameIndex]);
    frameIndex += 1;
    const timer = setInterval(() => {
      if (frameIndex >= animationFrames.length) {
        clearInterval(timer);
        setIsAnimating(false);
        setAnimationFrames([]);
        return;
      }
      setDisplaySequence(animationFrames[frameIndex]);
      frameIndex += 1;
    }, 800);
    return () => clearInterval(timer);
  }, [animationFrames]);

  const handlePaletteDragStart = (e, blockId) => {
    e.dataTransfer.setData('blockId', blockId);
    e.dataTransfer.setData('source', 'palette');
  };

  const handleSequenceDragStart = (e, blockId, index) => {
    e.dataTransfer.setData('blockId', blockId);
    e.dataTransfer.setData('source', 'sequence');
    e.dataTransfer.setData('index', index.toString());
  };

  const handlePaletteDrop = (e) => {
    e.preventDefault();
    const blockId = e.dataTransfer.getData('blockId');
    const source = e.dataTransfer.getData('source');

    if (source === 'sequence') {
      const sourceIndex = parseInt(e.dataTransfer.getData('index'));
      const block = sequence[sourceIndex];
      setSequence((prev) => prev.filter((_, i) => i !== sourceIndex));
      setPalette((prev) => [...prev, { ...block }]);
    }
  };

  const handleSequenceDrop = (blockId, targetIndex) => {
    const source = event.dataTransfer.getData('source');

    if (source === 'palette') {
      const block = palette.find((b) => b.id === blockId);
      if (!block) return;

      setPalette((prev) => {
        const index = prev.findIndex((b) => b.id === blockId);
        if (index === -1) return prev;
        return [...prev.slice(0, index), ...prev.slice(index + 1)];
      });
      setSequence((prev) => {
        const newSeq = [...prev];
        newSeq.splice(targetIndex, 0, block);
        return newSeq;
      });
    } else if (source === 'sequence') {
      const sourceIndex = parseInt(event.dataTransfer.getData('index'));
      if (sourceIndex === targetIndex) return;

      setSequence((prev) => {
        const newSeq = [...prev];
        const [block] = newSeq.splice(sourceIndex, 1);
        const adjustedTarget = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
        newSeq.splice(adjustedTarget, 0, block);
        return newSeq;
      });
    }
  };

  const handleQuickAdd = (blockId) => {
    const block = palette.find((b) => b.id === blockId);
    if (!block) return;
    setPalette((prev) => {
      const index = prev.findIndex((b) => b.id === blockId);
      if (index === -1) return prev;
      return [...prev.slice(0, index), ...prev.slice(index + 1)];
    });
    setSequence((prev) => [...prev, block]);
  };

  const handleQuickRemove = (index) => {
    const block = sequence[index];
    setSequence((prev) => prev.filter((_, i) => i !== index));
    setPalette((prev) => [...prev, { ...block }]);
  };

  const handleExecute = () => {
    const frames = (() => {
      const attireIds = ['socks', 'shoes', 'bag', 'raincoat'];
      const snapshots = [[]];
      const current = [];
      sequence.forEach((block) => {
        if (attireIds.includes(block.id)) {
          current.push(block);
          snapshots.push([...current]);
        }
      });
      return snapshots;
    })();
    setDisplaySequence([]);
    setResultFrameImages(frames.map(getImageInfo));
    setAnimationFrames(frames);

    const evaluation = evaluateRainyDay(sequence);
    const problems = [...evaluation.orderIssues];

    if (problems.length > 0) {
      setResult({ status: 'failure', title: '등교 실패! 😥', messages: problems });
    } else {
      setResult({ status: 'success', title: '등교 성공! 🥳', messages: ['발도, 가방도 젖지 않았어요! 완벽한 절차입니다!'] });
    }

    setIsModalOpen(true);
  };

  const handleReset = () => {
    setPalette(shuffleArray(RAINY_DAY_INITIAL_PALETTE));
    setSequence([]);
    setDisplaySequence([]);
    setAnimationFrames([]);
    setIsAnimating(false);
    setResultFrameImages([]);
    setResult(null);
    setIsModalOpen(false);
  };

  const handleResultModalClose = () => {
    if (gameMode === 'debug') {
      // 오류수정 모드: 모달만 닫고 블록 유지
      setResult(null);
      setIsModalOpen(false);
    } else {
      // 일반 모드: 완전 초기화
      handleReset();
    }
  };

  const handleStartGame = (mode) => {
    setGameMode(mode);
    setShowIntro(false);

    if (mode === 'debug') {
      // 인트로를 먼저 닫고, 약간의 딜레이 후 디버그 모드 초기화
      setTimeout(() => {
        const buggySeq = generateRainyDayBuggySequence();
        setSequence(buggySeq);

        // 팔레트에서 사용된 블록 제거
        const usedBlockIds = buggySeq.map(b => b.id);
        setPalette(prev => {
          let remaining = [...prev];
          usedBlockIds.forEach(id => {
            const idx = remaining.findIndex(b => b.id === id);
            if (idx !== -1) {
              remaining.splice(idx, 1);
            }
          });
          return remaining;
        });

        // 조립된 블록을 보여주고 나서 결과 실행
        setTimeout(() => {
          // 오류수정 모드: 즉시 결과 실행해서 보여주기
          const frames = (() => {
            const attireIds = ['socks', 'shoes', 'bag', 'raincoat'];
            const snapshots = [[]];
            const current = [];
            buggySeq.forEach((block) => {
              if (attireIds.includes(block.id)) {
                current.push(block);
                snapshots.push([...current]);
              }
            });
            return snapshots;
          })();

          setResultFrameImages(frames.map(getImageInfo));

          const evaluation = evaluateRainyDay(buggySeq);
          const problems = [...evaluation.orderIssues];

          if (problems.length > 0) {
            setResult({ status: 'failure', title: '등교 실패! 😥', messages: problems });
          } else {
            setResult({ status: 'success', title: '등교 성공! 🥳', messages: ['발도, 가방도 젖지 않았어요! 완벽한 절차입니다!'] });
          }
          setIsModalOpen(true);
        }, 500);
      }, 100);
    }
  };

  if (showIntro) {
    return html`<${IntroScreen} onStartGame=${handleStartGame} />`;
  }

  return html`
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-sky-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 flex justify-between items-center">
          <button
            onClick=${onBack}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg hover:bg-gray-700 transition-all"
          >
            ← 메뉴로 돌아가기
          </button>
          <h1 className="text-4xl font-bold text-center text-blue-800">🌧️ 비오는날 등교 성공하기!</h1>
          <div className="w-32"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3">
            <${BlockPalette}
              blocks=${palette}
              onDragStart=${handlePaletteDragStart}
              onDrop=${handlePaletteDrop}
              onQuickAdd=${handleQuickAdd}
              iconPaths=${RAINY_DAY_ICON_PATHS}
            />
          </div>
          <div className="lg:col-span-5">
            <${ExecutionSequence}
              blocks=${sequence}
              onDragStart=${handleSequenceDragStart}
              onDrop=${handleSequenceDrop}
              onExecute=${handleExecute}
              onReset=${handleReset}
              onQuickRemove=${handleQuickRemove}
              iconPaths=${RAINY_DAY_ICON_PATHS}
              executeLabel="등교하기! 🎒"
              showStartBlock=${true}
            />
          </div>
          <div className="lg:col-span-4">
            <${CharacterDisplay} sequence=${displaySequence} isAnimating=${isAnimating} />
          </div>
        </div>
      </div>

      <${RainyDayResultModal} isOpen=${isModalOpen} onClose=${handleResultModalClose} result=${result} frameImages=${resultFrameImages} isDebugMode=${gameMode === 'debug'} />
    </div>
  `;
}

// ==================== 메인 메뉴 ====================

// 절차적 사고 설명 모달
function ProceduralThinkingModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return html`
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick=${onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-2xl w-full" onClick=${(e) => e.stopPropagation()}>
        <h2 className="text-2xl sm:text-3xl font-bold text-blue-800 mb-4 text-center">🧠 절차적 사고란?</h2>

        <div className="space-y-4 text-gray-700">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <p className="text-base sm:text-lg leading-relaxed">
              <strong className="text-blue-700">절차적 사고</strong>는 어떤 일을 해결하기 위해
              <strong className="text-blue-700"> 순서대로 단계를 나누어 생각</strong>하는 능력이에요.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">💡 왜 중요할까요?</h3>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">✓</span>
                <span className="text-sm sm:text-base">복잡한 문제를 작은 단계로 나누어 쉽게 해결할 수 있어요</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">✓</span>
                <span className="text-sm sm:text-base">올바른 순서를 지켜 효율적으로 일을 처리할 수 있어요</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">✓</span>
                <span className="text-sm sm:text-base">컴퓨터 프로그래밍의 기초가 되는 사고방식이에요</span>
              </li>
            </ul>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
            <h3 className="text-base sm:text-lg font-bold text-yellow-800 mb-2">🎯 실생활 예시</h3>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              양치질을 할 때도 절차적 사고를 사용해요!<br />
              <span className="text-yellow-700">① 칫솔에 치약 묻히기 → ② 이를 닦기 → ③ 물로 헹구기</span><br />
              이런 순서를 지키지 않으면 제대로 양치를 할 수 없겠죠? 😊
            </p>
          </div>
        </div>

        <button
          onClick=${onClose}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold text-base sm:text-lg transition-all"
        >
          이해했어요! 👍
        </button>
      </div>
    </div>
  `;
}

// 매뉴얼 모달
function ManualModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return html`
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick=${onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick=${(e) => e.stopPropagation()}>
        <h2 className="text-2xl sm:text-3xl font-bold text-purple-800 mb-4 text-center">📖 사용 매뉴얼</h2>

        <div className="space-y-5 text-gray-700">
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
            <h3 className="text-lg sm:text-xl font-bold text-purple-700 mb-2">🎓 학습 목표</h3>
            <p className="text-sm sm:text-base leading-relaxed">
              이 사이트는 <strong>절차적 사고력</strong>을 재미있는 게임을 통해 기를 수 있도록 만들어졌어요.
              일상생활에서 자주 하는 일들을 올바른 순서로 배열하며 논리적 사고력을 키울 수 있어요!
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">💡 이런 학습에 활용하세요!</h3>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">✓</span>
                <span className="text-sm sm:text-base"><strong>초등 실과 교과서 활용:</strong> 초등학교 실과 교과서(이춘식) 78-81쪽의 내용을 다루며, 교과서와 함께 체험하면 학습 효과가 더욱 좋아요!</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">✓</span>
                <span className="text-sm sm:text-base"><strong>절차적 사고 학습:</strong> 순차, 조건, 반복 등 프로그래밍의 기본 개념을 익힐 수 있어요</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">✓</span>
                <span className="text-sm sm:text-base"><strong>논리적 사고력 향상:</strong> 원인과 결과, 순서의 중요성을 경험하며 논리력을 키울 수 있어요</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">✓</span>
                <span className="text-sm sm:text-base"><strong>문제해결 능력:</strong> 실패와 성공을 반복하며 스스로 해결책을 찾는 능력을 기를 수 있어요</span>
              </li>
            </ul>
          </div>

          <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
            <h3 className="text-base sm:text-lg font-bold text-green-800 mb-2">🎮 게임 모드</h3>
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <p className="font-bold text-green-700 mb-1">📝 일반 모드</p>
                <ol className="space-y-1 ml-4 list-decimal text-sm sm:text-base">
                  <li>왼쪽 <strong>블록 꾸러미</strong>에서 필요한 블록을 선택하세요</li>
                  <li>드래그 앤 드롭 또는 더블클릭으로 <strong>실행 순서</strong>에 추가하세요</li>
                  <li>블록을 올바른 순서로 배열한 후 <strong>실행 버튼</strong>을 눌러보세요</li>
                  <li>결과를 보고 무엇이 잘못되었는지 생각해보세요</li>
                  <li>성공할 때까지 순서를 바꿔가며 도전하세요!</li>
                </ol>
              </div>
              <div className="bg-white rounded-lg p-3 border border-orange-200">
                <p className="font-bold text-orange-700 mb-1">🔧 오류수정 모드</p>
                <ol className="space-y-1 ml-4 list-decimal text-sm sm:text-base">
                  <li>이미 잘못된 코드가 준비되어 있어요</li>
                  <li>먼저 <strong>실패한 결과</strong>를 확인하고 무엇이 문제인지 생각해보세요</li>
                  <li><strong>🔧 코드 수정하기</strong> 버튼을 눌러 코드를 수정하세요</li>
                  <li>블록을 빼거나 순서를 바꿔 오류를 고쳐보세요</li>
                  <li>실행 버튼을 눌러 성공할 때까지 디버깅하세요!</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <h3 className="text-base sm:text-lg font-bold text-blue-800 mb-2">💡 팁</h3>
            <ul className="space-y-2 text-sm sm:text-base">
              <li>• 실제 상황을 상상하며 순서를 생각해보세요</li>
              <li>• 실패해도 괜찮아요! 실패에서 배우는 것이 더 많답니다</li>
              <li>• 라면 게임에서는 ⏱️ 버튼을 눌러 기다리는 시간을 조절할 수 있어요</li>
              <li>• <strong>오류수정 모드</strong>는 디버깅 능력을 키우는 좋은 연습이에요!</li>
            </ul>
          </div>
        </div>

        <button
          onClick=${onClose}
          className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold text-base sm:text-lg transition-all"
        >
          시작하기! 🚀
        </button>
      </div>
    </div>
  `;
}

function MainMenu({ onSelectGame }) {
  const [showProceduralModal, setShowProceduralModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);

  return html`
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 p-4 sm:p-6 md:p-8 flex items-center justify-center">
      <div className="max-w-5xl w-full mx-auto">
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-3 sm:mb-4 text-gray-800">
            🎮 <span
              className="cursor-pointer hover:text-blue-600 transition-colors border-b-2 border-dashed border-blue-400 hover:border-blue-600"
              onClick=${() => setShowProceduralModal(true)}
              title="클릭하여 절차적 사고에 대해 알아보기"
            >절차적 사고</span> 놀이터
          </h1>
          <p className="text-center text-gray-600 mb-4 text-base sm:text-lg md:text-xl px-4">
            순서를 생각하며 문제를 해결해보세요!
          </p>
          <button
            onClick=${() => setShowManualModal(true)}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-bold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            📖 사용 매뉴얼
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 px-2 sm:px-4">
          <div
            onClick=${() => onSelectGame('rainy-day')}
            className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-10 cursor-pointer transform transition-all hover:scale-105 active:scale-95 hover:shadow-2xl border-4 border-blue-200 min-h-[240px] sm:min-h-[260px] md:min-h-[280px] flex flex-col items-center justify-center"
          >
            <div className="text-5xl sm:text-6xl md:text-7xl text-center mb-3 sm:mb-4">🌧️</div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-2 sm:mb-3 text-gray-800">
              비오는날 등교 성공하기
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 text-center leading-relaxed">
              비 오는 날, 학교 가기 전 준비를 올바른 순서로 해보세요!
            </p>
          </div>

          <div
            onClick=${() => onSelectGame('ramen')}
            className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-10 cursor-pointer transform transition-all hover:scale-105 active:scale-95 hover:shadow-2xl border-4 border-orange-200 min-h-[240px] sm:min-h-[260px] md:min-h-[280px] flex flex-col items-center justify-center"
          >
            <div className="text-5xl sm:text-6xl md:text-7xl text-center mb-3 sm:mb-4">🍜</div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-2 sm:mb-3 text-gray-800">
              라면 끓이기 마스터
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 text-center leading-relaxed">
              맛있는 라면을 만들기 위한 올바른 순서를 찾아보세요!
            </p>
          </div>
        </div>

        <div className="text-center mt-8 sm:mt-12">
          <p className="text-xs sm:text-sm text-gray-500">
            made by 핑키네
          </p>
        </div>
      </div>

      <${ProceduralThinkingModal} isOpen=${showProceduralModal} onClose=${() => setShowProceduralModal(false)} />
      <${ManualModal} isOpen=${showManualModal} onClose=${() => setShowManualModal(false)} />
    </div>
  `;
}

// ==================== 메인 앱 ====================

function App() {
  const [currentGame, setCurrentGame] = useState(null);

  const handleSelectGame = (game) => {
    setCurrentGame(game);
  };

  const handleBack = () => {
    setCurrentGame(null);
  };

  if (currentGame === 'ramen') {
    return html`<${RamenGame} onBack=${handleBack} />`;
  }

  if (currentGame === 'rainy-day') {
    return html`<${RainyDayGame} onBack=${handleBack} />`;
  }

  return html`<${MainMenu} onSelectGame=${handleSelectGame} />`;
}

// ==================== 렌더링 ====================

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(html`<${App} />`);

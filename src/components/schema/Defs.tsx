/** Общие градиенты, узоры и фильтры для всех трёх моделей */
export function SchemaDefs() {
  return (
    <defs>
      <linearGradient id="kd-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f3f6f9" />
        <stop offset="1" stopColor="#dfe5eb" />
      </linearGradient>
      <linearGradient id="kd-ground" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#a8916b" />
        <stop offset="1" stopColor="#d9cdb6" />
      </linearGradient>
      {/* Корпус: классический жёлтый Komatsu с бликом сверху и затенением книзу */}
      <linearGradient id="kd-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffe680" />
        <stop offset="0.14" stopColor="#f7c21a" />
        <stop offset="0.62" stopColor="#e6a800" />
        <stop offset="1" stopColor="#a87200" />
      </linearGradient>
      <linearGradient id="kd-bodyH" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#a87000" />
        <stop offset="0.42" stopColor="#f8c51c" />
        <stop offset="0.7" stopColor="#e2a500" />
        <stop offset="1" stopColor="#9a6600" />
      </linearGradient>
      <linearGradient id="kd-top" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff4c2" />
        <stop offset="1" stopColor="#f0c13a" />
      </linearGradient>
      <linearGradient id="kd-dark" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#5b6169" />
        <stop offset="0.15" stopColor="#3b4046" />
        <stop offset="1" stopColor="#15171a" />
      </linearGradient>
      <linearGradient id="kd-darkH" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#16181b" />
        <stop offset="0.45" stopColor="#4a5057" />
        <stop offset="1" stopColor="#16181b" />
      </linearGradient>
      <radialGradient id="kd-smoke" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#5c5f63" stopOpacity="0.75" />
        <stop offset="1" stopColor="#8a8d91" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="kd-chrome" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.45" stopColor="#b8bec4" />
        <stop offset="0.6" stopColor="#6c737a" />
        <stop offset="1" stopColor="#e2e6ea" />
      </linearGradient>
      <linearGradient id="kd-barrel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#737a82" />
        <stop offset="0.35" stopColor="#3a3f45" />
        <stop offset="1" stopColor="#121416" />
      </linearGradient>
      <linearGradient id="kd-pipe" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#1c1f22" />
        <stop offset="0.4" stopColor="#7a828a" />
        <stop offset="1" stopColor="#1a1c1f" />
      </linearGradient>
      <linearGradient id="kd-steel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#c3c9cf" />
        <stop offset="1" stopColor="#5f666d" />
      </linearGradient>
      <linearGradient id="kd-shoe" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#4b5157" />
        <stop offset="1" stopColor="#1b1d20" />
      </linearGradient>
      <linearGradient id="kd-glass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#b9d7ef" stopOpacity="0.55" />
        <stop offset="0.5" stopColor="#5d8fb8" stopOpacity="0.28" />
        <stop offset="1" stopColor="#1e3a56" stopOpacity="0.55" />
      </linearGradient>
      <linearGradient id="kd-interior" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#30353a" />
        <stop offset="1" stopColor="#15171a" />
      </linearGradient>
      <linearGradient id="kd-screen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#1f7ac9" />
        <stop offset="1" stopColor="#0a2540" />
      </linearGradient>
      <linearGradient id="kd-beam" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#fff3bf" stopOpacity="0.55" />
        <stop offset="1" stopColor="#fff3bf" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="kd-beamL" x1="1" y1="0" x2="0" y2="0">
        <stop offset="0" stopColor="#fff3bf" stopOpacity="0.55" />
        <stop offset="1" stopColor="#fff3bf" stopOpacity="0" />
      </linearGradient>
      <radialGradient id="kd-wheel" cx="0.42" cy="0.38" r="0.7">
        <stop offset="0" stopColor="#7a8188" />
        <stop offset="0.6" stopColor="#30353a" />
        <stop offset="1" stopColor="#141618" />
      </radialGradient>
      <radialGradient id="kd-hub" cx="0.4" cy="0.35" r="0.7">
        <stop offset="0" stopColor="#c7cdd3" />
        <stop offset="1" stopColor="#3c4147" />
      </radialGradient>
      <radialGradient id="kd-shadow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#000" stopOpacity="0.45" />
        <stop offset="1" stopColor="#000" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="kd-lens" cx="0.4" cy="0.4" r="0.6">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.6" stopColor="#ffe8a3" />
        <stop offset="1" stopColor="#c99a2e" />
      </radialGradient>
      <pattern id="kd-hazard" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="10" height="10" fill="#1a1a1a" />
        <rect width="5" height="10" fill="#f2b705" />
      </pattern>
      <pattern id="kd-grid" width="6" height="6" patternUnits="userSpaceOnUse">
        <rect width="6" height="6" fill="#16181b" />
        <rect width="4" height="4" fill="#2c3136" />
      </pattern>
      <filter id="kd-drop" x="-10%" y="-10%" width="125%" height="135%">
        <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000" floodOpacity="0.35" />
      </filter>
      <filter id="kd-blur" x="-20%" y="-50%" width="140%" height="200%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
    </defs>
  );
}

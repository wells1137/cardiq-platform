export interface SignalWeightState {
  onCourt: number;
  offCourt: number;
  market: number;
}

export interface SignalSettings {
  weights: SignalWeightState;
  normalizedWeights: SignalWeightState;
  summary: string;
}

const DEFAULT_SIGNAL_WEIGHTS: SignalWeightState = {
  onCourt: 42,
  offCourt: 18,
  market: 40,
};

let currentWeights: SignalWeightState = { ...DEFAULT_SIGNAL_WEIGHTS };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeSignalWeights(weights: SignalWeightState): SignalWeightState {
  const safe = {
    onCourt: clamp(Number(weights.onCourt || 0), 0, 100),
    offCourt: clamp(Number(weights.offCourt || 0), 0, 100),
    market: clamp(Number(weights.market || 0), 0, 100),
  };
  const total = safe.onCourt + safe.offCourt + safe.market;
  if (total <= 0) {
    return { ...DEFAULT_SIGNAL_WEIGHTS };
  }
  return {
    onCourt: Number(((safe.onCourt / total) * 100).toFixed(1)),
    offCourt: Number(((safe.offCourt / total) * 100).toFixed(1)),
    market: Number(((safe.market / total) * 100).toFixed(1)),
  };
}

function buildSummary(weights: SignalWeightState) {
  const entries = [
    { key: "赛场", value: weights.onCourt },
    { key: "场外", value: weights.offCourt },
    { key: "市场", value: weights.market },
  ].sort((a, b) => b.value - a.value);
  return `当前 AI 分析权重：${entries[0].key} ${entries[0].value}% 为主，${entries[1].key} ${entries[1].value}% 次之，${entries[2].key} ${entries[2].value}% 辅助确认。`;
}

export function getSignalSettings(): SignalSettings {
  const normalizedWeights = normalizeSignalWeights(currentWeights);
  return {
    weights: { ...currentWeights },
    normalizedWeights,
    summary: buildSummary(normalizedWeights),
  };
}

export function getSignalWeights() {
  return getSignalSettings().normalizedWeights;
}

export function updateSignalSettings(weights: SignalWeightState): SignalSettings {
  currentWeights = {
    onCourt: clamp(Number(weights.onCourt || 0), 0, 100),
    offCourt: clamp(Number(weights.offCourt || 0), 0, 100),
    market: clamp(Number(weights.market || 0), 0, 100),
  };
  return getSignalSettings();
}

export function resetSignalSettings(): SignalSettings {
  currentWeights = { ...DEFAULT_SIGNAL_WEIGHTS };
  return getSignalSettings();
}

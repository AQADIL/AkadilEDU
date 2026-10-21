export function lessonPlaybackProgress(
  position,
  duration,
  previouslyCompleted = false,
  ended = false,
) {
  const value = Number(position);
  const timestamp = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  const total = Number(duration);
  const ratio = Number.isFinite(total) && total > 0 ? Math.min(1, timestamp / total) : 0;
  return {
    timestamp,
    percent: ended ? 100 : Math.round(ratio * 100),
    completed: previouslyCompleted || ended || ratio >= 0.95,
  };
}

export function playbackStartTime(search, progress) {
  const parameter = new URLSearchParams(search).get('t');
  const requested = parameter == null ? NaN : Number(parameter);
  if (Number.isFinite(requested) && requested >= 0) return requested;
  if (progress?.completed) return 0;
  const saved = Number(progress?.timestamp);
  return Number.isFinite(saved) && saved > 0 ? saved : 0;
}

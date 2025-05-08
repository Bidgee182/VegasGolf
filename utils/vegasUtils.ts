export const TEAM_A = [0, 1];
export const TEAM_B = [2, 3];

export function applyVegasScoring(
  scores: string[],
  players: string[],
  currentHole: number
) {
  const original = [...scores];
  let notes: string[] = [];

  const s = scores.map((val) => parseInt(val) || 0);
  const fourPointerIndex = s.findIndex((val) => val === 4);

  if (fourPointerIndex !== -1) {
    const opposingTeam = TEAM_A.includes(fourPointerIndex) ? TEAM_B : TEAM_A;
    const maxIdx =
      s[opposingTeam[0]] > s[opposingTeam[1]] ? opposingTeam[0] : opposingTeam[1];
    s[maxIdx] = 0;
    notes.push("4-point eraser used");
  }

  const teamA =
    s[TEAM_A[0]] > s[TEAM_A[1]]
      ? `${s[TEAM_A[0]]}${s[TEAM_A[1]]}`
      : `${s[TEAM_A[1]]}${s[TEAM_A[0]]}`;
  const teamB =
    s[TEAM_B[0]] > s[TEAM_B[1]]
      ? `${s[TEAM_B[0]]}${s[TEAM_B[1]]}`
      : `${s[TEAM_B[1]]}${s[TEAM_B[0]]}`;

  let aVal = parseInt(teamA, 10);
  let bVal = parseInt(teamB, 10);

  if (aVal > bVal && Math.max(s[0], s[1]) > Math.max(s[2], s[3])) {
    bVal = parseInt(teamB.split("").reverse().join(""), 10);
    notes.push("High ball flip applied to Team 2");
  } else if (bVal > aVal && Math.max(s[2], s[3]) > Math.max(s[0], s[1])) {
    aVal = parseInt(teamA.split("").reverse().join(""), 10);
    notes.push("High ball flip applied to Team 1");
  }

  const winner =
    aVal > bVal
      ? `${players[0]} & ${players[1]}`
      : bVal > aVal
      ? `${players[2]} & ${players[3]}`
      : "Drawn hole";

  const value = Math.abs(aVal - bVal);
  const result = `Hole ${currentHole}: ${winner}, ${aVal} vs ${bVal}, worth $${value}${
    notes.length ? " (" + notes.join("; ") + ")" : ""
  }`;

  return { result, aVal, bVal, value };
}

export function getNextHole(
  current: number,
  played: number[],
  total: number
): number | null {
  if (played.length >= total) return null;

  let next = current + 1;
  if (next > 18) next = 1;

  let attempts = 0;
  while (played.includes(next) && attempts < 18) {
    next++;
    if (next > 18) next = 1;
    attempts++;
  }

  return next;
}

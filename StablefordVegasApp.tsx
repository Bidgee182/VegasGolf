"use client";

import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectItem, SelectContent, SelectTrigger } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { applyVegasScoring, getNextHole, TEAM_A, TEAM_B } from "@/utils/vegasUtils";

export default function StablefordVegasApp() {
  const inputRefs = [
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
  ];
  
  const [players, setPlayers] = useState<string[]>(["", "", "", ""]);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [playersEntered, setPlayersEntered] = useState<boolean>(false);
  const [scoreErrors, setScoreErrors] = useState<string[]>(["", "", "", ""]);
  const [startingHole, setStartingHole] = useState<number>(1);
  const [totalHoles, setTotalHoles] = useState<number>(18);
  const [scores, setScores] = useState<string[][]>(
    Array.from({ length: 18 }, () => ["", "", "", ""])
  );
  const [playedHoles, setPlayedHoles] = useState<number[]>([]);
  const [currentHole, setCurrentHole] = useState<number>(1);
  const [holeResults, setHoleResults] = useState<string[]>([]);
  const [teamTotals, setTeamTotals] = useState<{ teamA: number; teamB: number }>({
    teamA: 0,
    teamB: 0,
  });
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [gameFinished, setGameFinished] = useState<boolean>(false);

  const handlePlayerSubmit = () => {
    if (players.some((p) => p === "")) return alert("Enter all player names");
    setPlayersEntered(true);
  };

  const updateScore = (index: number, value: string) => {
    const num = parseInt(value, 10);
    const updatedErrors = [...scoreErrors];
  
    if (isNaN(num) || num < 0 || num > 5) {
      updatedErrors[index] = "Score must be between 0 and 5";
      setScoreErrors(updatedErrors);
      return;
    }
  
    updatedErrors[index] = "";
    setScoreErrors(updatedErrors);
  
    const newScores = scores.map((s, idx) =>
      idx === currentHole - 1 ? [...s.slice(0, index), value, ...s.slice(index + 1)] : s
    );
    setScores(newScores);
  
    // Auto-focus next input if any
    if (index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };
  
  
  

  const calculateHoleResult = () => {
    const scoreRow = scores[currentHole - 1];
    const { result, aVal, bVal, value } = applyVegasScoring(scoreRow, players, currentHole);
    setHoleResults((prev) => [...prev, result]);

    if (aVal > bVal) {
      setTeamTotals((prev) => ({ ...prev, teamA: prev.teamA + value }));
    } else if (bVal > aVal) {
      setTeamTotals((prev) => ({ ...prev, teamB: prev.teamB + value }));
    }
  };

  const prevHole = () => {
    if (playedHoles.length === 0 || holeResults.length === 0) return;

    const updatedPlayed = [...playedHoles];
    const lastHole = updatedPlayed.pop();
    const lastResult = holeResults[holeResults.length - 1];

    if (lastResult) {
      const valueMatch = lastResult.match(/\$([0-9]+)/);
      const value = valueMatch ? parseInt(valueMatch[1], 10) : 0;

      const isTeamAWin = lastResult.includes(players[0]) && lastResult.includes(players[1]);
      const isTeamBWin = lastResult.includes(players[2]) && lastResult.includes(players[3]);

      if (isTeamAWin) {
        setTeamTotals((prev) => ({ ...prev, teamA: prev.teamA - value }));
      } else if (isTeamBWin) {
        setTeamTotals((prev) => ({ ...prev, teamB: prev.teamB - value }));
      }
    }

    setPlayedHoles(updatedPlayed);
    setHoleResults((prev) => prev.slice(0, -1));
    setCurrentHole(lastHole ?? startingHole);
  };

  const roundOptions: Record<string, { start: number; holes: number }> = {
    "18-1": { start: 1, holes: 18 },
    "18-10": { start: 10, holes: 18 },
    "9-1": { start: 1, holes: 9 },
    "9-10": { start: 10, holes: 9 },
  };

  return (
    <div className="p-4 space-y-4">
      {!playersEntered ? (
        <Card>
          <CardContent className="space-y-4">
            <h2 className="text-xl font-bold">Player Setup</h2>
            <div className="bg-blue-700 text-white p-2 rounded">
              <h3 className="text-lg font-semibold">Team 1</h3>
              <div className="bg-blue-100 text-blue-900 p-2 rounded mt-2 space-y-2">
                {TEAM_A.map((idx) => (
                  <Input
                    key={idx}
                    placeholder={`Player ${idx + 1} Name`}
                    value={players[idx]}
                    onChange={(e) => {
                      const newPlayers = [...players];
                      newPlayers[idx] = e.target.value;
                      setPlayers(newPlayers);
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="bg-red-700 text-white p-2 rounded">
              <h3 className="text-lg font-semibold">Team 2</h3>
              <div className="bg-red-100 text-red-900 p-2 rounded mt-2 space-y-2">
                {TEAM_B.map((idx) => (
                  <Input
                    key={idx}
                    placeholder={`Player ${idx + 1} Name`}
                    value={players[idx]}
                    onChange={(e) => {
                      const newPlayers = [...players];
                      newPlayers[idx] = e.target.value;
                      setPlayers(newPlayers);
                    }}
                  />
                ))}
              </div>
            </div>
            <Button onClick={handlePlayerSubmit} disabled={players.some((p) => p === "")}>
              Next
            </Button>
          </CardContent>
        </Card>
      ) : !gameStarted ? (
        <Card>
          <CardContent className="space-y-4">
            <h2 className="text-xl font-bold">Choose Round Type</h2>
            <Select
              onValueChange={(val) => {
                const config = roundOptions[val];
                if (config) {
                  setStartingHole(config.start);
                  setTotalHoles(config.holes);
                  setCurrentHole(config.start);
                  setGameStarted(true);
                  setPlayedHoles([config.start]);
                }
              }}
            >
              <SelectTrigger className="w-full">Select round type</SelectTrigger>
              <SelectContent>
                <SelectItem value="18-1">18 Holes (Start at 1)</SelectItem>
                <SelectItem value="18-10">18 Holes (Start at 10)</SelectItem>
                <SelectItem value="9-1">9 Holes (1–9)</SelectItem>
                <SelectItem value="9-10">9 Holes (10–18)</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      ) : gameFinished ? (
        <Card>
    <CardContent className="space-y-4">
      <h2 className="text-xl font-bold text-center">Final Result</h2>

      {/* ✅ Final result summary */}
      <div className="px-4 sm:px-8 max-w-full">
        <div className="text-center text-lg space-y-2">
          {teamTotals.teamA > teamTotals.teamB && (
            <>
              <div className="text-blue-700 font-bold text-xl">
                🏆 {players[0]} & {players[1]} win!
              </div>
              <div className="text-gray-800">
                💰 Margin: ${teamTotals.teamA - teamTotals.teamB}
              </div>
            </>
          )}
          {teamTotals.teamB > teamTotals.teamA && (
            <>
              <div className="text-red-700 font-bold text-xl">
                🏆 {players[2]} & {players[3]} win!
              </div>
              <div className="text-gray-800">
                💰 Margin: ${teamTotals.teamB - teamTotals.teamA}
              </div>
            </>
          )}
          {teamTotals.teamA === teamTotals.teamB && (
            <div className="text-black font-semibold text-xl">🤝 It's a tie!</div>
          )}
        </div>
      </div>

      {/* ✅ Control buttons */}
      <div className="flex justify-center gap-4 flex-wrap">
        <Button variant="outline" onClick={() => { setGameFinished(false); prevHole(); }}>
          Go Back to Last Hole
        </Button>
        <Button onClick={() => setShowSummary(true)}>Scorecard</Button>
        <Button onClick={() => window.location.reload()}>Start New Game</Button>
      </div>

      {/* ✅ Scorecard (if toggled on) */}
      {showSummary && (
        <div>
          <h3 className="text-lg font-semibold mt-4 mb-2">Game Summary</h3>
          <div className="overflow-x-auto w-full">
            <table className="min-w-[600px] text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-1 sm:p-2">Hole</th>
                  {players.map((p, idx) => (
                    <th
                      key={idx}
                      className={`border p-1 sm:p-2 ${
                        idx < 2 ? "bg-blue-100 text-blue-900" : "bg-red-100 text-red-900"
                      }`}
                    >
                      {p}
                    </th>
                  ))}
                  <th className="border p-1 sm:p-2">Running Total</th>
                  <th className="border p-1 sm:p-2">Vegas Result</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let runningTotal = 0;

                  return playedHoles.map((hole, i) => {
                    const scoresRow = scores[hole - 1];
                    const result = holeResults[i];

                    const valueMatch = result.match(/\$([0-9]+)/);
                    const value = valueMatch ? parseInt(valueMatch[1], 10) : 0;

                    const teamWon = result.includes(players[0]) && result.includes(players[1])
                      ? "A"
                      : result.includes(players[2]) && result.includes(players[3])
                      ? "B"
                      : null;

                    if (teamWon === "A") runningTotal += value;
                    else if (teamWon === "B") runningTotal -= value;

                    const runningClass =
                      runningTotal > 0
                        ? "text-blue-700 font-semibold"
                        : runningTotal < 0
                        ? "text-red-700 font-semibold"
                        : "text-gray-700";

                    const vegasResult = result.includes("Drawn hole") ? result : `⛳ ${result}`;

                    return (
                      <tr key={hole} className="odd:bg-gray-50">
                        <td className="border p-1 sm:p-2 text-center">{hole}</td>
                        {scoresRow.map((score, idx) => (
                          <td
                            key={idx}
                            className={`border p-1 sm:p-2 text-center ${
                              idx < 2 ? "bg-blue-50" : "bg-red-50"
                            }`}
                          >
                            {score}
                          </td>
                        ))}
                        <td className={`border p-1 sm:p-2 text-center ${runningClass}`}>
                          {runningTotal > 0
                            ? `${players[0]} & ${players[1]} lead by $${runningTotal}`
                            : runningTotal < 0
                            ? `${players[2]} & ${players[3]} lead by $${Math.abs(runningTotal)}`
                            : "Match tied"}
                        </td>
                        <td className="border p-1 sm:p-2 text-left">{vegasResult}</td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </CardContent>
  </Card>
      ) : (
        <Card>
          <CardContent className="space-y-4">
            <h2 className="text-xl font-bold">Hole {currentHole}</h2>
            <Progress value={Math.round((playedHoles.length / totalHoles) * 100)} />
            {players.map((player, idx) => (
  <div key={idx} className="space-y-1">
    <div key={idx} className="space-y-1">
  <Input
    inputMode="numeric"
    pattern="[0-9]*"
    type="text"
    ref={inputRefs[idx]}
    placeholder={`${player}'s Stableford Points`}
    value={scores[currentHole - 1][idx]}
    onChange={(e) => updateScore(idx, e.target.value)}
  />
  {scoreErrors[idx] && (
    <p className="text-sm text-red-600">{scoreErrors[idx]}</p>
  )}
</div>

    {scoreErrors[idx] && (
      <p className="text-sm text-red-600">{scoreErrors[idx]}</p>
    )}
  </div>
))}

            <div className="flex gap-2">
              <Button variant="outline" onClick={prevHole}>Back</Button>
              <Button
                onClick={() => {
                  if (scores[currentHole - 1].some((score) => score === "")) {
                    alert("Enter all 4 scores before proceeding");
                    return;
                  }

                  calculateHoleResult();
                  if (!playedHoles.includes(currentHole)) {
                    setPlayedHoles([...playedHoles, currentHole]);
                  }

                  if (playedHoles.length + 1 >= totalHoles) {
                    setGameFinished(true);
                    return;
                  }

                  const next = getNextHole(currentHole, playedHoles, totalHoles);
                  if (next !== null) {
                    setCurrentHole(next);
                  }
                }}
              >
                Next
              </Button>
            </div>
            <div className="space-y-1 text-sm">
            {holeResults.length > 0 && (
  <div className="mt-2 bg-gray-50 p-3 rounded border text-sm space-y-1">
    {(() => {
      const lastResult = holeResults[holeResults.length - 1];
      const result = lastResult || "";
      const valueMatch = result.match(/\$([0-9]+)/);
      const value = valueMatch ? parseInt(valueMatch[1], 10) : 0;
      const aVal = parseInt(result.match(/, (\d+)/)?.[1] || "0", 10);
      const bVal = parseInt(result.match(/vs (\d+)/)?.[1] || "0", 10);
      const teamWon =
        result.includes(players[0]) && result.includes(players[1])
          ? "A"
          : result.includes(players[2]) && result.includes(players[3])
          ? "B"
          : null;
      const notes = result.includes("(")
        ? result.split("(")[1].replace(")", "")
        : "";

      return teamWon ? (
        <div className="space-y-1">
          <div>
            ⛳{" "}
            <span
              className={`font-bold ${
                teamWon === "A" ? "text-blue-700" : "text-red-700"
              }`}
            >
              {teamWon === "A"
                ? `${players[0]} & ${players[1]}`
                : `${players[2]} & ${players[3]}`}
            </span>{" "}
            win
          </div>
          <div>🏁 Score: {aVal} vs {bVal}</div>
          <div>💰 Value: ${value}</div>
          {notes && <div>📝 Note: {notes}</div>}
        </div>
      ) : (
        <div>⛳ Drawn hole</div>
      );
    })()}
    <div
      className={`font-bold mt-2 ${
        teamTotals.teamA > teamTotals.teamB
          ? "text-blue-700"
          : teamTotals.teamB > teamTotals.teamA
          ? "text-red-700"
          : "text-black"
      }`}
    >
      {teamTotals.teamA > teamTotals.teamB
        ? `${players[0]} & ${players[1]} lead by $${teamTotals.teamA - teamTotals.teamB}`
        : teamTotals.teamB > teamTotals.teamA
        ? `${players[2]} & ${players[3]} lead by $${teamTotals.teamB - teamTotals.teamA}`
        : "The match is currently tied."}
    </div>
  </div>
)}

            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

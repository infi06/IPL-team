const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB error:${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//get state API
app.get("/players/", async (request, response) => {
  const getStateQuery = `
    SELECT *
    FROM player_details
    ORDER BY player_id`;
  const playerList = await db.all(getStateQuery);
  response.send(
    playerList.map((eachPlayer) => ({
      playerId: eachPlayer.player_id,
      playerName: eachPlayer.player_name,
    }))
  );
});

//get movieId API
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerValueQuery = `
    SELECT *
    FROM 
    player_details
    WHERE player_id=${playerId};`;
  const playerList = await db.get(getPlayerValueQuery);
  response.send({
    playerId: playerList.player_id,
    playerName: playerList.player_name,
  });
});

//update player API

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerLatest = request.body;
  const { playerName } = playerLatest;
  const updatePlayerQuery = `
    UPDATE player_details
    SET 
     player_name='${playerName}'
    WHERE 
      player_id = ${playerId};`;
  const playerInform = await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//get movieId API
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchValueQuery = `
    SELECT *
    FROM 
    match_details
    WHERE match_id=${matchId};`;
  const matchList = await db.get(getMatchValueQuery);
  response.send({
    matchId: matchList.match_id,
    match: matchList.match,
    year: matchList.year,
  });
});

// convert get maych
const convertDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
// convert get player
const convertDbObjectToPlayer = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

//get state API
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getAllMatchQuery = `
    SELECT *
    FROM player_match_score
    NATURAL JOIN match_details
    WHERE player_id=${playerId}`;
  const matchList = await db.all(getAllMatchQuery);
  response.send(
    matchList.map((eachMatch) => convertDbObjectToResponseObject(eachMatch))
  );
});

// get players api

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getAllMatchQuery = `
    SELECT *
    FROM player_match_score
    NATURAL JOIN player_details
    WHERE match_id=${matchId}`;
  const matchList = await db.all(getAllMatchQuery);
  response.send(
    matchList.map((eachMatch) => convertDbObjectToPlayer(eachMatch))
  );
});

// total score

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
  const score = await db.get(getPlayerScored);
  response.send({
    playerId: score.playerId,
    playerName: score.playerName,
    totalScore: score.totalScore,
    totalFours: score.totalFours,
    totalSixes: score.totalSixes,
  });
});

module.exports = app;

new Vue({
      el: "#app",
      data: {
          gamePhase: "setup",
          playerCount: 5,
          spiesCount: 2,
          merlin: false,
          mordred: false,
          lovers: false,
          oberon: false,
          forthSpecialRound: false,
          players: [], // {name: "player", role: "Spy", subrole: "Merlin"}
          roleHint: "",
          currentPlayerIndex: 0,
          roleRevealed: false,
          currentLeader: 0,
          currentRound: 1,
          consecutiveRejections: 0,
          maxConsecutiveRejections: 5,
          missionSizes: [2, 3, 2, 3, 3], // for 5 players
          missionResults: [null, null, null, null, null],
          missionPlayers: [], // current mission players
          currentMissionPlayerIndex: 0,
          pastMissionPlayers: [],
          missionActionDone: false,
          gameResult: "",
          missionVotes: {
         success: 0,
         fail: 0,
          },
          pastMissionVotes: [],
          // end game choosing
          chosenLovers: [],
          chosenMerlin: -1,
      },
      computed: {
          allPlayersNamed() {
         let all_names_present = this.players.every(
             (player) => player.name.trim() !== "",
         );
         // return all_names_present;
         // check if there is enough player for merlin mordred lovers
         let enough_roles = true;
         let special_spies = 0;
         let special_good = 0;
         if (this.mordred) {
             special_spies++;
         };
         if (this.merlin) {
             special_spies++;
             special_spies++;
             special_good++;
             special_good++;
         };
         if (this.oberon) {
             special_spies++;
         };
         if (this.lovers) {
             special_good++;
             special_good++;
         }
         if (special_spies > this.spiesCount) {
             enough_roles = false;
         };
         if (special_good > this.playerCount - this.spiesCount) {
             enough_roles = false;
         };
         return all_names_present && enough_roles;
          },
          currentPlayer() {
         return this.players[this.currentPlayerIndex];
          },
          currentMissionPlayer() {
         return this.missionPlayers[
             this.currentMissionPlayerIndex
         ];
          },
          boxes() {
         const blueBoxes = Array(this.missionVotes.success).fill({ color: 'blue' });
         const redBoxes = Array(this.missionVotes.fail).fill({ color: 'red' });
         return [...redBoxes, ...blueBoxes];
          },
      },
      methods: {
          generatePlayerInputs() {
         // if players not empty don't regenerate
         if (this.players.length === this.playerCount) {
             this.players = Array(this.playerCount)
            .fill()
            .map((_, i) => ({
                name: `${this.players[i].name}`,
                role: "",
            }));
         } else {
             this.players = Array(this.playerCount)
            .fill()
            .map((_, i) => ({
                // TODO: change to blank names when depolying
                name: `Player ${i + 1}`,
                role: "",
            }));
         }
         this.setMissionSizes();
          },
          setMissionSizes() {
         const num_players = this.players.length;
         const missionSizes = {
             5: [2, 3, 2, 3, 3] ,
             6: [2, 3, 4, 3, 4] ,
             7: [2, 3, 3, 4, 4] ,
             8: [3, 4, 4, 5, 5] ,
             9: [3, 4, 4, 5, 5] ,
             10: [3, 4, 4, 5, 5],
         };
         this.missionSizes = missionSizes[num_players];
         const spiesCount = {
             5: 2,
             6: 2, 
             7: 3,
             8: 3,
             9: 3,
             10: 4,
         };
         this.spiesCount = spiesCount[num_players];
         this.playerCount = num_players;

         const specialRounds = {
             5: false,
             6: false,
             7: true,
             8: true,
             9: true,
             10:true,
         }
         this.forthSpecialRound = specialRounds[num_players];
          },
          startRoleReveal() {
         let spyCount = this.spiesCount;
         let goodGuyCount = this.playerCount - spyCount;

         let roles = [];
         if (this.merlin ) {
             spyCount--;
             spyCount--;
             goodGuyCount--;
             goodGuyCount--;
             roles.push({"role": "Spy", "speciality": "Morgana"});
             roles.push({"role": "Spy", "speciality": "Assassin"});

             roles.push({"role": "Good Guy", "speciality": "Merlin"});
             roles.push({"role": "Good Guy", "speciality": "Percival"});
         };
         if (this.mordred) {
             spyCount--;
             roles.push({"role": "Spy", "speciality": "Mordred"});
         };
         if (this.lovers ){
             goodGuyCount--;
             goodGuyCount--;
             roles.push({"role": "Good Guy", "speciality": "Lover"});
             roles.push({"role": "Good Guy", "speciality": "Lover"});
         };
         if (this.oberon){
             spyCount--;
             roles.push({"role": "Spy", "speciality": "Oberon"});
         };

         // ordinary bad, ordinary good
         for (let i = 0; i < spyCount; i++) {
             roles.push({"role": "Spy", "speciality": ""});
         };
         for (let i = 0; i < goodGuyCount; i++) {
             roles.push({"role": "Good Guy", "speciality": ""});
         };

         // shuffle
         for (let i = roles.length - 1; i > 0; i--) {
             const j = Math.floor(Math.random() * (i + 1));
             [roles[i], roles[j]] = [roles[j], roles[i]];
         };

         this.players.forEach(
             (player, index) => {
            player.role = roles[index].role; 
            player.speciality=roles[index].speciality 
             }
         );
         this.gamePhase = "role-reveal";
         this.currentPlayerIndex = 0;
         this.roleRevealed = false;
          },
          revealRole() {
         this.roleRevealed = true;
         this.otherRoles();
          },
          otherRoles(){
         let isSpy = this.currentPlayer.role === "Spy";
         let otherSpies = this.players.filter(player => player.role === "Spy" && player !== this.currentPlayer && player.speciality !== "Oberon");
         let visibleSpies = this.players.filter(player => player.role === "Spy" && player !== this.currentPlayer && (player.speciality !== "Mordred" || player.speciality !== "Oberon"));
         let merlinAndMorgana = this.players.filter(player => player.speciality === "Merlin" || player.speciality === "Morgana");
         let otherLover = this.players.filter(player => player.speciality === "Lover" && player !== this.currentPlayer);
         let displayRole = this.currentPlayer.speciality === "" ? this.currentPlayer.role : this.currentPlayer.speciality;
         let roleHint = "Your role is: <strong>" + displayRole + "</strong>";

         let secondaryHint = ""
         if (this.currentPlayer.speciality === "Lover") {
             secondaryHint = "<br>Other lover is: <strong>" + otherLover[0].name + "</strong>";
         }  
         if (this.currentPlayer.speciality === "Merlin") {
             secondaryHint = "<br>Spies are: <strong>" + visibleSpies.map(player => player.name).join(", ") + "</strong>";
         }  
         if (this.currentPlayer.speciality === "Percival") {
             secondaryHint = "<br>Merlin and Morgana are: <strong>" + merlinAndMorgana.map(player => player.name).join(", ") + "</strong>";
         }
         if (this.currentPlayer.role == "Spy") {
             secondaryHint = "<br>Other Spies are: <strong>" + otherSpies.map(player => player.name).join(", ") + "</strong>";
         }

         this.roleHint = roleHint + secondaryHint;
          },
          nextPlayer() {
         this.currentPlayerIndex++;
         this.roleRevealed = false;
         if (this.currentPlayerIndex >= this.players.length) {
             this.startGame();
         }
          },
          startGame() {
         this.gamePhase = "team-selection";
         this.currentLeader = Math.floor(
             Math.random() * this.playerCount,
         );
          },
          togglePlayerSelection(index) {
         if (this.missionPlayers.includes(index)) {
             this.missionPlayers = this.missionPlayers.filter(
            (i) => i !== index,
             );
         } else if (
             this.missionPlayers.length <
             this.missionSizes[this.currentRound - 1]
         ) {
             this.missionPlayers.push(index);
         }
          },
          proposeTeam() {
         this.gamePhase = "team-voting";
          },
          voteForTeam(approve) {
         if (approve) {
             this.consecutiveRejections = 0;
             this.gamePhase = "mission";
             this.missionVotes = { success: 0, fail: 0 };
         } else {
             this.consecutiveRejections++;
             if (this.consecutiveRejections === this.maxConsecutiveRejections) {
            this.gameOver("Spies win!");
             } else {
             this.nextLeader();
             }
         }
          },
          missionVote(playerIndex, success) {
         const isSpy = this.players[playerIndex].role === "Spy";
         const isResistance = !isSpy;
         success = isResistance ? true : success;
         if (success) {
             this.missionVotes.success++;
         } else {
             this.missionVotes.fail++;
         }
         if (
             this.missionVotes.success +
            this.missionVotes.fail ===
             this.missionPlayers.length
         ) {
             this.resolveMission();
         }
         else {
             this.currentMissionPlayerIndex++;
         }
          },
          resolveMission() {
         this.pastMissionVotes.push(structuredClone(this.missionVotes));

         let missionSuccess = this.missionVotes.fail === 0;
         if (this.currentRound === 4 && this.forthSpecialRound ) {
             missionSuccess = this.missionVotes.fail <= 1;
         }

         this.currentMissionPlayerIndex = 0;
         this.missionResults[this.currentRound - 1] =
             missionSuccess;
         if (this.missionResults.filter(Boolean).length === 3) {
             if (this.merlin) {
            this.gamePhase = "choose-merlin";
             }
             else {
            this.gameOver("Good guys win!");
             }
         } else if (
             this.missionResults.filter(
            (result) => result === false,
             ).length === 3
         ) {
             this.gameOver("Spies win!");
         } else {
             this.gamePhase = "mission-revealing";
         }
          },
          revealMissionResults() {
         this.gamePhase = "mission-revealed";
          },
          doneViewingMissionResults() {
         this.nextRound();
          },
          nextLeader() {
         this.currentLeader =
             (this.currentLeader + 1) % this.playerCount;
         this.gamePhase = "team-selection";
         this.pastMissionPlayers.push(
             this.missionPlayers.slice());
         this.missionPlayers = [];
          },
          nextRound() {
         this.currentRound++;
         this.nextLeader();
          },

          toggleEndGameChoosing(){
         if (this.gamePhase === "choose-merlin") {
             this.gamePhase = "choose-lovers";
             this.chosenMerlin = -1;
         } else {
             this.gamePhase = "choose-merlin";
             this.chosenLovers = [];
         }
          },
          toggleMerlinSelection(index) {
         this.chosenMerlin = index;
          },
          proposeMerlinSelection() {
         if (this.players[this.chosenMerlin].speciality !== "Merlin") {
             this.gameOver("Good guys win! Wrong Merlin chosen");
         } else {
             this.gameOver("Spies win! Merlin found");
         }
          },
          toggleLoversSelection(index) {
         if (this.chosenLovers.includes(index)) {
             this.chosenLovers = this.chosenLovers.filter(
            (i) => i !== index,
             );
         } else if (
             this.chosenLovers.length < 2
         ) {
             this.chosenLovers.push(index);
         }
          },
          proposeLoversSelection() {
         correctLoverChosen = this.players[this.chosenLovers[0]].speciality === "Lover" && this.players[this.chosenLovers[1]].speciality === "Lover";
         if (correctLoverChosen) {
             this.gameOver("Spies win! Lovers found");
         }
         else {
             this.gameOver("Good guys win! Wrong Lovers chosen");
         }
          },
          gameOver(result) {
         this.gameResult = result;
         this.gamePhase = "game-over";
          },
          resetGame() {
         // Object.assign(this.$data, this.$options.data());
         this.gamePhase = "setup";
         this.consecutiveRejections = 0;
         this.currentRound = 1;
         this.pastMissionPlayers = [];
         this.pastMissionVotes = [];
         this.missionResults= [null, null, null, null, null];
         this.missionPlayers= [];
         this.currentMissionPlayerIndex= 0;
         this.missionActionDone = false;
         this.gameResult = "";
         this.missionVotes = {success:0, fail: 0};
         this.chosenMerlin = -1;
         this.chosenLovers = [];

         this.generatePlayerInputs();
          },
      },
      mounted() {
          this.generatePlayerInputs();
      },
});

window.addEventListener('beforeunload', function (e) {
  // Cancel the event
  e.preventDefault(); // If you prevent default behavior in Mozilla Firefox prompt will always be shown
  // Chrome requires returnValue to be set
  e.returnValue = '';
});

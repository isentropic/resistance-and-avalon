import { createApp, ref, watch, computed } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';

// Define the game-setup component
const gameSetup = {
    template: '#game-setup-template',
    props: ['players', 'playerCount', 'merlin', 'mordred', 'lovers', 'oberon', 'allPlayersNamed'],
    setup(props, { emit }) {
        const localPlayerCount = ref(props.playerCount);
        const localMerlin = ref(props.merlin);
        const localMordred = ref(props.mordred);
        const localLovers = ref(props.lovers);
        const localOberon = ref(props.oberon);

        watch(localPlayerCount, (newVal) => {
            emit('update-player-count', newVal);
        });

        watch(localMerlin, (newVal) => {
            emit('update-merlin', newVal);
        });

        watch(localMordred, (newVal) => {
            emit('update-mordred', newVal);
        });

        watch(localLovers, (newVal) => {
            emit('update-lovers', newVal);
        });

        watch(localOberon, (newVal) => {
            emit('update-oberon', newVal);
        });

        const generatePlayerInputs = () => {
            emit('generate-player-inputs', localPlayerCount.value);
        };

        const startRoleReveal = () => {
            emit('start-role-reveal', {
                merlin: localMerlin.value,
                mordred: localMordred.value,
                lovers: localLovers.value,
                oberon: localOberon.value,
            });
        };

        return {
            localPlayerCount,
            localMerlin,
            localMordred,
            localLovers,
            localOberon,
            generatePlayerInputs,
            startRoleReveal,
        };
    },
};

// Create Vue app
const app = createApp({
    setup() {
        const gamePhase = ref("setup");
        const playerCount = ref(5);
        const spiesCount = ref(2);
        const merlin = ref(false);
        const mordred = ref(false);
        const lovers = ref(false);
        const oberon = ref(false);
        const forthSpecialRound = ref(false);
        const players = ref([]); // {name: "player", role: "Spy", subrole: "Merlin"}
        const roleHint = ref("");
        const currentPlayerIndex = ref(0);
        const roleRevealed = ref(false);
        const currentLeader = ref(0);
        const currentRound = ref(1);
        const consecutiveRejections = ref(0);
        const maxConsecutiveRejections = ref(5);
        const missionSizes = ref([2, 3, 2, 3, 3]); // for 5 players
        const missionResults = ref([null, null, null, null, null]);
        const missionPlayers = ref([]); // current mission players
        const missionVotes = ref({ success: 0, fail: 0 }); 
        const pastMissionVotes = ref([]); 
        const pastMissionPlayers = ref([]);
        const currentMissionPlayerIndex = ref(0);
        const chosenMerlin = ref(-1);
        const chosenLovers = ref(-1);
        const gameResult = ref("");

        const allPlayersNamed = computed(() => {
            let all_names_present = players.value.every(
                (player) => player.name.trim() !== ""
            );

            let enough_roles = true;
            let special_spies = 0;
            let special_good = 0;
            if (mordred.value) {
                special_spies++;
            }
            if (merlin.value) {
                special_spies++;
                special_spies++;
                special_good++;
                special_good++;
            }
            if (oberon.value) {
                special_spies++;
            }
            if (lovers.value) {
                special_good++;
                special_good++;
            }
            if (special_spies > spiesCount.value) {
                enough_roles = false;
            }
            if (special_good > playerCount.value - spiesCount.value) {
                enough_roles = false;
            }
            return all_names_present && enough_roles;
        });

        const currentPlayer = computed(() => players.value[currentPlayerIndex.value]);
        const currentMissionPlayer = computed(() => missionPlayers.value[currentMissionPlayerIndex.value]);
        const boxes = computed(() => {
            const blueBoxes = Array(missionVotes.value.success).fill({ color: 'blue' });
            const redBoxes = Array(missionVotes.value.fail).fill({ color: 'red' });
            return [...redBoxes, ...blueBoxes];
        });

        const generatePlayerInputs = () => {
            if (players.length === playerCount.value) {
                players.value = Array(playerCount.value)
                    .fill()
                    .map((_, i) => ({
                        name: `${players[i].name}`,
                        role: "",
                    }));
            } else {
                players.value = Array(playerCount.value)
                    .fill()
                    .map((_, i) => ({
                        name: `Player ${i + 1}`,
                        role: "",
                    }));
            }
            setMissionSizes();
        };

        const setMissionSizes = () => {
            const num_players = players.value.length;
            const missionSizesMapping = {
                5: [2, 3, 2, 3, 3],
                6: [2, 3, 4, 3, 4],
                7: [2, 3, 3, 4, 4],
                8: [3, 4, 4, 5, 5],
                9: [3, 4, 4, 5, 5],
                10: [3, 4, 4, 5, 5],
            };
            missionSizes.value = missionSizesMapping[num_players];

            const spiesCountMapping = {
                5: 2,
                6: 2,
                7: 3,
                8: 3,
                9: 3,
                10: 4,
            };
            spiesCount.value = spiesCountMapping[num_players];
            playerCount.value = num_players;

            const specialRounds = {
                5: false,
                6: false,
                7: true,
                8: true,
                9: true,
                10: true,
            };
            forthSpecialRound.value = specialRounds[num_players];
        };

        const shuffleArray = (array) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        };
        const startRoleReveal = () => {
            let spyCount = spiesCount.value;
            let goodGuyCount = playerCount.value - spyCount;

            let roles = [];
            if (merlin.value) {
                spyCount -= 2;
                goodGuyCount -= 2;

                roles.push({ role: "Spy", speciality: "Morgana" });
                roles.push({ role: "Spy", speciality: "Assassin" });

                roles.push({ role: "Good Guy", speciality: "Merlin" });
                roles.push({ role: "Good Guy", speciality: "Percival" });
            }
            if (mordred.value) {
                spyCount--;
                roles.push({ role: "Spy", speciality: "Mordred" });
            }
            if (lovers.value) {
                goodGuyCount -= 2;
                roles.push({ role: "Good Guy", speciality: "Lover" });
                roles.push({ role: "Good Guy", speciality: "Lover" });
            }
            if (oberon.value) {
                spyCount--;
                roles.push({ role: "Spy", speciality: "Oberon" });
            }

            for (let i = 0; i < spyCount; i++) {
                roles.push({ role: "Spy", speciality: "" });
            }
            for (let i = 0; i < goodGuyCount; i++) {
                roles.push({ role: "Good Guy", speciality: "" });
            }

            
            roles = shuffleArray(roles);  // shuffle the roles array

            players.value.forEach((player, index) => {
                player.role = roles[index].role;
                player.speciality = roles[index].speciality
            });

            gamePhase.value = "role-reveal";
            currentPlayerIndex.value = 0;
            roleRevealed.value = false;
        };

        const revealRole = () => {
            roleRevealed.value = true;
            otherRoles();
        };

        const otherRoles = () => {
            let isSpy = currentPlayer.value.role === "Spy";
            let otherSpies = players.value.filter(player => player.role === "Spy" && player !== currentPlayer.value && player.speciality !== "Oberon");
            let visibleSpies = players.value.filter(player => player.role === "Spy" && player !== currentPlayer.value && player.speciality !== "Mordred" && player.speciality !== "Oberon");
            let merlinAndMorgana = players.value.filter(player => player.speciality === "Merlin" || player.speciality === "Morgana");
            let otherLover = players.value.filter(player => player.speciality === "Lover" && player !== currentPlayer.value);
            let displayRole = currentPlayer.value.speciality === "" ? currentPlayer.value.role : currentPlayer.value.speciality;
            let roleHintText = "Your role is: <strong>" + displayRole + "</strong>";

            let secondaryHint = "";
            if (currentPlayer.value.speciality === "Lover") {
                secondaryHint = "<br>Other lover is: <strong>" + otherLover[0].name + "</strong>";
            }
            if (currentPlayer.value.speciality === "Merlin") {
                secondaryHint = "<br>Spies are: <strong>" + visibleSpies.map(player => player.name).join(", ") + "</strong>";
            }
            if (currentPlayer.value.speciality === "Percival") {
                secondaryHint = "<br>Merlin and Morgana are: <strong>" + merlinAndMorgana.map(player => player.name).join(", ") + "</strong>";
            }
            if (currentPlayer.value.role == "Spy") {
                secondaryHint = "<br>Other Spies are: <strong>" + otherSpies.map(player => player.name).join(", ") + "</strong>";
            }

            roleHint.value = roleHintText + secondaryHint;
        };

        const nextPlayer = () => {
            currentPlayerIndex.value++;
            roleRevealed.value = false;
            if (currentPlayerIndex.value >= players.value.length) {
                gamePhase.value = "team-selection";
                startGame();
            }
        };

        const startGame = () => {
            gamePhase.value = "team-selection";
            currentLeader.value = Math.floor(Math.random() * playerCount.value);
        };

        const togglePlayerSelection = (index) => {
            if (missionPlayers.value.includes(index)) {
                missionPlayers.value = missionPlayers.value.filter(i => i !== index);
            } else if (missionPlayers.value.length < missionSizes.value[currentRound.value - 1]) {
                missionPlayers.value.push(index);
            }
        };

        const proposeTeam = () => {
            gamePhase.value = "team-voting";
        };

        const voteForTeam = (approve) => {
            if (approve) {
                consecutiveRejections.value = 0;
                gamePhase.value = "mission";
                missionVotes.value = { success: 0, fail: 0 };
            } else {
                consecutiveRejections.value++;
                if (consecutiveRejections.value === maxConsecutiveRejections.value) {
                    gameOver("Spies win!");
                } else {
                    nextLeader();
                }
            }
        };

        const missionVote = (playerIndex, success) => {
            const isSpy = players.value[playerIndex].role === "Spy";
            const isResistance = !isSpy;
            success = isResistance ? true : success;
            if (success) {
                missionVotes.value.success++;
            } else {
                missionVotes.value.fail++;
            }
            if (missionVotes.value.success + missionVotes.value.fail === missionPlayers.value.length) {
                resolveMission();
            } else {
                currentMissionPlayerIndex.value++;
                gamePhase.value = 'pass-to-next-mission-player'
            }
        };
        const continueMission = () => {
            gamePhase.value = 'mission'
        };

        const resolveMission = () => {
            pastMissionVotes.value.push({ ...missionVotes.value });

            let missionSuccess = missionVotes.value.fail === 0;
            if (currentRound.value === 4 && forthSpecialRound.value) {
                missionSuccess = missionVotes.value.fail <= 1;
            }

            currentMissionPlayerIndex.value = 0;
            missionResults.value[currentRound.value - 1] = missionSuccess;

            gamePhase.value = "mission-revealing";
        };

        const maybeGameFinished = () => {
            console.log("maybe game finishes?");
            console.log(missionResults);
            if (missionResults.value.filter(result => result === false).length === 3) {
                gameOver("Spies win!");
                return true;
            }
            if (missionResults.value.filter(Boolean).length === 3) {
                if (merlin.value) {
                    gamePhase.value = "choose-merlin";
                    return true;
                } else {
                    gameOver("Good guys win!");
                    return true;
                }
            }
            return false;
        };

        const revealMissionResults = () => {
            gamePhase.value = "mission-revealed";
        };

        const doneViewingMissionResults = () => {
            let finished = maybeGameFinished();
            if (!finished) {
                nextRound();
            }
        };

        const nextLeader = () => {
            currentLeader.value = (currentLeader.value + 1) % playerCount.value;
            gamePhase.value = "team-selection";
            pastMissionPlayers.value.push(missionPlayers.value.slice());
            missionPlayers.value = [];
        };

        const nextRound = () => {
            currentRound.value++;
            nextLeader();
        };

        const toggleEndGameChoosing = () => {
            if (gamePhase.value === "choose-merlin") {
                gamePhase.value = "choose-lovers";
                chosenMerlin.value = -1;
            } else {
                gamePhase.value = "choose-merlin";
                chosenLovers.value = [];
            }
        };

        const toggleMerlinSelection = (index) => {
            chosenMerlin.value = index;
        };

        const proposeMerlinSelection = () => {
            if (players.value[chosenMerlin.value].speciality !== "Merlin") {
                gameOver("Good guys win! Wrong Merlin chosen");
            } else {
                gameOver("Spies win! Merlin found");
            }
        };

        const toggleLoversSelection = (index) => {
            if (chosenLovers.value.includes(index)) {
                chosenLovers.value = chosenLovers.value.filter(i => i !== index);
            } else if (chosenLovers.value.length < 2) {
                chosenLovers.value.push(index);
            }
        };

        const proposeLoversSelection = () => {
            let correctLoverChosen = players.value[chosenLovers.value[0]].speciality === "Lover" && players.value[chosenLovers.value[1]].speciality === "Lover";
            if (correctLoverChosen) {
                gameOver("Spies win! Lovers found");
            } else {
                gameOver("Good guys win! Wrong Lovers chosen");
            }
        };

        const gameOver = (result) => {
            gameResult.value = result;
            gamePhase.value = "game-over";
        };

        const resetPlayerRoles = () => {
            players.value.forEach(player => {
                player.role = "";
                player.speciality = "";
            });
        }

        const resetGame = () => {
            gamePhase.value = "setup";
            playerCount.value = 5;
            spiesCount.value = 2;
            // merlin.value = false;
            // mordred.value = false;
            // lovers.value = false;
            // oberon.value = false;
            // forthSpecialRound.value = false;
            // players.value = []; // {name: "player", role: "Spy", subrole: "Merlin"}
            resetPlayerRoles();
            roleHint.value = "";
            currentPlayerIndex.value = 0;
            roleRevealed.value = false;
            currentLeader.value = 0;
            currentRound.value = 1;
            consecutiveRejections.value = 0;
            maxConsecutiveRejections.value = 5;
            // missionSizes.value = [2, 3, 2, 3, 3]; // for 5 players
            missionResults.value = [null, null, null, null, null];
            missionPlayers.value = []; // current mission players
            missionVotes.value = { success: 0, fail: 0 }; 
            pastMissionVotes.value = []; 
            pastMissionPlayers.value = [];
            currentMissionPlayerIndex.value = 0;
            chosenMerlin.value = -1;
            chosenLovers.value = -1;
            gameResult.value = "";

            generatePlayerInputs();
        };

        return {
            gamePhase,
            playerCount,
            spiesCount,
            merlin,
            mordred,
            lovers,
            oberon,
            forthSpecialRound,
            players,
            roleHint,
            currentPlayerIndex,
            roleRevealed,
            currentLeader,
            currentRound,
            consecutiveRejections,
            maxConsecutiveRejections,
            missionSizes,
            missionResults,
            missionPlayers,
            continueMission,
            currentMissionPlayerIndex,
            pastMissionPlayers,
            gameResult,
            missionVotes,
            pastMissionVotes,
            chosenLovers,
            chosenMerlin,
            allPlayersNamed,
            currentPlayer,
            currentMissionPlayer,
            boxes,
            generatePlayerInputs,
            setMissionSizes,
            startRoleReveal,
            revealRole,
            otherRoles,
            nextPlayer,
            startGame,
            togglePlayerSelection,
            proposeTeam,
            voteForTeam,
            missionVote,
            resolveMission,
            revealMissionResults,
            doneViewingMissionResults,
            nextLeader,
            nextRound,
            toggleEndGameChoosing,
            toggleMerlinSelection,
            proposeMerlinSelection,
            toggleLoversSelection,
            proposeLoversSelection,
            gameOver,
            resetGame,
        };
    },
    mounted() {
        this.generatePlayerInputs();
    }
});

// Register components and mount app
app.component('game-setup', gameSetup);
app.mount("#app");

// Add beforeunload event
window.addEventListener('beforeunload', function (e) {
    e.preventDefault();
    e.returnValue = '';
});

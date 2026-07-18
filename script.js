// ======================================
// ELEMENTS
// ======================================

const playerInput = document.getElementById("player");
const gameType = document.getElementById("gameType");
const dateSelect = document.getElementById("date");
const customDate = document.getElementById("customDate");
const searchBtn = document.getElementById("searchBtn");

const gamesEl = document.getElementById("games");
const winsEl = document.getElementById("wins");
const lossesEl = document.getElementById("losses");
const drawsEl = document.getElementById("draws");
const ratingEl = document.getElementById("rating");
const accuracyEl = document.getElementById("accuracy");

const connection = document.getElementById("connection");
const lastUpdate = document.getElementById("lastUpdate");

const gamesTable = document.getElementById("gamesTable");

// ======================================
// LOCAL STORAGE
// ======================================

function getGamesDB(){
    return JSON.parse(
        localStorage.getItem("gamesDB")
    ) || [];
}

function saveGamesDB(data){
    localStorage.setItem(
        "gamesDB",
        JSON.stringify(data)
    );

}

// ======================================
// LOAD SETTINGS
// ======================================

window.addEventListener("load", ()=>{


    playerInput.value =
    localStorage.getItem("player")
    || "";


    gameType.value =
    localStorage.getItem("gameType")
    || "blitz";


    dateSelect.value =
    localStorage.getItem("date")
    || "today";


});
// ======================================
// SAVE SETTINGS
// ======================================

playerInput.addEventListener(
"change",
()=>{

    localStorage.setItem(
        "player",
        playerInput.value
    );

});



gameType.addEventListener(
"change",
()=>{

    localStorage.setItem(
        "gameType",
        gameType.value
    );

});



dateSelect.addEventListener(
"change",
()=>{

    localStorage.setItem(
        "date",
        dateSelect.value
    );


    customDate.style.display =
    dateSelect.value === "custom"
    ?
    "block"
    :
    "none";


});






// ======================================
// UPDATE BUTTON
// ======================================


searchBtn.addEventListener(
"click",
()=>{

localStorage.clear();
    if(
        dateSelect.value === "session"
    ){

        resetSession();

    }



    updateDashboard();


});







// ======================================
// MAIN UPDATE
// ======================================

async function updateDashboard(){


    const player =
    playerInput.value.trim();



    if(!player){

        return;

    }



    try{


        await fetchGames(player);



        connection.textContent =
        "● Connected";


        lastUpdate.textContent =
        "Updated: "
        +
        new Date()
        .toLocaleTimeString();



    }
    catch(error){


        console.log(error);



        connection.textContent =
        "● Using saved data";


        displayStats(
            player
        );


    }



}







// ======================================
// FETCH API
// ======================================

async function fetchGames(player){



    let target =
    new Date();



    let sessionStart = null;




    if(dateSelect.value==="yesterday"){


        target.setDate(
            target.getDate()-1
        );


    }




    if(dateSelect.value==="custom"){


        target =
        new Date(
            customDate.value
        );


    }




    if(dateSelect.value==="session"){


        sessionStart =
        Number(
            localStorage.getItem(
                "sessionStart"
            )
        );



        if(!sessionStart){


            localStorage.setItem(
                "sessionStart",
                Date.now()
            );


            sessionStart =
            Date.now();


        }



        target =
        new Date(
            sessionStart
        );


    }






    const year =
    target.getFullYear();



    const month =
    String(
        target.getMonth()+1
    )
    .padStart(2,"0");





    const url =

    `https://api.chess.com/pub/player/${player}/games/${year}/${month}`;



    console.log(
        "API:",
        url
    );





    const response =
    await fetch(url);




    if(!response.ok){

        throw new Error(
            "API ERROR "
            +
            response.status
        );

    }




    const data =
    await response.json();



    let games =
    data.games || [];




    games =
    games.filter(game=>{


        const time =
        game.end_time*1000;



        if(dateSelect.value==="session"){


            return time > sessionStart;


        }




        const d =
        new Date(time);



        return (

            d.getDate()
            ===
            target.getDate()

            &&

            d.getMonth()
            ===
            target.getMonth()

            &&

            d.getFullYear()
            ===
            target.getFullYear()

        );


    });





    games =
    games.filter(game=>

        game.time_class
        ===
        gameType.value

    );





    saveNewGames(
        games,
        player
    );



    displayStats(
        player
    );


}








// ======================================
// SAVE GAMES LOCALLY
// ======================================


function saveNewGames(
games,
player
){


    let db =
    getGamesDB();



    games.forEach(game=>{


        const id =
        game.url
        ||
        game.end_time;



        const exists =
        db.some(
            g=>g.id===id
        );



        if(exists){

            return;

        }




        const isWhite =

        game.white.username
        .toLowerCase()

        ===

        player.toLowerCase();





        const myData =
        isWhite
        ?
        game.white
        :
        game.black;




        const opponent =
        isWhite
        ?
        game.black.username
        :
        game.white.username;






        let accuracy = null;



        if(game.accuracies){


            accuracy =
            isWhite
            ?
            game.accuracies.white
            :
            game.accuracies.black;


        }






        db.push({

            id:id,

            player:player,

            type:game.time_class,

            date:
            new Date(
                game.end_time*1000
            )
            .toLocaleString(),


            opponent:opponent,


            result:
            myData.result,


            rating:
            myData.rating
            ||
            null,


            accuracy:accuracy


        });



    });




    saveGamesDB(db);


}









// ======================================
// CALCULATE STATS
// ======================================


function displayStats(player){


    let db =
    getGamesDB();




    db =
    db.filter(game=>


        game.player === player

        &&

        game.type === gameType.value


    );





    let wins=0;
    let losses=0;
    let draws=0;


    let accuracySum=0;
    let accuracyCount=0;




    db.forEach(game=>{


        if(game.result==="win"){

            wins++;

        }
        else if(

            game.result==="draw"
            ||
            game.result==="stalemate"
            ||
            game.result==="agreed"

        ){

            draws++;

        }
        else{

            losses++;

        }




        if(
            typeof game.accuracy
            ===
            "number"
        ){

            accuracySum +=
            game.accuracy;


            accuracyCount++;

        }



    });






    gamesEl.textContent =
    db.length;



    winsEl.textContent =
    wins;



    lossesEl.textContent =
    losses;



    drawsEl.textContent =
    draws;




    accuracyEl.textContent =

    accuracyCount

    ?

    (
        accuracySum /
        accuracyCount

    )
    .toFixed(1)
    +"%"

    :

    "N/A";




    renderHistory(db);


}

function resetSession(){

    const player =
    localStorage.getItem("player");


    localStorage.clear();



    if(player){

        localStorage.setItem(
            "player",
            player
        );

    }



    localStorage.setItem(
        "sessionStart",
        Date.now()
    );



    localStorage.setItem(
        "date",
        "session"
    );


    console.log(
        "New session started"
    );

}







// ======================================
// HISTORY TABLE
// ======================================


function renderHistory(db){


    if(!gamesTable){

        return;

    }


    gamesTable.innerHTML="";



    db
    .slice()
    .reverse()
    .forEach(game=>{


        const row =
        document.createElement("tr");



        row.innerHTML = `

        <td>${game.date}</td>

        <td>${game.opponent}</td>

        <td>${game.result}</td>

        <td>${game.rating ?? "-"}</td>

        <td>
        ${
            game.accuracy
            ?
            game.accuracy+"%"
            :
            "-"
        }
        </td>

        `;



        gamesTable.appendChild(row);



    });



}
function calculateRatingChange(games, player) {
    if (!games.length) return 0;

    const playerGames = games
        .filter(game =>
            game.white.username.toLowerCase() === player.toLowerCase() ||
            game.black.username.toLowerCase() === player.toLowerCase()
        )
        .sort((a, b) => a.end_time - b.end_time);


    let startRating = null;
    let endRating = null;


    playerGames.forEach(game => {

        const isWhite =
            game.white.username.toLowerCase() === player.toLowerCase();

        const myPlayer =
            isWhite ? game.white : game.black;


        if (myPlayer.rating) {

            if (startRating === null) {
                startRating = myPlayer.rating;
            }

            endRating = myPlayer.rating;
        }

    });


    if (startRating === null || endRating === null) {
        return 0;
    }

    console.log(endRating - startRating)
    return endRating - startRating;
}


// Display
const ratingChange = calculateRatingChange(
    games,
    player
);

console.log(ratingChange)
ratingEl.textContent =
    ratingChange >= 0
        ? `+${ratingChange}`
        : ratingChange;






// ======================================
// AUTO UPDATE 1 MIN
// ======================================


setInterval(()=>{


    if(
    playerInput.value.trim()
    ){

        updateDashboard();

    }


},60000);

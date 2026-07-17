// ================================
// ELEMENTS
// ================================

const playerInput = document.getElementById("player");
const dateSelect = document.getElementById("date");
const customDate = document.getElementById("customDate");
const gameType = document.getElementById("gameType");

const searchBtn = document.getElementById("searchBtn");

const gamesEl = document.getElementById("games");
const winsEl = document.getElementById("wins");
const lossesEl = document.getElementById("losses");
const drawsEl = document.getElementById("draws");
const ratingEl = document.getElementById("rating");



// ================================
// LOAD SETTINGS
// ================================

window.addEventListener("load", ()=>{

    playerInput.value =
    localStorage.getItem("player") || "";

    gameType.value =
    localStorage.getItem("gameType") || "blitz";

    dateSelect.value =
    localStorage.getItem("date") || "today";


});



// ================================
// SAVE SETTINGS
// ================================

playerInput.addEventListener("change", ()=>{

    localStorage.setItem(
        "player",
        playerInput.value
    );

});


gameType.addEventListener("change", ()=>{

    localStorage.setItem(
        "gameType",
        gameType.value
    );

});


dateSelect.addEventListener("change", ()=>{

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



// ================================
// BUTTON
// ================================

searchBtn.addEventListener(
"click",
loadGames
);



// ================================
// MAIN
// ================================

async function loadGames(){


    const player =
    playerInput.value
    .trim()
    .toLowerCase();



    if(!player){

        alert("Enter player name");
        return;

    }



    localStorage.setItem(
        "player",
        player
    );



    // SESSION MODE

    if(dateSelect.value === "session"){

        await startSession(
            player
        );

    }



    await fetchGames(
        player
    );

}





// ================================
// START LIVE SESSION
// ================================

async function startSession(player){


    const rating =
    await getCurrentRating(
        player,
        gameType.value
    );


    localStorage.setItem(
        "sessionStart",
        Date.now()
    );


    localStorage.setItem(
        "sessionRating",
        rating
    );


}



// ================================
// GET CURRENT RATING
// ================================

async function getCurrentRating(
player,
type
){


    const response =
    await fetch(

    `https://api.chess.com/pub/player/${player}/stats`

    );


    const data =
    await response.json();



    let key;


    if(type==="bullet")
        key="chess_bullet";


    if(type==="blitz")
        key="chess_blitz";


    if(type==="rapid")
        key="chess_rapid";



    return (
        data[key]
        ?.last
        ?.rating
        ||
        0
    );


}





// ================================
// FETCH GAMES
// ================================

async function fetchGames(player){


    let target =
    new Date();



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



    // SESSION DATE

    if(dateSelect.value==="session"){


        target =
        new Date(
            Number(
                localStorage.getItem(
                    "sessionStart"
                )
            )
        );


    }





    const year =
    target.getFullYear();


    const month =
    String(
    target.getMonth()+1
    )
    .padStart(2,"0");




    const response =
    await fetch(

    `https://api.chess.com/pub/player/${player}/games/${year}/${month}`

    );



    const data =
    await response.json();



    let games =
    data.games || [];





    games =
    games.filter(game=>{


        const gameTime =
        game.end_time * 1000;



        // LIVE SESSION

        if(
        dateSelect.value==="session"
        ){


            const start =
            Number(
            localStorage.getItem(
                "sessionStart"
            ));


            return gameTime > start;

        }



        // NORMAL DATE


        const d =
        new Date(gameTime);



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





    calculateStats(
        games,
        player
    );

}




// ================================
// CALCULATE STATS
// ================================

function calculateStats(
games,
player
){


    let wins=0;

    let losses=0;

    let draws=0;


    let ratingChange=0;


    let previousRating=null;




    games.sort(
        (a,b)=>
        a.end_time-b.end_time
    );





    if(
    dateSelect.value==="session"
    ){


        previousRating =
        Number(
        localStorage.getItem(
            "sessionRating"
        ));


    }





    games.forEach(game=>{


        let data;



        if(
        game.white.username
        .toLowerCase()
        ===
        player
        ){

            data =
            game.white;

        }
        else{

            data =
            game.black;

        }





        // RESULT

        switch(data.result){


            case "win":

                wins++;
                break;


            case "stalemate":
            case "repetition":
            case "agreed":
            case "insufficient":
            case "50move":
            case "timevsinsufficient":

                draws++;
                break;


            default:

                losses++;

        }




        // RATING

        if(
        data.rating
        &&
        previousRating!==null
        ){


            ratingChange +=
            data.rating
            -
            previousRating;


        }



        if(data.rating){

            previousRating =
            data.rating;

        }


    });





    gamesEl.textContent =
    games.length;


    winsEl.textContent =
    wins;


    lossesEl.textContent =
    losses;


    drawsEl.textContent =
    draws;


    ratingEl.textContent =
    ratingChange>=0
    ?
    "+"+ratingChange
    :
    ratingChange;



}



// ================================
// AUTO UPDATE EVERY 1 MINUTE
// ================================

setInterval(()=>{


    if(
    playerInput.value.trim()
    !== ""
    ){

        fetchGames(
            playerInput.value
            .trim()
            .toLowerCase()
        );

    }


},60000);

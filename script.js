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
// LOAD SAVED PLAYER
// ================================

playerInput.value =
localStorage.getItem("chessPlayer") || "";



// ================================
// CUSTOM DATE DISPLAY
// ================================

dateSelect.addEventListener("change", ()=>{

    if(dateSelect.value === "custom"){

        customDate.style.display = "block";

    }else{

        customDate.style.display = "none";

    }

});



// ================================
// BUTTON
// ================================

searchBtn.addEventListener(
"click",
loadGames
);



// ================================
// MAIN FUNCTION
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
        "chessPlayer",
        player
    );



    let targetDate = new Date();


// LIVE SESSION

if(dateSelect.value === "session"){


    let savedStart =
    localStorage.getItem(
        "sessionStart"
    );


    if(!savedStart){

        savedStart =
        Date.now();


        localStorage.setItem(
            "sessionStart",
            savedStart
        );

    }


}
else{

    localStorage.removeItem(
        "sessionStart"
    );

}



    // Yesterday

    if(dateSelect.value === "yesterday"){

        targetDate.setDate(
            targetDate.getDate() - 1
        );

    }



    // Custom date

    if(dateSelect.value === "custom"){

        if(!customDate.value){

            alert("Select date");

            return;

        }

        targetDate =
        new Date(customDate.value);

    }



    const year =
    targetDate.getFullYear();



    const month =
    String(
        targetDate.getMonth()+1
    )
    .padStart(2,"0");



    const url =
    `https://api.chess.com/pub/player/${player}/games/${year}/${month}`;



    try{


        const response =
        await fetch(url);



        if(!response.ok){

            throw new Error(
                "Player not found"
            );

        }



        const data =
        await response.json();



        let games =
        data.games || [];



        // Filter by selected date

        games =
games.filter(game=>{


    const gameDate =
    new Date(
        game.end_time * 1000
    );



    // FROM NOW MODE

    if(
        dateSelect.value === "session"
    ){

        const start =
        Number(
            localStorage.getItem(
                "sessionStart"
            )
        );


        return (
            game.end_time * 1000
            >
            start
        );

    }



    // NORMAL DATE FILTER

    return (

        gameDate.getDate()
        ===
        targetDate.getDate()


        &&


        gameDate.getMonth()
        ===
        targetDate.getMonth()


        &&


        gameDate.getFullYear()
        ===
        targetDate.getFullYear()

    );


});



        // Filter game type

        games =
        games.filter(game=>{


            return (
                game.time_class
                ===
                gameType.value
            );


        });



        calculateStats(
            games,
            player
        );



    }
    catch(error){


        console.error(error);


        alert(
            "Cannot load games"
        );


    }


}




// ================================
// CALCULATE STATS
// ================================

function calculateStats(
    games,
    player
){


    let wins = 0;

    let losses = 0;

    let draws = 0;


    let ratingChange = 0;

    let previousRating = null;



    // Oldest -> newest

    games.sort(
        (a,b)=>
        a.end_time - b.end_time
    );



    games.forEach(game=>{


        let playerData = null;



        const white =
        game.white?.username
        ?.toLowerCase();



        const black =
        game.black?.username
        ?.toLowerCase();




        if(white === player){


            playerData =
            game.white;


        }

        else if(black === player){


            playerData =
            game.black;


        }

        else{

            return;

        }




        // RESULT

        switch(
            playerData.result
        ){


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





        // RATING CHANGE

        if(playerData.rating){



            if(previousRating !== null){


                ratingChange +=
                playerData.rating
                -
                previousRating;


            }



            previousRating =
            playerData.rating;


        }



    });




    // UPDATE UI


    gamesEl.textContent =
    games.length;



    winsEl.textContent =
    wins;



    lossesEl.textContent =
    losses;



    drawsEl.textContent =
    draws;



    ratingEl.textContent =
    ratingChange >= 0
    ?
    "+" + ratingChange
    :
    ratingChange;



    ratingEl.style.color =
    ratingChange >= 0
    ?
    "#32d74b"
    :
    "#ff453a";

}



// ================================
// AUTO REFRESH EVERY 3 MINUTES
// ================================

setInterval(()=>{


    if(
        playerInput.value.trim()
        !==
        ""
    ){

        loadGames();

    }


},180000);

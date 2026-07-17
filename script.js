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
// LOCAL STORAGE HELPERS
// ================================

function saveCache(key, data){

    localStorage.setItem(
        key,
        JSON.stringify(data)
    );

}



function getCache(key){

    const data =
    localStorage.getItem(key);


    if(data === null){

        return null;

    }


    return JSON.parse(data);

}



// ================================
// LOAD SAVED SETTINGS
// ================================

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




// ================================
// SAVE SETTINGS
// ================================

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




// ================================
// BUTTON
// ================================

searchBtn.addEventListener(
"click",
loadGames
);




// ================================
// MAIN API FUNCTION
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



    let targetDate =
    new Date();



    // Yesterday

    if(dateSelect.value === "yesterday"){

        targetDate.setDate(
            targetDate.getDate()-1
        );

    }



    // Custom

    if(dateSelect.value === "custom"){


        targetDate =
        new Date(
            customDate.value
        );


    }



    // Session mode

    if(
        dateSelect.value === "session"
    ){


        if(
            !localStorage.getItem(
                "sessionStart"
            )
        ){

            localStorage.setItem(
                "sessionStart",
                Date.now()
            );

        }


    }



    const year =
    targetDate.getFullYear();



    const month =
    String(
        targetDate.getMonth()+1
    )
    .padStart(2,"0");



    try{


        const response =
        await fetch(

        `https://api.chess.com/pub/player/${player}/games/${year}/${month}`

        );



        if(!response.ok){

            throw new Error(
                "Player not found"
            );

        }



        const data =
        await response.json();



        let games =
        data.games || [];





        games =
        games.filter(game=>{


            const gameDate =
            new Date(
                game.end_time * 1000
            );



            // SESSION FILTER

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




            // DATE FILTER

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





        // TIME CONTROL FILTER

        games =
        games.filter(game=>

            game.time_class
            ===
            gameType.value

        );




        const previousRating =
        await getPreviousDayRating(
            player,
            targetDate,
            gameType.value
        );



        calculateStats(
            games,
            player,
            previousRating
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
// GET PREVIOUS DAY RATING
// ================================

async function getPreviousDayRating(
    player,
    date,
    type
){


    const key =
    `rating_${player}_${date.toISOString().slice(0,10)}_${type}`;



    const cached =
    localStorage.getItem(key);



    if(cached !== null){

        return JSON.parse(cached);

    }




    const previous =
    new Date(date);



    previous.setDate(
        previous.getDate()-1
    );



    const year =
    previous.getFullYear();


    const month =
    String(
        previous.getMonth()+1
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


        const d =
        new Date(
            game.end_time*1000
        );



        return (

            d.getDate()
            ===
            previous.getDate()

            &&

            d.getMonth()
            ===
            previous.getMonth()

            &&

            d.getFullYear()
            ===
            previous.getFullYear()

            &&

            game.time_class
            ===
            type

        );


    });




    if(games.length===0){

        return null;

    }



    games.sort(
        (a,b)=>
        a.end_time-b.end_time
    );



    const last =
    games[games.length-1];



    let rating;



    if(
        last.white.username
        .toLowerCase()
        ===
        player
    ){

        rating =
        last.white.rating;


    }else{


        rating =
        last.black.rating;


    }




    localStorage.setItem(
        key,
        JSON.stringify(rating)
    );



    return rating;

}







// ================================
// CALCULATE
// ================================

function calculateStats(
    games,
    player,
    startingRating
){


    let wins=0;

    let losses=0;

    let draws=0;


    let ratingChange=0;


    let previousRating =
    startingRating;



    games.sort(
        (a,b)=>
        a.end_time-b.end_time
    );




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


        }else{


            data =
            game.black;


        }




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




        if(
        data.rating
        &&
        previousRating !== null
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
    ratingChange >= 0
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

        loadGames();

    }


},60000);

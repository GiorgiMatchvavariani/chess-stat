// ======================================
// ELEMENTSasd
// ======================================


const playerInput =
document.getElementById("player");


const gameType =
document.getElementById("gameType");


const dateSelect =
document.getElementById("date");


const customDate =
document.getElementById("customDate");


const searchBtn =
document.getElementById("searchBtn");



const gamesEl =
document.getElementById("games");


const winsEl =
document.getElementById("wins");


const lossesEl =
document.getElementById("losses");


const drawsEl =
document.getElementById("draws");


const ratingEl =
document.getElementById("rating");


const accuracyEl =
document.getElementById("accuracy");


const table =
document.getElementById("gamesTable");



const connection =
document.getElementById("connection");


const lastUpdate =
document.getElementById("lastUpdate");





// ======================================
// LOCAL STORAGE DATABASE
// ======================================


function getDatabase(){

    return JSON.parse(
        localStorage.getItem("gamesDB")
    ) || [];

}



function saveDatabase(data){

    localStorage.setItem(
        "gamesDB",
        JSON.stringify(data)
    );

}




// ======================================
// SETTINGS LOAD
// ======================================


window.addEventListener(
"load",
()=>{


playerInput.value =
localStorage.getItem("player")
|| "";



gameType.value =
localStorage.getItem("type")
|| "blitz";



dateSelect.value =
localStorage.getItem("date")
|| "today";



});






// ======================================
// SETTINGS SAVE
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
"type",
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
dateSelect.value==="custom"
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

startUpdate();

});






// ======================================
// MAIN UPDATE
// ======================================


async function startUpdate(){



const player =
playerInput.value
.trim()




if(!player){

return;

}




try{


await fetchGames(
player
);



connection.innerHTML =
"● Connected";



connection.style.color =
"#22c55e";



lastUpdate.textContent =
"Updated: "
+
new Date()
.toLocaleTimeString();



}
catch(error){



console.log(error);



connection.innerHTML =
"● Offline cache";


connection.style.color =
"#eab308";



displayStats(
player
);



}



}








// ======================================
// FETCH CHESS.COM GAMES
// ======================================


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





let startTime =
0;



if(dateSelect.value==="session"){


startTime =
Number(
localStorage.getItem(
"sessionStart"
)
);


target =
new Date(
startTime
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





const response =
await fetch(url);



if(!response.ok){

throw new Error(
"API error"
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


return time > startTime;


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





saveGames(
games,
player
);





displayStats(
player
);



}








// ======================================
// SAVE NEW GAMES
// ======================================


function saveGames(
games,
player
){


let db =
getDatabase();




games.forEach(game=>{


const id =
game.url
||
game.end_time;



const exists =
db.find(
g=>g.id===id
);



if(exists){

return;

}





let white =
game.white.username
.toLowerCase()
===
player;



let color =
white
?
"white"
:
"black";





let data =
white
?
game.white
:
game.black;



let opponent =
white
?
game.black.username
:
game.white.username;





let accuracy =
null;



if(game.accuracies){


accuracy =
white
?
game.accuracies.white
:
game.accuracies.black;


}






db.push({

id:id,

date:
new Date(
game.end_time*1000
)
.toLocaleDateString(),


opponent:opponent,


color:color,


result:data.result,


rating:data.rating
||null,


accuracy:accuracy


});



});




saveDatabase(db);



}









// ======================================
// DISPLAY STATS
// ======================================


function displayStats(player){


let db =
getDatabase();




db =
db.filter(g=>{


return true;


});




let wins=0;

let losses=0;

let draws=0;


let rating=0;



let accTotal=0;

let accGames=0;





db.forEach(game=>{


if(game.result==="win")
wins++;


else if(
game.result==="stalemate"
||
game.result==="agreed"
||
game.result==="repetition"
)
draws++;


else
losses++;





if(game.accuracy!==null){

accTotal +=
game.accuracy;

accGames++;

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



if(accGames>0){


accuracyEl.textContent =

(
accTotal/accGames
)
.toFixed(1)
+
"%";


}
else{


accuracyEl.textContent =
"N/A";


}






renderTable(db);



}








// ======================================
// TABLE
// ======================================


function renderTable(data){


table.innerHTML="";



data
.slice()
.reverse()
.forEach(game=>{


let row =
document.createElement(
"tr"
);



let resultClass =
game.result==="win"
?
"win"
:
game.result==="loss"
?
"loss"
:
"draw";



row.innerHTML = `


<td>${game.date}</td>

<td>${game.opponent}</td>

<td class="${resultClass}">
${game.result}
</td>

<td>
${game.rating ?? "-"}
</td>


<td>
${game.accuracy ?? "-"}
</td>


`;



table.appendChild(row);



});


}









// ======================================
// AUTO UPDATE
// ======================================


setInterval(()=>{


if(
playerInput.value.trim()!=""
){

startUpdate();

}



},60000);

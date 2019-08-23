const cards = [1, 2, 3, 4, 5, 6];

let bet;
let round = 0;

class Player {
    constructor() {
        this.hand = [];
        this.score = 0;
    }

    setBet() {
        if ($('#betAmount').val() === "" || $('#betAmount').val() > 10000 || $('#betAmount').val() < 100) {
            bet = Math.floor(Math.random() * (10000 - 100) + 100);
        }
        else {
            bet = $('#betAmount').val();
        }
        // The regex adds in a comma
        $(".amount").text(`$${bet.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`);
    }

    drawCard(position) {
        let randomIndex = Math.floor(Math.random() * 6);
        this.hand.splice(position, 1, cards[randomIndex]);
    }

    firstFive() {
        for (let i = 0; i < 5; i++) {
            this.drawCard(i);
        }
        this.hand.sort((a, b) => a - b);
    }

    handCombo(whichPlayer) {
        let count = {},
            pairs = 0, three = 0, four = 0, five = 0,
            combo = { name: "NOTHING", value: 0 };

        /* Set the name of the key to the number itself. If the count (value) of the number is undefined, start it at 0. Then add one, and keep looping. */
        this.hand.forEach(number => count[number] = (count[number] || 0) + 1);

        Object.values(count).forEach(c => {
            if (c === 5) five++;
            if (c === 4) four++;
            if (c === 3) three++;
            if (c === 2) pairs++;
        });

        if (this.hand.find((card) => card === 6)) combo = { name: "HIGH CARD", value: 1 };
        if (pairs === 1) combo = { name: "ONE PAIR", value: 2 };
        if (pairs === 2) combo = { name: "TWO PAIRS", value: 3 };
        if (three) combo = { name: "THREE OF A KIND", value: 4 };
        if (four) combo = { name: "FOUR OF A KIND", value: 7 };
        if (five) combo = { name: "FIVE OF A KIND", value: 8 };
        if (pairs === 1 && three) combo = { name: "FULL HOUSE", value: 6 };

         /* We add in sort since the hand can be in any order.
        We also add in dummyhand since the sort function can cause unwanted results with this.hand when rendered. */

        let dummyhand = [...this.hand];

        if (dummyhand.sort((a, b) => a - b).join("") === "12345" || dummyhand.sort((a, b) => a - b).join("") === "23456") combo = { name: "STRAIGHT", value: 5 };

        $(`${whichPlayer} .combo`).text(`${combo.name} (${combo.value} Points)`);
        this.score = combo.value;

        /* Opponent AI goes here! */

        let keys = Object.keys(count);

        //This first condition excludes Full House and Straight

        if (whichPlayer === ".opponent" && combo.value !== 5 && combo.value !== 6) {
            keys.forEach(numberKey => {
                if (count[numberKey] === 1 && round < 3) {
                    //Grab the card by alt and extract the card class name by number
                    $(`.opponent-row img[alt="${numberKey} Card"]`)
                    .parent("#card-wrapper").addClass("ai-selected");
                }
            });
        }

        //When opponent is losing with Full House, they will drop the pair

        else if (whichPlayer === ".opponent" && combo.value === 6 && Opponent.score <= You.score) {
            keys.forEach(numberKey => {
                if (count[numberKey] === 2 && round < 3) {
                    //Grab the card by alt and extract the card class name by number
                    $(`.opponent-row img[alt="${numberKey} Card"]`)
                    .parent("#card-wrapper").addClass("ai-selected");
                }
            });
        }

         //When opponent is losing with Straight, they will drop entire hand

         else if (whichPlayer === ".opponent" && combo.value === 5 && Opponent.score <= You.score) {
            keys.forEach(numberKey => {
                if (count[numberKey] === 1 && round < 3) {
                    //Grab the card by alt and extract the card class name by number
                    $(`.opponent-row img[alt="${numberKey} Card"]`)
                    .parent("#card-wrapper").addClass("ai-selected");
                }
            });
        }
        
    }

    swapCard(whichCardIndex) {
        this.drawCard(whichCardIndex);
    }

    renderHand(whichSide) {
        let cardHTML = "";
        this.hand.forEach((card, index) => {
            cardHTML += `<div id="card-wrapper">
            <img src="images/${card}.jpg" alt="${card} Card" class="card${index}">
            </div>`;
        });
        $(whichSide).html(cardHTML);
        if (whichSide === ".hand-row") {
            console.log(this.hand);
        }
        
    }
}

let You = new Player();
let Opponent = new Player();

$("#setBet").click(() => {
    $(".splash").fadeOut(500);
    showRound();
    You.setBet();
    You.firstFive();

    You.renderHand(".hand-row");
    You.handCombo(".player");

    Opponent.firstFive();

    // Render the hand before the handCombo, thus allowing the opponent to "decide" via AI which cards to remove
    Opponent.renderHand(".opponent-row");
    Opponent.handCombo(".opponent");
});

$("body").on("click", ".hand-row img", function () {
    $(this).parent("#card-wrapper").toggleClass("selected");
    console.log($(this).attr("class"));
    
});

$(".next-round").click(() => {
    showRound();
    if ($(".selected")) {
        $(".selected").each((index, element) => {
            let number = parseInt(element.childNodes[1].className.slice(4));
            You.swapCard(number);
        });
        You.renderHand(".hand-row");
        You.handCombo(".player");
    }
    
    if ($(".ai-selected")) {
        $(".ai-selected").each((index, element) => {
            let number = parseInt(element.childNodes[1].className.slice(4));
            Opponent.swapCard(number);
        });
        Opponent.renderHand(".opponent-row");
        Opponent.handCombo(".opponent");
    }
});

$(".end-game").click(() => {
    endGame();
})

showRound = () => {
    round++;
    $(".round").text(`Round ${round} of 3`);
    if (round > 2) {
        $(".end-game").show();
        $(".next-round").hide();
    }
    $(".round-overlay").css("display", "flex")
        .hide()
        .fadeIn(750)
        .html(`<div class="round-wrapper">
                <h1>Round ${round}</h1>
                <img src="images/${round}-symbol.png" alt="">
            </div>`);
    setTimeout(() => {
        $(".round-overlay").fadeOut(500);
    }, 2250);
}

endGame = () => {
    // The regex adds in a comma
    let result = You.score > Opponent.score ? `You Win $${(2 * bet).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}!` : You.score < Opponent.score ? `You Lose $${(2 * bet).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}!` : `This game is a tie!`
    $(".round-overlay").css("display", "flex")
        .hide()
        .fadeIn(750)
        .html(`<div class="round-wrapper">
                <h1>${result}</h1>
                <button id="replay">REPLAY GAME?</button>
            </div>`);
    
}

$("body").on("click", "#replay", function () {
    window.location.reload()
});

$(".dragoness").click(() => {
    $(".dragoness").addClass("active");
    $(".info-box").fadeIn(330);
})

$("#close").click(() => {
    $(".dragoness").removeClass("active");
    $(".info-box").fadeOut(330);
})
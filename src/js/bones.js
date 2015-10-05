/*
 * =============================================================================
 * Bones - a browser-based dice game
 * =============================================================================
 * written for the February phase of One Game A Month
 * -----------------------------------------------------------------------------
 * (c) 2013 chrisatthestudy
 * -----------------------------------------------------------------------------
 */
 
/* 
 * Dice class - models a single die.
 *
 * @constructor Dice(sides) - creates a new die, with the specified number of sides.
 * @method      roll() - returns the result of rolling the die once.
 */
function Dice(sides) { 
    this.sides = sides;
    this.value = 0;
} 
Dice.prototype.roll = function() { 
  this.value = Math.floor(Math.random() * this.sides) + 1;
  return this.value;
}

/*
 * Game class - controls the main internals of the game.
 *
 * The game is divided into multiple levels, and each level is in multiple
 * rounds. 
 *
 * For each level the player has a target score to meet, within a specified
 * number of rounds.
 *
 * In each round, the player rolls 6 dice and adds them up, adding the result
 * to their total for the current level.
 *
 * Once the player has played the specified number of rounds, the total of all
 * the rounds is added up. If it reaches or exceeds the target, the player has
 * won the level, and moves to the next level.
 */
function Game() {
    this.dice   = new Dice(6);
    this.count  = 6; // How many dice are we using?
    this.level  = 1; // Which level are we on?
    this.total  = 0; // Player's total score in the current game.
    this.score  = 0; // Player's total score in the current level.
    this.target = 0; // The target score for the current level.
    this.rounds = 0; // The number of rounds in the current level.
    this.round  = 1; // Which round are we playing?
    this.rolls  = []; // The rolls for the current round.
    this.frozen = []; // The dice which are frozen for this round.
    this.state  = 0; // 0 = Ready, 1 = Playing
    this.diceSound = new Audio("sounds/dice_01.ogg");
    
    this.loadImages = function() {
        // Preload the images so that they are held in the browser cache, and
        // will subsequently be retrieved from there rather than being 
        // downloaded again.
        for(i = 0; i < this.count; i++) {
            img = new Image(64, 64);
            img.src = "graphics/die_0" + (i + 1) + ".png";
        }
    }
    
    this.startGame = function() {
        this.level = 1;
        this.total = 0;
        this.loadImages();
        this.unfreezeAll();
    }
    
    this.startLevel = function() {
        this.round  = 0;
        this.rounds = 3 + this.level - 1;
        this.target = this.rounds * 24;
        this.score  = 0;
        this.state  = 1;
        $("#total-score-label").text("Total: " + this.total);
        $("#roll-button").text("Roll");
        // Reset the rolls
        this.rolls = []
        for(i = 0; i < this.count; i++) {
            this.rolls.push(0);
        }
        this.clearBoard();
        // Display the score targets
        $("#min-target-label").html("Score <span class='highlight_1'>" + this.target + "</span> in <span class='highlight_1'>" + this.rounds + "</span> rolls");
        $("#bonus-target-label").html("Score higher than <span class='highlight_1'>" + this.target + "</span> for a bonus");
        $("#current-score-label").text("Current Score: 0");
        $("#roll-button").show();
        $("#game-result-board").hide();
        $("#score-board").show();
    }

    this.unfreezeAll = function() {
	// Marks all the dice as unfrozen
        var die_name = "";
	// Array holding the frozen (true) or unfrozen (false) state of each die
        this.frozen = []
        for(i = 0; i < this.count; i++) {
            die_name = ".die-" + (i + 1) + "-freeze";
            $(die_name).removeClass("frozen");
            this.frozen.push(false);
        }
    }
    
    this.frozenCount = function() {
        // Returns a count of the number of dice that are currently frozen.
        var count = 0;
        for(i = 0; i < this.count; i++) {
            count += this.frozen[i];
        }
        return count;
    }
    
    this.freeze = function(ndx) {
	// Only do this if the game as active and we haven't reach the end
	// of the current level
        if ((this.state == 1) && (this.round < this.rounds)) {
            // Toggle the 'frozen' state of the specifed die.
            var die_name = ".die-" + ndx + "-freeze";
            if ($(die_name).hasClass("frozen")) {
                // The die is currently frozen. Unfreeze it.
                $(die_name).toggleClass("frozen");
                this.frozen[ndx - 1] = false;
            }
            else {
                if (this.frozenCount() < 2) {
                    $(die_name).toggleClass("frozen");
                    this.frozen[ndx - 1] = true;
                }
            }
        }
    }
    
    this.clearBoard = function() {
        // Clear the main board ready for the next round.
        $("#die-1").css("background-image", "none");
        $("#die-2").css("background-image", "none");
        $("#die-3").css("background-image", "none");
        $("#die-4").css("background-image", "none");
        $("#die-5").css("background-image", "none");
        $("#die-6").css("background-image", "none");
        $("#round-label").text(" ");
        $("#round-score-label").text(" ");
    }
    
    this.endLevel = function() {
        $("#freeze-label").text(" ");
        $("#score-board").hide();
        $("#game-result-board").show();
        if(this.score >= this.target) {
            $("#final-score-label").html("Final Score: <span class='highlight_green'>" + this.score + "</span>");
            $("#announcement-label").text("You won!");
            $("#roll-button").text("Next turn");
            bonus = this.score - this.target;
            if (bonus > 0) {
                this.total += (this.score + (bonus * 10));
                $("#final-score-label").html("Final Score: <span class='highlight_green'>" + this.score + " + bonus of " + (bonus * 10) + "</span>");
            }
            else {
                this.total += this.score;
            }
            $("#total-score-label").text("Total: " + this.total);
            this.level = this.level + 1;
        } else {
            $("#final-score-label").html("Final Score: <span class='highlight_red'>" + this.score + "</span>");
            $("#announcement-label").text("You lost. Better luck next time.");
            $("#roll-button").text("Play again");
            this.startGame();
        }
        this.state = 0;
    }
    
    this.roll = function() {
        var diff = 0;
        this.roundResult = 0;
        this.diceSound.play();
        // Roll the dice
        for(i = 0; i < this.count; i++) {
            // For 'frozen' dice leave them with the same result as the previous 
            // turn
            if(!this.frozen[i]) {
                this.rolls[i] = this.dice.roll();
            }
            this.roundResult = this.roundResult + this.rolls[i];
        }
        // Display the results using the dice images
        $("#die-1").css("background-image", "url(" + "graphics/die_0" + this.rolls[0] + ".png)");
        $("#die-2").css("background-image", "url(" + "graphics/die_0" + this.rolls[1] + ".png)");
        $("#die-3").css("background-image", "url(" + "graphics/die_0" + this.rolls[2] + ".png)");
        $("#die-4").css("background-image", "url(" + "graphics/die_0" + this.rolls[3] + ".png)");
        $("#die-5").css("background-image", "url(" + "graphics/die_0" + this.rolls[4] + ".png)");
        $("#die-6").css("background-image", "url(" + "graphics/die_0" + this.rolls[5] + ".png)");
        // Update the score display
        this.score = this.score + this.roundResult;
        this.round = this.round + 1;
        $("#round-label").text("Roll " + this.round + " of " + this.rounds);
	// If the player hasn't reached the target score yet, display the
	// value still needed to reach that score
        diff = this.target - this.score;
        if (diff > 0) {
            $("#current-score-label").html("Current Score: " + this.score + " - You need <span class='highlight_1'>" + diff + "</span> more");
        }
        else {
            $("#current-score-label").text("Current Score: " + this.score);
        }
        $("#round-score-label").text(this.roundResult);
        // Clear any 'frozen' dice
        this.unfreezeAll();
        // Display the 'freeze' label
        $("#freeze-label").text("Click up to 2 dice to freeze them for the next throw");
    }
}

/* 
 * Log function - writes the supplied value to the output area.
 * Assumes that there is a DOM element with an id of "log".
 */
function log(value) {
    $("#log").append(value + "<br>");
}

/*
 * Simple test routine - outputs results to the log.
 */
function test() {
    var d = new Dice(6);
    log(d.roll());
}

/*
 * jQuery ready() function - initialises the script.
 */
$(document).ready(function() {
    $("#log").hide();
    game = new Game();
    game.startGame();
    game.startLevel();
    $("#roll-button").click(function( event ) {
        event.preventDefault();
	// If the game is active, roll the dice
        if (game.state == 1) {
            game.roll();
            if(game.round == game.rounds) {
                game.endLevel();
            }
        }
	// Otherwise, start the next level
        else {
            event.preventDefault();
            game.startLevel();        
        }
    });
    $(".die-1-freeze").click(function(event) { event.preventDefault(); game.freeze(1); });
    $(".die-2-freeze").click(function(event) { event.preventDefault(); game.freeze(2); });
    $(".die-3-freeze").click(function(event) { event.preventDefault(); game.freeze(3); });
    $(".die-4-freeze").click(function(event) { event.preventDefault(); game.freeze(4); });
    $(".die-5-freeze").click(function(event) { event.preventDefault(); game.freeze(5); });
    $(".die-6-freeze").click(function(event) { event.preventDefault(); game.freeze(6); });
});


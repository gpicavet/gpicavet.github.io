---
layout: post
title:  "Simple sudoku solver using constraint propagation"
date:   2017-12-16 20:38:41 +0200
categories: jekyll update
---

Solving NxN Sudoku is known to be a NP-complete problem, but it can still be done in a few milliseconds in a vast majority of cases.
Stop thinking about Brute-force search : even 9x9 grids would require seconds to solve !
Basically, Sudoku is a constraints satisfaction problem and there's a much clever way to solve this : "Constraint propagation". In a way that mimics human reasoning.

So what you do when you're bored and there's absolutely nothing else to do but solving a sudoku, is to first find the cell having a single choice, set it, and do it again. Simply.
When you "set" a cell, you propagate a new constraint to neighboor cells (ie same row, same column, same block), and so decreasing the choices.
Easy grids will solve only using this basic technique called "lone single", but there are other techniques like "hidden singles", "naked pairs", ... that can be used when there's no lone single or to speed up solving. (see here for a list : https://www.learn-sudoku.com/basic-techniques.html.)

So here is a simple program that first finds as much "lone single" as it can.
When there's no more single, it finds the cell having the less possibilities and explores each of them. One of them is good, others are bad and create conflict. As we dont know in advance, we save the state so when a conflict is detected, we go back to that state and choose another digit. This technique is called "backtracking", and yes you have already done that on hard sudoku with your favorite eraser !;)
It's a compromise between simplicity (it would require more code to implement other techniques) and performance. Even with one technique we can solve hardest sudoku in less than 100ms in javascript on a low end PC !

Note : This constraint propagation algorithm is very special case of a more generic algorithm called "SAT" which uses CNF boolean expression reduction (and also a little backtracking).


## source code
https://github.com/gpicavet/sudoku-solver
## demo
<script type='text/javascript' src="https://cdn.rawgit.com/gpicavet/sudoku-solver/master/solver.js"></script>
<style>
 table {
  border-collapse:collapse;
 }
 table input[type="text"] {
    font-size:20px;
    width: 26px;
    text-align: center;
 }
 table input[type="text"].solved {
    color:red;
 }
 td.c9:nth-of-type(3n), 
 td.c16:nth-of-type(4n) {
  border-right: 2px solid black;
 }
 td.c9:first-of-type,
 td.c16:first-of-type {
  border-left: 2px solid black;
 }
 tr.c9:nth-of-type(3n), 
 tr.c16:nth-of-type(4n) {
  border-bottom: 2px solid black;
 }
 tr.c9:first-of-type,
 tr.c16:first-of-type {
  border-top: 2px solid black;
 } 
 </style>

<p>
<div id="board"></div>
</p>

<p>

<textarea id="message" cols="40"></textarea>

</p>

<p>
 <select id="boardtype" onchange="boardselect()">
    <option value="easy">Sudoku (easy)</option>
    <option value="hard">Sudoku (hard)</option>
    <option value="alphadoku">Alphadoku</option>
 </select>
 <button onclick="solve()">SOLVE</button>
 <button onclick="clean()">CLEAR</button>
</p>

<script type="text/javascript">
   var boards = {
    "easy":[
       ["3", "9", "2", "8", " ", " ", "6", "1", "4"],
       [" ", " ", " ", "3", " ", "6", " ", " ", "9"],
       [" ", "4", " ", " ", "1", "2", " ", "7", " "],
       [" ", " ", "7", " ", " ", "3", " ", "2", " "],
       ["8", "3", " ", " ", " ", " ", " ", "9", "6"],
       [" ", "2", " ", "6", " ", " ", "1", " ", " "],
       [" ", "6", " ", "5", "3", " ", " ", "8", " "],
       ["2", " ", " ", "7", " ", "9", " ", " ", " "],
       ["9", "1", "5", " ", " ", "4", "3", "6", "7"]
      ],
     "hard":[
       ["8", " ", " ", " ", " ", " ", " ", " ", " "],
       [" ", " ", "3", "6", " ", " ", " ", " ", " "],
       [" ", "7", " ", " ", "9", " ", "2", " ", " "],
       [" ", "5", " ", " ", " ", "7", " ", " ", " "],
       [" ", " ", " ", " ", "4", "5", "7", " ", " "],
       [" ", " ", " ", "1", " ", " ", " ", "3", " "],
       [" ", " ", "1", " ", " ", " ", " ", "6", "8"],
       [" ", " ", "8", "5", " ", " ", " ", "1", " "],
       [" ", "9", " ", " ", " ", " ", "4", " ", " "]
     ],
    "alphadoku":[
       [" ", "E", " ", " ",  "4", " ", " ", " ",  " ", " ", "2", "3",  " ", " ", "G", "7"],
       ["8", " ", " ", " ",  " ", "5", " ", "1",  " ", "4", "D", " ",  " ", " ", "2", "A"],
       ["G", "3", " ", " ",  "B", " ", " ", " ",  "7", "1", " ", "8",  " ", "5", " ", " "],
       [" ", " ", "7", " ",  " ", " ", "D", "A",  "C", "E", " ", " ",  " ", " ", " ", " "],

       ["6", "A", "E", " ",  "7", " ", "3", " ",  " ", " ", " ", "G",  " ", "9", " ", "5"],
       [" ", " ", " ", " ",  "F", "1", "G", " ",  "3", " ", "B", " ",  " ", " ", "7", "E"],
       [" ", "1", "4", " ",  " ", "8", "A", " ",  "E", "D", " ", " ",  "2", "B", "F", " "],
       [" ", " ", " ", " ",  " ", "4", " ", " ",  " ", "C", "A", " ",  "D", "G", " ", " "],

       ["B", " ", "2", "C",  "E", " ", " ", "5",  " ", " ", " ", " ",  "A", " ", "D", " "],
       ["3", " ", "8", " ",  "6", " ", "4", " ",  " ", "9", "5", "B",  "F", " ", " ", " "],
       ["1", " ", " ", " ",  " ", "2", " ", " ",  "D", "G", "E", " ",  " ", " ", "4", " "],
       [" ", " ", " ", " ",  "1", " ", "B", "G",  " ", " ", "7", "F",  " ", "C", " ", "6"],

       ["C", " ", " ", "B",  " ", " ", " ", "6",  " ", " ", " ", " ",  " ", " ", " ", " "],
       [" ", "7", " ", " ",  " ", " ", "5", "C",  " ", "3", " ", "2",  "8", " ", " ", " "],
       [" ", "2", "1", " ",  " ", " ", " ", " ",  " ", "B", " ", "A",  " ", "6", " ", "D"],
       [" ", " ", " ", "D",  " ", "B", "8", "7",  " ", " ", " ", "E",  " ", "3", "A", " "]
    ]
  }

   function renderTable(id, board, solved) {
       var css="c"+board.length;
       var html = " ";
       html += "<table data-size=" + board.length +" >";
       for (var i = 0; i < board.length; i++) {
           html += "<tr class=\""+css+"\">";
           for (var j = 0; j < board.length; j++) {

               var iid = "cell_" + i + "_" + j;
               var ivalue = board[i][j].trim();
               var icss = "";
               if(ivalue === "." && solved) {
                 ivalue = solved[i][j];
                 icss="solved"; 
               }

               html += "<td class=\""+css+"\">";
               html += "<input type=\"text\" value=\"" + ivalue + "\" id=\""+iid+"\" maxlength=1 size=1 class=\""+icss+"\" />"
               html += "</td>";
           }
           html += "</tr>";
       }
       html += "</table>";
       document.querySelector(id).innerHTML = html;
   }

   function jsonFromTable(id) {
       var size = document.querySelector(id + " table").getAttribute("data-size");
       var regex = size === 9 ? /[1-9]/ : /[1-9A-G]/;
       var b = [];
       for (var i = 0; i < size; i++) {
           var r = [];
           b.push(r);
           for (var j = 0; j < size; j++) {
               v = document.querySelector("#cell_" + i + "_" + j).value;
               if (! regex.test(v)) {
                   v = ".";
               }
               r.push(v);
           }
       }
       return b;
   }

   function boardselect() {
      var boardtype = document.querySelector("#boardtype");
      var boardname = boardtype.options[boardtype.selectedIndex].value;
      var board = boards[boardname];
      renderTable("#board",board, null);
   }

   function solve() {
       var b = jsonFromTable("#board");
       try {
           var solver = new SudokuSolver();
           var solved = solver.solve(b);
           renderTable("#board", b, solved);
           document.querySelector("#message").value = "Solved in " + solver.stats.time + " ms, " + solver.stats.tests + " tests, " + solver.stats.backtracks + " backtracks";
       } catch (e) {
           if (e === "invalid board")
               document.querySelector("#message").value = "Invalid board!";
           else
               document.querySelector("#message").value = "error : " + e;
       }
   }

   function clean() {
       var size = document.querySelector("#board table").getAttribute("data-size");
       var board=[];
       for (var i = 0; i < size; i++) {
           var row=[];
           board.push(row);
           for (var j = 0; j < size; j++) {
               row.push(" ");
           }
       }
       renderTable("#board", board, null);

   }

   boardselect();
</script>

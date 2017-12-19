---
layout: post
title:  "Simple sudoku solver using constraint propagation"
date:   2017-12-16 20:38:41 +0200
categories: jekyll update
---

<script type='text/javascript' src="https://cdn.rawgit.com/gpicavet/sudoku-solver/master/solver.js"></script>
<script type='text/javascript' src="/assets/sudoku-solver/solver-ui.js"></script>

What's your favorite activity when you're bored and there's absolutely nothing else to do ? solving a sudoku ? No, it's much more interesting to write a sudoku solver !

Solving NxN Sudoku is known to be a [NP-complete problem](https://en.wikipedia.org/wiki/NP-completeness), but it can still be done in a few milliseconds in a vast majority of cases.<br>
Stop thinking about Brute-force search : even 9x9 grids would require seconds to solve !<br>
Basically, Sudoku is a [constraints satisfaction problem](https://en.wikipedia.org/wiki/Constraint_satisfaction_problem) (like the eight queens, magic squares, ...) and there's a much clever way to solve this : "Constraint propagation". In a way that mimics human reasoning.

What you do as a human is first find a cell having a single candidate, set it, and do it again. Simply.<br>
When you "set" a cell, you propagate a new constraint to neighboor cells (ie same row, same column, same block), and so decreasing the choices.<br>

Take a look at the board below for a better understanding. Cell candidates are drawn with small digits. Notice the small green "3", there's no other choice regarding to constraints. So we set this cell with "3" and remove "3" in the candidates of the same row, same column and same block in order to fit rules.
<p>
<div id="boardWithCandidates"></div>
</p>

<script type="text/javascript">
 
   var boardWithCandidates =[
       [[3,6,7], [3,7], 9, 4, 2, 1, [4,5,7,8], [5,6,7,8], [3,5,6,8]],
       [8, 5, [3,6], 7, ['3p',9], [3], 1, 4, 2],
       [2, 1, 4, 8, 6, [3,5], [3,5,7,9], [5,7,9], [3,5,9]],
       [9, [2,'3p',4], 8, [1,2,'3p'], ['3g'], 7, 6, [1,5], [1,'3p',4,5]],
       [5, 6, [1,3,7], [1,'3p'], 4, 8, [3,7,9], 2, [1,3,9]],
       [[1,3,4,7], [2,3,4,7], [1,2,3,7], 9, 5, 6, [3,4,7,8], [1,7,8], [1,3,4,8]],
       [[3,4,6,7], [3,4,7,8,9], [3,5,6,7], [3,5], 1, 2, [4,5,8,9], [5,6,8,9], [4,5,6,8,9]],
       [[1,3,4,6], [2,3,4], [1,2,3,5,6], [3,5], 8, 9, [2,4,5], [1,5,6], 7],
       [[1,7], [2,7,8,9], [1,2,5,7], 6, [7], 4, [2,5,8,9], 3, [1,5,8,9]]
      ];
   renderTableWithCandidates("#boardWithCandidates", boardWithCandidates);
</script>

Easy grids will solve only using this basic technique called "lone single", but there are other techniques like "hidden singles", "naked pairs", ... that can be used when there's no lone single or to speed up solving. (see here for a list : <https://www.learn-sudoku.com/basic-techniques.html>.)

So here is a simple program that first finds as much "lone single" as it can.<br>
When there's no more single, it finds the cell having the less candidates and explores each of them. One of them is good, others are bad and create conflict.<br>
As we dont know in advance, we save the state so when a conflict is detected, we go back to that state and choose another candidate. This technique is called "backtracking", and yes you have already done that on hard sudoku with your favorite eraser !;)<br>

I know it's not the first program to use this techniques and other sophisticated algorithms like the [Dancing Links](https://en.wikipedia.org/wiki/Dancing_Links) have a better time complexity. 
It's a compromise between simplicity (it would require more code to implement other techniques) and performance. 
Even a simple technique can dramatically reduce the search tree and speed up the solving of the hardest sudoku grids.

As a bonus, this one can solve 16x16 grids (with a little more milliseconds :) and could be extended easily to 25x25.

So next, what about generating sudoku grids ?<br>
Start thinking about how it can be done, maybe using a solver, maybe transforming an existing one, and how to make it unique !

Note : This constraint propagation algorithm is very special case of a more generic algorithm called "SAT solvers" which use "CNF" boolean expression reduction (and also a little backtracking).


## demo

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
  border-right: 2px solid black !important;
 }
 td.c9:first-of-type,
 td.c16:first-of-type {
  border-left: 2px solid black !important;
 }
 tr.c9:nth-of-type(3n), 
 tr.c16:nth-of-type(4n) {
  border-bottom: 2px solid black !important;
 }
 tr.c9:first-of-type,
 tr.c16:first-of-type {
  border-top: 2px solid black !important;
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

## source code
<https://github.com/gpicavet/sudoku-solver>

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

   boardselect();
</script>

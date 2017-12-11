---
layout: post
title:  "Simple sudoku solver with constraint propagation"
date:   2017-12-11 20:38:41 +0200
categories: jekyll update
---

<script type='text/javascript' src="https://cdn.rawgit.com/gpicavet/sudoku-solver/master/solver.js"></script>

 <style>
     table input[type="text"] {
    font-size:30px;
}
 </style>

 <div id="board"></div>

 <br>

 <textarea id="message" cols="60"></textarea>

 <br>

 <button onclick="solve()">SOLVE</button>
 <button onclick="clean()">CLEAR</button>

 <script type='text/javascript'>
   var board = [
       ["8", "", "", "", "", "", "", "", ""],
       ["", "", "3", "6", "", "", "", "", ""],
       ["", "7", "", "", "9", "", "2", "", ""],
       ["", "5", "", "", "", "7", "", "", ""],
       ["", "", "", "", "4", "5", "7", "", ""],
       ["", "", "", "1", "", "", "", "3", ""],
       ["", "", "1", "", "", "", "", "6", "8"],
       ["", "", "8", "5", "", "", "", "1", ""],
       ["", "9", "", "", "", "", "4", "", ""]
   ];

   renderTable("#board", board);

   function renderTable(id, board) {
       var html = "";
       html += "<table data-size=" + board.length + " style='font-size:20px'>";
       for (var i = 0; i < board.length; i++) {
           html += "<tr>";
           for (var j = 0; j < board.length; j++) {
               html += "<td>";
               html += "<input type='text' size=1 value='" + board[i][j] + "' id='cell_" + i + "_" + j + "' />"
               html += "</td>";
           }
           html += "</tr>";
       }
       html += "</table>";
       document.querySelector(id).innerHTML = html;
   }

   function jsonFromTable(id) {
       var size = document.querySelector(id + " table").getAttribute("data-size");
       var b = [];
       for (var i = 0; i < size; i++) {
           var r = [];
           b.push(r);
           for (var j = 0; j < size; j++) {
               v = document.querySelector("#cell_" + i + "_" + j).value;
               if (!/[1-9]/.test(v)) {
                   v = ".";
               }
               r.push(v);
           }
       }
       return b;
   }

   function solve() {
       var b = jsonFromTable("#board");
       try {
           var solver = new SudokuSolver();
           b = solver.solve(b);
           renderTable("#board", b);
           document.querySelector("#message").value = "Solved in " + solver.stats.time + " ms, " + solver.stats.tests + " tests, " + solver.stats.backtracks + " backtracks";
       } catch (e) {
           if (e === "invalid board")
               document.querySelector("#message").value = "Invalid board!";
           else
               document.querySelector("#message").value = "error : " + e;
       }
   }

   function clean() {
       for (var i = 0; i < board.length; i++) {
           for (var j = 0; j < board.length; j++) {
               board[i][j] = '';
           }
       }
       renderTable("#board", board);

   }

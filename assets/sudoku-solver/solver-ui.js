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


function renderTableWithCandidates(id, board) {
       var css="c"+board.length;
       var html = " ";
       html += "<table style='font-size:20px'>";
       html += "<caption>Board with candidates and singles</caption>";
       for (var i = 0; i < board.length; i++) {
           html += "<tr class=\""+css+"\">";
           for (var j = 0; j < board.length; j++) {

               var ivalue = board[i][j];

               html += "<td style='border:1px solid gray; text-align:center' class=\""+css+"\">";
               if(ivalue instanceof Array) {
                html+="<table style='font-size:10px'>";
                var count=1;
                for (var ii = 0; ii < 3; ii++) {
                  html+="<tr>";
                for (var jj = 0; jj < 3; jj++, count++) {
		  var background="";
                  if(ivalue.indexOf(count+'p')>=0)
			background="style='background-color:pink'";
                  if(ivalue.indexOf(count+'g')>=0)
			background="style='background-color:lightgreen'";
                  html+="<td width='12px' height='12px' "+background+">";
                  if(ivalue.indexOf(count)>=0 || ivalue.indexOf(count+'p')>=0 || ivalue.indexOf(count+'g')>=0)
                    html+=count;
                  html+="</td>";                  
                }
                  html+="</tr>";
                }
                html+="</table>";

               } else {
                html += ivalue;
               }

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

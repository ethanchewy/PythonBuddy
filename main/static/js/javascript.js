//jQuery all client side
$(document).ready(function(){
	/*
	function check(errors){
		//Split errors individually by line => list
		//var tokens = errors.split(/\r?\n/);
		document.getElementById('errorslist').innerHTML = '';
	   	$('#errorslist').append("<tr>"+"<th>Name</th>"+"<th>Description</th>"+
	        "</tr>");
		for(var x = 2; x < errors.length; x+=2){
		   console.log(x+" "+errors[x]);
		   $('#errorslist').append("<tr>"+"<td>" + errors[x] + "</td>"+"</tr>");
		}
		
	}
	*/

	function check_syntax(code, result_cb)
	{	
		var error_list = [{
            line_no: null,
            column_no_start: null,
            column_no_stop: null,
            fragment: null,
            message: null,
            severity: null
        }];
        console.log(error_list);
        //var error_list =[];
        
		//Add to html the errors
		function check(errors){
			//Split errors individually by line => list
			//var tokens = errors.split(/\r?\n/);
			var number,message, severity;
			//Regex for fetching number
			

			//console.log(errors);
			document.getElementById('errorslist').innerHTML = '';
		   	$('#errorslist').append("<tr>"+"<th>Name</th>"+"<th>Description</th>"+
		        "</tr>");
			for(var x = 2; x < errors.length; x+=2){
			   console.log(errors[x]);
			   $('#errorslist').append("<tr>"+"<td>" + errors[x] + "</td>"+"</tr>");
				//Sorting into line_no, etc.
				var match_number = errors[x].match(/\d+/);
				//console.log(parseInt(match_number[0], 10));
				number = parseInt(match_number[0], 10);
				severity = errors[x].charAt(0);
				//console.log(severity);
				//Split code based on colon
				var message_split = errors[x].split(':');
				console.log(message_split);
				//Get message after second colon
				message = message_split[2];
				//console.log(message);

				if(severity=="E"){
					console.log("error");
					severity="error";
				} else if(severity=="W"){
					console.log("error");
					severity="warning";
				}
				//Push to error list
				
				error_list.push({
					line_no: number, 
					column_no_start: null,
            		column_no_stop: null,
					fragment: null,
					message: message, 
					severity: severity
				});
				
				/*Test
				error_list.push({
		            line_no: 1,
		            column_no_start: 14,
		            column_no_stop: 17,
		            fragment: "def doesNothing:\n",
		            message: "invalid syntax",
		            severity: "error"
		        });
		        */
			}
			
			console.log("error_list"+error_list.toString());
	    	result_cb(error_list);

		}
		//AJAX call to pylint
		$.getJSON('/check_code', {
	      text :  code
	    }, function(data) {
	    	//console.log(data);
	    	current_text = data;
	    	check(current_text);
	    	//document.getElementById('append_text').innerHTML="<h1>" + current_text + "</h1>";
	    	return false;
	    });

	    
		//console.log("error_list"+error_list.toString());
	    //result_cb(error_list);
	}

	var editor = CodeMirror.fromTextArea(document.getElementById("txt"), {
        mode: {name: "python",
               version: 2,
               singleLineStringErrors: false},
        lineNumbers: true,
        indentUnit: 4,
        matchBrackets: true,
        lint:true,
        gutters: ["CodeMirror-lint-markers"],
        lintWith: {
	        "getAnnotations": CodeMirror.remoteValidator,
	        "async" : true,
	        "check_cb":check_syntax
	    },
    });
    /*
	editor.on("change", function(editor, change){
		$.getJSON('/check_code', {
	      text :  editor.getValue()
	    }, function(data) {
	    	console.log(data);
	    	current_text = data;
	    	check(current_text);
	    	//document.getElementById('append_text').innerHTML="<h1>" + current_text + "</h1>";
	    	return false;
	    });
	});
	*/
	

});




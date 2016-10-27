//Created by Ethan Chiu 10/25/16

$(document).ready(function(){
	//Pulls info from AJAX call and sends it off to codemirror's update linting
	//Has callback result_cb
	function check_syntax(code, result_cb)
	{	
		//Example error for guideline
		var error_list = [{
            line_no: null,
            column_no_start: null,
            column_no_stop: null,
            fragment: null,
            message: null,
            severity: null
        }];
        
		//Push and replace errors
		function check(errors){
			//Split errors individually by line => list
			//var tokens = errors.split(/\r?\n/);
			var number,message, severity, severity_color, id;
			//Regex for fetching number
			
			//Clear array.
		    error_list = [{
	            line_no: null,
	            column_no_start: null,
	            column_no_stop: null,
	            fragment: null,
	            message: null,
	            severity: null
	        }];
			//console.log(errors);
			document.getElementById('errorslist').innerHTML = '';
		   	$('#errorslist').append("<tr>"+"<th>Line</th>"+"<th>Severity</th>"+
		   		"<th>Error</th>"+ "<th>More Info</th>"+"</tr>");

			for(var x = 2; x < errors.length; x+=2){

				//Sorting into line_no, etc.
				var match_number = errors[x].match(/\d+/);
				number = parseInt(match_number[0], 10);
				severity = errors[x].charAt(0);
				//Split code based on colon
				var message_split = errors[x].split(':');
				console.log(message_split);
				//Get message after second colon
				message = message_split[2];
				//console.log(message);

				if(severity=="E"){
					console.log("error");
					severity="error";
					severity_color="red";
				} else if(severity=="W"){
					console.log("error");
					severity="warning";
					severity_color="yellow";
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

				//Moreinfo => link to more info or display helpmessage
				var moreinfo = null;



				//Append all data to table
			   	$('#errorslist').append("<tr>"+"<td>" + number + "</td>"
			   		+"<td style=\"background-color:"+severity_color+";\"" + 
			   		">" + severity + "</td>"
			   		+"<td>" + message + "</td>"
			   		+"<td>" + moreinfo + "</td>"+"</tr>");
				

			}
			
			console.log("error_list"+error_list.toString());
	    	result_cb(error_list);

		}
		//AJAX call to pylint
		$.getJSON('/check_code', {
	      text :  code
	    }, function(data) {
	    	console.log(data);
	    	current_text = data;
	    	//Check Text
	    	check(current_text);
	    	return false;
	    });
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
	

});
function getHelp(){
	
}



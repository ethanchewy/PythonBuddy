//jQuery all client side
$(document).ready(function(){
	$('#txt').bind('keypress', function(e) {
		if(e.keyCode==13){
			console.log('test');
			$.getJSON('/check_code', {
		      text :  $('textarea#txt').val()
		    }, function(data) {
		    	console.log(data);
		    	current_text = data;
		    	set_to_table(current_text);
		    	//document.getElementById('append_text').innerHTML="<h1>" + current_text + "</h1>";
		    	return false;
		    });
		    
		  };
	});
});


//Track number of rows. The number of the current row would be used to append to certain element.
function appendGutter(data) {
	console.log(data);
	/*
	var textArea = data;
	//console.log(data);
	var arrayOfLines = textArea.split("\n"); 
    var line_number = textArea.substr(0, textArea.selectionStart).split("\n").length;
    if (line_number==1){
    	var current_text = arrayOfLines[0];
    } else {
    	var current_text = arrayOfLines[line_number-1];
    }
    return current_text
    */
}

function set_to_table(errors){
	//Split errors individually by line => list
	//var tokens = errors.split(/\r?\n/);
	console.log(errors.length);
	
	for(var x = 2; x < errors.length; x+=2){
	   console.log(x+" "+errors[x]);
	   $('#errorslist').append("<tr>"+"<td>" + errors[x] + "</td>"+"</tr>");
	}
	
}

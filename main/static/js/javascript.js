//jQuery all client side
$(document).ready(function(){
	$('#txt').bind('keypress', function(e) {
		if(e.keyCode==13){
			console.log('test');
			$.getJSON('/check_code', {
		      text :  $('textarea#txt').val()
		    }, function(data) {
		    	current_text = appendGutter(data);
		    	$('#append_text').append("<h1>" + current_text + "</h1>");
		    	return false;
		    });
		    
		  };
	});
});


//Track number of rows. The number of the current row would be used to append to certain element.
function appendGutter(data) {
	var textArea = data;
	var arrayOfLines = textArea.split("\n"); 
    var line_number = textArea.substr(0, textArea.selectionStart).split("\n").length;
    if (line_number==1){
    	var current_text = arrayOfLines[0];
    } else {
    	var current_text = arrayOfLines[line_number-1];
    }
    return current_text
}

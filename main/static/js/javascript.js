//jQuery all client side
$(document).ready(function(){
	$('#txt').bind('keypress', function(e) {
		if(e.keyCode==13){
			console.log('test');
			$.getJSON('/check_code', {
		      text :  $('textarea#txt').val()
		    }, function(data) {
		    	appendGutter();
		    	$('#append_text').append("<h1>" + data + "</h1>");
		    	return false;
		    });
		    
		  };
	});
});


//Track number of rows. The number of the current row would be used to append to certain element.
function appendGutter() {
	var textArea = document.getElementById("txt");
	var arrayOfLines = textArea.value.split("\n"); 
    var line_number = textArea.value.substr(0, textArea.selectionStart).split("\n").length;
    console.log(arrayOfLines[line_number-2]);
    console.log(line_number);
}
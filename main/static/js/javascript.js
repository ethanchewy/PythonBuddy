//jQuery all client side
$(document).ready(function(){
	$('#code_textarea').bind('keypress', function(e) {
		if(e.keyCode==13){
			console.log('test');
			getline();
			$.getJSON('/check_code', {
		      text :  $('textarea#code_textarea').val()
		    }, function(data) {
		    	$('#append_text').append("<h1>" + data + "</h1>");
		    	return false;
		    });
		    
		  };
	});
});


//Track number of rows. The number of the current row would be used to append to certain element.
function getline() {
    var t = $("textarea")[0];
    console.log(t.value.substr(0, t.selectionStart).split("\n").length);
}
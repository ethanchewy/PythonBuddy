$(document).ready(function(){
$('#code_textarea').bind('keypress', function(e) {
	if(e.keyCode==13){
		console.log('test');
	}
});
});
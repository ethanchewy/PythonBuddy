$(document).ready(function () {
	$("[name='my-checkbox']").bootstrapSwitch();
    $('input[name="my-checkbox"]').on('switchChange.bootstrapSwitch', function(event, state) {
	  console.log(state); // true | false
	  //Temporary code. Need to shorten
	  var content = this.id;
	  console.log(content);
	  
  		switch(content){
		  	case "grader_check":
		  		if(state==true){
				  	$("#grader-content").show();
				  } else{
				  	$("#grader-content").hide();
				  }
		  		break;
		  	case "features":
		  		if(state==true){
				  	$("#features-content").show();
				  } else{
				  	$("#features-content").hide();
				  }
		  		break;
	  	}
		

	  
	});
});
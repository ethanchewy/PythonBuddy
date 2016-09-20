//jQuery all client side
$(document).ready(function(){
	$('#code_textarea').bind('keypress', function(e) {
		if(e.keyCode==13){
			console.log('test');
			$('textarea').trackRows();
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
jQuery.fn.trackRows = function() {
    return this.each(function() {

        var ininitalHeight, currentRow, iteration = 0;

        var createMirror = function(textarea) {
            jQuery(textarea).after('<div class="autogrow-textarea-mirror"></div>');
            return jQuery(textarea).next('.autogrow-textarea-mirror')[0];
        }

        var sendContentToMirror = function (textarea) {
            mirror.innerHTML = String(textarea.value.substring(0,textarea.selectionStart)).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br />') + '.<br/>.';

           calculateRowNumber();
       }

       var growTextarea = function () {
           sendContentToMirror(this);
       }

       var calculateRowNumber = function () {
           if(iteration===0){
               ininitalHeight = $(mirror).height();
               currentHeight = ininitalHeight;
               iteration++;
           }
           else{
               currentHeight = $(mirror).height();
           }

           currentRow = currentHeight/(ininitalHeight/2) - 1;
           
           //remove tracker in production
           $('.tracker').html('Current row: ' + currentRow);
      }

                // Create a mirror
      var mirror = createMirror(this);
                
                // Style the mirror
                mirror.style.display = 'none';
                mirror.style.wordWrap = 'break-word';
                mirror.style.whiteSpace = 'normal';
                mirror.style.padding = jQuery(this).css('padding');
                mirror.style.width = jQuery(this).css('width');
                mirror.style.fontFamily = jQuery(this).css('font-family');
                mirror.style.fontSize = jQuery(this).css('font-size');
                mirror.style.lineHeight = jQuery(this).css('line-height');

                // Style the textarea
                this.style.overflow = "hidden";
                this.style.minHeight = this.rows+"em";

                var ininitalHeight = $(mirror).height();

                // Bind the textarea's event
                this.onkeyup = growTextarea;

                // Fire the event for text already present
                // sendContentToMirror(this);

        });
};
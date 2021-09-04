window.onload = function() {
  $("#message").hide()
};


function success(){
	var message = "";
	if(!$("#name").val()){
		message = "Please enter a name!"
	}
	else{
		message = "Thank you " + $("#name").val() + ", your appointment for " + $("#task").val() + " with the one and only Surya is confirmed at " + $("#time").val() + ". See you there!"
		console.log(message);
	}

	
	$("#message").text(message);
	$("#message").show();
	

}
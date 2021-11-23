let container = document.querySelector(".container");
let btn = document.getElementById("spin");
let number = Math.ceil(Math.random() * 5000);
let previousNumber = 0;

function spinthewheel() {
	number = Math.ceil(Math.random() * 10000);
	while(true){
		if(number % 360 < 20 && Math.abs(previousNumber - number) > 720){
			break;
		}
		number = Math.ceil(Math.random() * 10000);
	}
	container.style.transform = "rotate(" + number + "deg)";
	previousNumber = number;
	//number += Math.ceil(Math.random() * 1000);
}
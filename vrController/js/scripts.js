window.onload = (event) => {
  var x = document.getElementById("x_val");
  var y = document.getElementById("y_val");
  var z = document.getElementById("z_val");

  //let sensor = new Gyroscope();
  let sensor = new AbsoluteOrientationSensor({frequency: 60});
  sensor.start();
  
  sensor.onreading = () => {    
    x.innerHTML = sensor.quaternion[0]
    y.innerHTML = sensor.quaternion[1]
    z.innerHTML = sensor.quaternion[2]
    
  };

  sensor.onerror = event => console.log(event.error.name, event.error.message);
  


};



